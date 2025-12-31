import { useTranslation } from "@/hooks/useTranslation";
import { useEffect } from "react";

export default function SupportWhatsApp() {
  const { t } = useTranslation();
  // WhatsApp number: +1 (813) 729-1689
  const whatsappNumber = "18137291689";
  const whatsappMessage = encodeURIComponent(t("supportWhatsApp.message"));
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  useEffect(() => {
    // Redirect to WhatsApp immediately
    window.location.href = whatsappUrl;
  }, [whatsappUrl]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">{t("supportWhatsApp.redirecting")}</p>
        <p className="text-sm text-muted-foreground">
          {t("supportWhatsApp.notRedirected")}{" "}
          <a
            href={whatsappUrl}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("supportWhatsApp.clickHere")}
          </a>
        </p>
      </div>
    </div>
  );
}

