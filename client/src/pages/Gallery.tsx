import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Check, Image as ImageIcon } from "lucide-react";

export default function Gallery() {
  const [sortBy, setSortBy] = useState<"newest" | "favourites">("newest");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [hasImages] = useState(true); // Change to false to show empty state

  // Placeholder images - using a mix of the existing images in the public folder
  const placeholderImages = Array.from({ length: 16 }, (_, i) => {
    const imageIndex = i % 10;
    const imageName = imageIndex === 0 ? "image.webp" : `image_${imageIndex}.webp`;
    return {
      id: i + 1,
      url: `/${imageName}`,
      alt: `Gallery image ${i + 1}`,
    };
  });

  const totalImages = 1128;
  const displayedImages = hasImages ? placeholderImages : [];

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
    // Placeholder for download functionality
    console.log("Downloading all images");
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
              <Button
                variant="outline"
                onClick={handleDownloadAll}
                className="rounded-full"
                disabled={selectedImages.size === 0 && !isSelectMode}
              >
                <Download className="w-4 h-4 mr-2" />
                Download All ({selectedImages.size})
              </Button>
            </div>
          )}
        </div>

        {/* Image Count (when filled) */}
        {hasImages && displayedImages.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Showing {displayedImages.length} of {totalImages} images
            </p>
          </div>
        )}

        {/* Empty State */}
        {!hasImages && (
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
        {hasImages && displayedImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedImages.map((image) => {
              const isSelected = selectedImages.has(image.id);
              return (
                <div
                  key={image.id}
                  className={`relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer group border-2 transition-all ${
                    isSelectMode && isSelected
                      ? "border-primary ring-2 ring-primary/50"
                      : isSelectMode
                      ? "border-border hover:border-primary/50"
                      : "border-transparent hover:border-primary/50"
                  }`}
                  onClick={() => toggleImageSelection(image.id)}
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback to a placeholder if image doesn't exist
                      const target = e.target as HTMLImageElement;
                      target.src = `https://picsum.photos/400/600?random=${image.id}`;
                    }}
                  />
                  
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

