import { useTranslation } from "@/hooks/useTranslation";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useEffect, useMemo } from "react";

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  
  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("session_id");
  }, []);

  useEffect(() => {
    // The webhook should have already processed the payment
    // But we can show a success message
    console.log("Payment successful, session ID:", sessionId);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <Card className="max-w-md w-full overflow-hidden">
        <CardContent className="p-6 md:p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">
              {t("payment.success.title") || "Pagamento Realizado!"}
            </h1>
            <p className="text-muted-foreground break-words">
              {t("payment.success.message") || "Seu pagamento foi processado com sucesso. Os créditos foram adicionados à sua conta."}
            </p>
          </div>

          {sessionId && (
            <div className="text-xs text-muted-foreground break-all bg-muted/50 p-3 rounded-md">
              <p className="font-semibold mb-1">ID da Sessão:</p>
              <p className="font-mono text-[10px] leading-relaxed">{sessionId}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={() => setLocation("/dashboard")}
              className="w-full"
            >
              {t("payment.success.goToDashboard") || "Ir para o Dashboard"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/dashboard/credits/buy")}
              className="w-full"
            >
              {t("payment.success.buyMore") || "Comprar Mais Créditos"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

