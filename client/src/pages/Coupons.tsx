import { useTranslation } from "@/hooks/useTranslation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Coupons() {
  const { t } = useTranslation();
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeem = async () => {
    if (!couponCode.trim()) {
      setError(t("coupons.pleaseEnterCode"));
      return;
    }

    setIsRedeeming(true);
    setError(null);

    // Simulate API call
    setTimeout(() => {
      // For demo purposes, show error for any code
      setError(t("coupons.invalidCode"));
      setIsRedeeming(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-card border-border">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <h1 className="text-2xl font-bold">{t("coupons.title")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("coupons.subtitle")}
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-code">{t("coupons.couponCode")}</Label>
                <Input
                  id="coupon-code"
                  placeholder={t("coupons.enterCode")}
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRedeem();
                    }
                  }}
                  className="h-12 text-base"
                />
              </div>

              <Button
                onClick={handleRedeem}
                disabled={isRedeeming}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12 text-base font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {isRedeeming ? t("coupons.redeeming") : t("coupons.redeemCoupon")}
              </Button>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

