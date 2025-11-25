import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { APP_LOGO } from "@/const";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-card border-t border-border">
      {/* CTA Section */}
      <div className="container py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("footer.cta")}</h2>
        <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-glow-light">
          <a href="/login">{t("hero.cta")} ✨</a>
        </Button>
      </div>

      {/* Links Section */}
      <div className="container py-12 border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {/* Product */}
          <div>
            <h3 className="font-bold mb-4">{t("footer.product.title")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/login" className="text-muted-foreground hover:text-primary transition-colors">
                  {t("footer.product.login")}
                </a>
              </li>
              <li>
                <a href="#examples" className="text-muted-foreground hover:text-primary transition-colors">
                  {t("footer.product.examples")}
                </a>
              </li>
              <li>
                <a href="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  {t("footer.product.blog")}
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">
                  {t("footer.product.pricing")}
                </a>
              </li>
              <li>
                <a href="#faq" className="text-muted-foreground hover:text-primary transition-colors">
                  {t("footer.product.faq")}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold mb-4">{t("footer.legal.title")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  {t("footer.legal.terms")}
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  {t("footer.legal.privacy")}
                </a>
              </li>
              <li>
                <a href="/refund" className="text-muted-foreground hover:text-primary transition-colors">
                  {t("footer.legal.refund")}
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="container py-6 border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={APP_LOGO} alt="AISelfie" className="h-6 w-auto" />
            <span>{t("footer.copyright")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
