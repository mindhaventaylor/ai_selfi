import { useTranslation } from "@/hooks/useTranslation";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useEffect, useState } from "react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, Sparkles, ChevronLeft, ChevronRight, ArrowRight, ArrowDown, Quote, ShieldCheck } from "lucide-react";
import { FAQ } from "@/components/FAQ";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { safeLocalStorage } from "@/utils/localStorage";
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

  return (
    <div
      ref={ref}
      className="transition-all duration-700 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [scrollY, setScrollY] = useState(0);
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());
  const [expandedReviewsGrid, setExpandedReviewsGrid] = useState<Set<number>>(new Set()); // For reviews grid section
  const [reviewsToShow, setReviewsToShow] = useState(6); // Start with 2 rows (6 items in 3-column grid)

  // Check for returnUrl in query params
  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const returnUrl = urlParams.get("returnUrl");
  const loginUrl = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/login";

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
    if (!loading && user) {
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get("returnUrl");
      if (returnUrl) {
        setLocation(returnUrl);
      } else {
        // Preserve variant parameter if present
        const variant = params.get("variant");
        const dashboardUrl = variant ? `/dashboard?variant=${variant}` : "/dashboard";
        setLocation(dashboardUrl);
      }
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden pt-7 pb-20 lg:py-20">
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
          <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
            {/* Badge with avatars */}
            <div className="flex items-center gap-3 bg-secondary/50 backdrop-blur-sm px-6 py-3 rounded-full">
              <div className="flex -space-x-2">
                {["/image.webp", "/image_1.webp", "/image_10.webp", "/image_100.webp", "/image_101.webp"].map(
                  (img, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full border-2 border-background overflow-hidden"
                    >
                      <OptimizedImage src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  )
                )}
              </div>
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm font-medium">{t("hero.badge")}</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              {t("hero.title")}
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              {t("hero.subtitle")}
            </p>

            {/* CTA Button */}
            <div className="flex flex-col items-center gap-3">
              <Button
                asChild
                size="lg"
                className="text-lg px-10 py-7 bg-primary hover:bg-primary/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-glow"
              >
                <a href="/login">{t("hero.cta")} ✨</a>
              </Button>
              <p className="text-sm text-muted-foreground">{t("hero.guarantee")}</p>
            </div>
          </div>

          {/* Mobile - Simple Grid */}
          <div className="grid grid-cols-2 gap-4 lg:hidden max-w-md mx-auto mt-12">
            {["/image.webp", "/image_1.webp", "/image_10.webp", "/image_100.webp"].map((img, idx) => (
              <div
                key={idx}
                className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl"
                style={{
                  transform: `rotate(${idx % 2 === 0 ? "-3deg" : "3deg"})`,
                }}
              >
                <OptimizedImage src={img} alt={t("home.altText.aiProfessionalPhoto")} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>


            {/* Reviews Section */}
            <div id="testimonials" className="mb-16 max-w-7xl mx-auto scroll-mt-20">
                  {/* Section Title */}
              <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                      {t("home.testimonialsTitlePart1")}{" "}
                      <span className="text-blue-400">{t("home.testimonialsTitleProfessional")}</span>{" "}
                      {t("home.testimonialsTitlePart2")}{" "}
                      <span className="text-blue-400">{t("home.testimonialsTitleAI")}</span>? {t("home.testimonialsTitlePart3")}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      {t("home.testimonialsSubtitle")}
                    </p>
                  </div>

              {/* Reviews - 3x5 Grid Layout (15 components, same as carousel card layout) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-[90%] mx-auto">
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




      {/* How It Works Section */}
      <AnimatedSection>
        <section id="how-it-works" className="py-20">
          <div className="container">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              {t("howItWorks.title")}
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-12">
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
                    <Card className="p-6 text-center h-full">
                      {/* Step Image */}
                      <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 rounded-lg overflow-hidden shadow-lg">
                        <OptimizedImage
                          src={stepImages[idx] || stepImages[0]}
                          alt={step.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                        {idx + 1}
                      </div>
                      <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </Card>
                  </AnimatedSection>
                );
              })}
            </div>

            <div className="text-center">
              <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-glow-light">
                <a href="/login">{t("howItWorks.cta")} →</a>
              </Button>
            </div>
          </div>
        </section>
      </AnimatedSection>




      {/* CTA Section - Boost Personal Brand */}
      <AnimatedSection>
        <section className="py-14 bg-gray-900">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Side - Text and CTA */}
              <div className="space-y-6 text-white">
                <div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                    {t("ctaSection.title")}
                  </h2>
                  <p className="text-xl md:text-2xl text-gray-200">
                    {t("ctaSection.subtitle")}
                  </p>
                </div>

                {/* CTA Button */}
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <a href={loginUrl}>
                    {t("ctaSection.button")}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>

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
              <div className="relative h-[480px] md:h-[560px]">
                {/* Left Photo - Man in Suit (Bottom, Left, With Increased Negative Angle) */}
                <div
                  className="absolute bottom-0 left-0 md:bottom-0 md:left-0 w-64 md:w-80 h-80 md:h-[480px] rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    transform: "rotate(-6deg)",
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
                  className="absolute -top-4 left-40 md:-top-8 md:left-56 w-64 md:w-80 h-80 md:h-[480px] rounded-2xl overflow-hidden shadow-2xl"
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
                  className="absolute bottom-0 -right-20 md:bottom-0 md:-right-32 w-64 md:w-80 h-80 md:h-[480px] rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    transform: "rotate(6deg)",
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
        </section>
      </AnimatedSection>
    </div>
  );
}
