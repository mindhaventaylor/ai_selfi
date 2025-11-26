import { useTranslation } from "@/hooks/useTranslation";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { usePostHogVariant } from "@/hooks/usePostHogVariant";
import { useEffect, useState } from "react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, Sparkles, ChevronLeft, ChevronRight, ArrowRight, ArrowDown, Quote } from "lucide-react";
import { FAQ } from "@/components/FAQ";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Linkedin } from "lucide-react";

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

  // Use the variant hook to handle variant parameter from URL
  // This ensures the variant is saved as the first variant when visiting /?variant=page2
  // The hook will handle saving to localStorage and removing from URL
  usePostHogVariant(user?.id);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            <img
              src="/image.jpg"
              alt={t("home.altText.professionalPhoto")}
              className="w-full h-full object-cover"
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
            <img
              src="/image_1.jpg"
              alt={t("home.altText.professionalPhoto")}
              className="w-full h-full object-cover"
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
            <img
              src="/image_100.jpg"
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
            <img
              src="/image_10.jpg"
              alt={t("home.altText.professionalPhoto")}
              className="w-full h-full object-cover"
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
            <img
              src="/image_101_last.jpg"
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
            <img
              src="/image_101.jpg"
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
                {["/image.jpg", "/image_1.jpg", "/image_10.jpg", "/image_100.jpg", "/image_101.jpg"].map(
                  (img, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full border-2 border-background overflow-hidden"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
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
            {["/image.jpg", "/image_1.jpg", "/image_10.jpg", "/image_100.jpg"].map((img, idx) => (
              <div
                key={idx}
                className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl"
                style={{
                  transform: `rotate(${idx % 2 === 0 ? "-3deg" : "3deg"})`,
                }}
              >
                <img src={img} alt={t("home.altText.aiProfessionalPhoto")} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Examples Section - Reviews Carousel */}
      <AnimatedSection>
        <section id="examples" className="py-20 bg-card">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">{t("examples.title")}</h2>
              <p className="text-xl text-muted-foreground flex items-center justify-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                {t("examples.subtitle")}
              </p>
            </div>

            <div className="max-w-6xl mx-auto relative px-12 md:px-16">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                  slidesToScroll: 1,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {(
                    t("examples.reviews", {
                      returnObjects: true,
                    }) as Array<{
                      name: string;
                      title: string;
                      review: string;
                      date: string;
                    }>
                  ).map((review, idx) => {
                    const isExpanded = expandedReviews.has(idx);
                    const reviewText = review.review;
                    const shouldTruncate = reviewText.length > 150;
                    const displayText = shouldTruncate && !isExpanded
                      ? reviewText.substring(0, 150) + "..."
                      : reviewText;

                    // Map reviews to images - using new numbered images
                    // Mapping review index to example number: [1, 2, 9, 3, 4, 5, 6, 7, 8, ...]
                    // Example 9 (Jorge) has 1 profile + 6 results, others have 1 profile + 1 result
                    const exampleMapping = [1, 2, 9, 3, 4, 5, 6, 7, 8];
                    const exampleNumber = exampleMapping[idx] || (idx + 1);
                    const isJorge = review.name.includes("Jorge") || exampleNumber === 9;
                    
                    let profileImage: string;
                    let resultImages: string[];
                    
                    if (isJorge) {
                      // Jorge is example 9 - 1 profile + 6 results
                      profileImage = "/9_profile.jpg";
                      resultImages = [
                        "/9_result1.jpg",
                        "/9_result2.jpg",
                        "/9_result3.jpg",
                        "/9_result4.jpg",
                        "/9_result5.jpg",
                        "/9_result6.jpg",
                      ];
                    } else {
                      // Other examples: 1 profile + 1 result
                      profileImage = `/${exampleNumber}_profile.jpg`;
                      resultImages = [`/${exampleNumber}_result.jpg`];
                    }

                    return (
                      <CarouselItem
                        key={idx}
                        className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                      >
                        <Card className="bg-white border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                          {/* Profile Section */}
                          <CardContent className="px-6 pt-0 pb-0">
                            <div className="flex items-center gap-3 mb-4">
                              <Avatar className="w-12 h-12 border-2 border-purple-200">
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
                                <h3 className="font-bold text-base leading-tight truncate text-black">
                                  {review.name}
                                </h3>
                                <p className="text-sm text-gray-600 truncate">
                                  {review.title}
                                </p>
                              </div>
                            </div>

                            {/* Review Text */}
                            <div className="mb-1">
                              <p className="text-sm text-black leading-relaxed">
                                {(() => {
                                  let text = displayText;
                                  const parts: (string | React.ReactElement)[] = [];
                                  
                                  // Key phrases to highlight (shorter, more distinctive)
                                  const highlightPhrases = t("examples.highlightPhrases", { returnObjects: true }) as string[];
                                  
                                  // Find and highlight phrases (avoid overlaps)
                                  let lastIndex = 0;
                                  const matches: Array<{ start: number; end: number; text: string }> = [];
                                  
                                  highlightPhrases.forEach((phrase) => {
                                    const index = text.indexOf(phrase, lastIndex);
                                    if (index !== -1) {
                                      // Check if this match overlaps with existing matches
                                      const overlaps = matches.some(
                                        (m) => !(index >= m.end || index + phrase.length <= m.start)
                                      );
                                      if (!overlaps) {
                                        matches.push({ start: index, end: index + phrase.length, text: phrase });
                                      }
                                    }
                                  });
                                  
                                  // Sort matches by start position
                                  matches.sort((a, b) => a.start - b.start);
                                  
                                  if (matches.length > 0) {
                                    matches.forEach((match, i) => {
                                      // Add text before match
                                      if (match.start > lastIndex) {
                                        parts.push(text.substring(lastIndex, match.start));
                                      }
                                      // Add highlighted match
                                      parts.push(
                                        <span key={`highlight-${idx}-${i}`} className="bg-yellow-200 px-1 rounded font-semibold">
                                          {match.text}
                                        </span>
                                      );
                                      lastIndex = match.end;
                                    });
                                    // Add remaining text
                                    if (lastIndex < text.length) {
                                      parts.push(text.substring(lastIndex));
                                    }
                                    return parts.length > 0 ? parts : text;
                                  }
                                  
                                  return text;
                                })()}
                              </p>
                              {shouldTruncate && (
                                <button
                                  onClick={() => {
                                    const newExpanded = new Set(expandedReviews);
                                    if (isExpanded) {
                                      newExpanded.delete(idx);
                                    } else {
                                      newExpanded.add(idx);
                                    }
                                    setExpandedReviews(newExpanded);
                                  }}
                                  className="text-sm text-primary hover:underline mt-2 font-medium"
                                >
                                  {isExpanded ? t("supportReviews.seeMore") : t("supportReviews.readMore")}
                                </button>
                              )}
                            </div>
                          </CardContent>

                          {/* Professional Photo(s) */}
                          <div className="w-full px-4 -mt-4">
                            {isJorge ? (
                              // Multiple images grid for Jorge (6 results)
                              <div className="grid grid-cols-3 gap-1">
                                {resultImages.map((imgSrc, imgIdx) => (
                                  <div
                                    key={imgIdx}
                                    className="aspect-square overflow-hidden bg-gray-100 rounded-[24px]"
                                  >
                                    <img
                                      src={imgSrc}
                                      alt={t("home.altText.reviewPhoto", { name: review.name, number: imgIdx + 1 })}
                                      className="w-full h-full object-cover rounded-[24px]"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              // Single image for others
                              <div className="aspect-[4/5] overflow-hidden bg-gray-100 rounded-[24px]">
                                <img
                                  src={resultImages[0]}
                                  alt={t("home.altText.reviewProfessionalPhoto", { name: review.name })}
                                  className="w-full h-full object-cover rounded-[24px]"
                                />
                              </div>
                            )}
                          </div>
                  </Card>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious 
                  variant="ghost"
                  className="!left-[calc(-3rem)] md:!left-[calc(-4rem)] top-1/2 -translate-y-1/2 !bg-white hover:!bg-white !border-0 !shadow-none z-10 !text-gray-700 !rounded-full !size-12"
                >
                  <ChevronLeft className="w-6 h-6" />
                </CarouselPrevious>
                <CarouselNext 
                  variant="ghost"
                  className="!right-[calc(-3rem)] md:!right-[calc(-4rem)] top-1/2 -translate-y-1/2 !bg-white hover:!bg-white !border-0 !shadow-none z-10 !text-gray-700 !rounded-full !size-12"
                >
                  <ChevronRight className="w-6 h-6" />
                </CarouselNext>
              </Carousel>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Comparison Section - Redesigned */}
      <AnimatedSection>
        <section className="py-20 relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background pointer-events-none" />

          <div className="container relative z-10">
            {/* Badge */}
            <div className="flex justify-center mb-8">
              <Badge variant="secondary" className="px-6 py-3 text-base gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span>{t("comparison.badge")}</span>
              </Badge>
            </div>

            {/* Title */}
            <div className="text-center mb-16 max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight">
                {t("comparison.mainTitle.part1")}{" "}
                <span className="italic text-primary">{t("comparison.mainTitle.models")}</span>
                {t("comparison.mainTitle.part2")}
              </h2>
            </div>
            {/* Comparison Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Traditional - Red/Pink Border */}
              <div className="relative rounded-3xl border-2 border-red-500/50 bg-card/30 backdrop-blur-sm p-8 hover:border-red-500 transition-colors">
                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                  <X className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-6 text-red-400">
                  {t("comparison.traditional.title")}
                </h3>
                <ul className="space-y-4">
                  {(t("comparison.traditional.items", { returnObjects: true }) as string[]).map(
                    (item, idx) => (
                      <li key={idx} className="flex gap-3 text-muted-foreground">
                        <span className="text-red-400 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    )
                  )}
                </ul>
                <p className="mt-8 text-xl font-bold text-red-400">
                  {t("comparison.traditional.cost")}
                </p>
              </div>

              {/* AI - Green Border */}
              <div className="relative rounded-3xl border-2 border-green-500/50 bg-card/30 backdrop-blur-sm p-8 hover:border-green-500 transition-colors">
                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-6 text-green-400">{t("comparison.ai.title")}</h3>
                <ul className="space-y-4">
                  {(t("comparison.ai.items", { returnObjects: true }) as string[]).map(
                    (item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-green-400 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    )
                  )}
                </ul>
                <p className="mt-8 text-xl font-bold text-green-400">{t("comparison.ai.stats")}</p>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

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
                {Array.from({ length: reviewsToShow }).map((_, idx) => {
                  const reviews = t("supportReviews.reviews", {
                    returnObjects: true,
                  }) as Array<{
                    name: string;
                    title: string;
                    review: string;
                    date: string;
                  }>;
                  
                  // Cycle through reviews, reusing them if needed
                  const review = reviews[idx % reviews.length];
                  
                  // Map each review index sequentially to examples 1-15
                  // All examples 1-15 now have complete files
                  const exampleNumber = idx + 1;
                  const hasMultipleResults = exampleNumber === 14 || exampleNumber === 15;
                  
                  let profileImage: string;
                  let resultImages: string[];
                  
                  if (hasMultipleResults) {
                    // Example 14: 1 profile + 6 results (14_result.jpg + 14_result_1.jpg through 14_result_5.jpg)
                    // Example 15: 1 profile + 6 results (15_result.jpg + 15_result_1.jpg through 15_result_5.jpg)
                    profileImage = `/reviews/${exampleNumber}_profile.jpg`;
                    if (exampleNumber === 14) {
                      resultImages = [
                        `/reviews/14_result.jpg`,
                        `/reviews/14_result_1.jpg`,
                        `/reviews/14_result_2.jpg`,
                        `/reviews/14_result_3.jpg`,
                        `/reviews/14_result_4.jpg`,
                        `/reviews/14_result_5.jpg`,
                      ];
                    } else {
                      // Example 15 - all 6 result images
                      resultImages = [
                        `/reviews/15_result.jpg`,
                        `/reviews/15_result_1.jpg`,
                        `/reviews/15_result_2.jpg`,
                        `/reviews/15_result_3.jpg`,
                        `/reviews/15_result_4.jpg`,
                        `/reviews/15_result_5.jpg`,
                      ];
                    }
                  } else {
                    // Examples 1-13: 1 profile + 1 result
                    profileImage = `/reviews/${exampleNumber}_profile.jpg`;
                    resultImages = [`/reviews/${exampleNumber}_result.jpg`];
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
                                <img
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
                            <img
                              src={resultImages[0]}
                              alt={t("home.altText.reviewProfessionalPhoto", { name: review.name })}
                              className="w-full h-full object-cover rounded-[20px]"
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
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

      {/* Testimonial Card Section */}
      <AnimatedSection>
        <section className="py-20 bg-gray-900">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="relative flex items-start">
              {/* Profile Picture - overlapping the card */}
              <div className="relative z-20 flex-shrink-0 -mr-6 md:-mr-8">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-gray-900">
                  <img
                    src="/image_101.jpg"
                    alt={t("home.altText.danielaMora")}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Speech Bubble Card */}
              <div className="flex-1 relative ml-2">
                {/* Speech bubble tail - pointing left to profile */}
                <div className="absolute -left-5 top-8 md:top-10 z-10">
                  <div className="relative">
                    {/* Outer purple border */}
                    <div
                      className="w-0 h-0"
                      style={{
                        borderTop: "14px solid transparent",
                        borderRight: "22px solid #9333ea",
                        borderBottom: "14px solid transparent",
                      }}
                    />
                    {/* Inner white fill */}
                    <div
                      className="absolute left-[2px] top-0 w-0 h-0"
                      style={{
                        borderTop: "12px solid transparent",
                        borderRight: "20px solid white",
                        borderBottom: "12px solid transparent",
                      }}
                    />
                  </div>
                </div>

                {/* Card */}
                <div className="bg-white border-2 border-purple-600 rounded-2xl p-6 md:p-8 shadow-xl relative z-10">
                  {/* Main Text */}
                  <p className="text-black text-base md:text-lg leading-relaxed mb-4 text-left">
                    {t("home.testimonial.text")}
                  </p>

                  {/* Attribution */}
                  <div className="text-sm md:text-base text-gray-600 leading-relaxed text-left">
                    <p>
                      {t("home.testimonial.attribution")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Styles Section */}
      <AnimatedSection>
        <section className="py-20 bg-gray-900">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Side - Image Grid with Video Player */}
              <div className="space-y-4">
                {/* Image Grid */}
                <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden bg-gray-800 p-4">
                  {[
                    { img: "/over100_1.jpg", label: null },
                    { img: "/over100_2.jpg", label: "Popular" },
                    { img: "/over100_3.jpg", label: null },
                    { img: "/over100_4.jpg", label: "New" },
                    { img: "/over100_5.jpg", label: null },
                    { img: "/over100_6.jpg", label: null },
                    { img: "/over100_7.jpg", label: "Popular" },
                    { img: "/over100_8.jpg", label: null },
                    { img: "/over100_9.jpg", label: null },
                  ].map((item, idx) => {
                    const badgeLabels = t("generateImages.badges", { returnObjects: true }) as { premium: string; new: string; popular: string };
                    return (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-700">
                        <img
                          src={item.img}
                          alt={t("home.altText.styleNumber", { number: idx + 1 })}
                          className="w-full h-full object-cover"
                        />
                        {item.label && (
                          <div className="absolute top-2 left-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              item.label === "Popular" 
                                ? "bg-purple-500 text-white" 
                                : "bg-green-500 text-white"
                            }`}>
                              {item.label === "Popular" ? badgeLabels.popular : item.label === "New" ? badgeLabels.new : item.label}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Side - Text, CTA, and Testimonial */}
              <div className="space-y-8 text-white">
                {/* Headline */}
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                  {t("styles.title")}
                </h2>

                {/* Body Text */}
                <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                  {t("styles.subtitle")}
                </p>

                {/* CTA Button */}
                <div>
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <a href="/login">
                      {t("styles.cta")} <ArrowRight className="ml-2 w-5 h-5 inline" />
                    </a>
                  </Button>
                </div>

                {/* Testimonial */}
                <div className="flex items-start gap-4 pt-4">
                  <Quote className="w-12 h-12 text-purple-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-lg md:text-xl text-white mb-3 italic">
                      "{t("styles.testimonial")}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-300">A</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">Aldo M.</span>
                          <span className="bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                            {t("home.styles.verifiedBuyer")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

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
                  "/girl_image_sample.jpg", // Step 1: Upload selfies
                  "/over100_1.jpg", // Step 2: Choose style
                  "/image.jpg", // Step 3: AI magic
                  "/image_1.jpg", // Step 4: Download and share
                ];
                
                return (
                  <AnimatedSection key={idx} delay={idx * 100}>
                    <Card className="p-6 text-center h-full">
                      {/* Step Image */}
                      <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 rounded-lg overflow-hidden shadow-lg">
                        <img
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

      {/* Pricing Section */}
      <AnimatedSection>
        <section id="pricing" className="py-20 bg-card">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
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
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t("pricing.subtitle")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Starter Pack */}
              <AnimatedSection delay={100}>
                <Card className="p-8 h-full">
                  <h3 className="text-2xl font-bold mb-2">{t("pricing.plans.starter.name")}</h3>
                  <p className="text-muted-foreground mb-4">{t("pricing.plans.starter.photos")}</p>
                  <div className="text-5xl font-bold mb-2">
                    {t("pricing.plans.starter.price")}
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
                  <p className="text-muted-foreground mb-4">{t("pricing.plans.pro.photos")}</p>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-5xl font-bold text-primary">
                      {t("pricing.plans.pro.price")}
                    </span>
                    <span className="text-2xl text-muted-foreground line-through">
                      {t("pricing.plans.pro.oldPrice")}
                    </span>
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
            </div>

            <AnimatedSection delay={300}>
              <div className="mt-12 max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-center mb-6">
                  {t("pricing.features.title")}
                </h3>
                <ul className="grid md:grid-cols-2 gap-4">
                  {(t("pricing.features.items", { returnObjects: true }) as string[]).map(
                    (item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                        <span>{item}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </AnimatedSection>

      {/* Upload Selfies Section */}
      <AnimatedSection>
        <section className="py-20 bg-gray-900">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center relative">
              {/* Arrow Icon - Vertical on mobile, horizontal on desktop */}
              {/* Mobile: Vertical arrow between sections */}
              <div className="flex justify-center my-6 md:hidden">
                <ArrowDown className="w-16 h-16 text-pink-500" strokeWidth={3} />
              </div>
              {/* Desktop: Horizontal arrow between columns */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
                <ArrowRight className="w-20 h-20 md:w-24 md:h-24 text-pink-500" strokeWidth={3} />
              </div>

              {/* Left Side - Upload Selfies */}
              <div className="space-y-6">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
                  {t("home.uploadSelfies.title")}
                </h3>
                <div className="grid grid-cols-2 gap-4 max-w-lg md:max-w-xl">
                  {[
                    "/girl_image_sample.jpg",
                    "/girl_image_sample2.jpg",
                    "/girl_image_sample3.jpg",
                    "/girl_image_sample4.jpg",
                  ].map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-lg overflow-hidden bg-gray-800"
                    >
                      <img
                        src={img}
                        alt={t("home.altText.selfieNumber", { number: idx + 1 })}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side - Generated Image */}
              <div className="relative">
                {/* Large Generated Image */}
                <div className="relative rounded-2xl overflow-hidden bg-gray-800">
                  <img
                    src="/girl_image_result.jpg"
                    alt={t("home.altText.aiGeneratedPhoto")}
                    className="w-full h-full object-cover aspect-[3/4]"
                  />
                  {/* Badge - Bottom Right */}
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-pink-100 border-2 border-pink-400 text-gray-900 text-[10px] font-bold px-2 py-1 rounded-md shadow-lg">
                      {t("faq.badge")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* FAQ Section */}
      <AnimatedSection>
        <FAQ />
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
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <a href="/login">
                    {t("ctaSection.button")}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>

                {/* Social Proof */}
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[
                      "/image.jpg",
                      "/image_1.jpg",
                      "/image_10.jpg",
                      "/image_100.jpg",
                      "/image_101.jpg",
                    ].map((img, idx) => (
                      <div
                        key={idx}
                        className="w-10 h-10 rounded-full border-2 border-purple-800 overflow-hidden bg-gray-700"
                      >
                        <img
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
                  <img
                    src="/similar_human2.jpeg"
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
                  <img
                    src="/image_1.jpg"
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
                  <img
                    src="/image_10.jpg"
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
