import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Construction, Sparkles, ArrowLeft, Star } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function UnderConstruction() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [featureName, setFeatureName] = useState<string>("");

  useEffect(() => {
    // Get feature name from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const feature = params.get("feature");
    setFeatureName(feature || t("pro.thisFeature"));
  }, [t]);

  const handleAcquireProPlan = () => {
    // Don't process payment, just redirect to buy credits page
    // The user can see the Pro plan there but won't be able to purchase these specific features
    toast.info(t("pro.proPlanRedirect"));
    setLocation("/dashboard/credits/buy");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-12 text-center space-y-8">
            {/* Acquire Pro Plan Button - Shown First */}
            <div className="space-y-4 pb-8 border-b border-border">
              <h2 className="text-2xl md:text-3xl font-bold">
                {t("pro.acquireProPlan")}
              </h2>
              <p className="text-muted-foreground">
                {t("pro.acquireProPlanDesc")}
              </p>
              <Button
                onClick={handleAcquireProPlan}
                className="bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <Star className="w-5 h-5 mr-2" />
                {t("pro.acquireProPlanButton")}
              </Button>
            </div>

            {/* Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-orange-500/20 flex items-center justify-center animate-pulse">
                  <Construction className="w-16 h-16 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-8 h-8 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-orange-500 bg-clip-text text-transparent">
                {t("pro.underConstruction")}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t("pro.underConstructionDesc")}
              </p>
            </div>

            {/* Feature Name */}
            <div className="pt-4">
              <div className="inline-block px-6 py-3 rounded-full bg-primary/10 border border-primary/20">
                <p className="text-lg font-semibold text-primary">
                  {featureName}
                </p>
              </div>
            </div>

            {/* Message */}
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                {t("pro.stayTuned")}
              </p>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

