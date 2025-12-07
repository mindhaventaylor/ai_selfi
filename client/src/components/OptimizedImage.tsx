import { useState, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "loading" | "decoding"> {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean; // For above-the-fold images
  quality?: number; // 1-100, for future optimization
  fill?: boolean; // Makes image fill parent container
  sizes?: string; // For responsive images
}

/**
 * Optimized Image component for better performance
 * Similar to Next.js Image but works with Vite/React
 * Features:
 * - Automatic lazy loading
 * - Error handling with fallback
 * - Loading state management
 * - Optimized loading attributes
 */
export function OptimizedImage({
  src,
  alt,
  className,
  priority = false,
  quality,
  fill = false,
  sizes,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Update image source if src prop changes
  useEffect(() => {
    setImageSrc(src);
    setIsLoading(true);
    setHasError(false);
    setImageLoaded(false);
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setImageLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setHasError(true);
    
    // Retry once with a cache-busting parameter
    const target = e.target as HTMLImageElement;
    const retryCount = parseInt(target.dataset.retryCount || "0");
    
    if (retryCount < 1) {
      target.dataset.retryCount = "1";
      setTimeout(() => {
        const separator = imageSrc.includes("?") ? "&" : "?";
        setImageSrc(`${imageSrc}${separator}retry=${Date.now()}`);
        setIsLoading(true);
        setHasError(false);
      }, 1000);
    } else {
      onError?.(e);
    }
  };

  const loading = priority ? "eager" : "lazy";
  const fetchPriority = priority ? "high" : "auto";

  const imageElement = (
    <img
      src={imageSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      sizes={sizes}
      className={cn(
        "transition-opacity duration-300",
        imageLoaded ? "opacity-100" : "opacity-0",
        fill && "absolute inset-0 w-full h-full object-cover",
        className
      )}
      style={{
        backgroundColor: isLoading ? "var(--muted)" : undefined,
        ...props.style,
      }}
      onLoad={handleLoad}
      onError={handleError}
      data-retry-count="0"
      {...props}
    />
  );

  if (fill) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        {isLoading && (
          <div className="absolute inset-0 bg-muted animate-pulse z-0" />
        )}
        {imageElement}
      </div>
    );
  }

  return imageElement;
}

