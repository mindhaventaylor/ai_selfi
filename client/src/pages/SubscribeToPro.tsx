import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Sparkles, ArrowLeft, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function SubscribeToPro() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [featureName, setFeatureName] = useState<string>("");

  useEffect(() => {
    // Get feature name from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const feature = params.get("feature");
    setFeatureName(feature || t("pro.thisFeature"));
  }, [t]);

  const handleSubscribe = () => {
    // Redirect to under construction page
    setLocation(`/dashboard/pro/under-construction?feature=${encodeURIComponent(featureName || t("pro.thisFeature"))}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-orange-500/20 flex items-center justify-center">
                  <Star className="w-10 h-10 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-orange-500 bg-clip-text text-transparent">
                {t("pro.subscribeToPro")}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t("pro.subscribeToProDesc")}
              </p>
            </div>

            {/* Feature Name */}
            {featureName && (
              <div className="text-center mb-8">
                <div className="inline-block px-6 py-3 rounded-full bg-primary/10 border border-primary/20">
                  <p className="text-lg font-semibold text-primary">
                    {featureName}
                  </p>
                </div>
              </div>
            )}

            {/* Pro Features */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6 text-center">
                {t("pro.proFeaturesTitle")}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {(
                  t("buyCredits.proFeatures", { returnObjects: true }) as string[]
                ).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Credits Features */}
            <div className="mb-8 p-6 bg-primary/5 rounded-lg border border-primary/10">
              <h3 className="text-lg font-semibold mb-4 text-primary">
                {t("buyCredits.proCreditsLabel")}
              </h3>
              <div className="grid md:grid-cols-2 gap-2">
                {(
                  t("buyCredits.proCreditsFeatures", { returnObjects: true }) as string[]
                ).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button
                variant="outline"
                onClick={() => setLocation("/dashboard/pro")}
                className="rounded-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("pro.backToPro")}
              </Button>
              <Button
                onClick={handleSubscribe}
                className="bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <Star className="w-5 h-5 mr-2" />
                {t("pro.subscribeNow")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

