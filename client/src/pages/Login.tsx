import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { APP_LOGO } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { Check } from "lucide-react";


// COMMENTED OUT: Images for carousel - matching the 4 testimonials
// Sofia Bianchi (example 1), Marco Rossi (example 2), Chiara Romano (example 4), Valentina Marchetti (example 6)
// const carouselImages = [
//   "/reviews/1_result.webp",
//   "/reviews/2_result.webp",
//   "/reviews/4_result.webp",
//   "/reviews/6_result.webp",
// ];

export default function Login() {
  const { t } = useTranslation();
  const { user, loading, signIn, signInWithEmail, signUpWithEmail } = useAuth();
  const [, setLocation] = useLocation(); // Only need setLocation, not location
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true); // Default to sign up since most users won't have an account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Check for variant in URL to determine if we should auto-create accounts
  // Use useRef to store initial values and prevent recalculation on every render
  // This prevents infinite loops when location changes trigger re-renders
  const variantRef = useRef<string | null>(null);
  const isVariant2Or3Ref = useRef<boolean>(false);
  
  // Initialize once on mount
  if (variantRef.current === null && typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const variantValue = urlParams.get("variant");
    variantRef.current = variantValue;
    isVariant2Or3Ref.current = variantValue === "page2" || variantValue === "page3";
  }
  
  const variant = variantRef.current;
  const isVariant2Or3 = isVariant2Or3Ref.current;
  // COMMENTED OUT: Reviews/testimonials section removed as they were distracting users
  // const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  // // Get testimonials early so they're available for useEffect
  // const testimonials = t("login.testimonials", { returnObjects: true }) as Array<{ text: string; author: string; stars: number }>;

  // Redirect to dashboard if already authenticated
  // Use useRef to prevent multiple redirects without causing re-renders
  const hasRedirectedRef = useRef(false);
  const isRedirectingRef = useRef(false);
  
  useEffect(() => {
    // Skip if already redirected or currently redirecting
    if (hasRedirectedRef.current || isRedirectingRef.current) {
      return;
    }

    // Only redirect if user is authenticated, not loading, and we haven't redirected yet
    // Also check that we're actually on the login page to prevent redirect loops
    if (!loading && user && typeof window !== "undefined" && window.location.pathname === "/login") {
      isRedirectingRef.current = true; // Set immediately to prevent multiple calls
      hasRedirectedRef.current = true; // Mark as redirected
      
      // Use requestAnimationFrame to ensure redirect happens after render cycle completes
      requestAnimationFrame(() => {
        const params = new URLSearchParams(window.location.search);
        const returnUrl = params.get("returnUrl");
        
        // Prevent redirect loop - don't redirect back to login
        if (returnUrl && returnUrl !== "/login" && !returnUrl.startsWith("/login")) {
          setLocation(returnUrl);
        } else if (!returnUrl) {
          // Preserve variant parameter if present
          const variantParam = params.get("variant");
          const dashboardUrl = variantParam ? `/dashboard?variant=${variantParam}` : "/dashboard";
          setLocation(dashboardUrl);
        } else {
          // If returnUrl is /login, just go to dashboard
          setLocation("/dashboard");
        }
        
        isRedirectingRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]); // Removed setLocation from deps - it's stable from wouter

  // COMMENTED OUT: Sync image and testimonial rotation - rotate together every 6 seconds
  // useEffect(() => {
  //   if (!testimonials || testimonials.length === 0) return;
  //   
  //   const rotationInterval = setInterval(() => {
  //     setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
  //     setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  //   }, 6000);

  //   return () => clearInterval(rotationInterval);
  // }, [testimonials]);

  // Don't render login page if user is already authenticated (prevents flash)
  // This must be after all hooks are called
  // Also check hasRedirectedRef to prevent rendering during redirect
  if ((!loading && user) || hasRedirectedRef.current) {
    return null;
  }

  const handleSignIn = async () => {
    try {
      // Store returnUrl if present
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get("returnUrl");
      if (returnUrl) {
        localStorage.setItem("auth_return_url", returnUrl);
      }
      
      setIsSigningIn(true);
      await signIn();
    } catch (error) {
      console.error("Sign in error:", error);
      setIsSigningIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    
    if (!email || !password) {
      setEmailError(t("login.emailRequired"));
      return;
    }

    // For variants 2 and 3, don't require name field
    if (isSignUp && !isVariant2Or3 && !name.trim()) {
      setEmailError(t("login.nameRequired"));
      return;
    }

    setIsProcessing(true);
    
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get("returnUrl");
    if (returnUrl) {
      localStorage.setItem("auth_return_url", returnUrl);
    }

    // For variants 2 and 3: try sign in first, if fails try sign up (auto-create)
    if (isVariant2Or3) {
      try {
        await signInWithEmail(email, password);
        // Sign in succeeded, redirect will happen automatically via useEffect when user is set
        // Don't set isProcessing to false here - let useEffect handle it when user is set
      } catch (signInError: any) {
        // If sign in fails, try to create account (user might not exist)
        console.log("Sign in failed, attempting to create account:", signInError);
        try {
          // Try sign up without name (name will be derived from email)
          await signUpWithEmail(email, password);
          // Sign up succeeded, redirect will happen automatically via useEffect when user is set
          // Don't set isProcessing to false here - let useEffect handle it when user is set
        } catch (signUpError: any) {
          // Sign up failed - this could mean:
          // 1. User already exists (password was wrong)
          // 2. Some other error
          const errorMessage = signUpError?.message || signInError?.message || t("login.signInError");
          // Check if error indicates user already exists
          const isUserExistsError = errorMessage.toLowerCase().includes("already") || 
                                   errorMessage.toLowerCase().includes("registered") ||
                                   errorMessage.toLowerCase().includes("exists");
          
          if (isUserExistsError) {
            // User exists but password was wrong - show appropriate error
            setEmailError(t("login.signInError") || "Invalid email or password");
          } else {
            // Other error from sign up
            setEmailError(errorMessage);
          }
          setIsProcessing(false);
        }
      }
    } else {
      // Original behavior for other variants
      try {
        if (isSignUp) {
          await signUpWithEmail(email, password, name.trim() || undefined);
        } else {
          await signInWithEmail(email, password);
        }
        // Redirect will happen automatically via useEffect when user is set
      } catch (error: any) {
        console.error("Email auth error:", error);
        setEmailError(error?.message || (isSignUp ? t("login.signUpError") : t("login.signInError")));
        setIsProcessing(false);
      }
    }
  };

  // No loading state needed - show login form immediately
  // The auth check happens in the background and redirects if already logged in

  // COMMENTED OUT: Reviews/testimonials section removed as they were distracting users
  // const currentTestimonial = testimonials && testimonials.length > 0 ? testimonials[currentTestimonialIndex] : null;

  return (
    <div className="min-h-screen flex items-start justify-center bg-background pt-6 lg:pt-24 px-4 lg:px-0">
      <div className="flex flex-col lg:flex-row w-full max-w-6xl items-center justify-center gap-8">
        {/* COMMENTED OUT: Left Side - Image Carousel with Testimonial (moved to bottom on mobile) */}
        {/* <div className="flex flex-col items-center w-full max-w-[30.8rem] order-2 lg:order-1">
          {/* Rotating Image with Overlay Testimonial */}
          {/* <div className="relative w-full h-[25rem] lg:h-[37.3rem]">
            <div className="absolute inset-0 rounded-lg overflow-hidden shadow-2xl">
              {carouselImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={t("login.altText.professionalPhoto", { number: idx + 1 })}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                    idx === currentImageIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>

            {/* Testimonial Card Overlay */}
            {/* {currentTestimonial && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm text-white rounded-xl p-6 shadow-xl">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: currentTestimonial.stars }).map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-sm mb-4 italic text-white">"{currentTestimonial.text}"</p>
                <p className="text-xs font-semibold text-white">- {currentTestimonial.author}</p>
                
                {/* Testimonial Indicators */}
                {/* {testimonials && testimonials.length > 0 && (
                  <div className="flex gap-2 justify-center mt-4">
                    {testimonials.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentTestimonialIndex(idx);
                          setCurrentImageIndex(idx);
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentTestimonialIndex
                            ? "bg-white w-6"
                            : "bg-white/50"
                        }`}
                        aria-label={t("login.ariaLabel.goToTestimonial", { number: idx + 1 })}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div> */}

        {/* COMMENTED OUT: Gap between panels */}
        {/* <div className="hidden lg:block w-8" aria-hidden="true"></div> */}

        {/* Right Side - Login Form (moved to top on mobile) */}
        <div className="flex flex-col items-start w-full max-w-md order-1 lg:order-2">
          {/* Logo */}
          <div className="hidden lg:flex items-center gap-2 mb-8">
            <img src={APP_LOGO} alt={t("login.altText.logo")} className="h-8 w-auto" />
            <span className="text-xl font-bold">{t("login.brandName")}</span>
          </div>

          {/* Stats Banner */}
          <div className="mb-6 text-left">
            <p className="text-sm font-semibold text-primary">{t("login.stats")}</p>
          </div>

          {/* Main Heading */}
          <div className="space-y-4 mb-8 text-left">
            <h1 className="text-4xl lg:text-5xl font-bold">
              {t("login.title")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("login.subtitle")}
            </p>
          </div>

          {/* Auth Options */}
          <div className="space-y-4 mb-8 w-full">
            {/* Always show Google button at the top */}
            <Button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full h-12 text-base font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-glow-light"
              size="lg"
            >
              {isSigningIn ? (
                t("login.redirecting")
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
                  {t("login.signInWithGoogle")}
                </>
              )}
            </Button>
            
            {/* Show divider and email form for variant 2/3 or when email mode is enabled */}
            {(isEmailMode || isVariant2Or3) && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {t("login.or")}
                    </span>
                  </div>
                </div>
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {/* Only show name field for sign up in non-variant 2/3 flows */}
                {isSignUp && !isVariant2Or3 && (
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      {t("login.name")}
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("login.namePlaceholder")}
                      className="h-12 rounded-full"
                      disabled={isProcessing}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    {t("login.email")}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("login.emailPlaceholder")}
                    className="h-12 rounded-full"
                    disabled={isProcessing}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    {t("login.password")}
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("login.passwordPlaceholder")}
                    className="h-12 rounded-full"
                    disabled={isProcessing}
                    required
                  />
                </div>
                {emailError && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                    {emailError}
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-12 text-base font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  size="lg"
                >
                  {isProcessing
                    ? t("login.processing")
                    : isSignUp && !isVariant2Or3
                    ? t("login.signUp")
                    : t("login.signIn")}
                </Button>
                {/* Only show sign up toggle for non-variant 2/3 flows */}
                {!isVariant2Or3 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setEmailError("");
                      }}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {isSignUp ? t("login.alreadyHaveAccount") : t("login.dontHaveAccount")}
                    </button>
                  </div>
                )}
                {/* Only show back button for non-variant 2/3 flows */}
                {!isVariant2Or3 && (
                  <Button
                    type="button"
                    onClick={() => {
                      setIsEmailMode(false);
                      setIsSignUp(true); // Reset to sign up mode when going back
                      setEmailError("");
                      setEmail("");
                      setPassword("");
                      setName("");
                    }}
                    variant="ghost"
                    className="w-full text-sm"
                  >
                    {t("login.backToGoogle")}
                  </Button>
                )}
              </form>
              </>
            )}
            {/* Show "Sign in with Email" button for non-variant 2/3 when not in email mode */}
            {!isEmailMode && !isVariant2Or3 && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {t("login.or")}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setIsEmailMode(true);
                    setIsSignUp(true); // Default to sign up mode
                  }}
                  variant="outline"
                  className="w-full h-12 text-base font-semibold rounded-full"
                  size="lg"
                >
                  {t("login.signInWithEmail")}
                </Button>
              </>
            )}
          </div>

          {/* Features List */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm">{t("login.moneyBackGuarantee")}</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm">{t("login.photosUnder30Minutes")}</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm">{t("login.foundedInEurope")}</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm">{t("login.thousandsHappyCustomers")}</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm">{t("login.bootstrapped")}</span>
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-left text-muted-foreground">
            {t("login.termsAgreement")}{" "}
            <a href="/terms" className="underline hover:text-primary">{t("login.termsOfService")}</a>
            {" "}{t("login.and")}{" "}
            <a href="/privacy" className="underline hover:text-primary">{t("login.privacyPolicy")}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
