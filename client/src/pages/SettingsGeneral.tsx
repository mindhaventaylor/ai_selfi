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
import { Globe, LogOut } from "lucide-react";

export default function SettingsGeneral() {
  const { t, changeLanguage, currentLanguage } = useTranslation();
  const { logout } = useAuth();
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
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">{t("settingsGeneral.title")}</h1>
        </div>

        <div className="space-y-6">
          {/* Language Section */}
          <Card className="bg-card/50 border-border">
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
          <Card className="bg-card/50 border-border">
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
    </div>
  );
}

