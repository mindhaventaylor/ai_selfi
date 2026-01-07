import { useTranslation } from "@/hooks/useTranslation";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { useEffect } from "react";

export default function PaymentCancel() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const variant = urlParams.get("variant");
    // All variants (page2, page3, page4, page5) use DashboardV2 design and flow
    const isPage2 = variant === "page2" || variant === "page3" || variant === "page4" || variant === "page5";
    const isPage3 = variant === "page3";

    // Check localStorage for page2 form data
    const savedData = localStorage.getItem("dashboardV2_formData");
    const isFromPage2 = isPage2 || !!savedData;

    // Check localStorage for page3 form data
    const savedDataV3 = localStorage.getItem("dashboardV3_formData");
    const isFromPage3 = isPage3 || !!savedDataV3;

    if (isFromPage3) {
      // For page3, redirect back to dashboard and let DashboardV3 show the toast
      setLocation(`/dashboard?variant=${variant || "page3"}&payment=cancelled`);
      return;
    }

    if (isFromPage2) {
      // For page2, page3, page4, page5 - never show this page—redirect back to plans and let DashboardV2 show the toast.
      setLocation(`/dashboard?variant=${variant || "page2"}&step=pricing&payment=cancelled`);
    }
  }, [setLocation, t]);

  // For non-page2 users, show the original popup
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <Card className="max-w-md w-full overflow-hidden">
        <CardContent className="p-6 md:p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">
              {t("payment.cancel.title")}
            </h1>
            <p className="text-muted-foreground break-words">
              {t("payment.cancel.message")}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={() => setLocation("/dashboard/credits/buy")}
              className="w-full"
            >
              {t("payment.cancel.tryAgain")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/dashboard")}
              className="w-full"
            >
              {t("payment.cancel.goToDashboard")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

