import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO } from "@/const";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Check } from "lucide-react";

// Testimonials data
const testimonials = [
  {
    text: "Ya me tocaba un upgrade en las fotos del trabajo y LinkedIn y vaya que lo he logrado!",
    author: "Cristian",
    stars: 5,
  },
  {
    text: "Increíble calidad, mis fotos profesionales en minutos. Totalmente recomendado!",
    author: "María",
    stars: 5,
  },
  {
    text: "Perfecto para mi perfil profesional. Las fotos quedaron espectaculares!",
    author: "Carlos",
    stars: 5,
  },
  {
    text: "Me ahorré mucho tiempo y dinero. Las fotos son de calidad profesional!",
    author: "Ana",
    stars: 5,
  },
];

// Images for carousel
const carouselImages = [
  "/image_102.jpg",
  "/image_103.jpg",
  "/image_104.jpg",
  "/image_105.jpg",
];

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const [, setLocation] = useLocation();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  // Se já estiver autenticado, redirecionar para dashboard
  useEffect(() => {
    // Only check auth after initial render to avoid blocking
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
      if (!loading && user) {
        setLocation("/dashboard");
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [user, loading, setLocation]);

  // Rotate images every 5 seconds
  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000);

    return () => clearInterval(imageInterval);
  }, []);

  // Rotate testimonials every 6 seconds
  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(testimonialInterval);
  }, []);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signIn();
    } catch (error) {
      console.error("Sign in error:", error);
      setIsSigningIn(false);
    }
  };

  // Show loading only if we're actively checking auth and it's loading
  if (isCheckingAuth && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const currentTestimonial = testimonials[currentTestimonialIndex];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex w-full max-w-6xl items-center justify-center gap-8">
        {/* Left Side - Image Carousel with Testimonial */}
        <div className="hidden lg:flex flex-col items-center w-full max-w-md">
          {/* Rotating Image with Overlay Testimonial */}
          <div className="relative w-full aspect-[3/4]">
            <div className="absolute inset-0 rounded-lg overflow-hidden shadow-2xl">
              {carouselImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Professional photo ${idx + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                    idx === currentImageIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>

            {/* Testimonial Card Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-foreground text-background rounded-b-lg p-6 shadow-xl">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: currentTestimonial.stars }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-sm mb-4 italic">"{currentTestimonial.text}"</p>
              <p className="text-xs font-semibold">- {currentTestimonial.author}</p>
              
              {/* Testimonial Indicators */}
              <div className="flex gap-2 justify-center mt-4">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentTestimonialIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentTestimonialIndex
                        ? "bg-background w-6"
                        : "bg-background/50"
                    }`}
                    aria-label={`Go to testimonial ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gap between panels */}
        <div className="hidden lg:block w-8" aria-hidden="true"></div>

        {/* Right Side - Login Form */}
        <div className="flex flex-col items-start w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <img src={APP_LOGO} alt="AISelfi" className="h-8 w-auto" />
            <span className="text-xl font-bold">aiselfi.es</span>
          </div>

          {/* Stats Banner */}
          <div className="mb-6 text-left">
            <p className="text-sm font-semibold text-primary">70K+ PROFESSIONAL PHOTOS GENERATED</p>
          </div>

          {/* Main Heading */}
          <div className="space-y-4 mb-8 text-left">
            <h1 className="text-4xl lg:text-5xl font-bold">
              Transform Selfies into Professional Photos
            </h1>
            <p className="text-lg text-muted-foreground">
              Sign up to create your photos
            </p>
          </div>

          {/* Login Button */}
          <div className="space-y-4 mb-8 w-full">
            <Button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full h-12 text-base font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-glow-light"
              size="lg"
            >
              {isSigningIn ? (
                "Redirecionando..."
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </Button>
          </div>

          {/* Features List */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm">100% money-back guarantee</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm">Your photos in under 30 minutes</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm">Founded in Europe. We respect your privacy</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm">Thousands of happy customers</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm">100% bootstrapped and solo funded</span>
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-left text-muted-foreground">
            Ao continuar, você concorda com nossos{" "}
            <a href="/terms" className="underline hover:text-primary">Termos de Serviço</a>
            {" "}e{" "}
            <a href="/privacy" className="underline hover:text-primary">Política de Privacidade</a>
          </p>
        </div>
      </div>
    </div>
  );
}
