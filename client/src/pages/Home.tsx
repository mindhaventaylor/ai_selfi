import { useTranslation } from "@/hooks/useTranslation";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { usePostHogVariant } from "@/hooks/usePostHogVariant";
import React, { useEffect, useState, Fragment, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, Sparkles, ChevronLeft, ChevronRight, ArrowRight, ArrowDown, Quote, ShieldCheck, Lock, Zap, Users, Award, Clock, TrendingUp, Eye, LockKeyhole, BadgeCheck } from "lucide-react";
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
  const [scrollY, setScrollY] = useState(0);
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());
  const [expandedReviewsGrid, setExpandedReviewsGrid] = useState<Set<number>>(new Set()); // For reviews grid section
  const [reviewsToShow, setReviewsToShow] = useState(6); // Start with 2 rows (6 items in 3-column grid)
  const hasRedirectedRef = useRef(false); // Prevent multiple redirects without causing re-renders

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

  const { isPage2Variant, isPage2Or3Variant, activeVariant, loginUrl } = variantData;

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

      {/* Hero Section */}
      <section className="relative min-h-[70vh] sm:min-h-[75vh] lg:min-h-[80vh] overflow-hidden pt-7 pb-24 lg:pb-20 px-4 sm:px-6">
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
        <div className="container relative z-10 pt-2 lg:pt-6">
          <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6 max-w-3xl mx-auto">
            {/* Badge with avatars - Smaller on mobile */}
            <div className="flex items-center gap-2 sm:gap-3 bg-secondary/50 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full">
              <div className="flex -space-x-1.5 sm:-space-x-2">
                {["/image.webp", "/image_1.webp", "/image_10.webp", "/image_100.webp", "/image_101.webp"].map(
                  (img, idx) => (
                    <div
                      key={idx}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-background overflow-hidden"
                    >
                      <OptimizedImage src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  )
                )}
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-xs sm:text-sm font-medium">{t("hero.badge")}</span>
            </div>

            {/* Main Title - Larger and more impactful on mobile */}
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-tight px-2">
              {t("hero.title")}
            </h1>

            {/* Subtitle - More concise on mobile */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl px-2">
              {parseMarkdownBold(t("hero.subtitle"))}
            </p>

            {/* CTA Button - Hidden on mobile (shown in sticky bar) */}
            <div className="hidden lg:flex flex-col items-center gap-3">
              <Button
                asChild
                size="lg"
                className="text-lg px-10 py-7 bg-primary hover:bg-primary/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-glow"
              >
                <a href="/login">{t("hero.cta")}</a>
              </Button>
            </div>

            {/* Checkmarks - Better mobile layout */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 mt-4 sm:mt-6 md:mt-8 md:mt-10 bg-secondary/30 backdrop-blur-sm px-4 sm:px-6 py-4 sm:py-6 md:py-8 rounded-2xl border border-border/50 w-full max-w-lg sm:max-w-none">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                <span className="text-sm sm:text-base font-medium">{t("hero.checkmark1")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                <span className="text-sm sm:text-base font-medium">{t("hero.checkmark2")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                <span className="text-sm sm:text-base font-medium">{t("hero.checkmark3")}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Why Choose Us Section - Trust Building */}
      <AnimatedSection>
        <section className="py-12 sm:py-16 md:py-20 pb-20 sm:pb-16 md:pb-20 bg-background">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                {t("whyChooseUs.title") || "Why Choose AISelfie?"}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                {t("whyChooseUs.subtitle") || "Professional headshots made simple, fast, and affordable"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {/* Feature 1: Fast Delivery */}
              <AnimatedSection delay={100}>
                <Card className="p-6 h-full text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {t("whyChooseUs.fast.title") || "Lightning Fast"}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {t("whyChooseUs.fast.description") || "Get your professional photos in under 6 minutes. No waiting, no appointments."}
                  </p>
                </Card>
              </AnimatedSection>

              {/* Feature 2: Privacy & Security */}
              <AnimatedSection delay={200}>
                <Card className="p-6 h-full text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {t("whyChooseUs.privacy.title") || "100% Private"}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {t("whyChooseUs.privacy.description") || "Your photos are encrypted and deleted after 30 days. Your privacy is our priority."}
                  </p>
                </Card>
              </AnimatedSection>

              {/* Feature 3: Quality Guarantee */}
              <AnimatedSection delay={300}>
                <Card className="p-6 h-full text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {t("whyChooseUs.quality.title") || "Studio Quality"}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {t("whyChooseUs.quality.description") || "AI-powered technology trained on thousands of professional photos for authentic results."}
                  </p>
                </Card>
              </AnimatedSection>

              {/* Feature 4: Money Back */}
              <AnimatedSection delay={400}>
                <Card className="p-6 h-full text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {t("whyChooseUs.guarantee.title") || "Money-Back Guarantee"}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {t("whyChooseUs.guarantee.description") || "Not satisfied? Get a full refund, no questions asked."}
                  </p>
                </Card>
              </AnimatedSection>
            </div>
          </div>
        </section>
      </AnimatedSection>

            {/* Reviews Section - Reduced padding on mobile */}
            <div id="testimonials" className="pt-8 sm:pt-12 md:pt-16 lg:pt-20 mb-12 sm:mb-16 md:mb-20 lg:mb-24 pb-20 sm:pb-16 md:pb-20 lg:pb-24 max-w-7xl mx-auto px-4 scroll-mt-20">
                  {/* Section Title */}
              <div className="text-center mb-6 sm:mb-8 md:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight px-2">
                      {t("home.testimonialsTitlePart1")}{" "}
                      <span className="text-blue-400">{t("home.testimonialsTitleProfessional")}</span>{" "}
                      {t("home.testimonialsTitlePart2")}{" "}
                      <span className="text-blue-400">{t("home.testimonialsTitleAI")}</span>? {t("home.testimonialsTitlePart3")}
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
                          <div className="aspect-[4/5] overflow-hidden bg-gray-100 rounded-[20px]">
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
                    if (reviewsToShow === 6) {
                      setReviewsToShow(12); // Show 2 more rows (4 rows total)
                    } else if (reviewsToShow === 12) {
                      setReviewsToShow(15); // Show last row (all 15)
                    } else if (reviewsToShow === 15) {
                      setReviewsToShow(6); // Collapse back to initial state
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




      {/* As Seen On Company Carousel */}
      <div className="py-10 md:py-14 overflow-hidden bg-gradient-to-b from-gray-50/50 to-gray-100/30 dark:from-gray-900/50 dark:to-gray-800/30 border-y border-border/50">
        <div className="container">
          <style>{`
            @keyframes scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
            .animate-scroll {
              animation: scroll 30s linear infinite;
            }
            .animate-scroll:hover {
              animation-play-state: paused;
            }
          `}</style>
          <div className="flex items-center gap-4 md:gap-6 lg:gap-8 pb-2">
            {/* As seen on text */}
            <div className="flex items-center gap-3 flex-shrink-0 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm">
              <span className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                As seen on
              </span>
            </div>
            
            {/* Scrolling Companies Container */}
            <div className="flex-1 overflow-hidden relative">
              {/* Gradient fade effects on edges */}
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50/50 dark:from-gray-900/50 to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50/50 dark:from-gray-900/50 to-transparent z-10 pointer-events-none"></div>
              <div className="flex items-center gap-4 md:gap-6 lg:gap-8 animate-scroll opacity-70 hover:opacity-100 transition-opacity duration-300">
                {/* First set of companies */}
                {[
                  { name: "LinkedIn", icon: Linkedin, iconColor: "text-[#0077b5]" },
                  { name: "TechCrunch" },
                  { name: "Forbes" },
                  { name: "The Verge" },
                  { name: "Product Hunt" },
                  { name: "Wired" },
                  { name: "Fast Company" },
                  { name: "Inc." },
                  { name: "Entrepreneur" },
                  { name: "Business Insider" },
                ].map((company, idx) => (
                  <Fragment key={`first-${idx}`}>
                    {idx > 0 && <div className="w-px h-8 bg-border/60 flex-shrink-0"></div>}
                    <div className="flex items-center gap-2 flex-shrink-0 px-3 py-1.5 rounded-md hover:bg-background/50 transition-colors duration-200">
                      {company.icon && (
                        <company.icon className={`w-5 h-5 md:w-6 md:h-6 ${company.iconColor || 'text-foreground/80'} transition-colors duration-200`} />
                      )}
                      <span className="text-sm md:text-base font-semibold text-foreground/80 hover:text-foreground whitespace-nowrap transition-colors duration-200">
                        {company.name}
                      </span>
                    </div>
                  </Fragment>
                ))}
                
                {/* Divider between sets */}
                <div className="w-px h-8 bg-border/60 flex-shrink-0"></div>
                
                {/* Duplicate set for seamless loop */}
                {[
                  { name: "LinkedIn", icon: Linkedin, iconColor: "text-[#0077b5]" },
                  { name: "TechCrunch" },
                  { name: "Forbes" },
                  { name: "The Verge" },
                  { name: "Product Hunt" },
                  { name: "Wired" },
                  { name: "Fast Company" },
                  { name: "Inc." },
                  { name: "Entrepreneur" },
                  { name: "Business Insider" },
                ].map((company, idx) => (
                  <Fragment key={`second-${idx}`}>
                    {idx > 0 && <div className="w-px h-8 bg-border/60 flex-shrink-0"></div>}
                    <div className="flex items-center gap-2 flex-shrink-0 px-3 py-1.5 rounded-md hover:bg-background/50 transition-colors duration-200">
                      {company.icon && (
                        <company.icon className={`w-5 h-5 md:w-6 md:h-6 ${company.iconColor || 'text-foreground/80'} transition-colors duration-200`} />
                      )}
                      <span className="text-sm md:text-base font-semibold text-foreground/80 hover:text-foreground whitespace-nowrap transition-colors duration-200">
                        {company.name}
                      </span>
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section - Reduced padding on mobile */}
      <AnimatedSection>
        <section id="how-it-works" className="py-8 sm:py-16 md:py-20 pb-20 sm:pb-16 md:pb-20">
          <div className="container px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6 sm:mb-12 md:mb-16">
              {t("howItWorks.title")}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto mb-6 sm:mb-8 md:mb-12">
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

                // Icons for each step
                const stepIcons = [
                  <ArrowDown key="upload" className="w-6 h-6" />,
                  <Sparkles key="style" className="w-6 h-6" />,
                  <Zap key="ai" className="w-6 h-6" />,
                  <Check key="done" className="w-6 h-6" />,
                ];

                // Time estimates
                const timeEstimates = [
                  "~2 min",
                  "~1 min",
                  "~3 min",
                  "Instant"
                ];
                
                return (
                  <AnimatedSection key={idx} delay={idx * 50}>
                    <Card className="p-4 sm:p-6 text-center h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
                      {/* Step Number Badge */}
                      <div className="relative mb-3 sm:mb-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                          {idx + 1}
                        </div>
                        {/* Time badge */}
                        <Badge className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-background border-2 border-primary text-xs font-semibold">
                          {timeEstimates[idx]}
                        </Badge>
                      </div>

                      {/* Step Image */}
                      <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto mb-3 sm:mb-4 rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <OptimizedImage
                          src={stepImages[idx] || stepImages[0]}
                          alt={step.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Icon */}
                      <div className="mb-2 sm:mb-3 flex justify-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {stepIcons[idx]}
                        </div>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{step.title}</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">{step.description}</p>
                    </Card>
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
                      {t("howItWorks.totalTime.title") || "Total Time: Less Than 6 Minutes"}
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

      {/* Money-Back Guarantee Banner */}
      <AnimatedSection>
        <section className="py-8 sm:py-10 md:py-12 bg-gradient-to-r from-green-500/10 via-primary/10 to-green-500/10 border-y-2 border-green-500/20">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
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
                <Badge className="bg-green-500 text-white text-sm sm:text-base px-4 py-2">
                  {t("guaranteeBanner.badge") || "Risk-Free"}
                </Badge>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Pricing Section - Reduced padding on mobile */}
      <AnimatedSection>
        <section id="pricing" className="py-12 sm:py-16 md:py-20 pb-20 sm:pb-16 md:pb-20 bg-card">
          <div className="container px-4">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                {(() => {
                  const title = t("pricing.title");
                  // Match "5x less", "5x menos", "5 volte meno", etc.
                  const match = title.match(/(.*?)(5x?\s*(?:less|menos|volte\s+meno))(?:\s+than\s+|\s+que\s+|di\s+)(.*)/i);
                  if (match) {
                    return (
                      <>
                        {match[1]}
                        <span className="text-green-700">{match[2]}</span>
                        {match[3] ? ` ${match[3]}` : ""}
                      </>
                    );
                  }
                  // Fallback: try to find and highlight "5x" pattern
                  const parts = title.split(/(5x?\s*(?:less|menos|volte\s+meno))/i);
                  if (parts.length > 1) {
                    return parts.map((part, idx) => 
                      /5x?\s*(?:less|menos|volte\s+meno)/i.test(part) ? (
                        <span key={idx} className="text-green-700">{part}</span>
                      ) : (
                        part
                      )
                    );
                  }
                  return title;
                })()}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
                {t("pricing.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
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
                <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  {t("buyCredits.moneyBackGuarantee")}
                </p>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </AnimatedSection>




      {/* Security & Privacy Section */}
      <AnimatedSection>
        <section className="py-12 sm:py-16 md:py-20 pb-20 sm:pb-16 md:pb-20 bg-gray-50 dark:bg-gray-900/50">
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
                    <span>{t("comparison.aiselfie.item1") || "Starting at $29 - 5x cheaper"}</span>
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
        <section className="py-10 sm:py-12 md:py-14 pb-20 sm:pb-12 md:pb-14 bg-gray-900">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
              {/* Left Side - Text and CTA */}
              <div className="space-y-4 sm:space-y-6 text-white text-center md:text-left">
                <div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4">
                    {t("ctaSection.title")}
                  </h2>
                  <p className="text-lg sm:text-xl md:text-2xl text-gray-200">
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
    </div>
  );
}
