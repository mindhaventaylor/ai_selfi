/**
 * Centralized server-side user-facing error messages and strings
 * These are returned to clients and should be user-friendly
 */

export const serverStrings = {
  errors: {
    // Auth errors
    supabaseNotConfigured: "Supabase not configured: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    tokenVerificationFailed: "Token verification failed",
    invalidAccessToken: "Invalid access token: no user found",
    serverConfigurationError: "Server configuration error. Please contact support.",
    
    // Database errors
    databaseNotAvailable: "Database not available",
    
    // Payment errors
    packNotFound: "Pack not found",
    
    // Model errors
    modelNotFound: "Model not found or access denied",
    insufficientCreditsForTraining: "Insufficient credits for training",
    failedToUpdateCredits: "Failed to update credits",
    failedToCreateModel: "Failed to create model",
    failedToInsertTrainingImages: "Failed to insert training images",
    failedToDeleteModel: "Failed to delete model",
    modelNotReady: "Model is not ready yet. Please wait for training to complete.",
    
    // Photo generation errors
    insufficientCredits: "Insufficient credits",
    failedToDownloadImage: "Failed to download image from storage",
    noDataReturned: "Failed to download image from storage: No data returned",
    failedToFetchImage: "Failed to fetch image",
    failedToFetchReferenceImage: "Failed to fetch reference image",
    noImagesGenerated: "No images were generated. Please try again.",
    highDemandRetry: "The image generation service is currently experiencing high demand. The system will automatically retry, but this may take several minutes. Your credits have not been deducted. You can close this window and check back later, or try again in a few minutes.",
    failedToGenerateImages: "Failed to generate images",
    failedToUploadGeneratedImage: "Failed to upload generated image",
    failedToUploadAnyImages: "Failed to upload any generated images. Please try again.",
    failedToCreateGenerationBatch: "Failed to create generation batch",
    failedToCreatePhotoRecords: "Failed to create photo records",
    failedToDeductCredits: "Failed to deduct credits",
    
    // Photo errors
    photoNotFound: "Photo not found or access denied",
    
    // Gemini API errors
    atLeastOneReferenceImageRequired: "At least one reference image is required",
    geminiApiError: "Gemini API error",
  },
} as const;

/**
 * Get a server error message by key
 */
export function getServerString(key: keyof typeof serverStrings.errors): string {
  return serverStrings.errors[key];
}

