import { useTranslation } from "@/hooks/useTranslation";
import { APP_LOGO } from "@/const";
import { usePostHogVariant } from "@/hooks/usePostHogVariant";
import { useAuth } from "@/_core/hooks/useAuth";
import { safeLocalStorage } from "@/utils/localStorage";

export function Footer() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { variant: posthogVariant } = usePostHogVariant(user?.id);

  // Detect variant 3
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const urlVariant = urlParams.get("variant") as "page1" | "page2" | "page3" | null;
  const cachedVariant = safeLocalStorage.getItem("aiselfi_dashboard_variant") as "page1" | "page2" | "page3" | null;
  const firstVariant = safeLocalStorage.getItem("aiselfi_first_dashboard_variant") as "page1" | "page2" | "page3" | null;
  const isPage3Variant = posthogVariant === "page3" || urlVariant === "page3" || cachedVariant === "page3" || firstVariant === "page3";

  const bgClass = isPage3Variant ? "bg-gray-900" : "bg-card";
  const borderClass = isPage3Variant ? "border-gray-700" : "border-border";
  const textClass = isPage3Variant ? "text-white" : "";
  const textMutedClass = isPage3Variant ? "text-gray-300" : "text-muted-foreground";

  return (
    <footer className={`${bgClass} border-t ${borderClass}`}>
      {/* Links Section */}
      <div className={`container py-12 border-t ${borderClass}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {/* Product */}
          <div>
            <h3 className={`font-bold mb-4 ${textClass}`}>{t("footer.product.title")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/login" className={`${textMutedClass} hover:text-primary transition-colors`}>
                  {t("footer.product.login")}
                </a>
              </li>
              <li>
                <a href="#examples" className={`${textMutedClass} hover:text-primary transition-colors`}>
                  {t("footer.product.examples")}
                </a>
              </li>
              <li>
                <a href="/blog" className={`${textMutedClass} hover:text-primary transition-colors`}>
                  {t("footer.product.blog")}
                </a>
              </li>
              <li>
                <a href="#pricing" className={`${textMutedClass} hover:text-primary transition-colors`}>
                  {t("footer.product.pricing")}
                </a>
              </li>
              <li>
                <a href="#faq" className={`${textMutedClass} hover:text-primary transition-colors`}>
                  {t("footer.product.faq")}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className={`font-bold mb-4 ${textClass}`}>{t("footer.legal.title")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/terms" className={`${textMutedClass} hover:text-primary transition-colors`}>
                  {t("footer.legal.terms")}
                </a>
              </li>
              <li>
                <a href="/privacy" className={`${textMutedClass} hover:text-primary transition-colors`}>
                  {t("footer.legal.privacy")}
                </a>
              </li>
              <li>
                <a href="/refund" className={`${textMutedClass} hover:text-primary transition-colors`}>
                  {t("footer.legal.refund")}
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className={`container py-6 border-t ${borderClass}`}>
        <div className={`flex flex-col md:flex-row justify-between items-center gap-4 text-sm ${textMutedClass}`}>
          <div className="flex items-center gap-2">
            <img src={APP_LOGO} alt="AISelfie" className="h-6 w-auto" />
            <span>{t("footer.copyright")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
