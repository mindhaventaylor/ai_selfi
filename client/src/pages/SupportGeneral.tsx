import { useTranslation } from "@/hooks/useTranslation";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, HelpCircle, BookOpen, ArrowRight } from "lucide-react";

export default function SupportGeneral() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">{t("supportGeneral.title")}</h1>
        </div>

        {/* Support Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contact Us Card */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-blue-400" />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-center">{t("supportGeneral.contactUs")}</h2>

                {/* Description */}
                <p className="text-sm text-muted-foreground text-center">
                  {t("supportGeneral.contactUsDesc")}
                </p>

                {/* Email Button */}
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                  onClick={() => (window.location.href = "mailto:hola@aiselfi.es")}
                >
                  {t("supportGeneral.email")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Card */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <HelpCircle className="w-8 h-8 text-orange-400" />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-center">
                  {t("supportGeneral.faq")}
                </h2>

                {/* FAQ Items */}
                <div className="space-y-4 mt-6">
                  <div>
                    <h3 className="font-semibold text-sm mb-2">
                      {t("supportGeneral.howDoIStart")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t("supportGeneral.howDoIStartAnswer")}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-2">
                      {t("supportGeneral.whatPaymentMethods")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t("supportGeneral.whatPaymentMethodsAnswer")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentation Card */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-purple-400" />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-center">
                  {t("supportGeneral.documentation")}
                </h2>

                {/* Description */}
                <p className="text-sm text-muted-foreground text-center">
                  {t("supportGeneral.documentationDesc")}
                </p>

                {/* Tutorial Button */}
                <Button
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-full"
                  onClick={() => setLocation("/dashboard/start")}
                >
                  {t("supportGeneral.viewTutorial")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

