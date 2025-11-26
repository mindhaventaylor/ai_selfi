import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "@/hooks/useTranslation";
import { usePostHogVariant } from "@/hooks/usePostHogVariant";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Sparkles, 
  CreditCard, 
  Settings, 
  ChevronDown,
  User,
  Image as ImageIcon,
  Glasses,
  Palette,
  Scissors,
  Download,
  AlertCircle,
  X
} from "lucide-react";
import { exampleImages, filterExampleImages, type ExampleImage } from "@/data/exampleImages";
import { toast } from "sonner";
import { safeLocalStorage } from "@/utils/localStorage";

import DashboardV2 from "./DashboardV2";

export default function GenerateImages() {
  // ALL HOOKS MUST BE CALLED FIRST, before any conditional returns
  const { user } = useAuth();
  const { t } = useTranslation();
  const { variant } = usePostHogVariant(user?.id);
  const [location, setLocation] = useLocation(); // Must be called before any useEffect
  
  // State hooks
  const [gender, setGender] = useState<"man" | "woman">("man");
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [selectedBackgrounds, setSelectedBackgrounds] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "9:16" | "16:9">("9:16");
  const [modelId, setModelId] = useState<string>("");
  const [glasses, setGlasses] = useState<string>("no");
  const [hairColor, setHairColor] = useState<string>("default");
  const [hairStyle, setHairStyle] = useState<string>("no-preference");
  
  // Generation modal state
  // Check for batchId in URL immediately (synchronously) to avoid rendering DashboardV2 when we have a batchId
  const urlParamsSync = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const batchIdFromUrlSync = urlParamsSync.get("batchId");
  const initialBatchId = batchIdFromUrlSync ? parseInt(batchIdFromUrlSync) : null;
  const hasInitialBatchId = initialBatchId !== null && !isNaN(initialBatchId);
  
  // For page2 variant, if there's a batchId, we should show the modal immediately
  const urlVariantSync = urlParamsSync.get("variant");
  const firstVariantSync = safeLocalStorage.getItem("aiselfi_first_dashboard_variant") as "page1" | "page2" | null;
  const cachedVariantSync = safeLocalStorage.getItem("aiselfi_dashboard_variant") as "page1" | "page2" | null;
  const isPage2VariantSync = urlVariantSync === "page2" || firstVariantSync === "page2" || cachedVariantSync === "page2";
  // Show modal initially if there's a batchId (for both page1 and page2)
  const shouldShowModalInitially = hasInitialBatchId;
  
  const [currentBatchId, setCurrentBatchId] = useState<number | null>(hasInitialBatchId ? initialBatchId : null);
  const [isGenerating, setIsGenerating] = useState(shouldShowModalInitially);
  const [showModal, setShowModal] = useState(shouldShowModalInitially);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [completedImages, setCompletedImages] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<Array<{ id: number; url: string; status: string }>>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastBatchStatusRef = useRef<string | null>(null); // Track last batch status to avoid unnecessary updates
  const progressAnimationRef = useRef<NodeJS.Timeout | null>(null); // Track progress animation interval
  const targetProgressRef = useRef<number>(0); // Track target progress for smooth animation

  // Check for variant - prioritize URL param, then first variant (permanent), then cached, then PostHog
  // This ensures we detect page2 even when navigating with batchId
  const urlParams = new URLSearchParams(window.location.search);
  const urlVariant = urlParams.get("variant") as "page1" | "page2" | null;
  
  // Also check localStorage directly (in case URL param was already removed)
  const cachedVariant = safeLocalStorage.getItem("aiselfi_dashboard_variant") as "page1" | "page2" | null;
  
  // Also check first variant (permanent storage) - highest priority after URL
  const firstVariant = safeLocalStorage.getItem("aiselfi_first_dashboard_variant") as "page1" | "page2" | null;
  
  // Determine if this is page2 variant - check all sources
  // Priority: URL > first variant (permanent) > cached variant > PostHog variant
  const isPage2Variant = urlVariant === "page2" || firstVariant === "page2" || cachedVariant === "page2" || variant === "page2";
  
  console.log("[GenerateImages] Variant detection:", {
    urlVariant,
    firstVariant,
    cachedVariant,
    posthogVariant: variant,
    isPage2Variant,
  });

  // Fetch user's models
  const { data: modelsData, isLoading: isLoadingModels } = trpc.model.list.useQuery();
  const generateMutation = trpc.photo.generate.useMutation();
  const getBatchStatusQuery = trpc.photo.getBatchStatus.useQuery(
    currentBatchId ? { batchId: currentBatchId } : { batchId: 0 },
    { 
      enabled: !!currentBatchId && !isPage2Variant && isGenerating,
      refetchInterval: isGenerating && !isPage2Variant ? 2000 : false, // Poll every 2 seconds while generating
    }
  );
  // Check if we have batchId in URL and variant is page2 (for query enablement)
  const urlParamsForQuery = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const batchIdFromUrlForQuery = urlParamsForQuery.get("batchId");
  const urlVariantForQuery = urlParamsForQuery.get("variant");
  const firstVariantForQuery = safeLocalStorage.getItem("aiselfi_first_dashboard_variant") as "page1" | "page2" | null;
  const cachedVariantForQuery = safeLocalStorage.getItem("aiselfi_dashboard_variant") as "page1" | "page2" | null;
  const isPage2ForQuery = urlVariantForQuery === "page2" || 
    (firstVariantForQuery !== null && firstVariantForQuery === "page2") || 
    (cachedVariantForQuery !== null && cachedVariantForQuery === "page2") || 
    isPage2Variant;
  
  // Determine if query should be enabled - check multiple sources for page2 variant
  const shouldEnablePage2Query = !!currentBatchId && !!isPage2ForQuery;
  
  const getPage2BatchStatusQuery = trpc.photo.getPage2BatchStatus.useQuery(
    { batchId: currentBatchId! },
    { 
      enabled: shouldEnablePage2Query,
      refetchInterval: shouldEnablePage2Query ? 2000 : false, // Poll every 2 seconds while generating
    }
  );
  
  // Debug: Log query status
  useEffect(() => {
    if (isPage2Variant && currentBatchId) {
      console.log("[GenerateImages] Page2 query status:", {
        enabled: !!currentBatchId && isPage2ForQuery,
        currentBatchId,
        isPage2ForQuery,
        isLoading: getPage2BatchStatusQuery.isLoading,
        error: getPage2BatchStatusQuery.error,
        data: getPage2BatchStatusQuery.data,
      });
    }
  }, [isPage2Variant, currentBatchId, isPage2ForQuery, getPage2BatchStatusQuery.isLoading, getPage2BatchStatusQuery.error, getPage2BatchStatusQuery.data]);
  
  // Force modal open for page2 when batchId is present in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const batchIdFromUrl = urlParams.get("batchId");
    const urlVariant = urlParams.get("variant");
    
    // Check all variant sources
    const firstVariant = safeLocalStorage.getItem("aiselfi_first_dashboard_variant") as "page1" | "page2" | null;
    const cachedVariant = safeLocalStorage.getItem("aiselfi_dashboard_variant") as "page1" | "page2" | null;
    const isPage2 = urlVariant === "page2" || firstVariant === "page2" || cachedVariant === "page2" || isPage2Variant;
    
    if (isPage2 && batchIdFromUrl) {
      const batchIdNum = parseInt(batchIdFromUrl);
      if (!isNaN(batchIdNum)) {
        console.log("[GenerateImages] Page2: Found batchId in URL, ensuring modal is open:", batchIdNum);
        if (currentBatchId !== batchIdNum) {
          setCurrentBatchId(batchIdNum);
        }
        if (!showModal) {
          setShowModal(true);
          setIsGenerating(true);
        }
      }
    }
  }, [isPage2Variant, currentBatchId, showModal]);
  
  // Fetch training images for selected model (only if model is selected and not page2 variant)
  const { data: trainingImages } = trpc.model.getTrainingImages.useQuery(
    { modelId: parseInt(modelId) },
    { enabled: !!modelId && modelId !== "" && !isPage2Variant }
  );
  
  // State for page2 data from DashboardV2
  const [page2Data, setPage2Data] = useState<any>(null);
  const [page2DataProcessed, setPage2DataProcessed] = useState(false);

  // Debug log and ensure variant is saved
  useEffect(() => {
    console.log("[GenerateImages] Variant detection:", {
      hookVariant: variant,
      urlVariant,
      cachedVariant,
      isPage2Variant,
    });
    
    // If we detect page2 variant from URL, save it immediately
    if (urlVariant === "page2" && cachedVariant !== "page2") {
      safeLocalStorage.setItem("aiselfi_dashboard_variant", "page2");
      console.log("[GenerateImages] Saved page2 variant to cache");
    }

    // Check for page2 data from DashboardV2
    if (isPage2Variant && !page2Data) {
      const savedData = safeLocalStorage.getItem('dashboardV2_data');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          // Check if data is recent (within last hour)
          if (parsed.timestamp && Date.now() - parsed.timestamp < 3600000) {
            setPage2Data(parsed);
            console.log("[GenerateImages] Found page2 data from DashboardV2:", parsed);
          } else {
            // Data is too old, remove it
            safeLocalStorage.removeItem('dashboardV2_data');
          }
        } catch (e) {
          console.error("[GenerateImages] Failed to parse page2 data:", e);
          safeLocalStorage.removeItem('dashboardV2_data');
        }
      }
    }
  }, [variant, urlVariant, cachedVariant, isPage2Variant, page2Data]);

  // If we have a batchId, use it for polling - check immediately on mount and when location changes
  useEffect(() => {
    // Parse URL params from current location
    const urlParamsForBatch = new URLSearchParams(window.location.search);
    const batchIdFromUrl = urlParamsForBatch.get("batchId");
    
    console.log("[GenerateImages] Checking for batchId:", {
      isPage2Variant,
      batchIdFromUrl,
      currentBatchId,
      location,
    });
    
    if (isPage2Variant && batchIdFromUrl) {
      const batchIdNum = parseInt(batchIdFromUrl);
      if (!isNaN(batchIdNum)) {
        console.log("[GenerateImages] Page2: Found batchId in URL:", batchIdNum, "currentBatchId:", currentBatchId);
        if (batchIdNum !== currentBatchId) {
          console.log("[GenerateImages] Page2: Setting batch ID from URL:", batchIdNum);
          setCurrentBatchId(batchIdNum);
          setIsGenerating(true);
          setShowModal(true); // Open modal immediately
          setGenerationProgress(0);
          setCompletedImages(0);
          setGeneratedImages([]);
          setErrorMessage(null);
          targetProgressRef.current = 0; // Reset target progress
          if (progressAnimationRef.current) {
            clearInterval(progressAnimationRef.current);
            progressAnimationRef.current = null;
          }
          console.log("[GenerateImages] Page2: Modal opened, showModal set to true, isGenerating set to true");
        }
        // Don't check showModal/isGenerating here to avoid loops - only set when batchId changes
      } else {
        console.warn("[GenerateImages] Page2: Invalid batchId in URL:", batchIdFromUrl);
      }
    }
    // Removed the else if block that checked showModal/isGenerating to avoid infinite loops
  }, [isPage2Variant, location, currentBatchId]);
  
  // Also check on initial mount for page2 with batchId
  // This ensures the modal opens even if the variant detection hasn't completed yet
  useEffect(() => {
    const urlParamsForBatch = new URLSearchParams(window.location.search);
    const batchIdFromUrl = urlParamsForBatch.get("batchId");
    const urlVariantForBatch = urlParamsForBatch.get("variant");
    
    // Check all variant sources synchronously
    const firstVariantForBatch = safeLocalStorage.getItem("aiselfi_first_dashboard_variant") as "page1" | "page2" | null;
    const cachedVariantForBatch = safeLocalStorage.getItem("aiselfi_dashboard_variant") as "page1" | "page2" | null;
    const isPage2ForBatch = urlVariantForBatch === "page2" || firstVariantForBatch === "page2" || cachedVariantForBatch === "page2";
    
    console.log("[GenerateImages] Initial mount check:", {
      isPage2Variant,
      isPage2ForBatch,
      batchIdFromUrl,
      currentBatchId,
      showModal,
    });
    
    if ((isPage2Variant || isPage2ForBatch) && batchIdFromUrl) {
      const batchIdNum = parseInt(batchIdFromUrl);
      if (!isNaN(batchIdNum)) {
        console.log("[GenerateImages] Page2: Initial mount with batchId:", batchIdNum, "currentBatchId:", currentBatchId);
        if (!currentBatchId || currentBatchId !== batchIdNum) {
          console.log("[GenerateImages] Page2: Setting up batch from URL on mount");
          setCurrentBatchId(batchIdNum);
          setIsGenerating(true);
          setShowModal(true); // Open modal immediately
          setGenerationProgress(0);
          setCompletedImages(0);
          setGeneratedImages([]);
          setErrorMessage(null);
          targetProgressRef.current = 0; // Reset target progress
          if (progressAnimationRef.current) {
            clearInterval(progressAnimationRef.current);
            progressAnimationRef.current = null;
          }
          console.log("[GenerateImages] Page2: Modal opened on mount, showModal:", true, "isGenerating:", true);
        } else if (!showModal) {
          // If batchId is already set but modal is closed, open it
          console.log("[GenerateImages] Page2: BatchId already set but modal closed, opening modal");
          setShowModal(true);
          setIsGenerating(true);
        }
      }
    }
  }, []); // Only run on mount

  // Handle batch status query errors
  useEffect(() => {
    if (getBatchStatusQuery.error && currentBatchId && isGenerating && !isPage2Variant) {
      console.error(`[GenerateImages] Batch status query error for batch ${currentBatchId}:`, getBatchStatusQuery.error);
      // Don't show error immediately - might be a temporary issue
      // Only show error if it persists
      if (getBatchStatusQuery.error.message?.includes("not found") || 
          getBatchStatusQuery.error.message?.includes("Batch not found")) {
        console.error(`[GenerateImages] Batch ${currentBatchId} not found - this might be a stale batch ID`);
        setIsGenerating(false);
        setErrorMessage(t("generateImages.batchNotFound"));
      }
    }
    
    // Handle page2 batch status query errors
    if (getPage2BatchStatusQuery.error && currentBatchId && isGenerating && isPage2Variant) {
      console.error(`[GenerateImages] Page2 batch status query error for batch ${currentBatchId}:`, getPage2BatchStatusQuery.error);
      // Don't show error immediately - might be a temporary issue
      // Only show error if it persists
      if (getPage2BatchStatusQuery.error.message?.includes("not found") || 
          getPage2BatchStatusQuery.error.message?.includes("Batch not found")) {
        console.error(`[GenerateImages] Page2 batch ${currentBatchId} not found - this might be a stale batch ID`);
        setIsGenerating(false);
        setErrorMessage(t("generateImages.batchNotFound"));
      }
    }
  }, [getBatchStatusQuery.error, getPage2BatchStatusQuery.error, currentBatchId, isGenerating, isPage2Variant]);

  // Debug: Log when batch ID changes
  useEffect(() => {
    if (currentBatchId) {
      console.log(`[GenerateImages] Current batch ID changed to: ${currentBatchId}`);
    }
  }, [currentBatchId]);

  // Update progress from polling - use page2 query if page2 variant, otherwise use regular query
  const batchStatusData = isPage2Variant 
    ? getPage2BatchStatusQuery.data 
    : getBatchStatusQuery.data;
  
  // Update progress from polling
  useEffect(() => {
    if (batchStatusData && currentBatchId) {
      const { batch, photos } = batchStatusData;
      
      // Create a unique key for this batch status to avoid unnecessary updates
      const statusKey = `${batch.id}-${batch.status}-${batch.totalImagesGenerated}-${photos.length}`;
      
      // Skip if this is the same status we already processed
      if (lastBatchStatusRef.current === statusKey) {
        return;
      }
      
      lastBatchStatusRef.current = statusKey;
      
      console.log("[GenerateImages] Batch status data received:", {
        isPage2Variant,
        batchStatus: batch.status,
        totalImages: batch.totalImagesGenerated,
        photosCount: photos.length,
        photos: photos.map((p: any) => ({ id: p.id, url: p.url, status: p.status })),
      });
      
      // Update progress - don't force modal open if user closed it
      // Only open modal automatically when generation completes or fails (so user sees results)
      if (batch.status === "completed") {
        setIsGenerating(false);
        // Clear progress animation and set to 100%
        if (progressAnimationRef.current) {
          clearInterval(progressAnimationRef.current);
          progressAnimationRef.current = null;
        }
        setGenerationProgress(100);
        targetProgressRef.current = 100;
        setCompletedImages(batch.totalImagesGenerated);
        const completedImages = photos
          .filter((p: { id: number; url: string; status: string }) => p.url) // Only include photos with URLs
          .map((p: { id: number; url: string; status: string }) => ({ id: p.id, url: p.url, status: p.status }));
        setGeneratedImages(completedImages);
        
        console.log("[GenerateImages] Completed images:", {
          totalPhotos: photos.length,
          photosWithUrls: completedImages.length,
          images: completedImages,
        });
        console.log("[GenerateImages] Generation completed:", batch.totalImagesGenerated, "images");
        // Open modal when completed so user can see results
        setShowModal((prev) => prev ? prev : true);
      } else if (batch.status === "failed") {
        setIsGenerating(false);
        setErrorMessage(t("generateImages.generationFailed"));
        console.log("[GenerateImages] Generation failed");
        // Open modal when failed so user can see error
        setShowModal((prev) => prev ? prev : true);
      } else if (batch.status === "generating") {
        // Don't force modal open if user closed it - allow them to close it
        // Only update progress (modal can be closed by user)
        setIsGenerating(true);
        
        // Use photos.length as primary source since photos are created one by one
        // Only use batch.totalImagesGenerated if photos array is empty (fallback)
        const currentPhotosCount = photos.length > 0 ? photos.length : (batch.totalImagesGenerated || 0);
        const expectedTotal = isPage2Variant 
          ? 4 // Page2 always generates 4 images
          : totalImagesToGenerate;
        
        // Update completed images count immediately (show images as they're created)
        setCompletedImages(currentPhotosCount);
        
        // Calculate target progress based on actual images completed
        // Progress = (completed images / total images) * 100
        let targetProgress = 0;
        if (currentPhotosCount === 0) {
          // Just started - show 2% to indicate processing has begun
          targetProgress = 2;
        } else if (currentPhotosCount >= expectedTotal) {
          // All images generated - show 100%
          targetProgress = 100;
        } else {
          // Calculate progress: each completed image adds (98 / expectedTotal)%
          // This gives us 2% to 100% range (2% start + 98% for images)
          // Example: 4 images = 2% + (1/4 * 98%) = 26.5% for first image
          const imageProgress = (currentPhotosCount / expectedTotal) * 98;
          targetProgress = 2 + imageProgress;
        }
        
        // Update target progress ref
        targetProgressRef.current = Math.min(100, Math.max(0, Math.round(targetProgress)));
        
        // Smooth progress animation - increment gradually towards target
        // Clear any existing animation
        if (progressAnimationRef.current) {
          clearInterval(progressAnimationRef.current);
        }
        
        // Animate progress smoothly towards target
        progressAnimationRef.current = setInterval(() => {
          setGenerationProgress((prev) => {
            const target = targetProgressRef.current;
            if (prev >= target) {
              // Reached target, clear interval
              if (progressAnimationRef.current) {
                clearInterval(progressAnimationRef.current);
                progressAnimationRef.current = null;
              }
              return prev;
            }
            // Increment by 2% per interval (smooth animation)
            const increment = Math.min(2, target - prev);
            return Math.min(100, prev + increment);
          });
        }, 200); // Update every 200ms for smooth animation
        
        // Update generated images list immediately as they're created - show one by one
        // Filter out photos without URLs and only add new ones
        const newImages = photos
          .filter((p: { id: number; url: string; status: string }) => p.url) // Only include photos with URLs
          .map((p: { id: number; url: string; status: string }) => ({ id: p.id, url: p.url, status: p.status }));
        
        // Only update if we have new images (avoid unnecessary re-renders)
        setGeneratedImages((prevImages) => {
          // If we have more images than before, update
          if (newImages.length > prevImages.length) {
            return newImages;
          }
          // If same count but different IDs, update (in case of replacement)
          const prevIds = new Set(prevImages.map(img => img.id));
          const newIds = new Set(newImages.map(img => img.id));
          if (prevIds.size !== newIds.size || Array.from(prevIds).some(id => !newIds.has(id))) {
            return newImages;
          }
          return prevImages;
        });
        
        console.log("[GenerateImages] Updated generated images:", {
          isPage2Variant,
          batchTotalImagesGenerated: batch.totalImagesGenerated,
          photosArrayLength: photos.length,
          currentPhotosCount,
          photosWithUrls: newImages.length,
          expectedTotal,
          targetProgress: targetProgressRef.current,
          images: newImages,
        });
      }
    } else if (currentBatchId && !batchStatusData) {
      // We have a batchId but no data yet - only open modal initially (don't force if user closed it)
      // This check only runs when batchId changes or data is first loading
      lastBatchStatusRef.current = null; // Reset when batchId changes
    }
  }, [batchStatusData, currentBatchId, isPage2Variant]);
  
  // Cleanup progress animation on unmount or when generation stops
  useEffect(() => {
    return () => {
      if (progressAnimationRef.current) {
        clearInterval(progressAnimationRef.current);
        progressAnimationRef.current = null;
      }
    };
  }, []);
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Define handleDownloadImage using useCallback (must be before return)
  const handleDownloadImage = useCallback((image: { id: number; url: string; status: string } | string, index: number) => {
    const imageUrl = typeof image === 'string' ? image : image.url;
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);
  
  // Calculate credits needed based on selected example image (4 variations per selected image)
  // For page2 variant, default to 4 images (1 example image * 4 variations)
  const imageCount = isPage2Variant ? 1 : (selectedImage !== null ? 1 : 0);
  const totalImagesToGenerate = imageCount * 4; // 4 images per selected image

  // Calculate derived values (not hooks, so safe to call after useEffect)
  const creditsNeeded = totalImagesToGenerate; // 1 credit per generated image
  const userCredits = user?.credits ?? 0;
  const hasEnoughCredits = creditsNeeded <= userCredits;
  const selectedModelStatus = modelsData?.find((m) => m.id.toString() === modelId)?.status;
  const isModelReady = selectedModelStatus === "ready";
  
  // For page2 variant, model is optional; for page1, model is required
  const canGenerate = isPage2Variant
    ? imageCount > 0 && hasEnoughCredits
    : imageCount > 0 && hasEnoughCredits && modelId !== "" && isModelReady;
  
  // Define helper functions and constants (not hooks, safe to call after hooks)
  const backgrounds = ["office", "neutral", "studio", "city", "nature", "interior"];
  const styles = ["formal", "casual", "elegant", "professional"];
  const badges = t("generateImages.badges", { returnObjects: true }) as { premium: string; new: string; popular: string };
  
  // Filter example images based on gender and selected styles/backgrounds
  const filteredExampleImages = filterExampleImages(
    exampleImages,
    gender,
    selectedStyles,
    selectedBackgrounds
  );

  const toggleImage = (id: number) => {
    setSelectedImage((prev) => (prev === id ? null : id));
  };

  const toggleBackground = (bg: string) => {
    setSelectedBackgrounds((prev) =>
      prev.includes(bg) ? prev.filter((b) => b !== bg) : [...prev, bg]
    );
  };

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  // Check if we should show DashboardV2 (no batchId and no page2Data)
  // This check happens AFTER all hooks are called
  const urlParamsForCheck = new URLSearchParams(window.location.search);
  const batchIdFromUrlCheck = urlParamsForCheck.get("batchId");
  const hasBatchId = batchIdFromUrlCheck || currentBatchId;
  const shouldShowDashboardV2 = isPage2Variant && !hasBatchId && !page2Data && !showModal && !isGenerating;
  const shouldShowPage1UI = !isPage2Variant || !hasBatchId;
  
  console.log("[GenerateImages] Render check:", {
    isPage2Variant,
    batchIdFromUrlCheck,
    currentBatchId,
    showModal,
    isGenerating,
    page2Data: !!page2Data,
    shouldShowDashboardV2,
  });
  
  // For page2 variant without batchId, show DashboardV2 flow
  // IMPORTANT: This return happens AFTER all hooks are called
  if (shouldShowDashboardV2) {
    console.log("[GenerateImages] Rendering DashboardV2 flow (page2 variant, no batchId)");
    return <DashboardV2 />;
  }
  
  console.log("[GenerateImages] Rendering GenerateImages", isPage2Variant ? "(page2 variant with data)" : "(page1 variant)");

  // Handle generation with page2 data (auto-called)
  const handleGenerateWithPage2Data = async (data: any, exampleImage: any) => {
    if (!user?.id) {
      toast.error(t("generateImages.userNotAuthenticated"));
      return;
    }

    // Build base prompt from form data
    let basePrompt = `Create a photorealistic professional portrait image of the person in the reference photos.`;
    
    if (data.formData.gender) {
      basePrompt += ` Gender: ${data.formData.gender}.`;
    }
    if (data.formData.age) {
      basePrompt += ` Age: ${data.formData.age}.`;
    }
    if (data.formData.hairColor) {
      basePrompt += ` Hair color: ${data.formData.hairColor}.`;
    }
    if (data.formData.hairLength) {
      basePrompt += ` Hair length: ${data.formData.hairLength}.`;
    }
    if (data.formData.hairStyle) {
      basePrompt += ` Hair style: ${data.formData.hairStyle}.`;
    }
    if (data.formData.ethnicity) {
      basePrompt += ` Ethnicity: ${data.formData.ethnicity}.`;
    }
    if (data.formData.bodyType) {
      basePrompt += ` Body type: ${data.formData.bodyType}.`;
    }
    if (data.formData.attire && data.formData.attire.length > 0) {
      basePrompt += ` Attire: ${data.formData.attire.join(", ")}.`;
    }
    if (data.formData.backgrounds && data.formData.backgrounds.length > 0) {
      basePrompt += ` Background: ${data.formData.backgrounds.join(", ")}.`;
    }
    
    basePrompt += ` High quality, professional photography, natural lighting, sharp focus.`;

    // Reset state
    setIsGenerating(true);
    setGenerationProgress(0);
    setCompletedImages(0);
    setGeneratedImages([]);
    setErrorMessage(null);
    setCurrentBatchId(null);
    setShowModal(true);
    targetProgressRef.current = 0; // Reset target progress
    if (progressAnimationRef.current) {
      clearInterval(progressAnimationRef.current);
      progressAnimationRef.current = null;
    }

    try {
      // Convert example image URL to absolute if needed
      let absoluteUrl = exampleImage.url;
      if (!exampleImage.url.startsWith('http')) {
        const publicDomain = import.meta.env.VITE_PUBLIC_DOMAIN || window.location.origin;
        absoluteUrl = exampleImage.url.startsWith('/') 
          ? `${publicDomain}${exampleImage.url}`
          : `${publicDomain}/${exampleImage.url}`;
      }

      const result = await generateMutation.mutateAsync({
        modelId: undefined, // No model for page2
        trainingImageUrls: data.trainingImageUrls, // User's uploaded images
        exampleImages: [{
          id: exampleImage.id,
          url: absoluteUrl,
          prompt: exampleImage.prompt || "professional portrait",
        }],
        basePrompt,
        aspectRatio: "9:16", // Default for page2
        numImagesPerExample: 4,
        glasses: "no",
        hairColor: data.formData.hairColor || undefined,
        hairStyle: data.formData.hairStyle || undefined,
        backgrounds: data.formData.backgrounds || [],
        styles: data.formData.attire || [],
      });

      if (result.batchId) {
        setCurrentBatchId(result.batchId);
        console.log("[GenerateImages] Generation started, batch ID:", result.batchId);
      } else {
        throw new Error(t("generateImages.failedToStartGeneration"));
      }

      // Clear page2 data after successful start
      safeLocalStorage.removeItem('dashboardV2_data');
    } catch (error: any) {
      console.error("[GenerateImages] Generation error:", error);
      setIsGenerating(false);
      setErrorMessage(error?.message || t("generateImages.failedToStartGeneration"));
      toast.error(t("generateImages.failedToGenerateImages"), {
        description: error?.message || t("generateImages.pleaseTryAgain"),
      });
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    
    // Build reference image URLs:
    // For page2 variant: Only use example images (no model required)
    // For page1 variant: Use model's training images + example images
    const referenceImageUrls: string[] = [];
    
    if (!isPage2Variant) {
      // Page1 variant: require model
      if (!modelId) {
        alert(t("generateImages.pleaseSelectValidModel"));
        return;
      }
    
      // Get selected model
      const selectedModel = modelsData?.find((m) => m.id.toString() === modelId);
      if (!selectedModel) {
        alert(t("generateImages.pleaseSelectValidModel"));
        return;
      }
    
      // Add model's training images (max 1 to minimize payload size and token consumption)
      // Using only 1 training image significantly reduces the payload size and helps avoid rate limits
      if (trainingImages && trainingImages.length > 0) {
        referenceImageUrls.push(trainingImages[0]); // Use only the first training image
      } else if (selectedModel.previewImageUrl) {
        // Fallback to preview image if training images aren't loaded yet
        referenceImageUrls.push(selectedModel.previewImageUrl);
      }
    
      if (referenceImageUrls.length === 0) {
        alert(t("generateImages.noTrainingImagesFound"));
        return;
      }
    }
    // For page2 variant, we skip model images and use only example images
    
    // Get selected example image with its prompt
    const selectedExampleImage = filteredExampleImages.find((img) => 
      img.id === selectedImage
    );
    
    if (!selectedExampleImage) {
      alert(t("generateImages.noImagesSelected"));
      return;
    }
    
    // Build base prompt from user options
    let basePrompt = `Create a photorealistic professional portrait image of the person in the reference photos.`;
    if (selectedBackgrounds.length > 0) {
      basePrompt += ` Use a ${selectedBackgrounds.join(", ")} background.`;
    }
    if (selectedStyles.length > 0) {
      basePrompt += ` Style: ${selectedStyles.join(", ")}.`;
    }
    if (glasses === "yes") {
      basePrompt += ` Include glasses.`;
    }
    if (hairColor && hairColor !== "default") {
      basePrompt += ` Hair color: ${hairColor}.`;
    }
    if (hairStyle && hairStyle !== "no-preference") {
      basePrompt += ` Hair style: ${hairStyle}.`;
    }
    basePrompt += ` High quality, professional photography, natural lighting, sharp focus.`;
    
    // Reset state
    setIsGenerating(true);
    setGenerationProgress(0); // Will be updated to 5% when batch status is first received
    setCompletedImages(0);
    setGeneratedImages([]);
    setErrorMessage(null);
    setCurrentBatchId(null);
    setShowModal(true);
    
    try {
      // Convert relative URL to absolute URL
      let absoluteUrl = selectedExampleImage.url;
      
      if (!selectedExampleImage.url.startsWith('http')) {
        // If it's a relative URL, convert to absolute
        if (selectedExampleImage.url.startsWith('/')) {
          // Use production domain if available, otherwise use current origin
          // In production, this should be your actual domain
          const publicDomain = import.meta.env.VITE_PUBLIC_DOMAIN || window.location.origin;
          absoluteUrl = `${publicDomain}${selectedExampleImage.url}`;
        } else {
          // If it doesn't start with /, assume it's relative to root
          const publicDomain = import.meta.env.VITE_PUBLIC_DOMAIN || window.location.origin;
          absoluteUrl = `${publicDomain}/${selectedExampleImage.url}`;
        }
      }

      // Call the API with new structure
      const result = await generateMutation.mutateAsync({
        modelId: isPage2Variant ? undefined : parseInt(modelId), // Optional for page2
        trainingImageUrls: referenceImageUrls, // Empty for page2, contains model images for page1
        exampleImages: [{
          id: selectedExampleImage.id,
          url: absoluteUrl,
          prompt: selectedExampleImage.prompt,
        }],
        basePrompt,
        aspectRatio,
        numImagesPerExample: 4,
        glasses: glasses as "yes" | "no",
        hairColor: hairColor !== "default" ? hairColor : undefined,
        hairStyle: hairStyle !== "no-preference" ? hairStyle : undefined,
        backgrounds: selectedBackgrounds,
        styles: selectedStyles,
      });

      // Set batch ID for polling
      if (result.batchId) {
        console.log(`[GenerateImages] Setting batch ID to ${result.batchId}`);
        setCurrentBatchId(result.batchId);
        // Force a small delay to ensure state is updated before query starts
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        // Fallback if no batch ID (shouldn't happen)
        setIsGenerating(false);
        setErrorMessage(t("generateImages.failedToStartGeneration"));
      }
    } catch (error: any) {
      console.error("Error generating images:", error);
      setIsGenerating(false);
      
      // Show error in modal instead of alert
      const errorMsg = error?.message || t("generateImages.errorGenerating");
      setErrorMessage(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Debug indicator for page2 variant */}
      {isPage2Variant && (
        <div className="bg-primary/10 border-b border-primary/20 px-6 py-2 text-center text-sm text-primary font-semibold">
          {t("generateImages.page2VariantActive")} - {hasBatchId ? t("generateImages.generationInProgress") : t("generateImages.modelSelectionHidden")}
        </div>
      )}
      {/* Only show page1 UI if not page2 variant with batchId */}
      {shouldShowPage1UI && (
      <div className="w-full max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold">{t("generateImages.title")}</h1>

            {/* Gender Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("generateImages.selectGender")}</label>
              <div className="flex gap-3 mt-1.5">
                <Button
                  variant={gender === "man" ? "default" : "outline"}
                  onClick={() => setGender("man")}
                  className={gender === "man" ? "bg-primary" : ""}
                >
                  {t("generateImages.man")}
                </Button>
                <Button
                  variant={gender === "woman" ? "default" : "outline"}
                  onClick={() => setGender("woman")}
                  className={gender === "woman" ? "bg-primary" : ""}
                >
                  {t("generateImages.woman")}
                </Button>
              </div>
            </div>

            {/* Filter Images */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("generateImages.background")}</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {backgrounds.map((bg) => (
                    <Button
                      key={bg}
                      variant={selectedBackgrounds.includes(bg) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleBackground(bg)}
                      className={
                        selectedBackgrounds.includes(bg) ? "bg-primary" : ""
                      }
                    >
                      {bg}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("generateImages.style")}</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {styles.map((style) => (
                    <Button
                      key={style}
                      variant={selectedStyles.includes(style) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleStyle(style)}
                      className={
                        selectedStyles.includes(style) ? "bg-primary" : ""
                      }
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Multiple Variations Banner */}
            <Card className="bg-primary/20 border-primary/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {t("generateImages.multipleVariations")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("generateImages.multipleVariationsDesc")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Example Images Grid - User selects style images */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">{t("generateImages.modelTrainingImages")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("generateImages.selectReferenceImages")}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredExampleImages.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    {t("generateImages.noImagesMatchFilters")}
                  </div>
                ) : (
                  filteredExampleImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedImage === image.id
                        ? "border-primary ring-2 ring-primary/50"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => toggleImage(image.id)}
                  >
                    <img
                      src={image.url}
                      alt={`${t("generateImages.altText.reference")} ${image.id}`}
                      className="w-full h-full object-cover"
                    />
                    {image.badge && (
                      <Badge
                        className={`absolute top-2 right-2 ${
                          image.badge === badges.premium
                            ? "bg-purple-500"
                            : image.badge === badges.new
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                      >
                        {image.badge}
                      </Badge>
                    )}
                    {selectedImage === image.id && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-white font-bold">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Parameters Sidebar - Fixed to the right */}
          <div className="w-full lg:w-[380px] shrink-0 flex-shrink-0">
            <Card className="bg-card/50 border-border lg:sticky lg:top-20 w-full">
              <CardContent className="p-0">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors border-b border-border">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-purple-400" />
                      <h2 className="text-xl font-bold">{t("generateImages.parameters")}</h2>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="p-6 space-y-6">
                      {/* Model ID - Hidden for page2 variant */}
                      {!isPage2Variant && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <label className="text-sm font-medium">{t("generateImages.model")}</label>
                        </div>
                        <Select value={modelId} onValueChange={setModelId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("generateImages.selectModel")} />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingModels ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                {t("generateImages.loadingModels")}
                              </div>
                            ) : modelsData && modelsData.length > 0 ? (
                              modelsData.map((model) => (
                                <SelectItem 
                                  key={model.id} 
                                  value={model.id.toString()}
                                  disabled={model.status !== "ready"}
                                >
                                  {model.name} {model.gender ? `(${model.gender})` : ""} 
                                  {model.status === "training" && ` - ${t("generateImages.training")}`}
                                  {model.status === "failed" && ` - ${t("generateImages.failed")}`}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                {t("generateImages.noModelsAvailable")}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {!modelId && modelsData && modelsData.length === 0 && t("generateImages.firstNeedToTrain")}
                          {!modelId && modelsData && modelsData.length > 0 && t("generateImages.selectModelToGenerate")}
                          {modelId && modelsData?.find((m) => m.id.toString() === modelId)?.status === "training" && t("generateImages.modelStillTraining")}
                          {modelId && modelsData?.find((m) => m.id.toString() === modelId)?.status === "failed" && t("generateImages.modelFailed")}
                        </p>
                      </div>
                      )}

                      {/* Image Dimensions */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <label className="text-sm font-medium">{t("generateImages.imageDimensions")}</label>
                        </div>
                        <div className="flex gap-2">
                          {(["1:1", "9:16", "16:9"] as const).map((ratio) => (
                            <Button
                              key={ratio}
                              variant={aspectRatio === ratio ? "default" : "outline"}
                              size="sm"
                              onClick={() => setAspectRatio(ratio)}
                              className={
                                aspectRatio === ratio
                                  ? "bg-purple-500 hover:bg-purple-600 border-purple-500"
                                  : "flex-1"
                              }
                            >
                              {ratio}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {t("generateImages.aspectRatio")}
                        </p>
                      </div>

                      {/* Glasses */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Glasses className="h-4 w-4 text-muted-foreground" />
                          <label className="text-sm font-medium">{t("generateImages.doYouWearGlasses")}</label>
                        </div>
                        <Select value={glasses} onValueChange={setGlasses}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">{t("generateImages.no")}</SelectItem>
                            <SelectItem value="yes">{t("generateImages.yes")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {t("generateImages.addGlassesToImages")}
                        </p>
                      </div>

                      {/* Hair Color */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Palette className="h-4 w-4 text-muted-foreground" />
                          <label className="text-sm font-medium">
                            {t("generateImages.hairColor")}
                          </label>
                        </div>
                        <Select value={hairColor} onValueChange={setHairColor}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">{t("generateImages.default")}</SelectItem>
                            <SelectItem value="black">{t("generateImages.black")}</SelectItem>
                            <SelectItem value="brown">{t("generateImages.brown")}</SelectItem>
                            <SelectItem value="blonde">{t("generateImages.blonde")}</SelectItem>
                            <SelectItem value="red">{t("generateImages.red")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {t("generateImages.chooseHairColor")}
                        </p>
                      </div>

                      {/* Hair Style */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Scissors className="h-4 w-4 text-muted-foreground" />
                          <label className="text-sm font-medium">
                            {t("generateImages.hairStyle")}
                          </label>
                        </div>
                        <Select value={hairStyle} onValueChange={setHairStyle}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-preference">{t("generateImages.noPreference")}</SelectItem>
                            <SelectItem value="short">{t("generateImages.short")}</SelectItem>
                            <SelectItem value="medium">{t("generateImages.medium")}</SelectItem>
                            <SelectItem value="long">{t("generateImages.long")}</SelectItem>
                            <SelectItem value="curly">{t("generateImages.curly")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {t("generateImages.selectHairStyle")}
                        </p>
                      </div>

                      {/* Generate Button */}
                      <div className="pt-4 border-t border-border">
                        <Button
                          className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          size="lg"
                          disabled={!canGenerate}
                          onClick={handleGenerate}
                        >
                          <Sparkles className="w-5 h-5 mr-2" />
                          {t("generateImages.generate")} {totalImagesToGenerate} {t("generateImages.images")}
                        </Button>
                        
                        {/* Credits Usage */}
                        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-2">
                          <Sparkles className="h-4 w-4" />
                          <span>
                            {imageCount === 0 
                              ? t("generateImages.selectImagesToGenerate")
                              : !hasEnoughCredits
                              ? `${t("generateImages.notEnoughCredits")} (${t("generateImages.needCredits")} ${creditsNeeded}, ${t("generateImages.haveCredits")} ${userCredits})`
                              : !isPage2Variant && modelId === ""
                              ? t("generateImages.selectModelFirst")
                              : `${t("generateImages.willUseCredits")} ${creditsNeeded} ${creditsNeeded === 1 ? t("generateImages.credit") : t("generateImages.credits")}`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      )}

      {/* Generation Progress Modal - Always render, controlled by showModal */}
      <Dialog 
        open={showModal} 
        onOpenChange={(open) => {
          console.log("[GenerateImages] Modal onOpenChange:", open, "current showModal:", showModal, "isGenerating:", isGenerating, "isPage2Variant:", isPage2Variant);
          // Allow closing the modal even if generating (user can still see progress in background)
          if (!open) {
            setShowModal(false);
            // For page2 variant, navigate back to generate page when modal closes
            if (isPage2Variant) {
              console.log("[GenerateImages] Page2: Navigating back to generate page");
              setLocation("/dashboard/generate");
            }
            // Don't stop generation, just close the modal
            // User can reopen by checking the batch status later
          }
        }}
      >
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
              <DialogTitle className="text-2xl font-bold">
                {t("generateImages.professionalPhotosAlmostReady")}
              </DialogTitle>
          </DialogHeader>
          
          <div className="px-6 py-4 space-y-4 flex-shrink-0">
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-destructive">
                      {t("generateImages.errorGeneratingImages")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {errorMessage}
                    </p>
                    {errorMessage.includes('rate limit') && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setErrorMessage(null);
                            setGenerationProgress(0);
                            setCompletedImages(0);
                            setGeneratedImages([]);
                            targetProgressRef.current = 0; // Reset target progress
                            if (progressAnimationRef.current) {
                              clearInterval(progressAnimationRef.current);
                              progressAnimationRef.current = null;
                            }
                            handleGenerate();
                          }}
                        >
                          {t("generateImages.retry")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowModal(false)}
                        >
                          {t("generateImages.close")}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar - Only show if not error */}
            {!errorMessage && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t("generateImages.progress")}</span>
                  <span className={`text-sm font-bold transition-colors duration-300 ${generationProgress === 100 ? 'text-green-500' : 'text-primary'}`}>
                    {Math.round(generationProgress)}%
                  </span>
                </div>
                <Progress 
                  value={generationProgress} 
                  className="h-3" 
                  animated={isGenerating && generationProgress < 100}
                />
                <p className="text-sm text-muted-foreground">
                  {completedImages} {t("generateImages.of")} {totalImagesToGenerate} {t("generateImages.imagesCompleted")}
                </p>
              </div>
            )}

            {/* Info Message - Only show if not error and generating */}
            {!errorMessage && isGenerating && (
              <p className="text-sm text-muted-foreground">
                {t("generateImages.generatingProfessionalPhotos")}
              </p>
            )}

            {/* Success Message */}
            {!errorMessage && !isGenerating && generatedImages.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {t("generateImages.canCloseWindow")}
              </p>
            )}
          </div>

          {/* Images Grid - Scrollable */}
          <div className="px-6 pb-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {/* Show generated images - appear one by one with smooth animation */}
              {generatedImages.map((image, index) => (
                <div
                  key={`generated-${image.id || index}`}
                  className="relative group aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 cursor-pointer"
                  style={{ 
                    animation: `slideInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
                    animationDelay: `${index * 100}ms`,
                    opacity: 0
                  }}
                  onClick={() => handleDownloadImage(image, index)}
                >
                  <img
                    src={image.url}
                    alt={t("generateImages.generatedImageAlt", { number: index + 1 })}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://picsum.photos/400/400?random=${index}`;
                    }}
                  />
                  {/* Download Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-background/90 rounded-full p-3">
                      <Download className="w-5 h-5 text-foreground" />
                    </div>
                  </div>
                  {/* Download Badge */}
                  <div className="absolute top-2 right-2 bg-background/90 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Download className="w-4 h-4 text-foreground" />
                  </div>
                </div>
              ))}
              
              {/* Show loading placeholders for remaining images */}
              {Array.from({ length: totalImagesToGenerate - generatedImages.length }).map((_, index) => (
                <div
                  key={`loading-${index}`}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-primary/30 bg-primary/5"
                >
                  <Skeleton className="w-full h-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="relative">
                        <Sparkles className="w-8 h-8 text-primary mx-auto animate-pulse" />
                        <div className="absolute inset-0 w-8 h-8 mx-auto rounded-full bg-primary/20 animate-ping" />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {index === 0 ? t("generateImages.generating") : `${t("generateImages.generating")}...`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}