import { useTranslation } from "@/hooks/useTranslation";
import { useEffect } from "react";

export default function SupportWhatsApp() {
  const { t } = useTranslation();
  // TODO: Replace with actual WhatsApp number when provided
  const whatsappNumber = "1234567890"; // Placeholder - update this with the actual number
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

