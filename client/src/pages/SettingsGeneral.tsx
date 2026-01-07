import { useTranslation } from "@/hooks/useTranslation";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, LogOut, Plus, CreditCard, Settings, HelpCircle, Image as ImageIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";
import { useLocation } from "wouter";
import { usePostHogVariant } from "@/hooks/usePostHogVariant";
import { safeLocalStorage } from "@/utils/localStorage";

export default function SettingsGeneral() {
  const { t, changeLanguage, currentLanguage } = useTranslation();
  const { logout, user } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const { variant: posthogVariant } = usePostHogVariant(user?.id);
  
  // Check for page2/page3 variant
  const urlParams = new URLSearchParams(window.location.search);
  const urlVariant = urlParams.get("variant") as "page1" | "page2" | "page3" | "page4" | "page5" | null;
  const cachedVariant = safeLocalStorage.getItem("aiselfi_dashboard_variant") as "page1" | "page2" | "page3" | "page4" | "page5" | null;
  const firstVariant = safeLocalStorage.getItem("aiselfi_first_dashboard_variant") as "page1" | "page2" | "page3" | "page4" | "page5" | null;
  // All variants (page2, page3, page4, page5) use the same design and flow as page2
  const isPage2Variant = posthogVariant === "page2" || posthogVariant === "page3" || posthogVariant === "page4" || posthogVariant === "page5"
    || urlVariant === "page2" || urlVariant === "page3" || urlVariant === "page4" || urlVariant === "page5"
    || cachedVariant === "page2" || cachedVariant === "page3" || cachedVariant === "page4" || cachedVariant === "page5"
    || firstVariant === "page2" || firstVariant === "page3" || firstVariant === "page4" || firstVariant === "page5";
  const isPage3Variant = posthogVariant === "page3" || urlVariant === "page3" || cachedVariant === "page3" || firstVariant === "page3";
  const [language, setLanguage] = useState(currentLanguage || "it");
  
  // Sync language state with currentLanguage
  useEffect(() => {
    if (currentLanguage) {
      setLanguage(currentLanguage);
    }
  }, [currentLanguage]);
  
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    changeLanguage(newLang);
  };
  
  const getLanguageLabel = (code: string) => {
    const labels: Record<string, string> = {
      "es": t("settingsGeneral.spanish"),
      "pt-BR": t("settingsGeneral.portuguese"),
      "en": t("settingsGeneral.english"),
      "it": t("settingsGeneral.italian"),
    };
    return labels[code] || code;
  };
  
  const getLanguageFlag = (code: string) => {
    const flags: Record<string, string> = {
      "es": "🇪🇸",
      "pt-BR": "🇧🇷",
      "en": "🇬🇧",
      "it": "🇮🇹",
    };
    return flags[code] || "🌐";
  };

  const bgClass = isPage3Variant ? "bg-gray-900" : "bg-background";
  const textClass = isPage3Variant ? "text-white" : "";
  const textMutedClass = isPage3Variant ? "text-gray-300" : "text-muted-foreground";
  const cardBgClass = isPage3Variant ? "bg-gray-800" : "bg-card";
  const cardBorderClass = isPage3Variant ? "border-gray-700" : "border-border";

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <div className={`max-w-4xl mx-auto px-6 py-8 ${isMobile ? "pb-20" : ""}`}>
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl md:text-4xl font-bold ${textClass}`}>{t("settingsGeneral.title")}</h1>
        </div>

        <div className="space-y-6">
          {/* Language Section */}
          <Card className={`${isPage3Variant ? 'bg-gray-800 border-gray-700' : 'bg-purple-500/10 border-purple-500/20'}`}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${isPage3Variant ? 'bg-primary/20' : 'bg-primary/20'} flex items-center justify-center`}>
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-semibold ${textClass}`}>{t("settingsGeneral.language")}</h2>
                    <p className={`text-sm ${textMutedClass}`}>
                      {t("settingsGeneral.languageDesc")}
                    </p>
                  </div>
                </div>

                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className={`w-full max-w-xs ${isPage3Variant ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <span>{getLanguageFlag(language)}</span>
                        <span>{getLanguageLabel(language)}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className={isPage3Variant ? 'bg-gray-800 border-gray-700' : ''}>
                    <SelectItem value="es" className={isPage3Variant ? 'text-white hover:bg-gray-700' : ''}>
                      <div className="flex items-center gap-2">
                        <span>🇪🇸</span>
                        <span>{t("settingsGeneral.spanish")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pt-BR" className={isPage3Variant ? 'text-white hover:bg-gray-700' : ''}>
                      <div className="flex items-center gap-2">
                        <span>🇧🇷</span>
                        <span>{t("settingsGeneral.portuguese")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="en" className={isPage3Variant ? 'text-white hover:bg-gray-700' : ''}>
                      <div className="flex items-center gap-2">
                        <span>🇬🇧</span>
                        <span>{t("settingsGeneral.english")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="it" className={isPage3Variant ? 'text-white hover:bg-gray-700' : ''}>
                      <div className="flex items-center gap-2">
                        <span>🇮🇹</span>
                        <span>{t("settingsGeneral.italian")}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Account Section */}
          <Card className={`${isPage3Variant ? 'bg-gray-800 border-gray-700' : 'bg-red-500/10 border-red-500/20'}`}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${isPage3Variant ? 'bg-red-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                    <LogOut className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-semibold ${textClass}`}>{t("settingsGeneral.account")}</h2>
                    <p className={`text-sm ${textMutedClass}`}>
                      {t("settingsGeneral.accountDesc")}
                    </p>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  className="rounded-full"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("settingsGeneral.signOut")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Navigation Bar - Mobile Only (Hidden for page1 variant) */}
      {isMobile && (isPage2Variant || isPage3Variant) && (() => {
        // Get variant from URL or localStorage, default to page2
        const urlParams = new URLSearchParams(window.location.search);
        const urlVariant = urlParams.get("variant");
        const cachedVariant = safeLocalStorage.getItem("aiselfi_dashboard_variant");
        const variantParam = urlVariant || cachedVariant ? `?variant=${urlVariant || cachedVariant || "page2"}` : "?variant=page2";
        const navBgClass = isPage3Variant ? "bg-gray-900" : "bg-background";
        const navBorderClass = isPage3Variant ? "border-gray-700" : "border-border";
        const navHoverClass = isPage3Variant ? "hover:bg-gray-800" : "hover:bg-accent";
        const navTextClass = isPage3Variant ? "text-gray-300" : "text-muted-foreground";
        return (
        <div className={`fixed bottom-0 left-0 right-0 ${navBgClass} border-t ${navBorderClass} z-50 shadow-lg`}>
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-end justify-around relative">
              {/* Start Here */}
              <button
                onClick={() => setLocation(`/dashboard/start${variantParam}`)}
                className={`flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg ${navHoverClass} transition-colors min-w-[50px]`}
                aria-label="Start Here"
              >
                <HelpCircle className={`h-6 w-6 ${navTextClass}`} />
                <span className={`text-xs ${navTextClass}`}>Start</span>
              </button>

              {/* Gallery */}
              <button
                onClick={() => setLocation(`/dashboard/gallery${variantParam}`)}
                className={`flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg ${navHoverClass} transition-colors min-w-[50px]`}
                aria-label="Gallery"
              >
                <ImageIcon className={`h-6 w-6 ${navTextClass}`} />
                <span className={`text-xs ${navTextClass}`}>Gallery</span>
              </button>

              {/* Create - Centered, Prominent Button */}
              <button
                onClick={() => setLocation(`/dashboard/generate${variantParam}`)}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 -mt-2 z-10"
                aria-label="Create"
              >
                <Plus className="h-7 w-7" />
              </button>

              {/* Buy Credits */}
              <button
                onClick={() => setLocation(`/dashboard/credits/buy${variantParam}`)}
                className={`flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg ${navHoverClass} transition-colors min-w-[50px]`}
                aria-label="Buy Credits"
              >
                <CreditCard className={`h-6 w-6 ${navTextClass}`} />
                <span className={`text-xs ${navTextClass}`}>Credits</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => setLocation(`/dashboard/settings/general${variantParam}`)}
                className={`flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg ${navHoverClass} transition-colors min-w-[50px]`}
                aria-label="Settings"
              >
                <Settings className="h-6 w-6 text-primary" />
                <span className="text-xs text-primary">Settings</span>
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}

