import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function BlogPost3() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-4xl mx-auto px-4 py-16">
        <Button
          variant="ghost"
          onClick={() => setLocation("/blog")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("blog.backToBlog")}
        </Button>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t("blogPost3.title")}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {t("blogPost3.publishedOn")}
          </p>

          <div className="mb-8">
            <img
              src="/image_10.jpg"
              alt={t("blogPost3.altText")}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          <p className="text-lg mb-4">
            {t("blogPost3.intro")}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost3.understandIndustry")}
          </h2>

          <p className="mb-4">
            {t("blogPost3.understandIndustryDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost3.industry1")}</strong></li>
            <li><strong>{t("blogPost3.industry2")}</strong></li>
            <li><strong>{t("blogPost3.industry3")}</strong></li>
            <li><strong>{t("blogPost3.industry4")}</strong></li>
            <li><strong>{t("blogPost3.industry5")}</strong></li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost3.considerPlatform")}
          </h2>

          <p className="mb-4">
            {t("blogPost3.considerPlatformDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost3.platform1")}</strong></li>
            <li><strong>{t("blogPost3.platform2")}</strong></li>
            <li><strong>{t("blogPost3.platform3")}</strong></li>
            <li><strong>{t("blogPost3.platform4")}</strong></li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost3.matchBrand")}
          </h2>

          <p className="mb-4">
            {t("blogPost3.matchBrandDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost3.brand1")}</strong></li>
            <li><strong>{t("blogPost3.brand2")}</strong></li>
            <li><strong>{t("blogPost3.brand3")}</strong></li>
            <li><strong>{t("blogPost3.brand4")}</strong></li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost3.backgroundSelection")}
          </h2>

          <p className="mb-4">
            {t("blogPost3.backgroundSelectionDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost3.background1")}</strong></li>
            <li><strong>{t("blogPost3.background2")}</strong></li>
            <li><strong>{t("blogPost3.background3")}</strong></li>
            <li><strong>{t("blogPost3.background4")}</strong></li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost3.tipsForSuccess")}
          </h2>

          <p className="mb-4">
            {t("blogPost3.tipsForSuccessDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost3.tip1")}</li>
            <li>{t("blogPost3.tip2")}</li>
            <li>{t("blogPost3.tip3")}</li>
            <li>{t("blogPost3.tip4")}</li>
            <li>{t("blogPost3.tip5")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost3.conclusion")}
          </h2>

          <p className="mb-8">
            {t("blogPost3.conclusionDesc")}
          </p>

          <div className="mt-12 p-6 bg-primary/10 rounded-lg border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">{t("blogPost3.ctaTitle")}</h3>
            <p className="mb-4">
              {t("blogPost3.ctaDesc")}
            </p>
            <Button asChild size="lg" className="rounded-full">
              <a href="/login">{t("blogPost3.ctaButton")}</a>
            </Button>
          </div>
        </article>
      </main>
    </div>
  );
}

