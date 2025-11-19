import { useTranslation } from "@/hooks/useTranslation";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, Sparkles } from "lucide-react";
import { FAQ } from "@/components/FAQ";

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
  const [scrollY, setScrollY] = useState(0);

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
  
  // Imagens da esquerda saem para esquerda
  const leftImageTransform = `translateX(-${scrollY * 0.8}px) scale(${heroImageScale}) rotate(-${heroImageRotation}deg)`;
  
  // Imagens da direita saem para direita
  const rightImageTransform = `translateX(${scrollY * 0.8}px) scale(${heroImageScale}) rotate(${heroImageRotation}deg)`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="container">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Left Side - Photo Cards Stack */}
            <div 
              className="relative w-full lg:w-1/3 h-[500px] md:h-[600px] hidden lg:block transition-all duration-500 ease-out"
              style={{
                opacity: heroImageOpacity,
                transform: leftImageTransform,
              }}
            >
              {/* Card 1 - Top */}
              <div
                className="absolute top-0 left-0 w-64 h-80 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105 hover:z-50"
                style={{
                  transform: "rotate(-12deg) translateY(0px)",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                }}
              >
                <img
                  src="/image.webp"
                  alt="Professional AI Photo"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Card 2 - Middle */}
              <div
                className="absolute top-32 left-8 w-56 h-72 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105 hover:z-50"
                style={{
                  transform: "rotate(-6deg) translateY(0px)",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                  backgroundColor: "#E9D5FF",
                }}
              >
                <img
                  src="/image_1.webp"
                  alt="Professional AI Photo"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Card 3 - Bottom */}
              <div
                className="absolute top-64 left-4 w-60 h-80 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105 hover:z-50"
                style={{
                  transform: "rotate(-3deg) translateY(0px)",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                }}
              >
                <img
                  src="/image_100.jpg"
                  alt="Professional AI Photo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Center - Main Content */}
            <div className="flex flex-col items-center text-center space-y-6 lg:w-1/3 z-10">
              {/* Badge with avatars */}
              <div className="flex items-center gap-3 bg-secondary/50 backdrop-blur-sm px-6 py-3 rounded-full">
                <div className="flex -space-x-2">
                  {["/image.webp", "/image_1.webp", "/image_10.webp", "/image_100.jpg", "/image_101.jpg"].map(
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
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight max-w-3xl">
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

            {/* Right Side - Photo Cards Stack */}
            <div 
              className="relative w-full lg:w-1/3 h-[500px] md:h-[600px] hidden lg:block transition-all duration-500 ease-out"
              style={{
                opacity: heroImageOpacity,
                transform: rightImageTransform,
              }}
            >
              {/* Card 4 - Top Right */}
              <div
                className="absolute top-8 right-0 w-64 h-80 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105 hover:z-50"
                style={{
                  transform: "rotate(8deg) translateY(0px)",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                }}
              >
                <img
                  src="/image_10.webp"
                  alt="Professional AI Photo"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Card 5 - Bottom Right */}
              <div
                className="absolute top-56 right-8 w-60 h-80 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105 hover:z-50"
                style={{
                  transform: "rotate(12deg) translateY(0px)",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                  backgroundColor: "#BFDBFE",
                }}
              >
                <img
                  src="/image_101.jpg"
                  alt="Professional AI Photo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Mobile - Simple Grid */}
            <div className="grid grid-cols-2 gap-4 lg:hidden max-w-md">
              {["/image.webp", "/image_1.webp", "/image_10.webp", "/image_100.jpg"].map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl"
                  style={{
                    transform: `rotate(${idx % 2 === 0 ? "-3deg" : "3deg"})`,
                  }}
                >
                  <img src={img} alt="AI Professional Photo" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <AnimatedSection>
        <section id="examples" className="py-20 bg-card">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">{t("examples.title")}</h2>
              <p className="text-xl text-muted-foreground">{t("examples.subtitle")}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  name: "Alba Ripoll Cucó",
                  title: "Technology and Automation Consultant",
                  img: "/image_1.png",
                },
                {
                  name: "Marta Gimenez Carrion",
                  title: "Fundadora conmdemarketing",
                  img: "/image_10.jpg",
                },
                {
                  name: "Jorge Bosch Alés",
                  title: "Creador de Cosas de Freelance",
                  img: "/image_100.jpg",
                },
              ].map((person, idx) => (
                <AnimatedSection key={idx} delay={idx * 100}>
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={person.img}
                        alt={person.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-1">{person.name}</h3>
                      <p className="text-sm text-muted-foreground">{person.title}</p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
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
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
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

      {/* Styles Section */}
      <AnimatedSection>
        <section className="py-20 bg-card">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">{t("styles.title")}</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t("styles.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-8">
              {[
                "/outfits.webp",
                "/image_102.jpg",
                "/image_103.jpg",
                "/image_104.jpg",
                "/image_105.jpg",
                "/image_106.jpg",
                "/image_107.jpg",
                "/image_108.jpg",
              ].map((img, idx) => (
                <AnimatedSection key={idx} delay={idx * 50}>
                  <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={img}
                      alt={`Style ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </AnimatedSection>
              ))}
            </div>

            <div className="text-center">
              <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-glow-light">
                <a href="/login">{t("styles.cta")} →</a>
              </Button>
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
              ).map((step, idx) => (
                <AnimatedSection key={idx} delay={idx * 100}>
                  <Card className="p-6 text-center h-full">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                      {idx + 1}
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </Card>
                </AnimatedSection>
              ))}
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
              <h2 className="text-4xl md:text-5xl font-bold mb-4">{t("pricing.title")}</h2>
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

      {/* FAQ Section */}
      <AnimatedSection>
        <FAQ />
      </AnimatedSection>
    </div>
  );
}
