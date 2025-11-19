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
import { Globe } from "lucide-react";

export function Header() {
  const { t, changeLanguage, currentLanguage } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  
  // Se estiver no dashboard, links devem ir para home com âncora
  const isOnDashboard = location === "/dashboard";
  const getNavLink = (anchor: string) => isOnDashboard ? `/${anchor}` : anchor;

  const languages = [
    { code: "pt-BR", label: "🇧🇷 Português" },
    { code: "es", label: "🇪🇸 Español" },
    { code: "en", label: "🇬🇧 English" },
    { code: "it", label: "🇮🇹 Italiano" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={APP_LOGO} alt="AISelfi" className="h-8 w-auto" />
          <span className="font-bold text-xl">AIselfi</span>
        </a>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a href={getNavLink("#examples")} className="text-sm font-medium hover:text-primary transition-colors">
            {t("nav.examples")}
          </a>
          <a href={getNavLink("#how-it-works")} className="text-sm font-medium hover:text-primary transition-colors">
            {t("nav.howItWorks")}
          </a>
          <a href={getNavLink("#pricing")} className="text-sm font-medium hover:text-primary transition-colors">
            {t("nav.pricing")}
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Auth Button */}
          {!isAuthenticated ? (
            <Button asChild variant="default" size="sm" className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-glow-light">
              <a href="/login">{t("header.signIn")}</a>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <a href="/dashboard">{t("header.dashboard")}</a>
            </Button>
          )}

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {(() => {
                    const currentLang = languages.find((l) => l.code === currentLanguage);
                    return currentLang ? currentLang.label.split(" ")[1] : t("header.language");
                  })()}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={currentLanguage === lang.code ? "bg-accent" : ""}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Login Button */}
          {!isAuthenticated && (
            <Button asChild variant="outline" size="sm">
              <a href="/login">{t("nav.login")}</a>
          </Button>
          )}
        </div>
      </div>
    </header>
  );
}
