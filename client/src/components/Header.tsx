import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO } from "@/const";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { t, changeLanguage, currentLanguage } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  
  // Se estiver no dashboard, links devem ir para home com âncora
  const isOnDashboard = location === "/dashboard";
  const isOnLoginPage = location === "/login";
  const getNavLink = (anchor: string) => isOnDashboard ? `/${anchor}` : anchor;

  // Check for returnUrl in query params to preserve it in login link
  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const returnUrl = urlParams.get("returnUrl");
  const loginUrl = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/login";

  const languages = [
    { code: "pt-BR", label: "🇧🇷 Português", flag: "🇧🇷" },
    { code: "es", label: "🇪🇸 Español", flag: "🇪🇸" },
    { code: "en", label: "🇬🇧 English", flag: "🇬🇧" },
    { code: "it", label: "🇮🇹 Italiano", flag: "🇮🇹" },
  ];

  // Get current language flag
  const currentLang = languages.find((l) => l.code === currentLanguage);
  const currentFlag = currentLang?.flag || "🌐";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 shadow-sm">
      <div className="container flex h-20 items-center justify-between px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <img src={APP_LOGO} alt="AISelfie" className="h-9 w-auto transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-primary/10 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/80 transition-all duration-300">
            AISelfie
          </span>
        </a>

        {/* Navigation */}
        {!isOnLoginPage && (
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href={getNavLink("#examples")} 
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-all duration-300 relative group py-2"
            >
              {t("nav.examples")}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </a>
            <a 
              href={getNavLink("#how-it-works")} 
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-all duration-300 relative group py-2"
            >
              {t("nav.howItWorks")}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </a>
            <a 
              href={getNavLink("#pricing")} 
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-all duration-300 relative group py-2"
            >
              {t("nav.pricing")}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </a>
            <a 
              href={getNavLink("#testimonials")} 
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-all duration-300 relative group py-2"
            >
              {t("nav.testimonials")}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </a>
          </nav>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Auth Button */}
          {!isOnLoginPage && (
            !isAuthenticated ? (
              <Button 
                asChild 
                variant="default" 
                size="sm" 
                className="rounded-full shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary border-0 px-6 font-semibold"
              >
                <a href={loginUrl}>{t("header.signIn")}</a>
              </Button>
            ) : (
              <Button 
                asChild 
                variant="outline" 
                size="sm"
                className="rounded-full border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 px-6 font-semibold"
              >
                <a href="/dashboard">{t("header.dashboard")}</a>
              </Button>
            )
          )}

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 rounded-full hover:bg-accent/50 transition-all duration-300 px-3 border border-transparent hover:border-border/50"
              >
                <span className="text-xl">{currentFlag}</span>
                <span className="hidden sm:inline text-sm font-medium">
                  {currentLang ? currentLang.label.split(" ")[1] : t("header.language")}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-border/50 shadow-lg backdrop-blur-xl bg-background/95">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`rounded-lg transition-all duration-200 ${
                    currentLanguage === lang.code 
                      ? "bg-primary/10 text-primary font-semibold" 
                      : "hover:bg-accent/50"
                  }`}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
