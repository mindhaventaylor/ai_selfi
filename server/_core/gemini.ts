/**
 * Google Gemini 2.5 Flash Image API integration
 * Used for generating AI images from reference photos
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyC7t1E9BoJ3_eV32Dn81G6x3S4b6eva6Yg";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

// Rate limiting: delay between requests (in milliseconds)
const REQUEST_DELAY = 10000; // 10 seconds between requests to avoid rate limits
const MAX_RETRIES = 5; // Increased retries
const INITIAL_RETRY_DELAY = 15000; // 15 seconds initial delay for rate limit errors
const MAX_RETRY_DELAY = 120000; // Maximum 2 minutes delay

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a fetch request with exponential backoff for rate limit errors
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If rate limited (429), retry with exponential backoff
      if (response.status === 429) {
        if (attempt < retries) {
          // Check for Retry-After header
          const retryAfter = response.headers.get('Retry-After');
          let delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          
          // If Retry-After header is present, use it (convert seconds to milliseconds)
          if (retryAfter) {
            delay = Math.min(parseInt(retryAfter) * 1000, MAX_RETRY_DELAY);
            console.log(`[Gemini API] Rate limited (429), Retry-After header: ${retryAfter}s`);
          }
          
          // Cap the delay at maximum
          delay = Math.min(delay, MAX_RETRY_DELAY);
          
          console.log(`[Gemini API] Rate limited (429), retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${retries + 1})`);
          await sleep(delay);
          continue;
        } else {
          const errorText = await response.text().catch(() => '');
          throw new Error(`Gemini API rate limit exceeded after ${retries + 1} attempts. The API is currently rate limiting requests. Please wait a few minutes and try again. ${errorText ? `Details: ${errorText}` : ''}`);
        }
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If it's a network error and we have retries left, wait and retry
      if (attempt < retries) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.log(`[Gemini API] Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retries + 1}):`, lastError.message);
        await sleep(delay);
        continue;
      }
      
      throw lastError;
    }
  }
  
  throw lastError || new Error("Failed to fetch from Gemini API");
}

export interface GenerateImageOptions {
  referenceImages: Array<{
    data: string; // base64 encoded image data
    mimeType: string; // e.g., "image/jpeg", "image/png"
  }>;
  prompt: string;
  aspectRatio?: "1:1" | "9:16" | "16:9";
  numImages?: number; // Number of variations to generate (default: 4)
}

export interface GeneratedImage {
  data: string; // base64 encoded image data
  mimeType: string;
}

/**
 * Generate images using Gemini 2.5 Flash Image API
 */
export async function generateImagesWithGemini(
  options: GenerateImageOptions
): Promise<GeneratedImage[]> {
  const { referenceImages, prompt, aspectRatio = "9:16", numImages = 4 } = options;

  if (referenceImages.length === 0) {
    throw new Error("At least one reference image is required");
  }

  // Build the request payload
  const parts: any[] = [];

  // Add reference images
  for (const refImage of referenceImages) {
    parts.push({
      inline_data: {
        mime_type: refImage.mimeType,
        data: refImage.data,
      },
    });
  }

  // Add text prompt
  parts.push({
    text: prompt,
  });

  const requestBody = {
    contents: [
      {
        parts,
      },
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: aspectRatio === "1:1" ? "1:1" : aspectRatio === "16:9" ? "16:9" : "9:16",
      },
    },
  };

  try {
    const response = await fetchWithRetry(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract generated images from the response
    const generatedImages: GeneratedImage[] = [];

    if (data.candidates && Array.isArray(data.candidates)) {
      for (const candidate of data.candidates) {
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inline_data && part.inline_data.data) {
              generatedImages.push({
                data: part.inline_data.data,
                mimeType: part.inline_data.mime_type || "image/png",
              });
            }
          }
        }
      }
    }

    // If we need more images, make additional requests
    // Gemini typically returns one image per request, so we make multiple requests
    const imagesToGenerate = Math.max(1, numImages);
    const allImages = [...generatedImages];

    // Generate remaining images with delays to avoid rate limiting
    while (allImages.length < imagesToGenerate) {
      // Add delay between requests to avoid rate limiting
      if (allImages.length > 0) {
        console.log(`[Gemini API] Waiting ${REQUEST_DELAY}ms before next request to avoid rate limits...`);
        await sleep(REQUEST_DELAY);
      }
      
      const additionalImages = await generateSingleImage(referenceImages, prompt, aspectRatio);
      allImages.push(...additionalImages);
      
      // Prevent infinite loop
      if (additionalImages.length === 0) {
        break;
      }
    }

    return allImages.slice(0, imagesToGenerate);
  } catch (error) {
    console.error("Error generating images with Gemini:", error);
    throw error;
  }
}

/**
 * Generate a single image (helper for multiple variations)
 */
async function generateSingleImage(
  referenceImages: Array<{ data: string; mimeType: string }>,
  prompt: string,
  aspectRatio: string
): Promise<GeneratedImage[]> {
  const parts: any[] = [];

  for (const refImage of referenceImages) {
    parts.push({
      inline_data: {
        mime_type: refImage.mimeType,
        data: refImage.data,
      },
    });
  }

  // Add variation to prompt for diversity
  const variedPrompt = `${prompt} Create a unique variation with different pose, expression, or composition.`;

  parts.push({
    text: variedPrompt,
  });

  const requestBody = {
    contents: [
      {
        parts,
      },
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: aspectRatio === "1:1" ? "1:1" : aspectRatio === "16:9" ? "16:9" : "9:16",
      },
    },
  };

  try {
    const response = await fetchWithRetry(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const images: GeneratedImage[] = [];

    if (data.candidates && Array.isArray(data.candidates)) {
      for (const candidate of data.candidates) {
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inline_data && part.inline_data.data) {
              images.push({
                data: part.inline_data.data,
                mimeType: part.inline_data.mime_type || "image/png",
              });
            }
          }
        }
      }
    }

    return images;
  } catch (error) {
    console.error("Error generating single image:", error);
    return [];
  }
}

