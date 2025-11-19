import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Check, Image as ImageIcon, Trash2, Heart } from "lucide-react";

export default function Gallery() {
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

  const handleDownloadAll = () => {
    if (selectedImages.size === 0) return;
    
    // Download each selected image
    selectedImages.forEach((photoId) => {
      const photo = photos.find((p) => p.id === photoId);
      if (photo?.url) {
        // Increment download count
        incrementDownloadMutation.mutate({ photoId });
        
        // Trigger download
        const link = document.createElement("a");
        link.href = photo.url;
        link.download = `photo-${photoId}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const handleDeleteSelected = () => {
    if (selectedImages.size === 0) return;
    
    if (selectedImages.size === 1) {
      const photoId = Array.from(selectedImages)[0];
      if (confirm("¿Estás seguro de que quieres eliminar esta foto?")) {
        deletePhotoMutation.mutate({ photoId });
      }
    } else {
      if (confirm(`¿Estás seguro de que quieres eliminar ${selectedImages.size} fotos?`)) {
        deleteManyMutation.mutate({ photoIds: Array.from(selectedImages) });
      }
    }
  };

  const handleDownloadImage = (photoId: number, url: string) => {
    incrementDownloadMutation.mutate({ photoId });
    const link = document.createElement("a");
    link.href = url;
    link.download = `photo-${photoId}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleFavorite = (e: React.MouseEvent, photoId: number) => {
    e.stopPropagation();
    toggleFavoriteMutation.mutate({ photoId });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl md:text-4xl font-bold">Your Gallery</h1>
            {hasImages && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <Select value={sortBy} onValueChange={(value: "newest" | "favourites") => setSortBy(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="favourites">Favourites</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {hasImages && (
            <div className="flex items-center gap-3">
              <Button
                variant={isSelectMode ? "default" : "outline"}
                onClick={handleSelectClick}
                className="rounded-full"
              >
                {isSelectMode ? "Cancel" : "Select"}
              </Button>
              {isSelectMode && selectedImages.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  className="rounded-full"
                  disabled={deletePhotoMutation.isPending || deleteManyMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedImages.size})
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleDownloadAll}
                className="rounded-full"
                disabled={selectedImages.size === 0 && !isSelectMode}
              >
                <Download className="w-4 h-4 mr-2" />
                Download ({selectedImages.size})
              </Button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-muted-foreground">Loading gallery...</p>
            </div>
          </div>
        )}

        {/* Image Count (when filled) */}
        {!isLoading && hasImages && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Showing {photos.length} of {totalImages} images
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
              <h2 className="text-xl font-semibold">No images found in your gallery.</h2>
              <p className="text-sm text-muted-foreground">
                Start creating images to see them here.
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
                      alt={`Photo ${photo.id}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://picsum.photos/400/600?random=${photo.id}`;
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
                          if (confirm("¿Estás seguro de que quieres eliminar esta foto?")) {
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
    </div>
  );
}

