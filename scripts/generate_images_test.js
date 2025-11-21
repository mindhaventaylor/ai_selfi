// generate_image_test.js
// Node.js CommonJS - funciona com node 18+ (fetch global disponível)
const fs = require("fs").promises;
const path = require("path");

// Configure sua chave aqui (ou exporte GEMINI_API_KEY no shell)
const GEMINI_API_KEY = "AIzaSyA3s-XR92O7nqy3g6d_IbMOj_hl2Qf0KD4";
if (!GEMINI_API_KEY) {
  console.error("ERRO: defina a variável de ambiente GEMINI_API_KEY antes de rodar.");
  console.error('Ex: export GEMINI_API_KEY="SUA_CHAVE"');
  process.exit(1);
}

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-image";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function jitter(ms) { return ms + Math.floor(Math.random()*1000) - 500; }

async function fileToInlineData(filePath) {
  const buf = await fs.readFile(filePath);
  const base64 = buf.toString("base64");
  const ext = path.extname(filePath).toLowerCase();
  let mime = "image/jpeg";
  if (ext === ".png") mime = "image/png";
  else if (ext === ".webp") mime = "image/webp";
  else if (ext === ".gif") mime = "image/gif";
  else if (ext === ".jpg" || ext === ".jpeg") mime = "image/jpeg";
  return { inline_data: { mime_type: mime, data: base64 } };
}

async function callGeminiGenerate(promptText, inlineImages = [], maxAttempts = 6) {
  const parts = [{ text: promptText }, ...inlineImages];
  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"]
      // imageConfig: { aspectRatio: "1:1" } // opcional
    }
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Gemini] tentativa ${attempt}/${maxAttempts} -> POST ${GEMINI_URL}`);
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify(body)
      });

      console.log(`[Gemini] status: ${res.status}`);
      if (res.status === 429) {
        // Tentar extrair Retry-After ou google.rpc.RetryInfo.retryDelay
        const retryAfterHeader = res.headers.get("retry-after");
        let suggestedMs = 90000; // fallback 90s
        try {
          const text = await res.text();
          if (retryAfterHeader) {
            const parsed = parseInt(retryAfterHeader, 10);
            if (!Number.isNaN(parsed)) suggestedMs = Math.min(parsed * 1000, 180000);
          } else if (text) {
            const j = JSON.parse(text);
            const retryInfo = j.error?.details?.find(d => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo");
            if (retryInfo?.retryDelay) {
              const m = String(retryInfo.retryDelay).match(/(\d+\.?\d*)/);
              if (m) suggestedMs = Math.min(parseFloat(m[1]) * 1000, 180000);
            }
          }
        } catch (e) { /* ignore parse errors */ }
        console.warn(`[Gemini] Rate limited (429). Suggested wait: ${Math.round(suggestedMs/1000)}s`);
        if (attempt === maxAttempts) throw new Error("Rate limited after max attempts");
        const waitMs = jitter(suggestedMs);
        console.log(`[Gemini] aguardando ${Math.round(waitMs/1000)}s antes de retry...`);
        await sleep(waitMs);
        continue;
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Gemini error ${res.status}: ${txt}`);
      }

      const result = await res.json();
      console.log(`[Gemini] candidatos: ${result.candidates?.length || 0}`);

      const candidate = result.candidates?.[0];
      if (!candidate) {
        console.error("Resposta sem candidates:", JSON.stringify(result, null, 2));
        throw new Error("No candidates in response");
      }

      const partsResp = candidate.content?.parts || [];
      let imagePart = null;
      for (const p of partsResp) {
        if (p.inlineData?.data) {
          imagePart = { data: p.inlineData.data, mimeType: p.inlineData.mimeType || p.inlineData.mime_type };
          break;
        }
        if (p.inline_data?.data) {
          imagePart = { data: p.inline_data.data, mimeType: p.inline_data.mime_type || p.inline_data.mimeType };
          break;
        }
      }
      if (!imagePart) {
        console.error("Nenhum inline_data encontrado. Full response:", JSON.stringify(result, null, 2));
        throw new Error("No image data in response");
      }
      console.log(`[Gemini] imagem recebida (mime: ${imagePart.mimeType || "unknown"})`);
      return imagePart;
    } catch (err) {
      console.error(`[Gemini] erro na tentativa ${attempt}:`, err.message || err);
      if (attempt >= maxAttempts) throw err;
      // backoff exponencial (capped)
      const backoffBase = Math.min(30000 * Math.pow(2, attempt - 1), 180000);
      const waitMs = jitter(backoffBase);
      console.log(`[Gemini] aguardando ${Math.round(waitMs/1000)}s antes da próxima tentativa...`);
      await sleep(waitMs);
    }
  }
  throw new Error("Failed after retries");
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length < 1) {
    console.log('Uso: node generate_image_test.js "prompt text" [example1.jpg example2.png ...]');
    process.exit(0);
  }
  const promptText = argv[0];
  const imagePaths = argv.slice(1);

  console.log("Prompt:", promptText);
  console.log("Arquivos de exemplo:", imagePaths.length ? imagePaths.join(", ") : "(nenhum)");

  const inlineImgs = [];
  for (const p of imagePaths) {
    try {
      const inline = await fileToInlineData(p);
      inlineImgs.push(inline);
      console.log(`> carregado ${p} (mime: ${inline.inline_data.mime_type})`);
    } catch (e) {
      console.error(`Falha ao ler ${p}:`, e.message || e);
      process.exit(1);
    }
  }

  try {
    const img = await callGeminiGenerate(promptText, inlineImgs, 6);
    const mime = (img.mimeType || "image/png").toLowerCase();
    let ext = ".png";
    if (mime.includes("jpeg")) ext = ".jpg";
    else if (mime.includes("webp")) ext = ".webp";
    else if (mime.includes("gif")) ext = ".gif";

    const outFile = `out${ext}`;
    const bytes = Buffer.from(img.data, "base64");
    await fs.writeFile(outFile, bytes);
    console.log(`Imagem gerada salva em ${outFile}`);
  } catch (err) {
    console.error("Falha ao gerar imagem:", err.message || err);
    process.exit(1);
  }
}

main();
