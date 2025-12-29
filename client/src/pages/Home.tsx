import { useTranslation } from "@/hooks/useTranslation";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { usePostHogVariant } from "@/hooks/usePostHogVariant";
import { useIsMobile } from "@/hooks/useMobile";
import React, { useEffect, useState, Fragment, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, Sparkles, ChevronLeft, ChevronRight, ArrowRight, ArrowDown, Quote, ShieldCheck, Lock, Zap, Users, Award, Clock, TrendingUp, Eye, LockKeyhole, BadgeCheck, Globe, Rocket, Cpu, Building, Lightbulb, Briefcase, Newspaper } from "lucide-react";
import { FAQ } from "@/components/FAQ";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { safeLocalStorage } from "@/utils/localStorage";
import { detectCurrency, getLocalizedPrice } from "@/utils/currency";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Linkedin } from "lucide-react";
import { OptimizedImage } from "@/components/OptimizedImage";
import { initPostHog, trackPageView } from "@/lib/posthog";
import { DiscountModal } from "@/components/DiscountModal";

// Before/After Image Comparison Component with Automatic Horizontal Scroll
function BeforeAfterSliderScroll({ 
  imagePairs,
  beforeLabel, 
  afterLabel 
}: { 
  imagePairs: { before: string; after: string }[];
  beforeLabel: string; 
  afterLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeScrollRef = useRef<HTMLDivElement>(null);
  const afterScrollRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollSpeedRef = useRef(1.5); // pixels per frame - increased for visibility

  // Sync scroll between before and after containers
  useEffect(() => {
    const beforeContainer = beforeScrollRef.current;
    const afterContainer = afterScrollRef.current;

    if (!beforeContainer || !afterContainer) return;

    const beforeScrollHandler = () => {
      if (beforeContainer && afterContainer) {
        afterContainer.scrollLeft = beforeContainer.scrollLeft;
      }
    };

    const afterScrollHandler = () => {
      if (beforeContainer && afterContainer) {
        beforeContainer.scrollLeft = afterContainer.scrollLeft;
      }
    };

    beforeContainer.addEventListener('scroll', beforeScrollHandler);
    afterContainer.addEventListener('scroll', afterScrollHandler);

    return () => {
      beforeContainer.removeEventListener('scroll', beforeScrollHandler);
      afterContainer.removeEventListener('scroll', afterScrollHandler);
    };
  }, []);

  // Automatic scroll animation
  useEffect(() => {
    const beforeContainer = beforeScrollRef.current;
    const afterContainer = afterScrollRef.current;

    if (!beforeContainer || !afterContainer) return;

    let isScrolling = true;

    const scroll = () => {
      if (!isScrolling || !beforeContainer || !afterContainer) return;
      
      const maxScroll = beforeContainer.scrollWidth - beforeContainer.clientWidth;
      
      // Wait for content to load
      if (maxScroll <= 0 || beforeContainer.scrollWidth === beforeContainer.clientWidth) {
        animationFrameRef.current = requestAnimationFrame(scroll);
        return;
      }
      
      if (beforeContainer.scrollLeft >= maxScroll - 1) {
        // Reset to start for seamless loop
        beforeContainer.scrollLeft = 0;
        afterContainer.scrollLeft = 0;
      } else {
        beforeContainer.scrollLeft += scrollSpeedRef.current;
        afterContainer.scrollLeft += scrollSpeedRef.current;
      }

      animationFrameRef.current = requestAnimationFrame(scroll);
    };

    // Start scrolling after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(scroll);
    }, 200);

    return () => {
      isScrolling = false;
      clearTimeout(timeoutId);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [imagePairs]); // Re-run when imagePairs change


  // Duplicate images for seamless loop
  const duplicatedPairs = [...imagePairs, ...imagePairs];

  return (
    <div 
      className="relative w-full" 
      ref={containerRef}
    >
      {/* Before Images Container (Left side) */}
      <div 
        ref={beforeScrollRef}
        className="overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="flex gap-4 sm:gap-6 md:gap-8" style={{ width: 'max-content' }}>
          {duplicatedPairs.map((pair, idx) => (
            <div
              key={`before-${idx}`}
              className="flex-shrink-0 relative"
              style={{ width: '280px', height: '373px' }}
            >
              <OptimizedImage
                src={pair.before}
                alt={`${beforeLabel} ${idx + 1}`}
                className="w-full h-full object-cover rounded-2xl"
              />
              {/* Before Label */}
              <div className="absolute top-4 left-4 z-20 bg-black/70 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg">
                {beforeLabel}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* After Images Container (Right side, clipped) - fixed at 50% */}
      <div 
        ref={afterScrollRef}
        className="absolute top-0 left-0 w-full overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          clipPath: 'inset(0 50% 0 0)',
          pointerEvents: 'none'
        }}
      >
        <div className="flex gap-4 sm:gap-6 md:gap-8" style={{ width: 'max-content' }}>
          {duplicatedPairs.map((pair, idx) => (
            <div
              key={`after-${idx}`}
              className="flex-shrink-0 relative"
              style={{ width: '280px', height: '373px' }}
            >
              <OptimizedImage
                src={pair.after}
                alt={`${afterLabel} ${idx + 1}`}
                className="w-full h-full object-cover rounded-2xl"
              />
              {/* After Label */}
              <div className="absolute top-4 right-4 z-20 bg-primary text-white text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg">
                {afterLabel}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Slider Divider in the middle - always at 50% */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-30 pointer-events-none"
        style={{ 
          left: '50%', 
          transform: 'translateX(-50%)',
          height: '373px'
        }}
      >
        {/* Slider Handle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-primary">
          <div className="flex gap-1">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

    </div>
  );
}

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, isVisible } = useScrollAnimation();
  // Use useMemo to check mobile only once on mount, avoiding resize listener overhead
  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  }, []);

  // Reduce delay on mobile for faster animations
  const adjustedDelay = isMobile ? delay * 0.3 : delay;

  return (
    <div
      ref={ref}
      className="transition-all ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(15px)",
        transitionDuration: "400ms",
        transitionDelay: `${adjustedDelay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function parseMarkdownBold(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // Add the bold text
    parts.push(<strong key={key++}>{match[1]}</strong>);
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export default function Home() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [scrollY, setScrollY] = useState(0);
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());
  const [expandedReviewsGrid, setExpandedReviewsGrid] = useState<Set<number>>(new Set()); // For reviews grid section
  const [reviewsToShow, setReviewsToShow] = useState(isMobile ? 3 : 6); // Start with 3 items on mobile, 6 on desktop
  const hasRedirectedRef = useRef(false); // Prevent multiple redirects without causing re-renders
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const discountModalShownRef = useRef(false);

  // Update reviewsToShow when screen size changes
  useEffect(() => {
    const initialCount = isMobile ? 3 : 6;
    // Only reset if currently showing the initial count for the previous screen size
    if (reviewsToShow === 3 && !isMobile) {
      setReviewsToShow(6);
    } else if (reviewsToShow === 6 && isMobile) {
      setReviewsToShow(3);
    }
  }, [isMobile]);

  // Use the variant hook to handle variant parameter from URL
  // This ensures the variant is saved as the first variant when visiting /?variant=page2
  // The hook will handle saving to localStorage and removing from URL
  const { variant: posthogVariant } = usePostHogVariant(user?.id);
  
  // Memoize variant calculations to prevent recalculation on every render
  // This is critical for mobile performance
  const variantData = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        urlVariant: null,
        cachedVariant: null,
        firstVariant: null,
        isPage2Variant: false,
        isPage3Variant: false,
        isPage2Or3Variant: false,
        activeVariant: null,
        returnUrl: null,
        loginUrl: "/login",
      };
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const urlVariant = urlParams.get("variant") as "page1" | "page2" | "page3" | null;
    const cachedVariant = safeLocalStorage.getItem("aiselfi_dashboard_variant") as "page1" | "page2" | "page3" | null;
    const firstVariant = safeLocalStorage.getItem("aiselfi_first_dashboard_variant") as "page1" | "page2" | "page3" | null;
    const isPage2Variant = posthogVariant === "page2" || urlVariant === "page2" || cachedVariant === "page2" || firstVariant === "page2";
    const isPage3Variant = posthogVariant === "page3" || urlVariant === "page3" || cachedVariant === "page3" || firstVariant === "page3";
    const isPage2Or3Variant = isPage2Variant || isPage3Variant;
    const activeVariant = urlVariant || posthogVariant || cachedVariant || firstVariant;
    const returnUrl = urlParams.get("returnUrl");
    const loginUrl = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/login";
    
    return {
      urlVariant,
      cachedVariant,
      firstVariant,
      isPage2Variant,
      isPage3Variant,
      isPage2Or3Variant,
      activeVariant,
      returnUrl,
      loginUrl,
    };
  }, [posthogVariant]); // Only recalculate when posthogVariant changes

  const { isPage2Variant, isPage3Variant, isPage2Or3Variant, activeVariant, loginUrl } = variantData;

  // Extract "How AISelfie works" section for conditional rendering
  const howItWorksSection = (
    <AnimatedSection>
      <section id="how-it-works" className="py-12 sm:py-20 md:py-24 bg-background">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
              {t("howItWorks.title") || "Get your headshots in minutes, not days"}
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              {t("howItWorks.subtitle") || "It's as easy as 1-2-3-4!"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 max-w-7xl mx-auto">
            {(
              t("howItWorks.steps", { returnObjects: true }) as Array<{
                title: string;
                description: string;
              }>
            ).map((step, idx) => {
              // Images for each step
              const stepImages = [
                "/howAISelfieWorks1.webp", // Step 1: Upload selfies
                "/howAISelfieWorks2.webp", // Step 2: Choose style
                "/howAISelfieWorks3.webp", // Step 3: AI magic
                "/howAISelfieWorks4.webp", // Step 4: Download and share
              ];
              
              return (
                <AnimatedSection key={idx} delay={idx * 100}>
                  <div className="flex flex-col items-start text-left">
                    {/* Large Step Number - Aragon style */}
                    <div className="text-6xl sm:text-7xl md:text-8xl font-bold text-primary/20 mb-4 leading-none">
                      {idx + 1}
                    </div>
                    
                    {/* Step Title */}
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 text-foreground">
                      {step.title}
                    </h3>
                    
                    {/* Step Description */}
                    <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-6">
                      {step.description}
                    </p>
                    
                    {/* Step Image */}
                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-muted/50 shadow-lg">
                      <OptimizedImage
                        src={stepImages[idx] || stepImages[0]}
                        alt={step.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>

          {/* Additional Info Box */}
          <AnimatedSection delay={200}>
            <Card className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 md:gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary flex items-center justify-center">
                    <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">
                    {t("howItWorks.totalTime.title") || "Total Time: Less Than 3 Minutes"}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {t("howItWorks.totalTime.description") || "From upload to download, get professional headshots faster than ordering coffee. No appointments, no waiting."}
                  </p>
                </div>
              </div>
            </Card>
          </AnimatedSection>

          <div className="text-center">
            <Button asChild size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-glow-light">
              <a href={isPage2Or3Variant 
                  ? (activeVariant ? `/dashboard?variant=${activeVariant}` : "/dashboard")
                  : "/login"}>{t("howItWorks.cta")} →</a>
            </Button>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );

  // Memoize price calculations to prevent recalculation on every render
  const prices = useMemo(() => {
    const currency = detectCurrency();
    return {
      starterPrice: getLocalizedPrice("starter", currency, isPage2Variant),
      proPrice: getLocalizedPrice("pro", currency, isPage2Variant),
      premiumPrice: getLocalizedPrice("premium", currency, isPage2Variant),
    };
  }, [isPage2Variant]);

  const { starterPrice, proPrice, premiumPrice } = prices;

  // Redirect authenticated users to dashboard or returnUrl
  // If user is already authenticated, redirect immediately to avoid showing home page

  useEffect(() => {
    initPostHog().then(() => {
      trackPageView("/", {
        page_type: "landing",
      });
    });
  }, []);
  
  useEffect(() => {
    // Only redirect if user is authenticated, not loading, and we haven't redirected yet
    // Also check that we're actually on the home page to prevent redirect loops
    if (!loading && user && !hasRedirectedRef.current && typeof window !== "undefined" && window.location.pathname === "/") {
      hasRedirectedRef.current = true; // Set immediately to prevent multiple calls
      
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get("returnUrl");
      
      // Prevent redirect loop - don't redirect if returnUrl is /login
      if (returnUrl && returnUrl !== "/login" && !returnUrl.startsWith("/login")) {
        setLocation(returnUrl);
      } else if (!returnUrl) {
        // Preserve variant parameter if present
        const variant = params.get("variant");
        const dashboardUrl = variant ? `/dashboard?variant=${variant}` : "/dashboard";
        setLocation(dashboardUrl);
      } else {
        // If returnUrl is /login, just go to dashboard
        setLocation("/dashboard");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]); // Removed setLocation from deps - it's stable from wouter

  // Optimize scroll handler for mobile performance
  // Use requestAnimationFrame and throttling to prevent excessive re-renders
  useEffect(() => {
    let ticking = false;
    let rafId: number | null = null;
    
    const handleScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Use passive listener for better mobile performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // Don't render home page content if user is authenticated (prevents flash)
  // This must be after all hooks are called
  if (!loading && user) {
    return null;
  }

  // Calcular opacidade e transformação baseado no scroll
  const heroImageOpacity = Math.max(0, 1 - scrollY / 400);
  const heroImageScale = Math.max(0.8, 1 + scrollY / 500); // Aumenta ao invés de diminuir
  const heroImageRotation = scrollY / 20; // Rotação para efeito splash
  
  // Scroll transforms for floating effect
  const scrollTransformLeft = `translateX(-${scrollY * 0.8}px) translateY(-${scrollY * 0.1}px) scale(${heroImageScale})`;
  const scrollTransformRight = `translateX(${scrollY * 0.8}px) translateY(-${scrollY * 0.1}px) scale(${heroImageScale})`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Sticky CTA Bar - Only visible on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background border-t border-border shadow-2xl">
        <div className="container px-4 py-3">
          <Button
            asChild
            size="lg"
            className="w-full text-base font-bold py-6 bg-primary hover:bg-primary/90 rounded-full shadow-lg"
          >
            <a href="/login">{t("hero.cta")}</a>
          </Button>
        </div>
      </div>

      {/* Hero Section - Aragon.ai style background */}
      <section className="relative min-h-0 sm:min-h-[50vh] lg:min-h-[55vh] overflow-hidden pt-4 pb-4 sm:pb-8 lg:pb-6 px-4 sm:px-6 bg-background">
        {/* Floating Images Container - Desktop */}
        <div className="absolute inset-0 w-full h-full hidden lg:block pointer-events-none">
          {/* Left Side Images */}
          {/* Top Left */}
          <div
            className="absolute w-60 h-80 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105 hover:z-50 pointer-events-auto"
            style={{
              top: "10%",
              left: "9%",
              transform: `rotate(-15deg) ${scrollTransformLeft}`,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              opacity: heroImageOpacity,
            }}
          >
            <OptimizedImage
              src="/image.webp"
              alt={t("home.altText.professionalPhoto")}
              className="w-full h-full object-cover"
              priority
            />
          </div>

          {/* Middle Left */}
          <div
            className="absolute w-60 h-80 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105 hover:z-50 pointer-events-auto"
            style={{
              top: "50%",
              left: "6%",
              transform: `translateY(-50%) rotate(5deg) ${scrollTransformLeft}`,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              backgroundColor: "#E9D5FF",
              opacity: heroImageOpacity,
            }}
          >
            <OptimizedImage
              src="/image_1.webp"
              alt={t("home.altText.professionalPhoto")}
              className="w-full h-full object-cover"
              priority
            />
          </div>

          {/* Bottom Left */}
          <div
            className="absolute w-60 h-80 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105 hover:z-50 pointer-events-auto"
            style={{
              bottom: "5%",
              left: "14%",
              transform: `rotate(-10deg) ${scrollTransformLeft}`,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              opacity: heroImageOpacity,
            }}
          >
            <OptimizedImage
              src="/image_100.webp"
              alt={t("home.altText.professionalPhoto")}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Side Images */}
          {/* Top Right */}
          <div
            className="absolute w-60 h-80 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105 hover:z-50 pointer-events-auto"
            style={{
              top: "10%",
              right: "9%",
              transform: `rotate(15deg) ${scrollTransformRight}`,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              opacity: heroImageOpacity,
            }}
          >
            <OptimizedImage
              src="/image_10.webp"
              alt={t("home.altText.professionalPhoto")}
              className="w-full h-full object-cover"
              priority
            />
          </div>

          {/* Middle Right */}
          <div
            className="absolute w-60 h-80 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105 hover:z-50 pointer-events-auto"
            style={{
              top: "50%",
              right: "6%",
              transform: `translateY(-50%) rotate(-5deg) ${scrollTransformRight}`,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              backgroundColor: "#E9D5FF",
              opacity: heroImageOpacity,
            }}
          >
            <OptimizedImage
              src="/image_101_last.webp"
              alt={t("home.altText.professionalPhoto")}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Bottom Right */}
          <div
            className="absolute w-60 h-80 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105 hover:z-50 pointer-events-auto"
            style={{
              bottom: "5%",
              right: "14%",
              transform: `rotate(5deg) ${scrollTransformRight}`,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              backgroundColor: "#BFDBFE",
              opacity: heroImageOpacity,
            }}
          >
            <OptimizedImage
              src="/image_101.webp"
              alt={t("home.altText.professionalPhoto")}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Center Content */}
        <div className="container relative z-10 pt-4 lg:pt-6">
          <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4 max-w-4xl mx-auto">
            {/* Ranking Badge - Aragon style */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FCF3ED] border border-[#F97316]/20 rounded-full">
              <BadgeCheck className="w-4 h-4 text-[#F97316]" />
              <span className="text-xs sm:text-sm font-semibold text-[#111111] uppercase tracking-wide">
                {t("hero.rankingBadge") || "THE #1 RANKED AI HEADSHOT COMPANY"}
              </span>
            </div>

            {/* Main Title - Aragon style large and bold */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight px-4">
              <span className="block">{t("hero.titleLine1") || "The Most Popular"}</span>
              <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {t("hero.titleLine2") || "AI Headshot Generator"}
              </span>
            </h1>

            {/* Subtitle - Aragon style */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl px-4 leading-relaxed">
              {parseMarkdownBold(t("hero.subtitle") || "Turn your selfies into studio-quality headshots in minutes. Save hundreds of dollars and hours of your time.")}
            </p>

            {/* CTA Button - Large and prominent */}
            <div className="pt-2">
              <Button
                asChild
                size="lg"
                className="text-base sm:text-lg px-8 sm:px-12 py-5 sm:py-6 bg-primary hover:bg-primary/90 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold"
              >
                <a href="/login">{t("hero.cta") || "Create your headshots now"}</a>
              </Button>
            </div>

            {/* Reviews Badge - Aragon style */}
            <div className="flex flex-col items-center gap-3 pt-2">
              {/* Google Rating */}
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm sm:text-base font-semibold">4.8</span>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              
              {/* General Rating */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-green-500 rounded flex items-center justify-center">
                  <Star className="w-2.5 h-2.5 fill-green-500 text-green-500" />
                </div>
                <span className="text-sm sm:text-base font-semibold">4.9</span>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-green-500 text-green-500" />
                  ))}
                </div>
              </div>
              
              {/* Money Back Guarantee */}
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm sm:text-base font-semibold underline decoration-primary decoration-2 underline-offset-2">
                  {t("hero.guarantee") || "100% Money Back Guarantee"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Image Comparison Section - Aragon.ai style */}
      <AnimatedSection>
        <section className="py-8 sm:py-12 md:py-16 bg-background overflow-hidden">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="text-center mb-8 sm:mb-12">
              <p className="text-sm sm:text-base text-muted-foreground mb-2">
                {t("home.beforeAfterSubtitle") || "Real photos generated for our real customers. See our results and reviews for yourself."}
              </p>
              <p className="text-xs text-muted-foreground italic">
                {t("home.beforeAfterDisclaimer") || "These photos are not real. 100% AI Generated."}
              </p>
          </div>
          
            {/* Horizontal Scroll Container with Fixed Middle Slider */}
            <div className="relative max-w-7xl mx-auto">
              <BeforeAfterSliderScroll
                imagePairs={[
                  { before: "/image.webp", after: "/image_1.webp" },
                  { before: "/image_10.webp", after: "/image_100.webp" },
                  { before: "/image_101.webp", after: "/image_101_last.webp" },
                  { before: "/image.webp", after: "/image_1.webp" },
                  { before: "/image_10.webp", after: "/image_100.webp" },
                  { before: "/image_101.webp", after: "/image_101_last.webp" },
                ]}
                beforeLabel={t("home.beforeLabel") || "Before"}
                afterLabel={t("home.afterLabel") || "After"}
              />
            </div>

            {/* Trusted By Section - Below images */}
            <div className="mt-12 sm:mt-16">
              <div className="text-center mb-6 sm:mb-8">
                <p className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2 leading-relaxed">
                  {(() => {
                    const text = t("home.trustedByText") || "Confiado por mais de 2.312.000 profissionais e equipes. 40.011.000+ fotos de retrato geradas até o momento.";
                    // Split text to highlight "profissionais" and "equipes" (or "professionals" and "teams")
                    const parts = text.split(/(profissionais|equipes|professionals|teams)/i);
                    return (
                      <>
                        {parts.map((part, idx) => {
                          const isHighlighted = /^(profissionais|equipes|professionals|teams)$/i.test(part);
                          return isHighlighted ? (
                            <span key={idx} className="text-primary font-semibold">{part}</span>
                          ) : (
                            <span key={idx}>{part}</span>
                          );
                        })}
                      </>
                    );
                  })()}
                </p>
              </div>
              
              <div className="py-3 md:py-4 overflow-hidden bg-white border-y border-border/50 rounded-lg">
                <div className="container">
          <style>{`
            @keyframes scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(calc(-50% - 0px));
              }
            }
            .animate-scroll {
              animation: scroll 60s linear infinite;
              display: flex;
              width: max-content;
            }
            .animate-scroll:hover {
              animation-play-state: paused;
            }
            .animate-scroll.paused {
              animation-play-state: paused;
            }
            @media (max-width: 768px) {
              .animate-scroll {
                animation: scroll 22s linear infinite;
              }
            }
          `}</style>
          
          {/* Scrolling Companies Container */}
          <div className="overflow-hidden relative">
            <div 
              className="flex items-center flex-nowrap gap-2 sm:gap-8 md:gap-12 lg:gap-16 animate-scroll transition-opacity duration-300 cursor-pointer will-change-transform"
              onClick={(e) => {
                const target = e.currentTarget;
                target.classList.toggle('paused');
              }}
              title="Click to pause/resume"
            >
                {/* First set of companies */}
                {[
                  { name: "Microsoft", image: "/logos/trusted_by_professionals/1_white_microsoft.png" },
                  { name: "J.P. Morgan", image: "/logos/trusted_by_professionals/2_white_jpmorgan.png" },
                  { name: "Deloitte", image: "/logos/trusted_by_professionals/3_white_deloitte.png" },
                  { name: "Amazon", image: "/logos/trusted_by_professionals/4_white_amazon.png" },
                  { name: "Goldman Sachs", image: "/logos/trusted_by_professionals/5_white_goldmansachs.png" },
                  { name: "Accenture", image: "/logos/trusted_by_professionals/7_white_accenture.png" },
                  { name: "Nike", image: "/logos/trusted_by_professionals/8_white_nike.png" },
                  { name: "PwC", image: "/logos/trusted_by_professionals/9_white_pwc.png" },
                  { name: "Disney", image: "/logos/trusted_by_professionals/10_white_disney.png" },
                  { name: "KPMG", image: "/logos/trusted_by_professionals/11_white_kpmg.png" },
                ].map((company, idx) => (
                        <Fragment key={`first-trusted-${idx}`}>
                    {idx > 0 && <div className="w-px h-12 sm:h-16 bg-border/60 flex-shrink-0"></div>}
                          <div className="flex items-center flex-shrink-0 px-2 sm:px-4 md:px-6 py-2 sm:py-4 rounded-xl hover:bg-gray-200 transition-colors duration-200 text-center min-w-[100px] sm:min-w-[130px] md:min-w-[150px]">
                      <OptimizedImage 
                        src={company.image} 
                        alt={company.name}
                        width={120}
                        height={60}
                              className="w-20 h-10 sm:w-24 sm:h-12 md:w-32 md:h-16 object-contain opacity-90 hover:opacity-100 transition-all duration-200 brightness-0 hover:brightness-100"
                      />
                    </div>
                  </Fragment>
                ))}
                
                {/* Divider between sets */}
                <div className="w-px h-12 sm:h-16 bg-border/60 flex-shrink-0"></div>
                
                {/* Duplicate set for seamless loop */}
                {[
                  { name: "Microsoft", image: "/logos/trusted_by_professionals/1_white_microsoft.png" },
                  { name: "J.P. Morgan", image: "/logos/trusted_by_professionals/2_white_jpmorgan.png" },
                  { name: "Deloitte", image: "/logos/trusted_by_professionals/3_white_deloitte.png" },
                  { name: "Amazon", image: "/logos/trusted_by_professionals/4_white_amazon.png" },
                  { name: "Goldman Sachs", image: "/logos/trusted_by_professionals/5_white_goldmansachs.png" },
                  { name: "Accenture", image: "/logos/trusted_by_professionals/7_white_accenture.png" },
                  { name: "Nike", image: "/logos/trusted_by_professionals/8_white_nike.png" },
                  { name: "PwC", image: "/logos/trusted_by_professionals/9_white_pwc.png" },
                  { name: "Disney", image: "/logos/trusted_by_professionals/10_white_disney.png" },
                  { name: "KPMG", image: "/logos/trusted_by_professionals/11_white_kpmg.png" },
                ].map((company, idx) => (
                        <Fragment key={`second-trusted-${idx}`}>
                    {idx > 0 && <div className="w-px h-12 sm:h-16 bg-border/60 flex-shrink-0"></div>}
                          <div className="flex items-center flex-shrink-0 px-2 sm:px-4 md:px-6 py-2 sm:py-4 rounded-xl hover:bg-gray-200 transition-colors duration-200 text-center min-w-[100px] sm:min-w-[130px] md:min-w-[150px]">
                      <OptimizedImage 
                        src={company.image} 
                        alt={company.name}
                        width={120}
                        height={60}
                              className="w-20 h-10 sm:w-24 sm:h-12 md:w-32 md:h-16 object-contain opacity-90 hover:opacity-100 transition-all duration-200 brightness-0 hover:brightness-100"
                      />
                    </div>
                  </Fragment>
                ))}
            </div>
          </div>
        </div>
      </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* New How It Works Section - Based on reference image */}
      <AnimatedSection>
        <section className="py-8 sm:py-12 md:py-16 bg-background">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight text-foreground">
                {t("home.getYourPhotos.title") || "Obtenha as suas fotografias de retrato em minutos, não em dias"}
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground font-medium">
                {t("home.getYourPhotos.subtitle") || "É tão fácil como 1-2-3-4!"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto">
              {[
                {
                  number: 1,
                  title: t("home.getYourPhotos.step1.title") || "Carregue algumas fotografias suas",
                  description: t("home.getYourPhotos.step1.description") || "As selfies funcionam muito bem. Seis carregamentos é tudo o que precisa - concentre-se na qualidade em vez da quantidade para obter os melhores resultados",
                  image: "/howAISelfieWorks1.webp"
                },
                {
                  number: 2,
                  title: t("home.getYourPhotos.step2.title") || "Selecionar o vestuário e os fundos",
                  description: t("home.getYourPhotos.step2.description") || "Escolha a partir da nossa seleção de roupas e fundos selecionados.",
                  image: "/howAISelfieWorks2.webp"
                },
                {
                  number: 3,
                  title: t("home.getYourPhotos.step3.title") || "Criamos um modelo de IA personalizado só para si",
                  description: t("home.getYourPhotos.step3.description") || "O nosso modelo de IA começa a trabalhar. Basta aguardar os resultados e enviar-lhe-emos um e-mail quando as suas fotografias de retrato estiverem prontas!",
                  image: "/howAISelfieWorks3.webp"
                },
                {
                  number: 4,
                  title: t("home.getYourPhotos.step4.title") || "Veja, edite e transfira os seus favoritos!",
                  description: t("home.getYourPhotos.step4.description") || "Receberá até 100 fotografias de alta qualidade para utilizar como quiser.",
                  image: "/howAISelfieWorks4.webp"
                }
              ].map((step, idx) => (
                <AnimatedSection key={idx} delay={idx * 120}>
                  <div className="flex flex-col h-full">
                    {/* Step Image - White background with subtle shadow */}
                    <div className="w-full mb-4 rounded-xl overflow-hidden bg-white border-2 border-gray-100 shadow-md hover:shadow-lg transition-all duration-300">
                      <OptimizedImage
                        src={step.image}
                        alt={step.title}
                        className="w-full h-48 sm:h-56 md:h-64 object-cover"
                      />
                    </div>
                    
                    {/* Step Number and Title - Horizontal layout */}
                    <div className="flex items-start gap-3 mb-3">
                      {/* Step Number in Orange Circle - Smaller, on the left */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center shadow-md hover:scale-105 transition-transform duration-300">
                          <span className="text-lg sm:text-xl font-bold text-white">{step.number}</span>
                        </div>
                      </div>
                      
                      {/* Step Title - Next to the number */}
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground leading-tight pt-1">
                        {step.title}
                      </h3>
                    </div>
                    
                    {/* Step Description */}
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-left">
                      {step.description}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* How It Works Section - After Trusted By */}
      {/* Show in default variant, hide in page2 (will show at bottom in page3) */}
      {!isPage2Variant && !isPage3Variant && howItWorksSection}

      {/* Why Choose Us Section - For Variants 1 and 2 only, right after Hero */}
      {!isPage3Variant && (
        <AnimatedSection>
          <section className="py-12 sm:py-20 md:py-24 bg-gradient-to-b from-background via-background to-muted/20">
            <div className="container max-w-6xl mx-auto px-4">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">
                {t("whyChooseUs.title") || "Why Choose AISelfie?"}
              </h2>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t("whyChooseUs.subtitle") || "Professional headshots made simple, fast, and affordable"}
              </p>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <AnimatedSection delay={100}>
                  <div className="group relative p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Clock className="w-6 h-6 text-primary" />
                  </div>
                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
                    {t("whyChooseUs.fast.title") || "Lightning Fast"}
                  </h3>
                        <p className="text-muted-foreground leading-relaxed">
                    {t("whyChooseUs.fast.description") || "Get your professional photos in under 6 minutes. No waiting, no appointments."}
                  </p>
                      </div>
                    </div>
                  </div>
              </AnimatedSection>

              <AnimatedSection delay={200}>
                  <div className="group relative p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Lock className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
                    {t("whyChooseUs.privacy.title") || "100% Private"}
                  </h3>
                        <p className="text-muted-foreground leading-relaxed">
                    {t("whyChooseUs.privacy.description") || "Your photos are encrypted and deleted after 30 days. Your privacy is our priority."}
                  </p>
                      </div>
                    </div>
                  </div>
              </AnimatedSection>

              <AnimatedSection delay={300}>
                  <div className="group relative p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
                    {t("whyChooseUs.quality.title") || "Studio Quality"}
                  </h3>
                        <p className="text-muted-foreground leading-relaxed">
                    {t("whyChooseUs.quality.description") || "AI-powered technology trained on thousands of professional photos for authentic results."}
                  </p>
                      </div>
                    </div>
                  </div>
              </AnimatedSection>

              <AnimatedSection delay={400}>
                  <div className="group relative p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <ShieldCheck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
                    {t("whyChooseUs.guarantee.title") || "Money-Back Guarantee"}
                  </h3>
                        <p className="text-muted-foreground leading-relaxed">
                    {t("whyChooseUs.guarantee.description") || "Not satisfied? Get a full refund, no questions asked."}
                  </p>
                      </div>
                    </div>
                  </div>
              </AnimatedSection>
            </div>
          </div>
        </section>
      </AnimatedSection>
      )}

      {/* As Seen On Company Carousel - For Variant 1 only, after Why Choose Us */}
      {!isPage2Variant && !isPage3Variant && (
      <div className="py-3 md:py-4 overflow-hidden bg-gray-50 border-y border-border/50">        <div className="container">
          {/* Section Title */}
          <div className="text-center mb-4 md:mb-8">
            <h2 className="text-lg md:text-xl font-semibold text-muted-foreground uppercase tracking-wider">
              {t("home.trustedBy")}
            </h2>
          </div>
          
          <style>{`
            @keyframes scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(calc(-50% - 0px));
              }
            }
            .animate-scroll {
              animation: scroll 60s linear infinite;
              display: flex;
              width: max-content;
            }
            .animate-scroll:hover {
              animation-play-state: paused;
            }
            .animate-scroll.paused {
              animation-play-state: paused;
            }
            @media (max-width: 768px) {
              .animate-scroll {
                animation: scroll 22s linear infinite;
              }
            }
          `}</style>
          
          {/* Scrolling Companies Container */}
          <div className="overflow-hidden relative">
            <div 
              className="flex items-center flex-nowrap gap-2 sm:gap-8 md:gap-12 lg:gap-16 animate-scroll transition-opacity duration-300 cursor-pointer will-change-transform"
              onClick={(e) => {
                const target = e.currentTarget;
                target.classList.toggle('paused');
              }}
              title="Click to pause/resume"
            >
                {/* First set of companies */}
                {[
                  { name: "Microsoft", image: "/logos/trusted_by_professionals/1_white_microsoft.png" },
                  { name: "J.P. Morgan", image: "/logos/trusted_by_professionals/2_white_jpmorgan.png" },
                  { name: "Deloitte", image: "/logos/trusted_by_professionals/3_white_deloitte.png" },
                  { name: "Amazon", image: "/logos/trusted_by_professionals/4_white_amazon.png" },
                  { name: "Goldman Sachs", image: "/logos/trusted_by_professionals/5_white_goldmansachs.png" },
                  { name: "Accenture", image: "/logos/trusted_by_professionals/7_white_accenture.png" },
                  { name: "Nike", image: "/logos/trusted_by_professionals/8_white_nike.png" },
                  { name: "PwC", image: "/logos/trusted_by_professionals/9_white_pwc.png" },
                  { name: "Disney", image: "/logos/trusted_by_professionals/10_white_disney.png" },
                  { name: "KPMG", image: "/logos/trusted_by_professionals/11_white_kpmg.png" },
                ].map((company, idx) => (
                  <Fragment key={`first-${idx}`}>
                    {idx > 0 && <div className="w-px h-12 sm:h-16 bg-border/60 flex-shrink-0"></div>}
                    <div className="flex items-center flex-shrink-0 px-2 sm:px-4 md:px-6 py-2 sm:py-4 rounded-xl hover:bg-gray-100 transition-colors duration-200 text-center min-w-[100px] sm:min-w-[130px] md:min-w-[150px]">
                      <OptimizedImage 
                        src={company.image} 
                        alt={company.name}
                        width={120}
                        height={60}
                              className="w-20 h-10 sm:w-24 sm:h-12 md:w-32 md:h-16 object-contain opacity-90 hover:opacity-100 transition-all duration-200 brightness-0 hover:brightness-100"
                      />
                    </div>
                  </Fragment>
                ))}
                
                {/* Divider between sets */}
                <div className="w-px h-12 sm:h-16 bg-border/60 flex-shrink-0"></div>
                
                {/* Duplicate set for seamless loop */}
                {[
                  { name: "Microsoft", image: "/logos/trusted_by_professionals/1_white_microsoft.png" },
                  { name: "J.P. Morgan", image: "/logos/trusted_by_professionals/2_white_jpmorgan.png" },
                  { name: "Deloitte", image: "/logos/trusted_by_professionals/3_white_deloitte.png" },
                  { name: "Amazon", image: "/logos/trusted_by_professionals/4_white_amazon.png" },
                  { name: "Goldman Sachs", image: "/logos/trusted_by_professionals/5_white_goldmansachs.png" },
                  { name: "Accenture", image: "/logos/trusted_by_professionals/7_white_accenture.png" },
                  { name: "Nike", image: "/logos/trusted_by_professionals/8_white_nike.png" },
                  { name: "PwC", image: "/logos/trusted_by_professionals/9_white_pwc.png" },
                  { name: "Disney", image: "/logos/trusted_by_professionals/10_white_disney.png" },
                  { name: "KPMG", image: "/logos/trusted_by_professionals/11_white_kpmg.png" },
                ].map((company, idx) => (
                  <Fragment key={`second-${idx}`}>
                    {idx > 0 && <div className="w-px h-12 sm:h-16 bg-border/60 flex-shrink-0"></div>}
                    <div className="flex items-center flex-shrink-0 px-2 sm:px-4 md:px-6 py-2 sm:py-4 rounded-xl hover:bg-gray-100 transition-colors duration-200 text-center min-w-[100px] sm:min-w-[130px] md:min-w-[150px]">
                      <OptimizedImage 
                        src={company.image} 
                        alt={company.name}
                        width={120}
                        height={60}
                              className="w-20 h-10 sm:w-24 sm:h-12 md:w-32 md:h-16 object-contain opacity-90 hover:opacity-100 transition-all duration-200 brightness-0 hover:brightness-100"
                      />
                    </div>
                  </Fragment>
                ))}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* As Seen On Company Carousel - For Variant 3, stays in original position */}
      {isPage3Variant && (
      <div className="py-3 md:py-4 overflow-hidden bg-gray-50 border-y border-border/50">        <div className="container">
          {/* Section Title */}
          <div className="text-center mb-4 md:mb-8">
            <h2 className="text-lg md:text-xl font-semibold text-muted-foreground uppercase tracking-wider">
              {t("home.trustedBy")}
            </h2>
          </div>
          
          <style>{`
            @keyframes scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(calc(-50% - 0px));
              }
            }
            .animate-scroll {
              animation: scroll 60s linear infinite;
              display: flex;
              width: max-content;
            }
            .animate-scroll:hover {
              animation-play-state: paused;
            }
            .animate-scroll.paused {
              animation-play-state: paused;
            }
            @media (max-width: 768px) {
              .animate-scroll {
                animation: scroll 22s linear infinite;
              }
            }
          `}</style>
          
          {/* Scrolling Companies Container */}
          <div className="overflow-hidden relative">
            <div 
              className="flex items-center flex-nowrap gap-2 sm:gap-8 md:gap-12 lg:gap-16 animate-scroll transition-opacity duration-300 cursor-pointer will-change-transform"
              onClick={(e) => {
                const target = e.currentTarget;
                target.classList.toggle('paused');
              }}
              title="Click to pause/resume"
            >
                {/* First set of companies */}
                {[
                  { name: "Microsoft", image: "/logos/trusted_by_professionals/1_white_microsoft.png" },
                  { name: "J.P. Morgan", image: "/logos/trusted_by_professionals/2_white_jpmorgan.png" },
                  { name: "Deloitte", image: "/logos/trusted_by_professionals/3_white_deloitte.png" },
                  { name: "Amazon", image: "/logos/trusted_by_professionals/4_white_amazon.png" },
                  { name: "Goldman Sachs", image: "/logos/trusted_by_professionals/5_white_goldmansachs.png" },
                  { name: "Accenture", image: "/logos/trusted_by_professionals/7_white_accenture.png" },
                  { name: "Nike", image: "/logos/trusted_by_professionals/8_white_nike.png" },
                  { name: "PwC", image: "/logos/trusted_by_professionals/9_white_pwc.png" },
                  { name: "Disney", image: "/logos/trusted_by_professionals/10_white_disney.png" },
                  { name: "KPMG", image: "/logos/trusted_by_professionals/11_white_kpmg.png" },
                ].map((company, idx) => (
                  <Fragment key={`first-${idx}`}>
                    {idx > 0 && <div className="w-px h-12 sm:h-16 bg-border/60 flex-shrink-0"></div>}
                    <div className="flex items-center flex-shrink-0 px-2 sm:px-4 md:px-6 py-2 sm:py-4 rounded-xl hover:bg-gray-100 transition-colors duration-200 text-center min-w-[100px] sm:min-w-[130px] md:min-w-[150px]">
                      <OptimizedImage 
                        src={company.image} 
                        alt={company.name}
                        width={120}
                        height={60}
                              className="w-20 h-10 sm:w-24 sm:h-12 md:w-32 md:h-16 object-contain opacity-90 hover:opacity-100 transition-all duration-200 brightness-0 hover:brightness-100"
                      />
                    </div>
                  </Fragment>
                ))}
                
                {/* Divider between sets */}
                <div className="w-px h-12 sm:h-16 bg-border/60 flex-shrink-0"></div>
                
                {/* Duplicate set for seamless loop */}
                {[
                  { name: "Microsoft", image: "/logos/trusted_by_professionals/1_white_microsoft.png" },
                  { name: "J.P. Morgan", image: "/logos/trusted_by_professionals/2_white_jpmorgan.png" },
                  { name: "Deloitte", image: "/logos/trusted_by_professionals/3_white_deloitte.png" },
                  { name: "Amazon", image: "/logos/trusted_by_professionals/4_white_amazon.png" },
                  { name: "Goldman Sachs", image: "/logos/trusted_by_professionals/5_white_goldmansachs.png" },
                  { name: "Accenture", image: "/logos/trusted_by_professionals/7_white_accenture.png" },
                  { name: "Nike", image: "/logos/trusted_by_professionals/8_white_nike.png" },
                  { name: "PwC", image: "/logos/trusted_by_professionals/9_white_pwc.png" },
                  { name: "Disney", image: "/logos/trusted_by_professionals/10_white_disney.png" },
                  { name: "KPMG", image: "/logos/trusted_by_professionals/11_white_kpmg.png" },
                ].map((company, idx) => (
                  <Fragment key={`second-${idx}`}>
                    {idx > 0 && <div className="w-px h-12 sm:h-16 bg-border/60 flex-shrink-0"></div>}
                    <div className="flex items-center flex-shrink-0 px-2 sm:px-4 md:px-6 py-2 sm:py-4 rounded-xl hover:bg-gray-100 transition-colors duration-200 text-center min-w-[100px] sm:min-w-[130px] md:min-w-[150px]">
                      <OptimizedImage 
                        src={company.image} 
                        alt={company.name}
                        width={120}
                        height={60}
                              className="w-20 h-10 sm:w-24 sm:h-12 md:w-32 md:h-16 object-contain opacity-90 hover:opacity-100 transition-all duration-200 brightness-0 hover:brightness-100"
                      />
                    </div>
                  </Fragment>
                ))}
            </div>
          </div>
        </div>
      </div>
      )}

            {/* Reviews Section - Reduced padding on mobile */}
            <section className="pt-8 sm:pt-12 md:pt-16 lg:pt-20 mb-12 sm:mb-16 md:mb-20 lg:mb-24 pb-20 sm:pb-16 md:pb-20 lg:pb-24 bg-background">
            <div id="testimonials" className="max-w-7xl mx-auto px-4 scroll-mt-20">
                  {/* Section Title */}
              <div className="text-center mb-6 sm:mb-8 md:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight px-2">
                      {t("home.testimonialsTitlePart1")}{" "}
                      <span className="text-primary">{t("home.testimonialsTitleProfessional")}</span>{" "}
                      {t("home.testimonialsTitlePart2")}{" "}
                      <span className="text-primary">{t("home.testimonialsTitleAI")}</span>? {t("home.testimonialsTitlePart3")}
                    </h2>
                    <p className="text-base sm:text-lg text-muted-foreground px-2">
                      {t("home.testimonialsSubtitle")}
                    </p>
                  </div>

              {/* Reviews - 3x5 Grid Layout (15 components, same as carousel card layout) - Better mobile spacing */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-[95%] sm:max-w-[90%] mx-auto">
                {(() => {
                  // Fetch reviews once outside the map
                  const reviews = t("supportReviews.reviews", {
                    returnObjects: true,
                  }) as Array<{
                    name: string;
                    title: string;
                    review: string;
                    date: string;
                  }>;
                  
                  return Array.from({ length: reviewsToShow }).map((_, idx) => {
                    // Use unique review for each image (we have 15 reviews for 15 images)
                    // Use modulo to cycle if we ever show more than available reviews
                    const reviewIndex = idx % reviews.length;
                    const review = reviews[reviewIndex];
                    
                    // Debug log to verify correct review assignment
                    if (process.env.NODE_ENV === 'development' && idx < 3) {
                      console.log(`[Home] Review ${idx}: ${review.name} (index ${reviewIndex})`);
                    }
                  
                  // Map each review index sequentially to examples 1-15
                  // All examples 1-15 now have complete files
                  const exampleNumber = idx + 1;
                  const hasMultipleResults = exampleNumber === 14 || exampleNumber === 15;
                  
                  let profileImage: string;
                  let resultImages: string[];
                  
                  if (hasMultipleResults) {
                    // Example 14: 1 profile + 6 results (14_result.jpg + 14_result_1.jpg through 14_result_5.jpg)
                    // Example 15: 1 profile + 6 results (15_result.jpg + 15_result_1.jpg through 15_result_5.jpg)
                    profileImage = `/reviews/${exampleNumber}_profile.webp`;
                    if (exampleNumber === 14) {
                      resultImages = [
                        `/reviews/14_result.webp`,
                        `/reviews/14_result_1.webp`,
                        `/reviews/14_result_2.webp`,
                        `/reviews/14_result_3.webp`,
                        `/reviews/14_result_4.webp`,
                        `/reviews/14_result_5.webp`,
                      ];
                    } else {
                      // Example 15 - all 6 result images
                      resultImages = [
                        `/reviews/15_result.webp`,
                        `/reviews/15_result_1.webp`,
                        `/reviews/15_result_2.webp`,
                        `/reviews/15_result_3.webp`,
                        `/reviews/15_result_4.webp`,
                        `/reviews/15_result_5.webp`,
                      ];
                    }
                  } else {
                    // Examples 1-13: 1 profile + 1 result
                    profileImage = `/reviews/${exampleNumber}_profile.webp`;
                    resultImages = [`/reviews/${exampleNumber}_result.webp`];
                  }
                  
                  // Check if review should be truncated (more than 4 lines, roughly 200 characters)
                  const isExpanded = expandedReviewsGrid.has(idx);
                  const reviewText = review.review;
                  const shouldTruncate = reviewText.length > 200;
                  const displayText = shouldTruncate && !isExpanded
                    ? reviewText.substring(0, 200) + "..."
                    : reviewText;
                  
                  // Highlight key phrases
                  const highlightPhrases = t("examples.highlightPhrases", { returnObjects: true }) as string[];
                  
                  const parts: (string | React.ReactElement)[] = [];
                  let lastIndex = 0;
                  const matches: Array<{ start: number; end: number; text: string }> = [];
                  
                  highlightPhrases.forEach((phrase) => {
                    const index = displayText.indexOf(phrase, lastIndex);
                    if (index !== -1) {
                      const overlaps = matches.some(
                        (m) => !(index >= m.end || index + phrase.length <= m.start)
                      );
                      if (!overlaps) {
                        matches.push({ start: index, end: index + phrase.length, text: phrase });
                      }
                    }
                  });
                  
                  matches.sort((a, b) => a.start - b.start);
                  
                  if (matches.length > 0) {
                    matches.forEach((match, i) => {
                      if (match.start > lastIndex) {
                        parts.push(displayText.substring(lastIndex, match.start));
                      }
                      parts.push(
                        <span key={`highlight-${idx}-${i}`} className="bg-yellow-200 px-1 rounded font-semibold">
                          {match.text}
                        </span>
                      );
                      lastIndex = match.end;
                    });
                    if (lastIndex < displayText.length) {
                      parts.push(displayText.substring(lastIndex));
                    }
                  } else {
                    parts.push(displayText);
                  }

                  return (
                    <Card 
                      key={idx} 
                      className="bg-white border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                    >
                      {/* Profile Section */}
                      <CardContent className="px-5 pt-0 pb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-9 h-9 border-2 border-purple-200">
                            <AvatarImage src={profileImage} alt={review.name} />
                            <AvatarFallback className="bg-purple-100 text-purple-700">
                              {review.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm leading-tight truncate text-black">
                              {review.name}
                            </h3>
                            <p className="text-xs text-gray-600 truncate">
                              {review.title}
                            </p>
                          </div>
                        </div>

                        {/* Review Text */}
                        <div className="mb-0">
                          <p className={`text-xs text-black leading-tight ${shouldTruncate && !isExpanded ? 'line-clamp-4' : ''}`}>
                            {parts.length > 0 ? parts : displayText}
                          </p>
                          {shouldTruncate && (
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedReviewsGrid);
                                if (isExpanded) {
                                  newExpanded.delete(idx);
                                } else {
                                  newExpanded.add(idx);
                                }
                                setExpandedReviewsGrid(newExpanded);
                              }}
                              className="text-xs text-primary hover:underline mt-1 font-medium"
                            >
                              {isExpanded ? t("supportReviews.showLess") : t("supportReviews.readMore")}
                            </button>
                          )}
                        </div>
                      </CardContent>

                      {/* Professional Photo(s) */}
                      <div className="w-full px-3 -mt-2">
                        {hasMultipleResults ? (
                          // Multiple images grid for examples 14 and 15
                          <div className="grid grid-cols-3 gap-1">
                            {resultImages.map((imgSrc, imgIdx) => (
                              <div
                                key={imgIdx}
                                className="aspect-square overflow-hidden bg-gray-100 rounded-[20px]"
                              >
                                <OptimizedImage
                                  src={imgSrc}
                                  alt={t("home.altText.reviewPhoto", { name: review.name, number: imgIdx + 1 })}
                                  className="w-full h-full object-cover rounded-[20px]"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          // Single image for others
                          <div className={`${isMobile ? 'aspect-[3/4]' : 'aspect-[4/5]'} overflow-hidden bg-gray-100 rounded-[20px]`}>
                            <OptimizedImage
                              src={resultImages[0]}
                              alt={t("home.altText.reviewProfessionalPhoto", { name: review.name })}
                              className="w-full h-full object-cover rounded-[20px]"
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                  });
                })()}
              </div>

              {/* See More / Show Less Button */}
              <div className="flex justify-center mt-8">
                <Button
                  onClick={() => {
                    const initialCount = isMobile ? 3 : 6;
                    const secondCount = isMobile ? 6 : 12;
                    const maxCount = 15;
                    
                    if (reviewsToShow === initialCount) {
                      setReviewsToShow(secondCount); // Show more items
                    } else if (reviewsToShow === secondCount) {
                      setReviewsToShow(maxCount); // Show all items
                    } else if (reviewsToShow === maxCount) {
                      setReviewsToShow(initialCount); // Collapse back to initial state
                    }
                  }}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-6 rounded-full text-base font-medium transition-all duration-300 hover:scale-105"
                >
                  {reviewsToShow === 15 
                    ? t("supportReviews.showLess")
                    : t("supportReviews.seeMore")
                  }
                </Button>
              </div>
                    </div>
            </section>

      {/* As Seen On Company Carousel - For Variant 2 only, after How It Works */}
      {isPage2Variant && (
      <div className="py-3 md:py-4 overflow-hidden bg-gray-50 border-y border-border/50">        <div className="container">
          {/* Section Title */}
          <div className="text-center mb-4 md:mb-8">
            <h2 className="text-lg md:text-xl font-semibold text-muted-foreground uppercase tracking-wider">
              {t("home.trustedBy")}
            </h2>
          </div>
          
          <style>{`
            @keyframes scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(calc(-50% - 0px));
              }
            }
            .animate-scroll {
              animation: scroll 60s linear infinite;
              display: flex;
              width: max-content;
            }
            .animate-scroll:hover {
              animation-play-state: paused;
            }
            .animate-scroll.paused {
              animation-play-state: paused;
            }
            @media (max-width: 768px) {
              .animate-scroll {
                animation: scroll 22s linear infinite;
              }
            }
          `}</style>
          
          {/* Scrolling Companies Container */}
          <div className="overflow-hidden relative">
            <div 
              className="flex items-center flex-nowrap gap-2 sm:gap-8 md:gap-12 lg:gap-16 animate-scroll transition-opacity duration-300 cursor-pointer will-change-transform"
              onClick={(e) => {
                const target = e.currentTarget;
                target.classList.toggle('paused');
              }}
              title="Click to pause/resume"
            >
                {/* First set of companies */}
                {[
                  { name: "Microsoft", image: "/logos/trusted_by_professionals/1_white_microsoft.png" },
                  { name: "J.P. Morgan", image: "/logos/trusted_by_professionals/2_white_jpmorgan.png" },
                  { name: "Deloitte", image: "/logos/trusted_by_professionals/3_white_deloitte.png" },
                  { name: "Amazon", image: "/logos/trusted_by_professionals/4_white_amazon.png" },
                  { name: "Goldman Sachs", image: "/logos/trusted_by_professionals/5_white_goldmansachs.png" },
                  { name: "Accenture", image: "/logos/trusted_by_professionals/7_white_accenture.png" },
                  { name: "Nike", image: "/logos/trusted_by_professionals/8_white_nike.png" },
                  { name: "PwC", image: "/logos/trusted_by_professionals/9_white_pwc.png" },
                  { name: "Disney", image: "/logos/trusted_by_professionals/10_white_disney.png" },
                  { name: "KPMG", image: "/logos/trusted_by_professionals/11_white_kpmg.png" },
                ].map((company, idx) => (
                  <Fragment key={`first-v2-${idx}`}>
                    {idx > 0 && <div className="w-px h-12 sm:h-16 bg-border/60 flex-shrink-0"></div>}
                    <div className="flex items-center flex-shrink-0 px-2 sm:px-4 md:px-6 py-2 sm:py-4 rounded-xl hover:bg-gray-100 transition-colors duration-200 text-center min-w-[100px] sm:min-w-[130px] md:min-w-[150px]">
                      <OptimizedImage 
                        src={company.image} 
                        alt={company.name}
                        width={120}
                        height={60}
                              className="w-20 h-10 sm:w-24 sm:h-12 md:w-32 md:h-16 object-contain opacity-90 hover:opacity-100 transition-all duration-200 brightness-0 hover:brightness-100"
                      />
                    </div>
                  </Fragment>
                ))}
                
                {/* Divider between sets */}
                <div className="w-px h-12 sm:h-16 bg-border/60 flex-shrink-0"></div>
                
                {/* Duplicate set for seamless loop */}
                {[
                  { name: "Microsoft", image: "/logos/trusted_by_professionals/1_white_microsoft.png" },
                  { name: "J.P. Morgan", image: "/logos/trusted_by_professionals/2_white_jpmorgan.png" },
                  { name: "Deloitte", image: "/logos/trusted_by_professionals/3_white_deloitte.png" },
                  { name: "Amazon", image: "/logos/trusted_by_professionals/4_white_amazon.png" },
                  { name: "Goldman Sachs", image: "/logos/trusted_by_professionals/5_white_goldmansachs.png" },
                  { name: "Accenture", image: "/logos/trusted_by_professionals/7_white_accenture.png" },
                  { name: "Nike", image: "/logos/trusted_by_professionals/8_white_nike.png" },
                  { name: "PwC", image: "/logos/trusted_by_professionals/9_white_pwc.png" },
                  { name: "Disney", image: "/logos/trusted_by_professionals/10_white_disney.png" },
                  { name: "KPMG", image: "/logos/trusted_by_professionals/11_white_kpmg.png" },
                ].map((company, idx) => (
                  <Fragment key={`second-v2-${idx}`}>
                    {idx > 0 && <div className="w-px h-12 sm:h-16 bg-border/60 flex-shrink-0"></div>}
                    <div className="flex items-center flex-shrink-0 px-2 sm:px-4 md:px-6 py-2 sm:py-4 rounded-xl hover:bg-gray-100 transition-colors duration-200 text-center min-w-[100px] sm:min-w-[130px] md:min-w-[150px]">
                      <OptimizedImage 
                        src={company.image} 
                        alt={company.name}
                        width={120}
                        height={60}
                              className="w-20 h-10 sm:w-24 sm:h-12 md:w-32 md:h-16 object-contain opacity-90 hover:opacity-100 transition-all duration-200 brightness-0 hover:brightness-100"
                      />
                        </div>
                  </Fragment>
                ))}
                      </div>
          </div>
        </div>
      </div>
      )}

      {/* Why Choose Us Section - For Variant 3 only, after How It Works */}
      {isPage3Variant && (
        <AnimatedSection>
          <section className="py-12 sm:py-20 md:py-24 bg-gradient-to-b from-background via-background to-muted/20">
            <div className="container max-w-6xl mx-auto px-4">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">
                  {t("whyChooseUs.title") || "Why Choose AISelfie?"}
                </h2>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  {t("whyChooseUs.subtitle") || "Professional headshots made simple, fast, and affordable"}
                </p>
                      </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <AnimatedSection delay={100}>
                  <div className="group relative p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Clock className="w-6 h-6 text-primary" />
                        </div>
                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
                          {t("whyChooseUs.fast.title") || "Lightning Fast"}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {t("whyChooseUs.fast.description") || "Get your professional photos in under 6 minutes. No waiting, no appointments."}
                        </p>
                      </div>
            </div>
                  </div>
                </AnimatedSection>

            <AnimatedSection delay={200}>
                  <div className="group relative p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Lock className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
                          {t("whyChooseUs.privacy.title") || "100% Private"}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {t("whyChooseUs.privacy.description") || "Your photos are encrypted and deleted after 30 days. Your privacy is our priority."}
                        </p>
                  </div>
                    </div>
                  </div>
                </AnimatedSection>

                <AnimatedSection delay={300}>
                  <div className="group relative p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
                          {t("whyChooseUs.quality.title") || "Studio Quality"}
                    </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {t("whyChooseUs.quality.description") || "AI-powered technology trained on thousands of professional photos for authentic results."}
                    </p>
                  </div>
                </div>
                  </div>
            </AnimatedSection>

                <AnimatedSection delay={400}>
                  <div className="group relative p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <ShieldCheck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
                          {t("whyChooseUs.guarantee.title") || "Money-Back Guarantee"}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {t("whyChooseUs.guarantee.description") || "Not satisfied? Get a full refund, no questions asked."}
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
            </div>
          </div>
        </section>
      </AnimatedSection>
      )}

      {/* Money-Back Guarantee Banner */}
      <AnimatedSection>
        <section className="py-8 sm:py-10 md:py-12 bg-background border-y border-border/50">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                  {t("guaranteeBanner.title") || "100% Money-Back Guarantee"}
                </h3>
                <p className="text-base sm:text-lg text-muted-foreground">
                  {t("guaranteeBanner.description") || "Not satisfied with your photos? Get a full refund within 30 days. No questions asked. We're confident you'll love your results."}
                </p>
              </div>
              <div className="flex-shrink-0">
                <Badge className="bg-primary text-white text-sm sm:text-base px-4 py-2">
                  {t("guaranteeBanner.badge") || "Risk-Free"}
                </Badge>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Comparison Section - Aragon style */}
      <AnimatedSection>
          <section className="py-12 sm:py-20 md:py-24 bg-background">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                {t("comparison.title") || "Compare AISelfie to hiring a corporate photographer"}
              </h2>
            </div>
            
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-4 sm:p-6 font-semibold text-foreground"></th>
                      <th className="text-center p-4 sm:p-6 font-semibold text-primary">With AISelfie</th>
                      <th className="text-center p-4 sm:p-6 font-semibold text-muted-foreground">Hiring a photographer</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="p-4 sm:p-6 font-medium">{t("comparison.doItFromHome") || "Do it from home"}</td>
                      <td className="p-4 sm:p-6 text-center">
                        <Check className="w-5 h-5 mx-auto text-green-600" />
                      </td>
                      <td className="p-4 sm:p-6 text-center">
                        <X className="w-5 h-5 mx-auto text-muted-foreground" />
                        <span className="text-xs text-muted-foreground block mt-1">{t("comparison.onLocation") || "No, on-location shoot"}</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-4 sm:p-6 font-medium">{t("comparison.time") || "Time"}</td>
                      <td className="p-4 sm:p-6 text-center font-semibold text-primary">
                        {t("comparison.quickTime") || "As quick as 30 min"}
                      </td>
                      <td className="p-4 sm:p-6 text-center text-muted-foreground">
                        {t("comparison.photographerTime") || "2–3 work days"}
                      </td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-4 sm:p-6 font-medium">{t("comparison.numberOfHeadshots") || "Number of headshots"}</td>
                      <td className="p-4 sm:p-6 text-center font-semibold text-primary">
                        {t("comparison.upTo100") || "Up to 100"}
                      </td>
                      <td className="p-4 sm:p-6 text-center text-muted-foreground">
                        {t("comparison.photographerHeadshots") || "5-10 per person"}
                      </td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-4 sm:p-6 font-medium">{t("comparison.outfits") || "Outfits"}</td>
                      <td className="p-4 sm:p-6 text-center font-semibold text-primary">
                        {t("comparison.manyOutfits") || "20+ outfits"}
                      </td>
                      <td className="p-4 sm:p-6 text-center text-muted-foreground">
                        {t("comparison.photographerOutfits") || "1–2 outfits"}
                      </td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-4 sm:p-6 font-medium">{t("comparison.backgrounds") || "Backgrounds"}</td>
                      <td className="p-4 sm:p-6 text-center font-semibold text-primary">
                        {t("comparison.yourChoice") || "Your choice"}
                      </td>
                      <td className="p-4 sm:p-6 text-center text-muted-foreground">
                        {t("comparison.oneBackground") || "1 background"}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 sm:p-6 font-medium">{t("comparison.visualConsistency") || "Visual Consistency"}</td>
                      <td className="p-4 sm:p-6 text-center">
                        <Check className="w-5 h-5 mx-auto text-green-600" />
                        <span className="text-xs text-muted-foreground block mt-1">{t("comparison.presetsAvailable") || "Yes, presets available"}</span>
                      </td>
                      <td className="p-4 sm:p-6 text-center text-muted-foreground">
                        {t("comparison.manualEdits") || "Manual edits needed"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Pricing Section - Aragon style */}
      <AnimatedSection>
        <section id="pricing" className="py-12 sm:py-20 md:py-24 bg-background">
          <div className="container max-w-6xl mx-auto px-4">
            {/* Discount Badge - Aragon style */}
            <div className="text-center mb-6">
              <Badge className="px-4 py-2 text-base font-semibold bg-primary/10 text-primary border-primary/20">
                {t("pricing.discountBadge") || "20% off all packages limited time only!"}
              </Badge>
            </div>
            
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
                {(() => {
                  const title = t("pricing.title");
                  // Match "100x less", "100x menos", "100 volte meno", etc.
                  const match = title.match(/(.*?)(100x?\s*(?:less|menos|volte\s+meno))(?:\s+than\s+|\s+que\s+|di\s+)(.*)/i);
                  if (match) {
                    return (
                      <>
                        {match[1]}
                        <span className="text-green-700">{match[2]}</span>
                        {match[3] ? ` ${match[3]}` : ""}
                      </>
                    );
                  }
                  // Fallback: try to find and highlight "100x" pattern
                  const parts = title.split(/(100x?\s*(?:less|menos|volte\s+meno))/i);
                  if (parts.length > 1) {
                    return parts.map((part, idx) => 
                      /100x?\s*(?:less|menos|volte\s+meno)/i.test(part) ? (
                        <span key={idx} className="text-green-700">{part}</span>
                      ) : (
                        part
                      )
                    );
                  }
                  return title;
                })()}
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                {t("pricing.subtitle") || "Professional photoshoots in the US cost an average of $250 for a one-hour session — save time and money with our high-tech solution."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {/* Starter Pack */}
              <AnimatedSection delay={100}>
                <Card className="p-8 h-full">
                  <h3 className="text-2xl font-bold mb-2">{t("pricing.plans.starter.name")}</h3>
                  <p className="text-muted-foreground mb-4">
                    {isPage2Variant ? "40 photos" : t("pricing.plans.starter.photos")}
                  </p>
                  <div className={`text-5xl font-bold mb-2 ${isPage2Variant && starterPrice.oldFormatted ? "flex items-baseline gap-3" : ""}`}>
                    <span>
                      {isPage2Variant ? starterPrice.formatted : t("pricing.plans.starter.price")}
                    </span>
                    {isPage2Variant && starterPrice.oldFormatted && (
                      <span className="text-2xl text-muted-foreground line-through font-normal">
                        {starterPrice.oldFormatted}
                      </span>
                    )}
                    <span className="text-lg text-muted-foreground ml-2">
                      {t("pricing.plans.starter.currency")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t("pricing.plans.starter.note")}
                  </p>
                  <Button asChild className="w-full rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-glow-light" size="lg">
                    <a href="/login">{t("hero.cta")}</a>
                  </Button>
                </Card>
              </AnimatedSection>

              {/* Pro Pack */}
              <AnimatedSection delay={200}>
                <Card className="p-8 border-2 border-primary relative h-full">
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    {t("pricing.plans.pro.badge")}
                  </Badge>
                  <h3 className="text-2xl font-bold mb-2">{t("pricing.plans.pro.name")}</h3>
                  <p className="text-muted-foreground mb-4">
                    {isPage2Variant ? "60 photos" : t("pricing.plans.pro.photos")}
                  </p>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-5xl font-bold text-primary">
                      {isPage2Variant ? proPrice.formatted : t("pricing.plans.pro.price")}
                    </span>
                    {isPage2Variant && proPrice.oldFormatted ? (
                      <span className="text-2xl text-muted-foreground line-through font-normal">
                        {proPrice.oldFormatted}
                      </span>
                    ) : !isPage2Variant && (
                      <span className="text-2xl text-muted-foreground line-through">
                        {t("pricing.plans.pro.oldPrice")}
                      </span>
                    )}
                    <span className="text-lg text-muted-foreground">
                      {t("pricing.plans.pro.currency")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t("pricing.plans.pro.note")}
                  </p>
                  <Button asChild className="w-full rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-glow-light" size="lg">
                    <a href="/login">{t("hero.cta")}</a>
                  </Button>
                </Card>
              </AnimatedSection>

              {/* Premium Pack */}
              <AnimatedSection delay={300}>
                <Card className="p-8 h-full">
                  <h3 className="text-2xl font-bold mb-2">{t("pricing.plans.premium.name")}</h3>
                  <p className="text-muted-foreground mb-4">
                    {isPage2Variant ? "100 photos" : t("pricing.plans.premium.photos")}
                  </p>
                  <div className={`text-5xl font-bold mb-2 ${premiumPrice.oldFormatted ? "flex items-baseline gap-3" : ""}`}>
                    <span>
                      {premiumPrice.formatted}
                    </span>
                    {premiumPrice.oldFormatted && (
                      <span className="text-2xl text-muted-foreground line-through font-normal">
                        {premiumPrice.oldFormatted}
                      </span>
                    )}
                    <span className="text-lg text-muted-foreground ml-2">
                      {t("pricing.plans.premium.currency")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t("pricing.plans.premium.note")}
                  </p>
                  <Button asChild className="w-full rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-glow-light" size="lg">
                    <a href="/login">{t("hero.cta")}</a>
                  </Button>
                </Card>
              </AnimatedSection>
            </div>

            <AnimatedSection delay={400}>
              <div className="mt-12 max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-center mb-6">
                  {t("pricing.features.title")}
                </h3>
                <ul className="grid md:grid-cols-2 gap-4">
                  {(() => {
                    const items = t("pricing.features.items", { returnObjects: true });
                    const itemsArray = Array.isArray(items) ? items : (typeof items === 'string' ? [items] : []);
                    return itemsArray.map(
                      (item, idx) => (
                        <li key={idx} className="flex gap-3">
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                          <span>{item}</span>
                        </li>
                      )
                    );
                  })()}
                </ul>
              </div>
            </AnimatedSection>

            {/* Money-Back Guarantee */}
            <AnimatedSection delay={500}>
              <div className="flex items-center justify-center gap-2 pt-6 mt-6 border-t border-border max-w-2xl mx-auto">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm font-medium text-primary">
                  {t("buyCredits.moneyBackGuarantee")}
                </p>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </AnimatedSection>




      {/* Security & Privacy Section */}
      <AnimatedSection>
        <section className="py-12 sm:py-16 md:py-20 pb-20 sm:pb-16 md:pb-20 bg-background">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
              {/* Left: Image */}
              <div className="order-2 md:order-1">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <OptimizedImage
                    src="/similar_human1.webp"
                    alt="Secure AI Photo Generation"
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <div className="flex items-center gap-3 text-white">
                      <LockKeyhole className="w-6 h-6" />
                      <span className="font-semibold">Enterprise-Grade Security</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Content */}
              <div className="order-1 md:order-2 space-y-6">
                <div>
                  <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                    <Lock className="w-3 h-3 mr-1" />
                    Security First
                  </Badge>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                    {t("security.title") || "Your Privacy is Protected"}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    {t("security.subtitle") || "We use bank-level encryption to protect your photos. Your images are automatically deleted after 30 days."}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        {t("security.feature1.title") || "End-to-End Encryption"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t("security.feature1.description") || "All uploads and processing are encrypted using industry-standard protocols"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        {t("security.feature2.title") || "Auto-Deletion"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t("security.feature2.description") || "Your photos are automatically deleted after 30 days. We never store them permanently."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        {t("security.feature3.title") || "No Data Sharing"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t("security.feature3.description") || "We never share your photos with third parties. Your data stays private."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Comparison Section - Before/After */}
      <AnimatedSection>
        <section className="py-12 sm:py-16 md:py-20 pb-20 sm:pb-16 md:pb-20 bg-background">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                {t("comparison.title") || "Traditional Studio vs. AISelfie"}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                {t("comparison.subtitle") || "See why thousands choose AI over expensive studio sessions"}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {/* Traditional Studio */}
              <Card className="p-6 sm:p-8 border-2 border-red-200 dark:border-red-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <X className="w-6 h-6 text-red-500" />
                  <h3 className="text-xl sm:text-2xl font-bold">
                    {t("comparison.traditional.title") || "Traditional Studio"}
                  </h3>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{t("comparison.traditional.item1") || "$500+ per session"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{t("comparison.traditional.item2") || "Weeks of waiting for appointment"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{t("comparison.traditional.item3") || "Limited retakes"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{t("comparison.traditional.item4") || "Travel time required"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{t("comparison.traditional.item5") || "No refunds if unsatisfied"}</span>
                  </li>
                </ul>
              </Card>

              {/* AISelfie */}
              <Card className="p-6 sm:p-8 border-2 border-primary relative">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  {t("comparison.bestValue") || "Best Value"}
                </Badge>
                <div className="flex items-center gap-3 mb-4">
                  <Check className="w-6 h-6 text-primary" />
                  <h3 className="text-xl sm:text-2xl font-bold">
                    {t("comparison.aiselfie.title") || "AISelfie"}
                  </h3>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{t("comparison.aiselfie.item1") || "Starting at $5 - 100x cheaper"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{t("comparison.aiselfie.item2") || "Ready in under 6 minutes"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{t("comparison.aiselfie.item3") || "Unlimited retakes included"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{t("comparison.aiselfie.item4") || "From anywhere, anytime"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{t("comparison.aiselfie.item5") || "100% money-back guarantee"}</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* FAQ Section */}
      <AnimatedSection>
        <FAQ />
      </AnimatedSection>

      {/* Trust Badges Section */}
      <AnimatedSection>
        <section className="py-10 sm:py-12 md:py-16 pb-20 sm:pb-12 md:pb-16 bg-background border-y border-border">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 items-center justify-items-center">
              <div className="flex flex-col items-center gap-2 text-center">
                <BadgeCheck className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                <span className="text-xs sm:text-sm font-medium">
                  {t("trust.badge1") || "SSL Encrypted"}
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <ShieldCheck className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                <span className="text-xs sm:text-sm font-medium">
                  {t("trust.badge2") || "Money-Back Guarantee"}
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                <span className="text-xs sm:text-sm font-medium">
                  {t("trust.badge3") || "1.2M+ Happy Customers"}
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <Award className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                <span className="text-xs sm:text-sm font-medium">
                  {t("trust.badge4") || "Studio Quality"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA Section - Boost Personal Brand - More compact on mobile */}
      <AnimatedSection>
        <style>{`
          @media (min-width: 768px) {
            .cta-image-left {
              transform: rotate(-6deg);
            }
            .cta-image-right {
              transform: rotate(6deg);
            }
          }
        `}</style>
        <section className="py-10 sm:py-12 md:py-14 pb-20 sm:pb-12 md:pb-14 bg-background">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
              {/* Left Side - Text and CTA */}
              <div className="space-y-4 sm:space-y-6 text-foreground text-center md:text-left">
                <div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4">
                    {t("ctaSection.title")}
                  </h2>
                  <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground">
                    {t("ctaSection.subtitle")}
                  </p>
                </div>

                {/* CTA Button - Hidden on mobile (sticky bar shows it) */}
                <div className="hidden md:block">
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <a href={isPage2Or3Variant 
                        ? (activeVariant ? `/dashboard?variant=${activeVariant}` : "/dashboard")
                        : "/login"}>
                      {t("ctaSection.button")}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </a>
                  </Button>
                </div>

                {/* Social Proof */}
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[
                      "/image.webp",
                      "/image_1.webp",
                      "/image_10.webp",
                      "/image_100.webp",
                      "/image_101.webp",
                    ].map((img, idx) => (
                      <div
                        key={idx}
                        className="w-10 h-10 rounded-full border-2 border-purple-800 overflow-hidden bg-gray-700"
                      >
                        <OptimizedImage
                          src={img}
                          alt={t("home.altText.userNumber", { number: idx + 1 })}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm md:text-base text-gray-200">
                    {t("ctaSection.stats")}
                  </p>
                </div>
              </div>

              {/* Right Side - Overlapping Photos in Arc Pattern (Symmetrical) */}
              {/* Mobile: Stack vertically as single component */}
              {/* Desktop: Overlapping arc pattern */}
              <div className="flex flex-col md:relative md:h-[560px] items-center md:items-start">
                {/* Container for images - works as single component */}
                <div className="flex flex-col md:absolute md:inset-0 gap-4 md:gap-0 w-full max-w-sm md:max-w-none">
                  {/* Left Photo - Man in Suit (Bottom, Left, With Increased Negative Angle) */}
                  <div
                    className="cta-image-left w-full md:w-64 lg:w-80 aspect-[3/4] md:aspect-auto md:h-80 lg:h-[480px] rounded-2xl overflow-hidden shadow-2xl md:absolute md:bottom-0 md:left-0"
                    style={{
                      zIndex: 1,
                    }}
                  >
                    <OptimizedImage
                      src="/similar_human2.webp"
                      alt={t("home.altText.professionalPhotoNumber", { number: 1 })}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Center Photo - Woman (Higher Up, On Top of Left, Middle, No Angle, Straight) */}
                  <div
                    className="w-full md:w-64 lg:w-80 aspect-[3/4] md:aspect-auto md:h-80 lg:h-[480px] rounded-2xl overflow-hidden shadow-2xl md:absolute md:-top-8 md:left-56"
                    style={{
                      zIndex: 2,
                    }}
                  >
                    <OptimizedImage
                      src="/image_1.webp"
                      alt={t("home.altText.professionalPhotoNumber", { number: 2 })}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Right Photo - Third Image (Foreground, Right, With Increased Positive Angle - Mirrored) */}
                  <div
                    className="cta-image-right w-full md:w-64 lg:w-80 aspect-[3/4] md:aspect-auto md:h-80 lg:h-[480px] rounded-2xl overflow-hidden shadow-2xl md:absolute md:bottom-0 md:-right-32"
                    style={{
                      zIndex: 3,
                    }}
                  >
                    <OptimizedImage
                      src="/image_10.webp"
                      alt={t("home.altText.professionalPhotoNumber", { number: 3 })}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* How It Works Section - At bottom for page3 variant */}
      {isPage3Variant && howItWorksSection}

      {/* Discount Modal */}
      <DiscountModal open={showDiscountModal} onOpenChange={setShowDiscountModal} />
    </div>
  );
}
