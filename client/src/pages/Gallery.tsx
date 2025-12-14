import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Check, Image as ImageIcon, Trash2, Heart, Plus, CreditCard, Settings, HelpCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";

export default function Gallery() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [sortBy, setSortBy] = useState<"newest" | "favourites">("newest");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());

  // Fetch photos from database
  const { data, isLoading, refetch } = trpc.photo.list.useQuery({
    sortBy,
    limit: 50,
    offset: 0,
  });

  const deletePhotoMutation = trpc.photo.delete.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedImages(new Set());
    },
  });

  const deleteManyMutation = trpc.photo.deleteMany.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedImages(new Set());
      setIsSelectMode(false);
    },
  });

  const toggleFavoriteMutation = trpc.photo.toggleFavorite.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const incrementDownloadMutation = trpc.photo.incrementDownload.useMutation();

  const photos = data?.photos || [];
  const totalImages = data?.total || 0;
  const hasImages = photos.length > 0;

  const toggleImageSelection = (id: number) => {
    if (!isSelectMode) return;
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectClick = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedImages(new Set());
    }
  };

  const handleDownloadAll = async () => {
    if (selectedImages.size === 0) return;
    
    // Download each selected image
    const photoIds = Array.from(selectedImages);
    for (const photoId of photoIds) {
      const photo = photos.find((p) => p.id === photoId);
      if (photo?.url) {
        try {
          // Increment download count
          incrementDownloadMutation.mutate({ photoId });
          
          // Fetch the image as a blob to force download instead of opening
          const response = await fetch(photo.url);
          const blob = await response.blob();
          
          // Create a blob URL and trigger download
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = `photo-${photoId}.jpg`;
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
          
          // Small delay between downloads to avoid browser blocking multiple downloads
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error downloading photo ${photoId}:`, error);
        }
      }
    }
  };

  const handleDeleteSelected = () => {
    if (selectedImages.size === 0) return;
    
    if (selectedImages.size === 1) {
      const photoId = Array.from(selectedImages)[0];
      if (confirm(t("gallery.areYouSureDeleteOne"))) {
        deletePhotoMutation.mutate({ photoId });
      }
    } else {
      if (confirm(`${t("gallery.areYouSureDeleteMany")} ${selectedImages.size} ${t("gallery.images")}?`)) {
        deleteManyMutation.mutate({ photoIds: Array.from(selectedImages) });
      }
    }
  };

  const handleDownloadImage = async (photoId: number, url: string) => {
    try {
      incrementDownloadMutation.mutate({ photoId });
      
      // Fetch the image as a blob to force download instead of opening
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Create a blob URL and trigger download
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `photo-${photoId}.jpg`;
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
  };

  const handleToggleFavorite = (e: React.MouseEvent, photoId: number) => {
    e.stopPropagation();
    toggleFavoriteMutation.mutate({ photoId });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className={`max-w-7xl mx-auto px-6 py-8 ${isMobile ? "pb-20" : ""}`}>
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Title row */}
          <h1 className="text-3xl md:text-4xl font-bold">{t("gallery.title")}</h1>
          
          {/* Controls row - stacks on mobile, inline on desktop */}
          {hasImages && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Sort dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("gallery.sortBy")}</span>
                <Select value={sortBy} onValueChange={(value: "newest" | "favourites") => setSortBy(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t("gallery.newest")}</SelectItem>
                    <SelectItem value="favourites">{t("gallery.favourites")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={isSelectMode ? "default" : "outline"}
                  onClick={handleSelectClick}
                  className="rounded-full"
                  size="sm"
                >
                  {isSelectMode ? t("gallery.cancel") : t("gallery.select")}
                </Button>
                {isSelectMode && selectedImages.size > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteSelected}
                    className="rounded-full"
                    size="sm"
                    disabled={deletePhotoMutation.isPending || deleteManyMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t("gallery.delete")} ({selectedImages.size})
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleDownloadAll}
                  className="rounded-full"
                  size="sm"
                  disabled={selectedImages.size === 0 && !isSelectMode}
                >
                  <Download className="w-4 h-4 mr-1" />
                  {t("gallery.download")} ({selectedImages.size})
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-muted-foreground">{t("gallery.loadingGallery")}</p>
            </div>
          </div>
        )}

        {/* Image Count (when filled) */}
        {!isLoading && hasImages && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              {t("gallery.showing")} {photos.length} {t("gallery.of")} {totalImages} {t("gallery.images")}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasImages && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">{t("gallery.noImagesFound")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("gallery.startCreatingImages")}
              </p>
            </div>
          </div>
        )}

        {/* Image Grid */}
        {!isLoading && hasImages && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => {
              const isSelected = selectedImages.has(photo.id);
              return (
                <div
                  key={photo.id}
                  className={`relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer group border-2 transition-all ${
                    isSelectMode && isSelected
                      ? "border-primary ring-2 ring-primary/50"
                      : isSelectMode
                      ? "border-border hover:border-primary/50"
                      : "border-transparent hover:border-primary/50"
                  }`}
                  onClick={() => {
                    if (isSelectMode) {
                      toggleImageSelection(photo.id);
                    } else {
                      handleDownloadImage(photo.id, photo.url || "");
                    }
                  }}
                >
                  {photo.url ? (
                    <img
                      src={photo.url}
                      alt={t("gallery.photoAlt", { number: photo.id })}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="auto"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Retry once with a slight delay
                        const retryCount = parseInt(target.dataset.retryCount || "0");
                        if (retryCount < 1) {
                          target.dataset.retryCount = "1";
                          setTimeout(() => {
                            target.src = photo.url + (photo.url.includes("?") ? "&" : "?") + `retry=${Date.now()}`;
                          }, 1000);
                        } else {
                          target.src = `https://picsum.photos/400/600?random=${photo.id}`;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Favorite Badge */}
                  {photo.isFavorite && !isSelectMode && (
                    <div className="absolute top-2 left-2 bg-primary rounded-full p-1.5">
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}

                  {/* Action Buttons (when not in select mode) */}
                  {!isSelectMode && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button
                        onClick={(e) => handleToggleFavorite(e, photo.id)}
                        className={`bg-background/90 rounded-full p-1.5 ${
                          photo.isFavorite ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${photo.isFavorite ? "fill-current" : ""}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(t("gallery.areYouSureDeleteOne"))) {
                            deletePhotoMutation.mutate({ photoId: photo.id });
                          }
                        }}
                        className="bg-background/90 rounded-full p-1.5 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Selection Overlay */}
                  {isSelectMode && (
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-primary/20"
                          : "bg-black/0 group-hover:bg-black/20"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar - Mobile Only */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-end justify-around relative">
              {/* Start Here */}
              <button
                onClick={() => setLocation("/dashboard/start")}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Start Here"
              >
                <HelpCircle className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Start</span>
              </button>

              {/* Gallery */}
              <button
                onClick={() => setLocation("/dashboard/gallery")}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Gallery"
              >
                <ImageIcon className="h-6 w-6 text-primary" />
                <span className="text-xs text-primary">Gallery</span>
              </button>

              {/* Create - Centered, Prominent Button */}
              <button
                onClick={() => setLocation("/dashboard/generate?variant=page2")}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 -mt-2 z-10"
                aria-label="Create"
              >
                <Plus className="h-7 w-7" />
              </button>

              {/* Buy Credits */}
              <button
                onClick={() => setLocation("/dashboard/credits/buy")}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Buy Credits"
              >
                <CreditCard className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Credits</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => setLocation("/dashboard/settings/general")}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Settings"
              >
                <Settings className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

