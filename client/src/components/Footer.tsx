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
        <Button asChild size="lg" className="text-lg px-8 py-6">
          <a href="/login">{t("hero.cta")} ✨</a>
        </Button>
      </div>

      {/* Links Section */}
      <div className="container py-12 border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
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
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  {t("footer.legal.refund")}
                </a>
              </li>
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="font-bold mb-4">{t("footer.tools.title")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  {t("footer.tools.freeTool")}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  {t("footer.tools.pfpMaker")}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  {t("footer.tools.analyzer")}
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-bold mb-4">{t("footer.social.title")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  {t("footer.social.linkedin")}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Twitter
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
            <img src={APP_LOGO} alt="AISelfi" className="h-6 w-auto" />
            <span>© 2025 AIselfi. All rights reserved.</span>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary transition-colors">
              Featured on Fazier
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
