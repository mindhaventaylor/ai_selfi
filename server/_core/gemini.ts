/**
 * Google Gemini 2.5 Flash Image API integration
 * Used for generating AI images from reference photos
 */

import { getServerString } from "./strings.js";

const GEMINI_API_KEY: string = process.env.GEMINI_API_KEY || "";
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
// Try alternative model names if the primary doesn't work
// Primary: gemini-2.5-flash-image
// Alternative: gemini-2.5-flash-preview-image
const GEMINI_MODEL_NAME = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash-image";
const GEMINI_API_URL = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL_NAME}:generateContent`;

// Rate limiting: delay between requests (in milliseconds)
const REQUEST_DELAY = 5000; // 5 seconds between sequential requests (reduced for faster generation)
const MAX_RETRIES = 3; // Reduced retries - fail faster if quota is exhausted
const INITIAL_RETRY_DELAY = 10000; // 10 seconds initial delay (reduced - API usually suggests shorter times)
const MAX_RETRY_DELAY = 120000; // Maximum 2 minutes delay (reduced from 5 minutes)
const JITTER_MAX = 5000; // Reduced jitter to 5 seconds

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * List available Gemini models to find the correct image generation model
 */
export async function listAvailableModels(): Promise<void> {
  try {
    const response = await fetch(`${GEMINI_BASE_URL}/models?key=${GEMINI_API_KEY}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Gemini API] Failed to list models: ${response.status} ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`[Gemini API] Available models:`);
    
    if (data.models && Array.isArray(data.models)) {
      const imageModels = data.models.filter((m: any) => 
        m.name?.toLowerCase().includes('image') || 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      console.log(`[Gemini API] Found ${data.models.length} total models`);
      console.log(`[Gemini API] Image-related models:`);
      imageModels.forEach((model: any) => {
        console.log(`[Gemini API]   - ${model.name}`);
        console.log(`[Gemini API]     Supported methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
      });
      
      // Find models that support generateContent
      const generateContentModels = data.models.filter((m: any) => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      console.log(`[Gemini API] Models supporting generateContent:`);
      generateContentModels.forEach((model: any) => {
        console.log(`[Gemini API]   - ${model.name}`);
      });
    }
  } catch (error) {
    console.error(`[Gemini API] Error listing models:`, error);
  }
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
  const requestId = Math.random().toString(36).substring(7);
  const bodySize = options.body ? Buffer.byteLength(options.body as string) : 0;
  
  console.log(`[Gemini API] 🚀 Starting API call (ID: ${requestId})`);
  console.log(`[Gemini API] 📤 Request details: URL=${url}, Method=${options.method}, Body size=${Math.round(bodySize / 1024)}KB`);
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`[Gemini API] ⏳ Attempt ${attempt + 1}/${retries + 1} (ID: ${requestId})`);
      const response = await fetch(url, options);
      
      console.log(`[Gemini API] 📥 Response received (ID: ${requestId}): Status=${response.status} ${response.statusText}`);
      
      // If rate limited (429), retry with exponential backoff
      if (response.status === 429) {
        // Get error details to understand the rate limit better
        const errorText = await response.text().catch(() => '');
        let errorDetails: any = null;
        let retryAfterSeconds: number | null = null;
        let quotaInfo: string[] = [];
        
        try {
          errorDetails = JSON.parse(errorText);
          if (errorDetails?.error) {
            const error = errorDetails.error;
            console.log(`[Gemini API] ⚠️  Rate limit hit (429) on attempt ${attempt + 1} (ID: ${requestId})`);
            console.log(`[Gemini API] 📋 Error message: ${error.message || 'No message'}`);
            
            // Extract quota information
            if (error.details) {
              const quotaFailure = error.details.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.QuotaFailure');
              if (quotaFailure?.violations) {
                quotaFailure.violations.forEach((v: any) => {
                  quotaInfo.push(`${v.quotaMetric} (${v.quotaId})`);
                });
                console.log(`[Gemini API] 🚫 Quota violations:`);
                quotaInfo.forEach(q => console.log(`[Gemini API]    - ${q}`));
              }
              
              // Extract RetryInfo
              const retryInfo = error.details.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
              if (retryInfo?.retryDelay) {
                // retryDelay format: "47.741630862s" or similar
                const delayMatch = retryInfo.retryDelay.match(/(\d+\.?\d*)/);
                if (delayMatch) {
                  retryAfterSeconds = parseFloat(delayMatch[1]);
                  console.log(`[Gemini API] ⏰ API suggests retry after: ${retryAfterSeconds}s`);
                }
              }
            }
          }
        } catch {
          // If parsing fails, log the raw error
          console.log(`[Gemini API] ⚠️  Rate limit hit (429) on attempt ${attempt + 1} (ID: ${requestId})`);
          if (errorText) {
            console.log(`[Gemini API] 📋 Raw error: ${errorText.substring(0, 200)}...`);
          }
        }
        
        // Check if quota is completely exhausted (limit: 0)
        const isQuotaExhausted = errorDetails?.error?.message?.includes('limit: 0') || 
                                  quotaInfo.some(q => q.includes('limit: 0'));
        
        if (isQuotaExhausted && attempt >= 1) {
          // If quota is exhausted, fail fast instead of waiting
          console.log(`[Gemini API] 🚫 Quota completely exhausted (limit: 0), failing fast instead of retrying`);
          const quotaDetails = quotaInfo.length > 0 
            ? `\nQuota violations:\n${quotaInfo.map(q => `  - ${q}`).join('\n')}`
            : '';
          throw new Error(`Gemini API quota exhausted. Your free tier quota has been reached. Please wait for quota reset or upgrade your plan.${quotaDetails}`);
        }
        
        if (attempt < retries) {
          // Check for Retry-After header first
          const retryAfterHeader = response.headers.get('Retry-After');
          let delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          
          // Priority: RetryInfo from error > Retry-After header > exponential backoff
          // API usually suggests reasonable retry times (30-60s), so prefer that
          if (retryAfterSeconds !== null) {
            // Use API suggestion, but cap at reasonable maximum
            delay = Math.min(retryAfterSeconds * 1000, 60000); // Max 60s for API suggestions
            console.log(`[Gemini API] ⏰ Using API-suggested delay: ${retryAfterSeconds}s`);
          } else if (retryAfterHeader) {
            delay = Math.min(parseInt(retryAfterHeader) * 1000, MAX_RETRY_DELAY);
            console.log(`[Gemini API] ⏰ Using Retry-After header: ${retryAfterHeader}s`);
          } else {
            // Reduced exponential backoff for faster retries
            delay = Math.min(delay, 30000); // Cap at 30s instead of 5 minutes
            console.log(`[Gemini API] ⏰ Using exponential backoff: ${Math.round(delay / 1000)}s`);
          }
          
          // Cap the delay at maximum
          delay = Math.min(delay, MAX_RETRY_DELAY);
          
          // Add small random jitter to avoid synchronized retries
          const jitter = Math.floor(Math.random() * JITTER_MAX);
          const totalDelay = delay + jitter;
          
          console.log(`[Gemini API] ⏸️  Waiting ${Math.round(totalDelay / 1000)}s before retry (ID: ${requestId}, base: ${Math.round(delay / 1000)}s + jitter: ${Math.round(jitter / 1000)}s)`);
          await sleep(totalDelay);
          console.log(`[Gemini API] 🔄 Retrying after delay (ID: ${requestId})`);
          continue;
        } else {
          // All retries exhausted - provide detailed error message
          const quotaDetails = quotaInfo.length > 0 
            ? `\nQuota violations:\n${quotaInfo.map(q => `  - ${q}`).join('\n')}`
            : '';
          const detailedError = errorDetails?.error?.message 
            ? `\nError details: ${errorDetails.error.message}${quotaDetails}`
            : 'The API is currently rate limiting requests. Please wait a few minutes and try again.';
          console.error(`[Gemini API] ❌ Rate limit exceeded after ${retries + 1} attempts (ID: ${requestId})`);
          throw new Error(`Gemini API rate limit exceeded after ${retries + 1} attempts.${detailedError}`);
        }
      }
      
      // Success!
      if (response.ok) {
        console.log(`[Gemini API] ✅ API call successful (ID: ${requestId}): Status=${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Gemini API] ❌ Request failed (ID: ${requestId}, attempt ${attempt + 1}):`, lastError.message);
      
      // If it's a network error and we have retries left, wait and retry
      if (attempt < retries) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.log(`[Gemini API] 🔄 Network error, retrying in ${Math.round(delay / 1000)}s (ID: ${requestId}, attempt ${attempt + 1}/${retries + 1})`);
        await sleep(delay);
        continue;
      }
      
      console.error(`[Gemini API] ❌ All retries exhausted (ID: ${requestId})`);
      throw lastError;
    }
  }
  
  console.error(`[Gemini API] ❌ Failed to fetch from Gemini API (ID: ${requestId})`);
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

  console.log(`[Gemini API] 🎨 Starting image generation:`);
  console.log(`[Gemini API]    - Reference images: ${referenceImages.length}`);
  console.log(`[Gemini API]    - Aspect ratio: ${aspectRatio}`);
  console.log(`[Gemini API]    - Target images: ${numImages}`);
  console.log(`[Gemini API]    - Prompt length: ${prompt.length} chars`);

  if (referenceImages.length === 0) {
    console.error(`[Gemini API] ❌ No reference images provided`);
    throw new Error(getServerString("atLeastOneReferenceImageRequired"));
  }

  // Build the request payload
  const parts: any[] = [];

  // Add reference images
  console.log(`[Gemini API] 📸 Preparing ${referenceImages.length} reference images...`);
  for (let i = 0; i < referenceImages.length; i++) {
    const refImage = referenceImages[i];
    const imageSizeKB = Math.round(refImage.data.length * 0.75 / 1024); // Base64 is ~33% larger
    console.log(`[Gemini API]    Image ${i + 1}: ${refImage.mimeType}, ~${imageSizeKB}KB`);
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
      // Include both TEXT and IMAGE - some models may require both
      // We'll filter out text responses and only use images
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: {
        aspectRatio: aspectRatio === "1:1" ? "1:1" : aspectRatio === "16:9" ? "16:9" : "9:16",
      },
    },
  };

  const requestBodySize = JSON.stringify(requestBody).length;
  console.log(`[Gemini API] 📦 Request payload size: ${Math.round(requestBodySize / 1024)}KB`);

  try {
    console.log(`[Gemini API] 🌐 Making API call to: ${GEMINI_API_URL}`);
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
      console.error(`[Gemini API] Error response (${response.status}):`, errorText);
      
      // If 404, the model might not exist - list available models
      if (response.status === 404) {
        console.log(`[Gemini API] ⚠️  Model not found. Listing available models...`);
        await listAvailableModels();
      }
      
      // Try to parse error details if it's JSON
      let errorDetails = '';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorDetails = errorJson.error.message || JSON.stringify(errorJson.error);
        }
      } catch {
        errorDetails = errorText;
      }
      
      throw new Error(`${getServerString("geminiApiError")} (${response.status}): ${errorDetails || response.statusText}`);
    }

    const data = await response.json();
    
    // Log response structure for debugging
    console.log(`[Gemini API] 📥 Response received:`);
    console.log(`[Gemini API]    - Has candidates: ${!!data.candidates}`);
    console.log(`[Gemini API]    - Candidates count: ${data.candidates?.length || 0}`);
    console.log(`[Gemini API]    - Has prompt feedback: ${!!data.promptFeedback}`);
    if (data.promptFeedback) {
      console.log(`[Gemini API]    - Prompt feedback:`, JSON.stringify(data.promptFeedback, null, 2));
    }
    
    // Log full response structure for debugging (truncated to avoid huge logs)
    const responsePreview = JSON.stringify(data, null, 2);
    console.log(`[Gemini API] 🔍 Full response structure (first 2000 chars):`, responsePreview.substring(0, 2000));
    if (responsePreview.length > 2000) {
      console.log(`[Gemini API] 🔍 ... (response truncated, total length: ${responsePreview.length} chars)`);
    }

    // Extract generated images from the response
    const generatedImages: GeneratedImage[] = [];

    if (data.candidates && Array.isArray(data.candidates)) {
      console.log(`[Gemini API] 🔍 Processing ${data.candidates.length} candidate(s)...`);
      for (let i = 0; i < data.candidates.length; i++) {
        const candidate = data.candidates[i];
        console.log(`[Gemini API]    Candidate ${i + 1}: has content=${!!candidate.content}, has parts=${!!candidate.content?.parts}`);
        
        // Log candidate structure for debugging
        const candidateStr = JSON.stringify(candidate, null, 2);
        console.log(`[Gemini API]    Candidate ${i + 1} structure (first 1500 chars):`, candidateStr.substring(0, 1500));
        
        if (candidate.content && candidate.content.parts) {
          for (let j = 0; j < candidate.content.parts.length; j++) {
            const part = candidate.content.parts[j];
            const partKeys = Object.keys(part);
            console.log(`[Gemini API]    Part ${j + 1} keys:`, partKeys);
            
            // Check for inlineData (camelCase) - API returns this format
            if (part.inlineData && part.inlineData.data) {
              const imageSizeKB = Math.round(part.inlineData.data.length * 0.75 / 1024);
              console.log(`[Gemini API]    ✅ Found image in part ${j + 1}: ${part.inlineData.mimeType || 'image/png'}, ~${imageSizeKB}KB`);
              generatedImages.push({
                data: part.inlineData.data,
                mimeType: part.inlineData.mimeType || "image/png",
              });
            }
            // Check for inline_data (snake_case) - fallback for different API versions
            else if (part.inline_data && part.inline_data.data) {
              const imageSizeKB = Math.round(part.inline_data.data.length * 0.75 / 1024);
              console.log(`[Gemini API]    ✅ Found image in part ${j + 1} (snake_case): ${part.inline_data.mime_type || 'image/png'}, ~${imageSizeKB}KB`);
              generatedImages.push({
                data: part.inline_data.data,
                mimeType: part.inline_data.mime_type || "image/png",
              });
            } 
            // Check for file_data (alternative image format)
            else if (part.file_data || part.fileData) {
              const fileData = part.file_data || part.fileData;
              console.log(`[Gemini API]    ✅ Found file_data in part ${j + 1}:`, JSON.stringify(fileData, null, 2));
              // Note: file_data might need different handling - might need to fetch the file
              console.warn(`[Gemini API]    ⚠️  file_data format not yet supported, skipping`);
            }
            // Check for text - this indicates the API returned text instead of images
            else if (part.text) {
              console.log(`[Gemini API]    📝 Found text in part ${j + 1}: ${part.text.substring(0, 200)}...`);
              console.warn(`[Gemini API]    ⚠️  API returned text instead of image. This suggests:`);
              console.warn(`[Gemini API]       1. The model may not support image generation`);
              console.warn(`[Gemini API]       2. The responseModalities parameter may not be working`);
              console.warn(`[Gemini API]       3. The model name may be incorrect`);
            }
            // Check for other possible image formats
            else if (part.image) {
              console.log(`[Gemini API]    ✅ Found image in part ${j + 1} (image field):`, Object.keys(part.image));
              // Handle different image formats
              if (part.image.data) {
                generatedImages.push({
                  data: part.image.data,
                  mimeType: part.image.mime_type || "image/png",
                });
              }
            }
            // Log unknown part structure
            else {
              console.log(`[Gemini API]    ⚠️  Unknown part structure in part ${j + 1}:`, JSON.stringify(part, null, 2).substring(0, 500));
            }
          }
        } else {
          console.warn(`[Gemini API]    ⚠️  Candidate ${i + 1} has no content or parts`);
        }
      }
    } else {
      console.warn(`[Gemini API] ⚠️  Response has no candidates array`);
    }
    
    // Check for errors in prompt feedback
    if (data.promptFeedback && data.promptFeedback.blockReason) {
      const reason = data.promptFeedback.blockReason;
      const message = data.promptFeedback.safetyRatings?.map((r: any) => r.category).join(', ') || 'Unknown reason';
      console.error(`[Gemini API] 🚫 Prompt blocked: ${reason} - ${message}`);
      throw new Error(`Image generation was blocked: ${reason}. ${message}`);
    }
    
    console.log(`[Gemini API] ✅ Successfully extracted ${generatedImages.length} image(s) from response`);

    // If no images were found, check if we got text instead
    if (generatedImages.length === 0) {
      // Check if we got text responses instead of images
      const hasTextResponse = data.candidates?.some((c: any) => 
        c.content?.parts?.some((p: any) => p.text)
      );
      
      if (hasTextResponse) {
        console.error(`[Gemini API] ❌ API returned text instead of images. Possible issues:`);
        console.error(`[Gemini API]    1. Model '${GEMINI_MODEL_NAME}' may not support image generation`);
        console.error(`[Gemini API]    2. The responseModalities parameter may not be working correctly`);
        console.error(`[Gemini API]    3. The model may require different API parameters`);
        console.error(`[Gemini API]    Suggestion: Verify the model name and check Google AI documentation`);
        
        // Try to list available models to help debug
        console.log(`[Gemini API] 🔍 Listing available models to verify model name...`);
        await listAvailableModels();
        
        throw new Error(
          `Gemini API returned text descriptions instead of images. ` +
          `The model '${GEMINI_MODEL_NAME}' may not support image generation, or the API parameters may be incorrect. ` +
          `Please verify the model name and API configuration.`
        );
      } else {
        console.error(`[Gemini API] ❌ No images found in response and no text either. Response structure may be unexpected.`);
        throw new Error(
          `No images were generated. The API response did not contain image data. ` +
          `Please check the model configuration and API parameters.`
        );
      }
    }

    // If we need more images, make additional requests
    // Gemini typically returns one image per request, so we make multiple requests
    const imagesToGenerate = Math.max(1, numImages);
    const allImages = [...generatedImages];

    // Generate remaining images with delays to avoid rate limiting
    const remainingImages = imagesToGenerate - allImages.length;
    if (remainingImages > 0) {
      console.log(`[Gemini API] 🔄 Need ${remainingImages} more image(s), making additional API calls...`);
    }
    
    while (allImages.length < imagesToGenerate) {
      // Add delay between requests to avoid rate limiting (reduced delay for faster generation)
      if (allImages.length > 0) {
        console.log(`[Gemini API] ⏸️  Waiting ${REQUEST_DELAY / 1000}s before next request to avoid rate limits...`);
        await sleep(REQUEST_DELAY);
      }
      
      console.log(`[Gemini API] 🎨 Generating additional image ${allImages.length + 1}/${imagesToGenerate}...`);
      const additionalImages = await generateSingleImage(referenceImages, prompt, aspectRatio);
      
      if (additionalImages.length > 0) {
        console.log(`[Gemini API] ✅ Received ${additionalImages.length} additional image(s)`);
        allImages.push(...additionalImages);
      } else {
        console.warn(`[Gemini API] ⚠️  No additional images returned, stopping generation`);
        break;
      }
      
      // If we've been waiting too long, break early
      // (This prevents infinite loops if API keeps failing)
      if (allImages.length === 0 && remainingImages > 0) {
        console.warn(`[Gemini API] ⚠️  No images generated after first attempt, stopping to avoid long waits`);
        break;
      }
    }

    const finalImages = allImages.slice(0, imagesToGenerate);
    console.log(`[Gemini API] 🎉 Image generation complete: ${finalImages.length}/${imagesToGenerate} images generated`);
    return finalImages;
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
  console.log(`[Gemini API] 🎨 [Single Image] Starting generation with ${referenceImages.length} reference images`);
  
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
      // Include both TEXT and IMAGE - some models may require both
      // We'll filter out text responses and only use images
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: {
        aspectRatio: aspectRatio === "1:1" ? "1:1" : aspectRatio === "16:9" ? "16:9" : "9:16",
      },
    },
  };

  try {
    console.log(`[Gemini API] 🌐 [Single Image] Making API call...`);
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

    console.log(`[Gemini API] 📥 [Single Image] Response received, processing...`);

    if (data.candidates && Array.isArray(data.candidates)) {
      for (const candidate of data.candidates) {
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            // Check for inlineData (camelCase) - API returns this format
            if (part.inlineData && part.inlineData.data) {
              const imageSizeKB = Math.round(part.inlineData.data.length * 0.75 / 1024);
              console.log(`[Gemini API] ✅ [Single Image] Found image: ${part.inlineData.mimeType || 'image/png'}, ~${imageSizeKB}KB`);
              images.push({
                data: part.inlineData.data,
                mimeType: part.inlineData.mimeType || "image/png",
              });
            }
            // Check for inline_data (snake_case) - fallback for different API versions
            else if (part.inline_data && part.inline_data.data) {
              const imageSizeKB = Math.round(part.inline_data.data.length * 0.75 / 1024);
              console.log(`[Gemini API] ✅ [Single Image] Found image (snake_case): ${part.inline_data.mime_type || 'image/png'}, ~${imageSizeKB}KB`);
              images.push({
                data: part.inline_data.data,
                mimeType: part.inline_data.mime_type || "image/png",
              });
            }
          }
        }
      }
    }

    if (images.length === 0) {
      console.warn(`[Gemini API] ⚠️  [Single Image] No images found in response`);
    } else {
      console.log(`[Gemini API] ✅ [Single Image] Successfully extracted ${images.length} image(s)`);
    }

    return images;
  } catch (error) {
    console.error(`[Gemini API] ❌ [Single Image] Error:`, error);
    return [];
  }
}

