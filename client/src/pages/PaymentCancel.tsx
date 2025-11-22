import { useTranslation } from "@/hooks/useTranslation";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default function PaymentCancel() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

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
              {t("payment.cancel.title") || "Pagamento Cancelado"}
            </h1>
            <p className="text-muted-foreground break-words">
              {t("payment.cancel.message") || "Você cancelou o processo de pagamento. Nenhum valor foi cobrado."}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={() => setLocation("/dashboard/credits/buy")}
              className="w-full"
            >
              {t("payment.cancel.tryAgain") || "Tentar Novamente"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/dashboard")}
              className="w-full"
            >
              {t("payment.cancel.goToDashboard") || "Ir para o Dashboard"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

