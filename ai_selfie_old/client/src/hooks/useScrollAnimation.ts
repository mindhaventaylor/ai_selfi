import { useEffect, useRef, useState } from "react";

export function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // More sensitive on mobile - detect viewport width
    const isMobile = window.innerWidth < 768;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        // Lower threshold for earlier trigger
        threshold: isMobile ? 0.01 : 0.05,
        // Much larger positive rootMargin makes elements appear much earlier (before they enter viewport)
        // This triggers animation when element is still far below viewport
        rootMargin: isMobile ? "0px 0px 400px 0px" : "0px 0px 300px 0px",
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return { ref, isVisible };
}
