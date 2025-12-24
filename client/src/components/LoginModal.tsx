import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { APP_LOGO } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  variant?: "page2" | "page3";
}

export function LoginModal({ open, onOpenChange, onSuccess, variant }: LoginModalProps) {
  const { t } = useTranslation();
  const { user, loading, signIn, signInWithFacebook, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningInWithFacebook, setIsSigningInWithFacebook] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Check for variant in URL if not provided as prop
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const urlVariant = urlParams.get("variant") as "page2" | "page3" | null;
  const effectiveVariant = variant || urlVariant;
  const isVariant2Or3 = effectiveVariant === "page2" || effectiveVariant === "page3";

  // Close modal and call onSuccess when user is authenticated
  useEffect(() => {
    if (!loading && user && open) {
      // Reset form state
      // For variant 2/3, keep email mode enabled, otherwise reset
      setIsEmailMode(isVariant2Or3);
      setIsSignUp(false);
      setEmail("");
      setPassword("");
      setName("");
      setEmailError("");
      setIsProcessing(false);
      setIsSigningIn(false);
      setIsSigningInWithFacebook(false);
      
      // Close modal
      onOpenChange(false);
      
      // Call onSuccess after a small delay to ensure state is updated
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 200);
      }
    }
  }, [user, loading, open, onOpenChange, onSuccess, isVariant2Or3]);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signIn();
    } catch (error) {
      console.error("Sign in error:", error);
      setIsSigningIn(false);
    }
  };

  // COMMENTED OUT: Facebook authentication pending Meta approval
  // const handleSignInWithFacebook = async () => {
  //   try {
  //     setIsSigningInWithFacebook(true);
  //     await signInWithFacebook();
  //   } catch (error) {
  //     console.error("Facebook sign in error:", error);
  //     setIsSigningInWithFacebook(false);
  //   }
  // };

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
    
    // For variants 2 and 3: try sign in first, if fails try sign up (auto-create)
    if (isVariant2Or3) {
      try {
        await signInWithEmail(email, password);
        // Sign in succeeded, onSuccess will be called via useEffect when user is set
        // Don't set isProcessing to false here - let useEffect handle it when user is set
      } catch (signInError: any) {
        // If sign in fails, try to create account (user might not exist)
        console.log("Sign in failed, attempting to create account:", signInError);
        try {
          // Try sign up without name (name will be derived from email)
          await signUpWithEmail(email, password);
          // Sign up succeeded, onSuccess will be called via useEffect when user is set
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
        // onSuccess will be called via useEffect when user is set
      } catch (error: any) {
        console.error("Email auth error:", error);
        setEmailError(error?.message || (isSignUp ? t("login.signUpError") : t("login.signInError")));
        setIsProcessing(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <img src={APP_LOGO} alt={t("login.altText.logo")} className="h-8 w-auto" />
            <DialogTitle className="text-xl font-bold">{t("login.brandName")}</DialogTitle>
          </div>
          <DialogDescription>
            {t("login.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!isEmailMode && !isVariant2Or3 ? (
            <>
              <Button
                onClick={handleSignIn}
                disabled={isSigningIn || isSigningInWithFacebook}
                className="w-full h-12 text-base font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
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
              {/* COMMENTED OUT: Facebook button - pending Meta approval for 2FA */}
              {/* <Button
                onClick={handleSignInWithFacebook}
                disabled={isSigningIn || isSigningInWithFacebook}
                className="w-full h-12 text-base font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-[#1877F2] hover:bg-[#166FE5] text-white"
                size="lg"
              >
                {isSigningInWithFacebook ? (
                  t("login.redirecting")
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    {t("login.signInWithFacebook")}
                  </>
                )}
              </Button> */}
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
                onClick={() => setIsEmailMode(true)}
                variant="outline"
                className="w-full h-12 text-base font-semibold rounded-full"
                size="lg"
              >
                {t("login.signInWithEmail")}
              </Button>
            </>
          ) : (
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
                className="w-full h-12 text-base font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
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
                    setEmailError("");
                    setEmail("");
                    setPassword("");
                    setName("");
                  }}
                  variant="ghost"
                  className="w-full text-sm"
                >
                  {t("login.backToGoogle") || "Back to sign in options"}
                </Button>
              )}
            </form>
          )}
        </div>

        {/* Features List */}
        <div className="space-y-2 mt-6 pt-6 border-t">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-xs">{t("login.moneyBackGuarantee")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-xs">{t("login.photosUnder30Minutes")}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

