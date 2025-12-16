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
  const urlVariant = urlParams.get("variant") as "page1" | "page2" | "page3" | null;
  const cachedVariant = safeLocalStorage.getItem("aiselfi_dashboard_variant") as "page1" | "page2" | "page3" | null;
  const firstVariant = safeLocalStorage.getItem("aiselfi_first_dashboard_variant") as "page1" | "page2" | "page3" | null;
  const isPage2Variant = posthogVariant === "page2" || urlVariant === "page2" || cachedVariant === "page2" || firstVariant === "page2";
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

  return (
    <div className="min-h-screen bg-background">
      <div className={`max-w-4xl mx-auto px-6 py-8 ${isMobile ? "pb-20" : ""}`}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">{t("settingsGeneral.title")}</h1>
        </div>

        <div className="space-y-6">
          {/* Language Section */}
          <Card className="bg-purple-500/10 border-purple-500/20">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{t("settingsGeneral.language")}</h2>
                    <p className="text-sm text-muted-foreground">
                      {t("settingsGeneral.languageDesc")}
                    </p>
                  </div>
                </div>

                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <span>{getLanguageFlag(language)}</span>
                        <span>{getLanguageLabel(language)}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">
                      <div className="flex items-center gap-2">
                        <span>🇪🇸</span>
                        <span>{t("settingsGeneral.spanish")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pt-BR">
                      <div className="flex items-center gap-2">
                        <span>🇧🇷</span>
                        <span>{t("settingsGeneral.portuguese")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="en">
                      <div className="flex items-center gap-2">
                        <span>🇬🇧</span>
                        <span>{t("settingsGeneral.english")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="it">
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
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{t("settingsGeneral.account")}</h2>
                    <p className="text-sm text-muted-foreground">
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
      {isMobile && (isPage2Variant || isPage3Variant) && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-end justify-around relative">
              {/* Start Here */}
              <button
                onClick={() => setLocation("/dashboard/start")}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Start Here"
              >
                <HelpCircle className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Start</span>
              </button>

              {/* Gallery */}
              <button
                onClick={() => setLocation("/dashboard/gallery")}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Gallery"
              >
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Gallery</span>
              </button>

              {/* Create - Centered, Prominent Button */}
              <button
                onClick={() => setLocation("/dashboard/generate?variant=page2")}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 -mt-2 z-10"
                aria-label="Create"
              >
                <Plus className="h-7 w-7" />
              </button>

              {/* Buy Credits */}
              <button
                onClick={() => setLocation("/dashboard/credits/buy")}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Buy Credits"
              >
                <CreditCard className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Credits</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => setLocation("/dashboard/settings/general")}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors min-w-[50px]"
                aria-label="Settings"
              >
                <Settings className="h-6 w-6 text-primary" />
                <span className="text-xs text-primary">Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

