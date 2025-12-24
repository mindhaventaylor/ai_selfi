import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "@/hooks/useTranslation";
import { usePostHogVariant } from "@/hooks/usePostHogVariant";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  X,
  Upload,
  Loader2,
  HelpCircle
} from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";
import { exampleImages, filterExampleImages, type ExampleImage } from "@/data/exampleImages";
import { toast } from "sonner";
import { safeLocalStorage } from "@/utils/localStorage";

import DashboardV2 from "./DashboardV2";
import DashboardV3 from "./DashboardV3";
import { LoginModal } from "@/components/LoginModal";

export default function GenerateImages() {
  // ALL HOOKS MUST BE CALLED FIRST, before any conditional returns
  const { user } = useAuth();
  const { t } = useTranslation();
  const { variant } = usePostHogVariant(user?.id);
  const [location, setLocation] = useLocation(); // Must be called before any useEffect
  const isMobile = useIsMobile();
  
  // State hooks
  const [gender, setGender] = useState<"man" | "woman">("man");
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [selectedBackgrounds, setSelectedBackgrounds] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "9:16" | "16:9">("9:16");
  const [modelId, setModelId] = useState<string>(""); // Keep for backward compatibility but won't be used
  const [glasses, setGlasses] = useState<string>("no");
  const [hairColor, setHairColor] = useState<string>("default");
  const [hairStyle, setHairStyle] = useState<string>("no-preference");
  const [isParametersSheetOpen, setIsParametersSheetOpen] = useState(false);
  
  // Upload state for user images (replaces model selection)
  interface UploadedFile {
    id: string;
    file: File;
    preview: string;
  }
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Generation modal state
  // Check for batchId in URL immediately (synchronously) to avoid rendering DashboardV2 when we have a batchId
  const urlParamsSync = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const batchIdFromUrlSync = urlParamsSync.get("batchId");
  const initialBatchId = batchIdFromUrlSync ? parseInt(batchIdFromUrlSync) : null;
  const hasInitialBatchId = initialBatchId !== null && !isNaN(initialBatchId);
  
  // For page2 variant, if there's a batchId, we should show the modal immediately
  // ONLY use URL parameter - no localStorage or PostHog fallback
  const urlVariantSync = urlParamsSync.get("variant");
  const isPage2VariantSync = urlVariantSync === "page2";
  // Show modal initially if there's a batchId (for both page1 and page2)
  const shouldShowModalInitially = hasInitialBatchId;
  
  const [currentBatchId, setCurrentBatchId] = useState<number | null>(hasInitialBatchId ? initialBatchId : null);
  const [isGenerating, setIsGenerating] = useState(shouldShowModalInitially);
  const [isStartingGeneration, setIsStartingGeneration] = useState(false); // Immediate loading state when button is clicked
  const [showModal, setShowModal] = useState(shouldShowModalInitially);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [completedImages, setCompletedImages] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<Array<{ id: number; url: string; status: string }>>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastBatchStatusRef = useRef<string | null>(null); // Track last batch status to avoid unnecessary updates
  const progressAnimationRef = useRef<NodeJS.Timeout | null>(null); // Track progress animation interval
  const targetProgressRef = useRef<number>(0); // Track target progress for smooth animation
  const totalImagesToGenerateRef = useRef<number>(4); // Default to 4, will be updated when generation starts

  // Check for variant - ONLY use URL parameter (explicit variant=page2 or page3 required)
  const urlParams = new URLSearchParams(window.location.search);
  const urlVariantRaw = urlParams.get("variant") as "page1" | "page2" | "page3" | null;
  // Normalize page1 to page2 - page1 should never be used
  const urlVariant = urlVariantRaw === "page1" ? "page2" : urlVariantRaw;
  
  // Update URL if it was page1
  useEffect(() => {
    if (urlVariantRaw === "page1" && urlVariant === "page2") {
      const newParams = new URLSearchParams(window.location.search);
      newParams.set("variant", "page2");
      const newUrl = window.location.pathname + "?" + newParams.toString();
      window.history.replaceState({}, "", newUrl);
    }
  }, [urlVariantRaw, urlVariant]);
  
  // ONLY check URL parameter - no localStorage or PostHog fallback
  const isPage2Variant = urlVariant === "page2";
  const isPage3Variant = urlVariant === "page3";
  // For modal close behavior, both page2 and page3 should redirect to gallery
  const shouldRedirectToGalleryOnClose = isPage2Variant || isPage3Variant;
  
  console.log("[GenerateImages] Variant detection:", {
    urlVariant,
    isPage2Variant,
    isPage3Variant,
  });

  // Fetch user's models (keep for backward compatibility, but won't be displayed)
  const { data: modelsData, isLoading: isLoadingModels } = trpc.model.list.useQuery();
  const generateMutation = trpc.photo.generate.useMutation();
  const uploadImagesMutation = trpc.model.uploadTrainingImages.useMutation();
  const getBatchStatusQuery = trpc.photo.getBatchStatus.useQuery(
    currentBatchId ? { batchId: currentBatchId } : { batchId: 0 },
    { 
      enabled: !!currentBatchId && !isPage2Variant, // Enabled for page1 and page3 (page3 uses regular batches)
      // Debug query status
      onSuccess: (data) => {
        console.log("[GenerateImages] ✅ getBatchStatusQuery onSuccess:", {
          batchId: data?.batch?.id,
          batchStatus: data?.batch?.status,
          photosCount: data?.photos?.length || 0,
          enabled: !!currentBatchId && !isPage2Variant,
          currentBatchId,
          isPage2Variant,
          isPage3Variant,
        });
      },
      onError: (error) => {
        console.error("[GenerateImages] ❌ getBatchStatusQuery onError:", error);
      },
      refetchInterval: (query) => {
        const data = query.state.data;
        const isStillGenerating = data?.batch?.status === "generating" || data?.batch?.status === "pending";
        const isCompleted = data?.batch?.status === "completed";
        const photosWithUrls = data?.photos?.filter((p: any) => p.url) || [];
        const hasImages = photosWithUrls.length > 0;
        
        // Stop polling if:
        // 1. Completed and we have images
        // 2. Completed and we've been polling for a while (to prevent infinite polling)
        if (isCompleted && hasImages) {
          return false;
        }
        
        // Poll only if still generating
        if (isStillGenerating) {
          return 2000; // Poll every 2s (less aggressive)
        }
        
        // Stop polling otherwise
        return false;
      },
      staleTime: 0, // Always consider data stale to ensure fresh fetches
      cacheTime: 0, // Don't cache to see updates immediately
    }
  );
  // Check if we have batchId in URL and variant is page2 or page3 (for query enablement)
  // ONLY use URL parameter
  const urlParamsForQuery = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const batchIdFromUrlForQuery = urlParamsForQuery.get("batchId");
  const urlVariantForQuery = urlParamsForQuery.get("variant");
  const isPage2ForQuery = urlVariantForQuery === "page2";
  const isPage3ForQuery = urlVariantForQuery === "page3";
  
  // Determine if query should be enabled - only page2 uses the specialized query
  // page3 uses regular generate mutation which creates regular batches, so it needs regular query
  const shouldEnablePage2Query = !!currentBatchId && !!isPage2ForQuery;
  
  const getPage2BatchStatusQuery = trpc.photo.getPage2BatchStatus.useQuery(
    { batchId: currentBatchId! },
    { 
      enabled: shouldEnablePage2Query,
      refetchInterval: (query) => {
        // With Realtime, we can reduce polling frequency
        // Keep polling as fallback if generating OR if batch is completed but we haven't seen images yet
        const data = query.state.data;
        const isStillGenerating = data?.batch?.status === "generating" || data?.batch?.status === "pending";
        const isCompleted = data?.batch?.status === "completed";
        const photosWithUrls = data?.photos?.filter((p: any) => p.url) || [];
        
        console.log(`[GenerateImages] Page2 refetch interval check:`, {
          isStillGenerating,
          isCompleted,
          photosCount: data?.photos?.length,
          photosWithUrls: photosWithUrls.length,
          batchStatus: data?.batch?.status,
        });
        
        // Poll aggressively to show images as they're generated
        // Poll if still generating (to see images one by one)
        if (isStillGenerating) {
          return 800; // Poll every 800ms to catch images as they're generated
        }
        // Stop polling when completed (even if no photos yet, to prevent infinite polling)
        return false;
      },
      staleTime: 0, // Always consider data stale to ensure fresh fetches
      cacheTime: 0, // Don't cache to see updates immediately
    }
  );
  
  // Debug: Log query status for page2
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

  // Debug: Log query status for page3
  useEffect(() => {
    if (isPage3Variant && currentBatchId) {
      console.log("[GenerateImages] Page3 query status:", {
        enabled: !!currentBatchId && !isPage2Variant,
        currentBatchId,
        isPage3Variant,
        isLoading: getBatchStatusQuery.isLoading,
        error: getBatchStatusQuery.error,
        data: getBatchStatusQuery.data,
      });
    }
  }, [isPage3Variant, currentBatchId, isPage2Variant, getBatchStatusQuery.isLoading, getBatchStatusQuery.error, getBatchStatusQuery.data]);
  
  // Force modal open when batchId is present in URL (for both page1 and page2)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const batchIdFromUrl = urlParams.get("batchId");
    const urlVariant = urlParams.get("variant");
    
    // ONLY use URL parameter
    const isPage2 = urlVariant === "page2";
    
    // Open modal for both page1 and page2 when batchId is in URL
    if (batchIdFromUrl) {
      const batchIdNum = parseInt(batchIdFromUrl);
      if (!isNaN(batchIdNum)) {
        console.log(`[GenerateImages] ${isPage2 ? 'Page2' : 'Page1'}: Found batchId in URL, ensuring modal is open:`, batchIdNum);
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
  
  // Training images query removed - we now use uploaded images instead of models
  
  // State for page2 data from DashboardV2
  const [page2Data, setPage2Data] = useState<any>(null);
  const [page2DataProcessed, setPage2DataProcessed] = useState(false);

  // Debug log and ensure variant is saved
  useEffect(() => {
    console.log("[GenerateImages] Variant detection:", {
      urlVariant,
      isPage2Variant,
    });
    
    // No longer saving variant to localStorage - only using URL parameter

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
  }, [variant, urlVariant, isPage2Variant, page2Data]);

  // If we have a batchId, use it for polling - check immediately on mount and when location changes
  // Also poll window.location.search to catch URL changes from child components
  const [urlSearch, setUrlSearch] = useState(window.location.search);
  
  // Poll for URL changes (workaround for setLocation from child components)
  // Use a ref to track the last URL to prevent infinite loops
  const lastUrlSearchRef = useRef<string>(window.location.search);
  useEffect(() => {
    const checkUrl = () => {
      const currentSearch = window.location.search;
      // Only update if URL actually changed (prevent infinite loops)
      if (currentSearch !== lastUrlSearchRef.current) {
        console.log("[GenerateImages] URL search changed:", currentSearch);
        lastUrlSearchRef.current = currentSearch;
        setUrlSearch(currentSearch);
      }
    };
    
    // Poll less frequently (500ms instead of 100ms) to reduce CPU usage
    const interval = setInterval(checkUrl, 500);
    return () => clearInterval(interval);
  }, []); // Remove urlSearch from dependencies to prevent infinite loops
  
  useEffect(() => {
    // Parse URL params from current location
    const urlParamsForBatch = new URLSearchParams(window.location.search);
    const batchIdFromUrl = urlParamsForBatch.get("batchId");
    
    console.log("[GenerateImages] Checking for batchId:", {
      isPage2Variant,
      batchIdFromUrl,
      currentBatchId,
      location,
      urlSearch,
    });
    
    // Handle batchId for both page1 and page2
    if (batchIdFromUrl) {
      const batchIdNum = parseInt(batchIdFromUrl);
      if (!isNaN(batchIdNum)) {
        const variantType = isPage2Variant ? 'Page2' : 'Page1';
        console.log(`[GenerateImages] ${variantType}: Found batchId in URL:`, batchIdNum, "currentBatchId:", currentBatchId);
        if (batchIdNum !== currentBatchId) {
          console.log(`[GenerateImages] ${variantType}: Setting batch ID from URL:`, batchIdNum);
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
          console.log(`[GenerateImages] ${variantType}: Modal opened, showModal set to true, isGenerating set to true`);
        }
        // Don't check showModal/isGenerating here to avoid loops - only set when batchId changes
      } else {
        console.warn(`[GenerateImages] ${isPage2Variant ? 'Page2' : 'Page1'}: Invalid batchId in URL:`, batchIdFromUrl);
      }
    }
    // Removed the else if block that checked showModal/isGenerating to avoid infinite loops
  }, [isPage2Variant, location, currentBatchId, urlSearch]);
  
  // Also check on initial mount for page2 with batchId
  // This ensures the modal opens even if the variant detection hasn't completed yet
  useEffect(() => {
    const urlParamsForBatch = new URLSearchParams(window.location.search);
    const batchIdFromUrl = urlParamsForBatch.get("batchId");
    const urlVariantForBatch = urlParamsForBatch.get("variant");
    
    // ONLY use URL parameter
    const isPage2ForBatch = urlVariantForBatch === "page2";
    
    console.log("[GenerateImages] Initial mount check:", {
      isPage2Variant,
      isPage2ForBatch,
      batchIdFromUrl,
      currentBatchId,
      showModal,
    });
    
    // Handle batchId for both page1 and page2 on initial mount
    if (batchIdFromUrl) {
      const batchIdNum = parseInt(batchIdFromUrl);
      if (!isNaN(batchIdNum)) {
        const variantType = (isPage2Variant || isPage2ForBatch) ? 'Page2' : 'Page1';
        console.log(`[GenerateImages] ${variantType}: Initial mount with batchId:`, batchIdNum, "currentBatchId:", currentBatchId);
        if (!currentBatchId || currentBatchId !== batchIdNum) {
          console.log(`[GenerateImages] ${variantType}: Setting up batch from URL on mount`);
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
          console.log(`[GenerateImages] ${variantType}: Modal opened on mount, showModal:`, true, "isGenerating:", true);
        } else if (!showModal) {
          // If batchId is already set but modal is closed, open it
          console.log(`[GenerateImages] ${variantType}: BatchId already set but modal closed, opening modal`);
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

  // Realtime subscription for photos - listen for INSERTs when a new photo is added
  useEffect(() => {
    if (!currentBatchId) {
      console.log(`[GenerateImages] ⚠️ No currentBatchId, skipping Realtime subscription`);
      return;
    }

    console.log(`[GenerateImages] 🔴 Setting up Realtime subscription for batch ${currentBatchId}`, {
      isPage2Variant,
      filter: isPage2Variant 
        ? `page2GenerationBatchId=eq.${currentBatchId}`
        : `generationBatchId=eq.${currentBatchId}`,
    });

    // Create subscription for INSERTs and UPDATEs on photos table
    // Filter by generationBatchId (page1) or page2GenerationBatchId (page2)
    const channel = supabase
      .channel(`photos-batch-${currentBatchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos',
          filter: isPage2Variant 
            ? `page2GenerationBatchId=eq.${currentBatchId}`
            : `generationBatchId=eq.${currentBatchId}`,
        },
        (payload) => {
          console.log(`[GenerateImages] 🟢 Realtime INSERT received:`, {
            photoId: payload.new.id,
            url: payload.new.url ? payload.new.url.substring(0, 50) + "..." : "NO URL",
            status: payload.new.status,
            batchId: isPage2Variant ? payload.new.page2GenerationBatchId : payload.new.generationBatchId,
          });

          // Add photo immediately when it's inserted (backend inserts with URL and status="completed")
          if (payload.new.url) {
            const newPhoto = {
              id: payload.new.id,
              url: payload.new.url,
              status: payload.new.status || 'completed',
            };

            console.log(`[GenerateImages] 🎯 Processing INSERT event for photo ${newPhoto.id}`, {
              photoId: newPhoto.id,
              hasUrl: !!newPhoto.url,
              status: newPhoto.status,
              currentImagesCount: generatedImages.length,
            });

            // Update generatedImages state immediately - use functional update to ensure we have latest state
            setGeneratedImages((prevImages) => {
              // Check if this photo already exists (avoid duplicates)
              const exists = prevImages.some((img) => img.id === newPhoto.id);
              if (exists) {
                console.log(`[GenerateImages] ⚠️ Photo ${newPhoto.id} already exists in state, skipping`);
                return prevImages;
              }

              console.log(`[GenerateImages] ✅ Adding new photo to state from INSERT:`, {
                photoId: newPhoto.id,
                url: newPhoto.url.substring(0, 50) + "...",
                status: newPhoto.status,
                previousCount: prevImages.length,
                newCount: prevImages.length + 1,
                allPhotoIds: [...prevImages.map(img => img.id), newPhoto.id],
              });

              // Add new photo and sort by ID to maintain order
              const updated = [...prevImages, newPhoto].sort((a, b) => a.id - b.id);
              
              // Update completed images count immediately (use the new count)
              const newCount = updated.length;
              setCompletedImages(newCount);
              console.log(`[GenerateImages] 📊 Completed images count updated from INSERT: ${prevImages.length} -> ${newCount}`);
              
              // Update progress immediately when new image arrives
              const expectedTotal = isPage2Variant ? 4 : totalImagesToGenerateRef.current;
              if (newCount > 0 && newCount < expectedTotal) {
                const progress = 2 + (newCount / expectedTotal) * 98;
                targetProgressRef.current = Math.min(100, Math.round(progress));
                console.log(`[GenerateImages] 📊 Progress updated from INSERT: ${newCount}/${expectedTotal} = ${targetProgressRef.current}%`);
              }
              
              return updated;
            });
          } else {
            console.log(`[GenerateImages] ⏳ Photo ${payload.new.id} inserted but not ready yet (no URL)`);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'photos',
          filter: isPage2Variant 
            ? `page2GenerationBatchId=eq.${currentBatchId}`
            : `generationBatchId=eq.${currentBatchId}`,
        },
        (payload) => {
          console.log(`[GenerateImages] 🔵 Realtime UPDATE received:`, {
            photoId: payload.new.id,
            url: payload.new.url ? payload.new.url.substring(0, 50) + "..." : "NO URL",
            status: payload.new.status,
            oldStatus: payload.old.status,
            batchId: isPage2Variant ? payload.new.page2GenerationBatchId : payload.new.generationBatchId,
          });

          // If photo was updated with URL or status changed to completed, add/update it
          if (payload.new.url) {
            const updatedPhoto = {
              id: payload.new.id,
              url: payload.new.url,
              status: payload.new.status,
            };

            // Update generatedImages state
            setGeneratedImages((prevImages) => {
              const existingIndex = prevImages.findIndex((img) => img.id === updatedPhoto.id);
              
              if (existingIndex >= 0) {
                // Photo already exists, update it
                console.log(`[GenerateImages] ✅ Updating existing photo in state:`, {
                  photoId: updatedPhoto.id,
                  oldUrl: prevImages[existingIndex].url ? "HAS URL" : "NO URL",
                  newUrl: updatedPhoto.url ? "HAS URL" : "NO URL",
                });
                const updated = [...prevImages];
                updated[existingIndex] = updatedPhoto;
                return updated;
              } else {
                // New photo, add it
                console.log(`[GenerateImages] ✅ Adding new photo from UPDATE to state:`, {
                  photoId: updatedPhoto.id,
                  totalImages: prevImages.length + 1,
                });
                const updated = [...prevImages, updatedPhoto].sort((a, b) => a.id - b.id);
                return updated;
              }
            });

            // Update progress based on new photo count - calculate from updated images state
            setCompletedImages((prev) => {
              // Calculate new count from the updated images (after the setGeneratedImages above)
              // We need to check if the photo was newly added
              const wasNewPhoto = !generatedImages.some(img => img.id === updatedPhoto.id);
              const newCount = wasNewPhoto ? prev + 1 : prev;
              if (newCount !== prev) {
                console.log(`[GenerateImages] 📊 Completed images updated from UPDATE: ${prev} -> ${newCount}`);
                return newCount;
              }
              return prev;
            });

            // Refetch batch status to get updated totalImagesGenerated
            if (isPage2Variant) {
              getPage2BatchStatusQuery.refetch();
            } else {
              getBatchStatusQuery.refetch();
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`[GenerateImages] 📡 Realtime subscription status:`, status);
      });

    // Cleanup subscription when batchId changes or component unmounts
    return () => {
      console.log(`[GenerateImages] 🔴 Cleaning up Realtime subscription for batch ${currentBatchId}`);
      // Unsubscribe from the channel first, then remove it
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [currentBatchId, isPage2Variant]); // Remove query refs from dependencies to prevent unnecessary re-subscriptions

  // Update progress from polling - use page2 query only for page2 variant
  // page3 uses regular generate mutation which creates regular batches, so it needs regular query
  const batchStatusData = isPage2Variant
    ? getPage2BatchStatusQuery.data 
    : getBatchStatusQuery.data;
  
  // CRITICAL: Force update images whenever batchStatusData changes and has photos
  // This ensures images appear immediately when query returns data
  // Use a ref to track the last processed photos to avoid unnecessary updates
  const lastProcessedPhotosRef = useRef<number[]>([]);
  
  useEffect(() => {
    if (!currentBatchId) {
      return;
    }
    
    // Check both batchStatusData and the raw query data
    const data = batchStatusData || (isPage2Variant ? getPage2BatchStatusQuery.data : getBatchStatusQuery.data);
    
    console.log("[GenerateImages] 🔍 Force update check:", {
      hasBatchStatusData: !!batchStatusData,
      hasData: !!data,
      hasPhotos: !!data?.photos,
      photosLength: data?.photos?.length || 0,
      currentBatchId,
      isPage2Variant,
    });
    
    if (!data || !data.photos) {
      console.log("[GenerateImages] ⚠️ No data or photos available");
      return;
    }
    
    const photosWithUrls = (data.photos || []).filter((p: any) => p && p.url);
    
    console.log("[GenerateImages] 🔍 Photos check:", {
      totalPhotos: data.photos.length,
      photosWithUrls: photosWithUrls.length,
      photos: photosWithUrls.map((p: any) => ({ id: p.id, url: p.url?.substring(0, 50) + "..." })),
    });
    
    if (photosWithUrls.length > 0) {
      const imagesToSet = photosWithUrls
        .map((p: { id: number; url: string; status: string }) => ({ id: p.id, url: p.url, status: p.status }))
        .sort((a, b) => a.id - b.id);
      
      const currentPhotoIds = imagesToSet.map(img => img.id).sort((a, b) => a - b);
      const lastPhotoIds = lastProcessedPhotosRef.current.sort((a, b) => a - b);
      const hasNewPhotos = currentPhotoIds.length !== lastPhotoIds.length || 
        currentPhotoIds.some((id: number) => !lastPhotoIds.includes(id));
      
      if (hasNewPhotos || generatedImages.length === 0) {
        console.log("[GenerateImages] 🔥 FORCE UPDATE: Setting images immediately:", {
          imagesCount: imagesToSet.length,
          images: imagesToSet.map(img => ({ id: img.id, url: img.url?.substring(0, 50) + "..." })),
          previousCount: generatedImages.length,
          hasNewPhotos,
          photoIds: currentPhotoIds,
          lastPhotoIds: lastProcessedPhotosRef.current,
        });
        
        // ALWAYS update when we have new photos or state is empty
        setGeneratedImages(imagesToSet);
        setCompletedImages(imagesToSet.length);
        lastProcessedPhotosRef.current = currentPhotoIds;
        
        // Update progress based on number of images
        const expectedTotal = isPage2Variant ? 4 : totalImagesToGenerateRef.current;
        if (imagesToSet.length > 0 && imagesToSet.length < expectedTotal) {
          const progress = 2 + (imagesToSet.length / expectedTotal) * 98;
          targetProgressRef.current = Math.min(100, Math.round(progress));
        }
        
        // Clean up saved data when generation completes
        if (data.batch?.status === "completed") {
          // Clear saved generation intent and form data after successful generation
          try {
            localStorage.removeItem("dashboardV2_generationIntent");
            localStorage.removeItem("dashboardV2_formData");
            console.log("[GenerateImages] ✅ Cleared saved generation data after completion");
          } catch (e) {
            console.warn("[GenerateImages] Failed to clear saved data:", e);
          }
          
          setGenerationProgress(100);
          setIsGenerating(false);
          setErrorMessage(null); // Clear any error messages on success
        }
        
        // Check for failed batch status and display error message
        if (data.batch?.status === "failed") {
          console.error("[GenerateImages] Batch failed:", data.batch);
          setIsGenerating(false);
          const errorMsg = (data.batch as any)?.errorMessage || t("generateImages.failedToGenerateImages");
          setErrorMessage(errorMsg);
          toast.error(t("generateImages.failedToGenerateImages"), {
            description: errorMsg,
          });
        }
      } else {
        console.log("[GenerateImages] ⏭️ Skipping update - no new photos", {
          currentPhotoIds,
          lastPhotoIds,
        });
      }
    } else {
      console.log("[GenerateImages] ⚠️ No photos with URLs found");
    }
  }, [batchStatusData, getBatchStatusQuery.data, getPage2BatchStatusQuery.data, currentBatchId, isPage2Variant, generatedImages.length]);
  
  // Debug: Log query data whenever it changes
  useEffect(() => {
    console.log("[GenerateImages] 🔍 Debug query data:", {
      hasBatchStatusData: !!batchStatusData,
      batchStatusData: batchStatusData ? {
        hasBatch: !!batchStatusData.batch,
        hasPhotos: !!batchStatusData.photos,
        photosType: Array.isArray(batchStatusData.photos) ? 'array' : typeof batchStatusData.photos,
        photosLength: batchStatusData.photos?.length || 0,
        batchId: batchStatusData.batch?.id,
        batchStatus: batchStatusData.batch?.status,
      } : null,
      getBatchStatusQueryData: getBatchStatusQuery.data ? {
        hasBatch: !!getBatchStatusQuery.data.batch,
        hasPhotos: !!getBatchStatusQuery.data.photos,
        photosLength: getBatchStatusQuery.data.photos?.length || 0,
      } : null,
      currentBatchId,
      isPage2Variant,
    });
    
    if (batchStatusData) {
      console.log("[GenerateImages] 📥 Query data received:", {
        batchId: batchStatusData.batch?.id,
        batchStatus: batchStatusData.batch?.status,
        totalImagesGenerated: batchStatusData.batch?.totalImagesGenerated,
        photosCount: batchStatusData.photos?.length || 0,
        photosWithUrls: batchStatusData.photos?.filter((p: any) => p.url).length || 0,
        photos: batchStatusData.photos?.map((p: any) => ({ 
          id: p.id, 
          url: p.url ? p.url.substring(0, 50) + "..." : "NO URL", 
          status: p.status 
        })) || [],
        isPage2Variant,
        currentBatchId,
        rawPhotos: batchStatusData.photos,
      });
    } else if (currentBatchId) {
      console.log("[GenerateImages] ⚠️ No batchStatusData but currentBatchId exists:", {
        currentBatchId,
        isPage2Variant,
        getBatchStatusQueryIsLoading: getBatchStatusQuery.isLoading,
        getPage2BatchStatusQueryIsLoading: getPage2BatchStatusQuery.isLoading,
        getBatchStatusQueryError: getBatchStatusQuery.error,
        getPage2BatchStatusQueryError: getPage2BatchStatusQuery.error,
        getBatchStatusQueryData: getBatchStatusQuery.data,
        getPage2BatchStatusQueryData: getPage2BatchStatusQuery.data,
      });
    }
  }, [batchStatusData, currentBatchId, isPage2Variant, getBatchStatusQuery.isLoading, getPage2BatchStatusQuery.isLoading, getBatchStatusQuery.error, getPage2BatchStatusQuery.error, getBatchStatusQuery.data, getPage2BatchStatusQuery.data]);
  
  // Remove fallback polling - rely on refetchInterval and Realtime only

  // Update progress when generatedImages changes (via Realtime)
  useEffect(() => {
    // Only update progress if we have a batch and are generating
    if (!currentBatchId) {
      return;
    }

    const expectedTotal = isPage2Variant ? 4 : totalImagesToGenerateRef.current;
    const currentImagesCount = generatedImages.length;

    console.log(`[GenerateImages] 📊 Progress useEffect triggered:`, {
      currentImagesCount,
      expectedTotal,
      currentBatchId,
      isGenerating,
      isPage2Variant,
    });

    if (currentImagesCount === 0) {
      // Just started - show minimal progress
      targetProgressRef.current = 2;
      setGenerationProgress(2);
      setCompletedImages(0);
      return;
    }

    if (currentImagesCount >= expectedTotal) {
      // All images generated
      targetProgressRef.current = 100;
      setGenerationProgress(100);
      setCompletedImages(expectedTotal);
      // Clear animation interval if exists
      if (progressAnimationRef.current) {
        clearInterval(progressAnimationRef.current);
        progressAnimationRef.current = null;
      }
      return;
    }

    // Calculate progress based on actual images received via Realtime
    // Each image adds (98 / expectedTotal)% to the progress
    // Reserve 2% for start, 98% for images
    const imageProgress = (currentImagesCount / expectedTotal) * 98;
    const targetProgress = 2 + imageProgress;
    
    const newTargetProgress = Math.min(100, Math.max(0, Math.round(targetProgress)));
    targetProgressRef.current = newTargetProgress;
    setCompletedImages(currentImagesCount);

    console.log(`[GenerateImages] 📊 Progress calculated from Realtime:`, {
      currentImagesCount,
      expectedTotal,
      imageProgress,
      targetProgress: newTargetProgress,
      currentProgress: generationProgress,
      generatedImages: generatedImages.map(img => ({ id: img.id, url: img.url?.substring(0, 50) + "..." })),
    });

    // Update progress immediately when a new image arrives (don't wait for animation)
    // This ensures users see progress update right away
    setGenerationProgress((prev) => {
      // If we have a new image, jump progress significantly to show immediate feedback
      if (newTargetProgress > prev) {
        // Jump to at least 70% of the way to target for immediate visual feedback
        const jumpProgress = prev + (newTargetProgress - prev) * 0.7;
        console.log(`[GenerateImages] 📈 Jumping progress: ${prev}% -> ${jumpProgress}% (target: ${newTargetProgress}%)`);
        return Math.min(newTargetProgress, jumpProgress);
      }
      return prev;
    });

    // Smooth progress animation - increment gradually towards target
    if (progressAnimationRef.current) {
      clearInterval(progressAnimationRef.current);
      progressAnimationRef.current = null;
    }

    // Start animation to smoothly reach target
    progressAnimationRef.current = setInterval(() => {
      setGenerationProgress((prev) => {
        const target = targetProgressRef.current;
        if (prev >= target) {
          // Reached target, clear interval
          if (progressAnimationRef.current) {
            clearInterval(progressAnimationRef.current);
            progressAnimationRef.current = null;
          }
          return target;
        }
        // Increment by 0.8% every 200ms for faster, smoother animation
        return Math.min(target, prev + 0.8);
      });
    }, 200);
  }, [generatedImages.length, currentBatchId, isPage2Variant]);
  
  // Update progress from polling
  useEffect(() => {
    if (batchStatusData && currentBatchId) {
      const { batch, photos } = batchStatusData;
      
      // Log every time this effect runs to debug
      const photosWithUrls = photos.filter((p: any) => p.url);
      console.log("[GenerateImages] 🔄 useEffect triggered with batchStatusData:", {
        batchId: batch.id,
        batchStatus: batch.status,
        totalImagesGenerated: batch.totalImagesGenerated,
        photosCount: photos.length,
        photosWithUrls: photosWithUrls.length,
        photos: photos.map((p: any) => ({ 
          id: p.id, 
          url: p.url ? p.url.substring(0, 50) + "..." : "NO URL", 
          status: p.status 
        })),
        currentBatchId,
        isPage2Variant,
        generatedImagesCount: generatedImages.length,
        showModal,
        isGenerating,
      });
      
      // ALWAYS update images if we have photos - this is the main update mechanism
      if (photosWithUrls.length > 0) {
        const imagesToSet = photosWithUrls
          .map((p: { id: number; url: string; status: string }) => ({ id: p.id, url: p.url, status: p.status }))
          .sort((a, b) => a.id - b.id);
        
        // Check if we need to update by comparing with current state
        setGeneratedImages((prevImages) => {
          const prevIds = new Set(prevImages.map(img => img.id));
          const newIds = new Set(imagesToSet.map(img => img.id));
          const areDifferent = prevIds.size !== newIds.size || 
            Array.from(newIds).some(id => !prevIds.has(id));
          
          if (areDifferent || prevImages.length === 0) {
            console.log("[GenerateImages] 🔄 Updating images from batchStatusData:", {
              queryCount: imagesToSet.length,
              stateCount: prevImages.length,
              areDifferent,
              queryIds: Array.from(newIds),
              stateIds: Array.from(prevIds),
              images: imagesToSet.map(img => ({ id: img.id, url: img.url?.substring(0, 50) + "..." })),
            });
            setCompletedImages(imagesToSet.length);
            lastProcessedPhotosRef.current = Array.from(newIds);
            return imagesToSet;
          }
          return prevImages;
        });
      }
      
      // Create a unique key for this batch status to avoid unnecessary updates
      // Include photos.length to detect when new photos are added
      const statusKey = `${batch.id}-${batch.status}-${batch.totalImagesGenerated}-${photos.length}`;
      const previousKey = lastBatchStatusRef.current;
      
      // Get current photos count from state to detect new photos
      const currentPhotosInState = generatedImages.length;
      const newPhotosCount = photos.filter((p: any) => p.url).length;
      
      // Skip if this is the same status we already processed AND no new photos were added
      // BUT: Always process if:
      // 1. Status is "completed" (to ensure images are shown) - CRITICAL
      // 2. New photos were added (photos.length increased)
      // 3. Photos with URLs increased (newPhotosCount > currentPhotosInState)
      const hasNewPhotos = newPhotosCount > currentPhotosInState || photos.length > currentPhotosInState;
      const isCompleted = batch.status === "completed";
      
      // CRITICAL: Always process "completed" status, even if statusKey is the same
      // This ensures images are shown when batch completes
      if (previousKey === statusKey && !isCompleted && !hasNewPhotos) {
        console.log("[GenerateImages] Skipping duplicate status update:", {
          statusKey,
          currentPhotosInState,
          newPhotosCount,
          photosLength: photos.length,
          batchStatus: batch.status,
        });
        return;
      }
      
      // If status is "completed", force processing even if statusKey is the same
      // This is critical because when batch completes, statusKey might not change
      // if photos.length and totalImagesGenerated are already at final values
      if (isCompleted && previousKey === statusKey) {
        console.log("[GenerateImages] ⚠️ Batch completed but statusKey unchanged - forcing update anyway", {
          statusKey,
          photosCount: photos.length,
          photosWithUrls: newPhotosCount,
          generatedImagesCount: generatedImages.length,
          previousKey,
        });
        // Don't return - continue processing to update images
      }
      
      console.log("[GenerateImages] Status changed:", {
        previous: previousKey,
        current: statusKey,
        photosCount: photos.length,
        photosWithUrls: newPhotosCount,
        currentPhotosInState,
        hasNewPhotos,
        batchTotalImages: batch.totalImagesGenerated,
        batchStatus: batch.status,
      });
      
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
        // Clean up saved generation data after successful completion
        try {
          localStorage.removeItem("dashboardV2_generationIntent");
          localStorage.removeItem("dashboardV2_formData");
          console.log("[GenerateImages] ✅ Cleared saved generation data after batch completion");
        } catch (e) {
          console.warn("[GenerateImages] Failed to clear saved data:", e);
        }
        
        console.log("[GenerateImages] ✅ Processing completed batch:", {
          batchId: batch.id,
          totalImagesGenerated: batch.totalImagesGenerated,
          photosCount: photos.length,
          photosWithUrls: photos.filter((p: any) => p.url).length,
          currentGeneratedImagesCount: generatedImages.length,
        });
        
        setIsGenerating(false);
        // Clear progress animation and set to 100%
        if (progressAnimationRef.current) {
          clearInterval(progressAnimationRef.current);
          progressAnimationRef.current = null;
        }
        setGenerationProgress(100);
        targetProgressRef.current = 100;
        setCompletedImages(batch.totalImagesGenerated);
        
        // Get all photos with URLs - ensure we have all images
        const completedImages = photos
          .filter((p: { id: number; url: string; status: string }) => p.url) // Only include photos with URLs
          .map((p: { id: number; url: string; status: string }) => ({ id: p.id, url: p.url, status: p.status }));
        
        console.log("[GenerateImages] 🎉 Generation completed:", {
          batchStatus: batch.status,
          totalPhotos: photos.length,
          photosWithUrls: completedImages.length,
          batchTotalImagesGenerated: batch.totalImagesGenerated,
          images: completedImages.map(img => ({ id: img.id, url: img.url?.substring(0, 50) + "..." })),
          previousGeneratedImagesCount: generatedImages.length,
        });
        
        // ALWAYS update images list when completed - force update
        // This is critical - ensure images are set even if count is the same
        // Use functional update to ensure we get the latest state
        setGeneratedImages((prevImages) => {
          // If we have completed images, always set them (even if count is same)
          if (completedImages.length > 0) {
            // Check if arrays are different
            const prevIds = new Set(prevImages.map(img => img.id));
            const newIds = new Set(completedImages.map(img => img.id));
            const areDifferent = prevIds.size !== newIds.size || 
              Array.from(newIds).some(id => !prevIds.has(id));
            
            if (areDifferent || prevImages.length === 0) {
              console.log("[GenerateImages] 📸 Setting generated images from completed batch:", {
                count: completedImages.length,
                prevCount: prevImages.length,
                images: completedImages.map(img => ({ id: img.id, url: img.url?.substring(0, 50) + "..." })),
              });
              return completedImages.sort((a, b) => a.id - b.id);
            }
            
            // Arrays are the same, but ensure we return the correct array
            console.log("[GenerateImages] 📸 Images already set, keeping current state");
            return prevImages;
          } else {
            console.warn("[GenerateImages] ⚠️ Batch completed but no images with URLs found!", {
              photos: photos.map((p: any) => ({ id: p.id, url: p.url ? "HAS URL" : "NO URL", status: p.status })),
            });
            return prevImages;
          }
        });
        
        // Force modal open to show results
        console.log("[GenerateImages] Opening modal to show completed images");
        setShowModal(true);
      } else if (batch.status === "failed") {
        setIsGenerating(false);
        setErrorMessage(t("generateImages.generationFailed"));
        console.log("[GenerateImages] Generation failed");
        // Open modal when failed so user can see error
        setShowModal((prev) => prev ? prev : true);
      } else if (batch.status === "generating" || batch.status === "pending") {
        // Don't force modal open if user closed it - allow them to close it
        // Only update progress (modal can be closed by user)
        setIsGenerating(true);
        
        // Ensure modal is open when generating (user can still close it manually)
        if (!showModal) {
          console.log("[GenerateImages] Opening modal for generation in progress");
          setShowModal(true);
        }
        
        // Use photos.length as primary source since photos are created one by one
        // Photos are saved to database immediately as they're generated, so photos.length reflects real-time progress
        const currentPhotosCount = photos.length > 0 ? photos.length : (batch.totalImagesGenerated || 0);
        
        console.log("[GenerateImages] 🔄 Generation in progress:", {
          batchStatus: batch.status,
          photosCount: photos.length,
          photosWithUrls: photos.filter((p: any) => p.url).length,
          photos: photos.map((p: any) => ({ 
            id: p.id, 
            url: p.url ? p.url.substring(0, 50) + "..." : "NO URL",
            status: p.status 
          })),
          currentPhotosCount,
          batchTotalImagesGenerated: batch.totalImagesGenerated,
          showModal,
          isGenerating,
          generatedImagesCount: generatedImages.length,
        });
        const expectedTotal = isPage2Variant 
          ? 4 // Page2 always generates 4 images
          : totalImagesToGenerateRef.current;
        
        // Update completed images count immediately (show images as they're created)
        setCompletedImages(currentPhotosCount);
        
        // Calculate target progress based on ACTUAL images completed
        // Progress should only increase as images are actually generated
        let targetProgress = 0;
        if (currentPhotosCount === 0) {
          // Just started - show minimal progress (2%) to indicate processing has begun
          // Don't go higher until we actually have images
          targetProgress = 2;
        } else if (currentPhotosCount >= expectedTotal) {
          // All images generated - show 100%
          targetProgress = 100;
        } else {
          // Calculate progress based on actual images generated
          // Each image adds (98 / expectedTotal)% to the progress
          // Reserve 2% for start, 98% for images
          // Example: 4 images = 2% + (1/4 * 98%) = 26.5% for first image
          // Example: 4 images = 2% + (2/4 * 98%) = 51% for second image
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
        
        // Animate progress smoothly towards target - based on actual images
        // Only animate if we have a target higher than current progress
        if (targetProgressRef.current > generationProgress) {
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
              // Increment by 0.3% per interval for slower, more gradual progress
              // This makes the progress bar rise slowly as images are being created
              const increment = Math.min(0.3, target - prev);
              return Math.min(100, prev + increment);
            });
          }, 400); // Update every 400ms for smoother, slower animation
        } else {
          // If target is not higher, just set it directly (shouldn't happen, but safety check)
          setGenerationProgress(targetProgressRef.current);
        }
        
        // Update generated images list immediately as they're created - show one by one
        // Filter out photos without URLs and only add new ones
        const photosWithUrls = photos
          .filter((p: { id: number; url: string; status: string }) => p.url) // Only include photos with URLs
          .map((p: { id: number; url: string; status: string }) => ({ id: p.id, url: p.url, status: p.status }));
        
        console.log("[GenerateImages] 🔄 Processing images during generation:", {
          photosWithUrlsCount: photosWithUrls.length,
          currentGeneratedImagesCount: generatedImages.length,
          photosWithUrls: photosWithUrls.map(img => ({ id: img.id, url: img.url?.substring(0, 50) + "..." })),
          currentImages: generatedImages.map(img => ({ id: img.id, url: img.url?.substring(0, 50) + "..." })),
        });
        
        // CRITICAL: Update images list incrementally as they arrive
        // This ensures images appear one by one, not all at once at the end
        setGeneratedImages((prevImages) => {
          // Always update if query has more images than state
          if (photosWithUrls.length > prevImages.length) {
            console.log(`[GenerateImages] ✨ Updating images list (query has more than state):`, {
              queryCount: photosWithUrls.length,
              stateCount: prevImages.length,
              queryIds: photosWithUrls.map(img => img.id),
              stateIds: prevImages.map(img => img.id),
            });
            
            // Update completed images count immediately
            setCompletedImages(photosWithUrls.length);
            
            // Return all photos from query, sorted by ID
            return photosWithUrls.sort((a, b) => a.id - b.id);
          }
          
          // Find new photos that aren't in the current state (for incremental updates)
          const newPhotos = photosWithUrls.filter(
            (photo) => !prevImages.some((existing) => existing.id === photo.id)
          );
          
          if (newPhotos.length > 0) {
            console.log(`[GenerateImages] ✨ Adding ${newPhotos.length} new image(s) during generation:`, {
              newPhotos: newPhotos.map(img => ({ id: img.id, url: img.url?.substring(0, 50) + "..." })),
              previousCount: prevImages.length,
              newCount: prevImages.length + newPhotos.length,
            });
            
            // Add new photos and sort by ID
            const updated = [...prevImages, ...newPhotos].sort((a, b) => a.id - b.id);
            
            // Update completed images count immediately
            setCompletedImages(updated.length);
            
            return updated;
          }
          
          // No new images - keep current state
          return prevImages;
        });
        
        console.log("[GenerateImages] Updated generated images:", {
          isPage2Variant,
          batchTotalImagesGenerated: batch.totalImagesGenerated,
          photosArrayLength: photos.length,
          photosWithUrls: photosWithUrls.length,
          expectedTotal,
          targetProgress: targetProgressRef.current,
          generatedImagesCount: generatedImages.length,
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
  
  // Upload functions for user images (replaces model selection)
  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const newFiles: UploadedFile[] = [];
    const maxFiles = 10;
    const currentCount = uploadedFiles.length;
    const totalFiles = currentCount + files.length;

    // Check total files limit first
    if (totalFiles > maxFiles) {
      toast.error(t("trainModel.max5Images") || "Too many files", {
        description: `Maximum ${maxFiles} images allowed. You have ${currentCount} and trying to add ${files.length}.`,
      });
      return;
    }

    // Process each file
    for (const file of Array.from(files)) {
      // Check if we've reached the limit
      if (currentCount + newFiles.length >= maxFiles) {
        toast.error(t("trainModel.max5Images") || "Too many files", {
          description: `Maximum ${maxFiles} images allowed.`,
        });
        break;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        toast.error(t("trainModel.onlyJpgPng") || "Invalid file type", {
          description: `File "${file.name}" is not a valid format. Use PNG, JPG, HEIC or WEBP.`,
        });
        continue;
      }

      // Validate file size (120MB)
      const maxFileSize = 120 * 1024 * 1024;
      if (file.size > maxFileSize) {
        toast.error(t("trainModel.fileTooLarge") || "File too large", {
          description: `File "${file.name}" is too large (maximum 120MB)`,
        });
        continue;
      }

      const id = `${Date.now()}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      newFiles.push({ id, file, preview });
    }

    if (newFiles.length > 0) {
      setUploadedFiles((prev) => {
        const updated = [...prev, ...newFiles];
        // For page1 variant: Auto-open parameters when files are uploaded and an image is selected
        if (!isPage2Variant && !isPage3Variant && selectedImage !== null) {
          // Use setTimeout to ensure state is updated first
          setTimeout(() => {
            setIsParametersSheetOpen(true);
          }, 100);
        }
        return updated;
      });
      toast.success(`${newFiles.length} ${newFiles.length === 1 ? "image selected" : "images selected"}`, {
        description: "Ready to use",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
    toast.success("Image removed");
  };
  
  // Define handleDownloadImage using useCallback (must be before return)
  const handleDownloadImage = useCallback(async (image: { id: number; url: string; status: string } | string, index: number) => {
    try {
      const imageUrl = typeof image === 'string' ? image : image.url;
      
      // Fetch the image as a blob to force download instead of opening
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create a blob URL and trigger download
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `generated-image-${index + 1}.jpg`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up: remove link and revoke blob URL
      setTimeout(() => {
        if (link.parentNode === document.body) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  }, []);
  
  // Calculate credits needed based on selected example image (4 variations per selected image)
  // For page2 variant, default to 4 images (1 example image * 4 variations)
  const imageCount = isPage2Variant ? 1 : (selectedImage !== null ? 1 : 0);
  const totalImagesToGenerate = imageCount * 4; // 4 images per selected image
  
  // Update ref when totalImagesToGenerate changes (for use in useEffects)
  useEffect(() => {
    totalImagesToGenerateRef.current = totalImagesToGenerate;
  }, [totalImagesToGenerate]);

  // Tell layout to show when GenerateImages is rendering (not DashboardV2/V3)
  // This must be BEFORE the conditional return to maintain hooks order
  useEffect(() => {
    // Calculate shouldShowDashboard here to avoid using it before it's defined
    const urlParamsForLayout = new URLSearchParams(window.location.search);
    const batchIdFromUrlLayout = urlParamsForLayout.get("batchId");
    const hasBatchIdLayout = batchIdFromUrlLayout || currentBatchId;
    const shouldShowDashboardV2Layout = isPage2Variant && !hasBatchIdLayout && !page2Data && !showModal && !isGenerating;
    const shouldShowDashboardV3Layout = isPage3Variant && !hasBatchIdLayout && !showModal && !isGenerating;
    
    if (!shouldShowDashboardV2Layout && !shouldShowDashboardV3Layout) {
      // GenerateImages is rendering, so ensure layout is visible
      window.dispatchEvent(new CustomEvent('aiselfi-dashboard-layout-mode', { 
        detail: { showFullLayout: true } 
      }));
    }
  }, [isPage2Variant, isPage3Variant, currentBatchId, page2Data, showModal, isGenerating]);

  // Auto-open parameters for page1 when both image is selected and files are uploaded
  // But don't open during generation to avoid interfering with user's intent to close
  useEffect(() => {
    if (
      !isPage2Variant && 
      !isPage3Variant && 
      selectedImage !== null && 
      uploadedFiles.length > 0 && 
      !isParametersSheetOpen &&
      !isGenerating && 
      !isStartingGeneration && 
      !generateMutation.isPending
    ) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setIsParametersSheetOpen(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedImage, uploadedFiles.length, isPage2Variant, isPage3Variant, isParametersSheetOpen, isGenerating, isStartingGeneration, generateMutation.isPending]);


  // Calculate derived values (not hooks, so safe to call after useEffect)
  const creditsNeeded = totalImagesToGenerate; // 1 credit per generated image
  const userCredits = user?.credits ?? 0;
  const hasEnoughCredits = creditsNeeded <= userCredits;
  // Model status check removed - we now use uploaded images instead
  
  // For page1: Check if user has uploaded images (replaces model requirement)
  // For page2: Keep credit check as it has its own flow
  // For page1: Don't check credits in canGenerate - let button redirect if no credits
  const canGenerate = isPage2Variant
    ? imageCount > 0 && hasEnoughCredits
    : imageCount > 0 && uploadedFiles.length > 0; // Check for uploaded files instead of model
  
  // Define helper functions and constants (not hooks, safe to call after hooks)
  const backgrounds = ["office", "studio", "city", "nature", "interior"];
  const styles = ["professional", "casual", "elegant", "formal"];
  const badges = t("generateImages.badges", { returnObjects: true }) as { premium: string; new: string; popular: string };
  
  // Filter example images based on gender and selected styles/backgrounds
  const filteredExampleImages = filterExampleImages(
    exampleImages,
    gender,
    selectedStyles,
    selectedBackgrounds
  );

  const toggleImage = (id: number) => {
    const newValue = selectedImage === id ? null : id;
    setSelectedImage(newValue);
    // Open parameters sheet on mobile when an image is selected
    if (newValue !== null && window.innerWidth < 1024) {
      setIsParametersSheetOpen(true);
    }
    // For page1 variant: Auto-open parameters when image is selected and files are uploaded
    if (!isPage2Variant && !isPage3Variant && newValue !== null && uploadedFiles.length > 0) {
      setIsParametersSheetOpen(true);
    }
  };

  const toggleBackground = (bg: string) => {
    if (isPage2Variant) {
      // For page2 variant, only allow single selection
      setSelectedBackgrounds((prev) =>
        prev.includes(bg) ? [] : [bg]
      );
    } else {
      // For other variants, allow multiple selections
      setSelectedBackgrounds((prev) =>
        prev.includes(bg) ? prev.filter((b) => b !== bg) : [...prev, bg]
      );
    }
  };

  const toggleStyle = (style: string) => {
    if (isPage2Variant) {
      // For page2 variant, only allow single selection
      setSelectedStyles((prev) =>
        prev.includes(style) ? [] : [style]
      );
    } else {
      // For other variants, allow multiple selections
      setSelectedStyles((prev) =>
        prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
      );
    }
  };

  // Check if we should show DashboardV2 or DashboardV3 (no batchId)
  // This check happens AFTER all hooks are called
  const urlParamsForCheck = new URLSearchParams(window.location.search);
  const batchIdFromUrlCheck = urlParamsForCheck.get("batchId");
  const hasBatchId = batchIdFromUrlCheck || currentBatchId;
  const shouldShowDashboardV2 = isPage2Variant && !hasBatchId && !page2Data && !showModal && !isGenerating;
  const shouldShowDashboardV3 = isPage3Variant && !hasBatchId && !showModal && !isGenerating;
  const shouldShowPage1UI = !isPage2Variant && !isPage3Variant;
  
  console.log("[GenerateImages] Render check:", {
    isPage2Variant,
    isPage3Variant,
    batchIdFromUrlCheck,
    currentBatchId,
    showModal,
    isGenerating,
    page2Data: !!page2Data,
    shouldShowDashboardV2,
    shouldShowDashboardV3,
  });
  
  // For page2 variant without batchId, show DashboardV2 flow
  // IMPORTANT: This return happens AFTER all hooks are called
  if (shouldShowDashboardV2) {
    console.log("[GenerateImages] Rendering DashboardV2 flow (page2 variant, no batchId)");
    return <DashboardV2 />;
  }
  
  // For page3 variant without batchId, show DashboardV3 flow
  if (shouldShowDashboardV3) {
    console.log("[GenerateImages] Rendering DashboardV3 flow (page3 variant, no batchId)");
    return <DashboardV3 />;
  }
  
  console.log("[GenerateImages] Rendering GenerateImages", 
    isPage2Variant ? "(page2 variant with batchId)" : 
    isPage3Variant ? "(page3 variant with batchId)" : 
    "(page1 variant)");

  // Handle generation with page2 data (auto-called)
  const handleGenerateWithPage2Data = async (data: any, exampleImage: any) => {
    if (!user?.id) {
      // Show login modal instead of toast
      setPendingAction(() => () => handleGenerateWithPage2Data(data, exampleImage));
      setShowLoginModal(true);
      return;
    }

    // Build base prompt using the exampleImage prompt with wrapper format
    const exampleImagePrompt = exampleImage.prompt || "A professional portrait in a studio setting with soft, even lighting.";
    const basePrompt = `Create a professional headshot for this person, following the guidance below. The photograph and the person should look real, like it was taken from a premium photograph session:

${exampleImagePrompt}

Output should be a vertical rectangle. Entire head should be visible`;

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
        console.log("[GenerateImages] Generation started, batch ID:", result.batchId);
        setCurrentBatchId(result.batchId);
        // Force query to refetch immediately after setting batchId
        setTimeout(() => {
          console.log("[GenerateImages] Forcing query refetch after batchId set");
          getBatchStatusQuery.refetch();
        }, 100);
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
    // Prevent multiple clicks while generating or starting
    if (isGenerating || isStartingGeneration) {
      console.log("[GenerateImages] Generation already in progress, ignoring click");
      return;
    }
    
    if (!canGenerate) return;
    
    // Set loading state immediately for instant UI feedback
    setIsStartingGeneration(true);
    
    // For page1 flow only: Check credits before generating
    // page2 and page3 have their own credit checking in their respective dashboards
    if (!isPage2Variant && !isPage3Variant) {
      // Check if user has credits - redirect to buy credits page if no credits
      if ((user?.credits ?? 0) <= 0) {
        setIsStartingGeneration(false);
        toast.error(t("generateImages.notEnoughCredits") || "Insufficient credits", {
          description: t("buyCredits.subtitle") || "Please purchase credits to generate images",
        });
        // Redirect directly to buy credits page
        setLocation("/dashboard/credits/buy");
        return;
      }
    }
    
    // Build reference image URLs:
    // For page2 variant: Only use example images (no model required)
    const referenceImageUrls: string[] = [];
    
    if (!isPage2Variant && !isPage3Variant) {
      // Page1 variant: require uploaded images
      if (uploadedFiles.length === 0) {
        setIsStartingGeneration(false);
        toast.error(t("generateImages.noImagesUploaded") || "Please upload images", {
          description: t("generateImages.uploadImagesToGenerate") || "Upload images to generate photos",
        });
        return;
      }
    
      // Upload user images and get URLs
      try {
        const uploadedUrls: string[] = [];
        for (const file of uploadedFiles) {
          const base64 = await readFileAsBase64(file.file);
          const { urls } = await uploadImagesMutation.mutateAsync({
            images: [
              {
                data: base64,
                fileName: file.file.name,
                contentType: file.file.type,
              },
            ],
          });

          if (!urls || urls.length === 0) {
            throw new Error(t("trainModel.couldNotUploadImages") || "Could not upload images");
          }

          uploadedUrls.push(urls[0]);
        }
        
        // Use uploaded images as reference (max 1 to minimize payload size)
        if (uploadedUrls.length > 0) {
          referenceImageUrls.push(uploadedUrls[0]); // Use only the first uploaded image
        }
      } catch (error: any) {
        console.error("[GenerateImages] Upload error:", error);
        toast.error(t("generateImages.failedToUploadImages") || "Failed to upload images", {
          description: error?.message || t("generateImages.pleaseTryAgain"),
        });
        setIsStartingGeneration(false);
        setIsGenerating(false);
        setShowModal(false);
        return;
      }
    
      if (referenceImageUrls.length === 0) {
        toast.error(t("generateImages.noImagesUploaded") || "No images uploaded");
        setIsStartingGeneration(false);
        setIsGenerating(false);
        setShowModal(false);
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
      setIsStartingGeneration(false);
      return;
    }
    
    // Build base prompt: For page1, use only the exampleImage prompt + gender
    // Don't include user attributes (hair, glasses, backgrounds, styles) as they override the person's appearance
    const genderText = gender === "man" ? "male" : "female";
    const basePrompt = `Create a professional headshot for this person, following the guidance below. The photograph and the person should look real, like it was taken from a premium photograph session:

${selectedExampleImage.prompt}

Output should be a vertical rectangle. Entire head should be visible`;
    
    // Reset state - clear starting state first, then set generating state
    setIsStartingGeneration(false); // Clear starting state, now we're actually generating
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
      // For page1: Only send gender (embedded in basePrompt) and exampleImage prompt
      // Don't send user attributes (hair, glasses, backgrounds, styles) as they're not used
      const result = await generateMutation.mutateAsync({
        modelId: undefined, // No longer using models - using uploaded images instead for both flows
        trainingImageUrls: referenceImageUrls, // Contains uploaded user images for page1, empty for page2
        exampleImages: [{
          id: selectedExampleImage.id,
          url: absoluteUrl,
          prompt: selectedExampleImage.prompt,
        }],
        basePrompt,
        aspectRatio,
        numImagesPerExample: 4,
        glasses: "no", // Not used for page1, but required by schema
        backgrounds: [], // Not used for page1
        styles: [], // Not used for page1
      });

      // Set batch ID for polling
      if (result.batchId) {
        console.log(`[GenerateImages] Setting batch ID to ${result.batchId}`);
        setCurrentBatchId(result.batchId);
        // Force query to refetch immediately after setting batchId
        setTimeout(() => {
          if (isPage2Variant) {
            console.log("[GenerateImages] Forcing Page2 query refetch after batchId set");
            getPage2BatchStatusQuery.refetch();
          } else {
            console.log("[GenerateImages] Forcing Page1 query refetch after batchId set");
            getBatchStatusQuery.refetch();
          }
        }, 100);
      } else {
        // Fallback if no batch ID (shouldn't happen)
        setIsStartingGeneration(false);
        setIsGenerating(false);
        setErrorMessage(t("generateImages.failedToStartGeneration"));
      }
    } catch (error: any) {
      console.error("Error generating images:", error);
      setIsStartingGeneration(false);
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

          {/* Floating Parameters Button - Mobile only */}
          <Button
            className="lg:hidden fixed right-4 bottom-6 z-40 h-14 w-14 rounded-full bg-purple-500 hover:bg-purple-600 shadow-lg hover:shadow-xl transition-all"
            size="icon"
            onClick={() => setIsParametersSheetOpen(true)}
          >
            <Sparkles className="h-6 w-6 text-white" />
          </Button>

          {/* Parameters Sidebar - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block w-[380px] shrink-0 flex-shrink-0">
            <Card className="bg-card/50 border-border sticky top-20 w-full max-h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
              <CardContent className="p-0 flex flex-col h-full overflow-hidden">
                <Collapsible defaultOpen className="flex flex-col h-full overflow-hidden">
                  <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-purple-400" />
                      <h2 className="text-xl font-bold">{t("generateImages.parameters")}</h2>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="flex-1 min-h-0 overflow-y-auto">
                    <div className="p-6 space-y-6">
                      {/* Upload Images - Replaces model selection */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-sm font-medium">{t("generateImages.uploadImages") || "Upload Images"}</Label>
                        </div>
                        <div
                          className={`border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer relative ${
                            isDragging
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/heic,image/webp"
                            multiple
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => {
                              handleFileSelect(e.target.files);
                              e.target.value = '';
                            }}
                          />
                          <div className="text-center">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {t("trainModel.orDragAndDrop") || "Click or drag and drop"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t("trainModel.minMaxImages") || "1-10 images, max 120MB each"}
                            </p>
                            {uploadedFiles.length > 0 && (
                              <p className="text-sm text-green-500 font-medium mt-2">
                                {uploadedFiles.length} {uploadedFiles.length === 1 ? "image selected" : "images selected"}
                              </p>
                            )}
                              </div>
                        </div>
                        {uploadedFiles.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {uploadedFiles.map((file, index) => (
                              <div
                                key={file.id}
                                className="relative aspect-square rounded-lg overflow-hidden border-2 border-border group"
                              >
                                <img
                                  src={file.preview}
                                  alt={file.file.name}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(file.id);
                                  }}
                                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove image"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                                  {index + 1}
                                </div>
                              </div>
                            ))}
                              </div>
                            )}
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {uploadedFiles.length === 0 && (t("generateImages.uploadImagesToGenerate") || "Upload images to generate photos")}
                        </p>
                      </div>

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
                          disabled={!canGenerate || (isPage2Variant && !hasEnoughCredits) || isGenerating || isStartingGeneration || generateMutation.isPending}
                          onClick={handleGenerate}
                        >
                          {(isGenerating || isStartingGeneration || generateMutation.isPending) ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              {t("generateImages.generating") || "Generating..."}
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5 mr-2" />
                              {t("generateImages.generate")} {totalImagesToGenerate} {t("generateImages.images")}
                            </>
                          )}
                        </Button>
                        
                        {/* Credits Usage */}
                        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-2">
                          <Sparkles className="h-4 w-4" />
                          <span>
                            {imageCount === 0 
                              ? t("generateImages.selectImagesToGenerate")
                              : !hasEnoughCredits
                              ? `${t("generateImages.notEnoughCredits")} (${t("generateImages.needCredits")} ${creditsNeeded}, ${t("generateImages.haveCredits")} ${userCredits})`
                              : !isPage2Variant && uploadedFiles.length === 0
                              ? t("generateImages.uploadImagesToGenerate") || "Upload images to generate photos"
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

          {/* Mobile Parameters Sheet - Slides from right when image is selected */}
          <Sheet 
            open={isParametersSheetOpen} 
            onOpenChange={(open) => {
              // Don't allow closing the sheet while generating to avoid confusion
              if (!open && (isGenerating || isStartingGeneration || generateMutation.isPending)) {
                return;
              }
              // Allow manual closing - user can close it if they want
              setIsParametersSheetOpen(open);
            }}
          >
            <SheetContent side="right" className="w-[85vw] sm:w-[400px] overflow-y-auto px-3">
              <SheetHeader className="pb-4 border-b border-border">
                <SheetTitle className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  {t("generateImages.parameters")}
                </SheetTitle>
              </SheetHeader>
              
              <div className="py-6 space-y-6">
                {/* Upload Images - Replaces model selection for page1 variant */}
                {!isPage2Variant && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">{t("generateImages.uploadImages") || "Upload Images"}</Label>
                  </div>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer relative ${
                      isDragging
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/heic,image/webp"
                      multiple
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => {
                        handleFileSelect(e.target.files);
                        e.target.value = '';
                      }}
                    />
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {t("trainModel.orDragAndDrop") || "Click or drag and drop"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("trainModel.minMaxImages") || "1-10 images, max 120MB each"}
                      </p>
                      {uploadedFiles.length > 0 && (
                        <p className="text-sm text-green-500 font-medium mt-2">
                          {uploadedFiles.length} {uploadedFiles.length === 1 ? "image selected" : "images selected"}
                        </p>
                      )}
                    </div>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={file.id}
                          className="relative aspect-square rounded-lg overflow-hidden border-2 border-border group"
                        >
                          <img
                            src={file.preview}
                            alt={file.file.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(file.id);
                            }}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {uploadedFiles.length === 0 && (t("generateImages.uploadImagesToGenerate") || "Upload images to generate photos")}
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
                            ? "bg-purple-500 hover:bg-purple-600 border-purple-500 flex-1"
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
                    disabled={!canGenerate || (isPage2Variant && !hasEnoughCredits) || isGenerating || isStartingGeneration || generateMutation.isPending}
                    onClick={handleGenerate}
                  >
                    {(isGenerating || isStartingGeneration || generateMutation.isPending) ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {t("generateImages.generating") || "Generating..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        {t("generateImages.generate")} {totalImagesToGenerate} {t("generateImages.images")}
                      </>
                    )}
                  </Button>
                  
                  {/* Credits Usage */}
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-2">
                    <Sparkles className="h-4 w-4" />
                    <span>
                      {imageCount === 0 
                        ? t("generateImages.selectImagesToGenerate")
                        : !hasEnoughCredits
                        ? `${t("generateImages.notEnoughCredits")} (${t("generateImages.needCredits")} ${creditsNeeded}, ${t("generateImages.haveCredits")} ${userCredits})`
                        : !isPage2Variant && uploadedFiles.length === 0
                        ? t("generateImages.uploadImagesToGenerate") || "Upload images to generate photos"
                        : `${t("generateImages.willUseCredits")} ${creditsNeeded} ${creditsNeeded === 1 ? t("generateImages.credit") : t("generateImages.credits")}`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      )}

      {/* Generation Progress Modal - Always render, controlled by showModal */}
      <Dialog 
        open={showModal} 
        onOpenChange={(open) => {
          console.log("[GenerateImages] Modal onOpenChange:", open, "current showModal:", showModal, "isGenerating:", isGenerating, "shouldRedirectToGalleryOnClose:", shouldRedirectToGalleryOnClose);
          // Allow closing the modal even if generating (user can still see progress in background)
          if (!open) {
            setShowModal(false);
            // For page2/page3 variant, navigate to gallery when modal closes
            if (shouldRedirectToGalleryOnClose) {
              console.log("[GenerateImages] Page2/Page3: Navigating to gallery after closing modal");
              // Clear saved form data and step to reset flow for next creation
              try {
                localStorage.removeItem("dashboardV2_formData");
                localStorage.removeItem("dashboardV2_generationIntent");
                localStorage.removeItem("dashboardV3_formData");
                localStorage.removeItem("dashboardV3_generationIntent");
                console.log("[GenerateImages] ✅ Cleared saved form data after closing modal");
              } catch (e) {
                console.warn("[GenerateImages] Failed to clear saved data:", e);
              }
              // Reset state
              setCurrentBatchId(null);
              setGeneratedImages([]);
              setCompletedImages(0);
              setGenerationProgress(0);
              setIsGenerating(false);
              // Navigate to gallery to view the generated images
              setLocation("/dashboard/gallery");
            } else if (!isPage2Variant && !isPage3Variant) {
              // For page1 variant, also navigate to gallery when modal closes
              console.log("[GenerateImages] Page1: Navigating to gallery after closing modal");
              // Reset state
              setCurrentBatchId(null);
              setGeneratedImages([]);
              setCompletedImages(0);
              setGenerationProgress(0);
              setIsGenerating(false);
              // Navigate to gallery to view the generated images
              setLocation("/dashboard/gallery");
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
                          onClick={() => {
                            setShowModal(false);
                            // For page2/page3 variant, navigate to gallery when close button is clicked
                            if (shouldRedirectToGalleryOnClose) {
                              console.log("[GenerateImages] Page2/Page3: Close button clicked, navigating to gallery");
                              // Clear saved form data and step to reset flow for next creation
                              try {
                                localStorage.removeItem("dashboardV2_formData");
                                localStorage.removeItem("dashboardV2_generationIntent");
                                localStorage.removeItem("dashboardV3_formData");
                                localStorage.removeItem("dashboardV3_generationIntent");
                                console.log("[GenerateImages] ✅ Cleared saved form data after closing modal");
                              } catch (e) {
                                console.warn("[GenerateImages] Failed to clear saved data:", e);
                              }
                              // Reset state
                              setCurrentBatchId(null);
                              setGeneratedImages([]);
                              setCompletedImages(0);
                              setGenerationProgress(0);
                              setIsGenerating(false);
                              // Navigate to gallery to view the generated images
                              setLocation("/dashboard/gallery");
                            } else if (!isPage2Variant && !isPage3Variant) {
                              // For page1 variant, also navigate to gallery when close button is clicked
                              console.log("[GenerateImages] Page1: Close button clicked, navigating to gallery");
                              // Reset state
                              setCurrentBatchId(null);
                              setGeneratedImages([]);
                              setCompletedImages(0);
                              setGenerationProgress(0);
                              setIsGenerating(false);
                              // Navigate to gallery to view the generated images
                              setLocation("/dashboard/gallery");
                            }
                          }}
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
            {/* Debug: Log current state */}
            {(() => {
              const imagesCount = generatedImages.length;
              console.log("[GenerateImages] 🖼️ Rendering images grid:", {
                generatedImagesCount: imagesCount,
                isGenerating,
                showModal,
                images: generatedImages.map(img => ({ id: img.id, url: img.url?.substring(0, 50) + "..." })),
                rawGeneratedImages: generatedImages,
              });
              
              if (imagesCount === 0) {
                console.warn("[GenerateImages] ⚠️ WARNING: generatedImages is EMPTY! No images to render!");
              } else {
                console.log(`[GenerateImages] ✅ Will render ${imagesCount} image(s)`);
              }
              
              return null;
            })()}
            <div className="grid grid-cols-2 gap-4">
              {/* Show generated images - appear one by one with smooth animation */}
              {/* Always show images, even during generation */}
              {generatedImages.length > 0 && (
                generatedImages.map((image, index) => {
                  console.log(`[GenerateImages] 🖼️ Rendering image ${index + 1}/${generatedImages.length}:`, {
                    id: image.id,
                    hasUrl: !!image.url,
                    url: image.url?.substring(0, 50) + "...",
                  });
                  
                  // Preload first 2 images for faster display
                  if (index < 2 && typeof window !== "undefined") {
                    const existingPreload = document.head.querySelector(`link[href="${image.url}"]`);
                    if (!existingPreload) {
                      const link = document.createElement("link");
                      link.rel = "preload";
                      link.as = "image";
                      link.href = image.url;
                      if (index === 0) {
                        link.setAttribute("fetchpriority", "high");
                      }
                      document.head.appendChild(link);
                    }
                  }
                  
                  return (
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
                    loading={index < 2 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={index === 0 ? "high" : index === 1 ? "high" : "auto"}
                    onLoad={(e) => {
                      console.log(`[GenerateImages] ✅ Image ${image.id} loaded successfully`);
                      // Remove any loading state
                      const target = e.target as HTMLImageElement;
                      target.style.opacity = "1";
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.error(`[GenerateImages] ❌ Image ${image.id} failed to load:`, image.url);
                      // Retry once with a slight delay
                      const retryCount = parseInt(target.dataset.retryCount || "0");
                      if (retryCount < 1) {
                        target.dataset.retryCount = "1";
                        setTimeout(() => {
                          target.src = image.url + (image.url.includes("?") ? "&" : "?") + `retry=${Date.now()}`;
                        }, 1000);
                      } else {
                        target.src = `https://picsum.photos/400/400?random=${index}`;
                      }
                    }}
                    style={{ opacity: 0, transition: "opacity 0.3s ease-in-out" }}
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
                  );
                })
              )}
              
              {/* Show loading placeholders for remaining images (or all 4 if no images loaded yet) */}
              {Array.from({ length: Math.max(0, isGenerating && generatedImages.length === 0 ? totalImagesToGenerate : (totalImagesToGenerate - generatedImages.length)) }).map((_, index) => (
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

      {/* Bottom Navigation Bar - Mobile Only (Hidden for page1 variant) */}
      {isMobile && (isPage2Variant || isPage3Variant) && (() => {
        const variantParam = isPage3Variant ? "?variant=page3" : "?variant=page2";
        return (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-end justify-around relative">
              {/* Start Here */}
              <button
                onClick={() => setLocation(`/dashboard/start${variantParam}`)}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Start Here"
              >
                <HelpCircle className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Start</span>
              </button>

              {/* Gallery */}
              <button
                onClick={() => setLocation(`/dashboard/gallery${variantParam}`)}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Gallery"
              >
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Gallery</span>
              </button>

              {/* Create - Center with prominent styling (current page) */}
              <div className="relative -mt-4">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-16 bg-primary/20 rounded-full blur-xl" />
                <button
                  className="relative flex flex-col items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
                  aria-label="Create"
                >
                  <Sparkles className="h-6 w-6" />
                </button>
                <span className="block text-xs text-primary font-medium mt-1.5 text-center">Create</span>
              </div>

              {/* Credits */}
              <button
                onClick={() => setLocation(`/dashboard/credits/buy${variantParam}`)}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Credits"
              >
                <CreditCard className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Credits</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => setLocation(`/dashboard/settings/general${variantParam}`)}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Settings"
              >
                <Settings className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Settings</span>
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSuccess={() => {
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
        variant={isPage2Variant ? "page2" : isPage3Variant ? "page3" : undefined}
      />
    </div>
  );
}