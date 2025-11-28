import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function BlogPost7() {
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
            {t("blogPost7.title")}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {t("blogPost7.publishedOn")}
          </p>

          <div className="mb-8">
            <img
              src="/over100_2.jpg"
              alt={t("blogPost7.altText")}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          <p className="text-lg mb-4">
            {t("blogPost7.intro")}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost7.evolutionOfBranding")}
          </h2>

          <p className="mb-4">
            {t("blogPost7.evolutionOfBrandingDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost7.evolution1")}</li>
            <li>{t("blogPost7.evolution2")}</li>
            <li>{t("blogPost7.evolution3")}</li>
            <li>{t("blogPost7.evolution4")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost7.whyAI")}
          </h2>

          <p className="mb-4">
            {t("blogPost7.whyAIDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost7.whyAI1")}</strong></li>
            <li><strong>{t("blogPost7.whyAI2")}</strong></li>
            <li><strong>{t("blogPost7.whyAI3")}</strong></li>
            <li><strong>{t("blogPost7.whyAI4")}</strong></li>
            <li><strong>{t("blogPost7.whyAI5")}</strong></li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost7.impactOnPersonalBrand")}
          </h2>

          <p className="mb-4">
            {t("blogPost7.impactOnPersonalBrandDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost7.impact1")}</li>
            <li>{t("blogPost7.impact2")}</li>
            <li>{t("blogPost7.impact3")}</li>
            <li>{t("blogPost7.impact4")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost7.industryAdoption")}
          </h2>

          <p className="mb-4">
            {t("blogPost7.industryAdoptionDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost7.industry1")}</li>
            <li>{t("blogPost7.industry2")}</li>
            <li>{t("blogPost7.industry3")}</li>
            <li>{t("blogPost7.industry4")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost7.futureTrends")}
          </h2>

          <p className="mb-4">
            {t("blogPost7.futureTrendsDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost7.trend1")}</li>
            <li>{t("blogPost7.trend2")}</li>
            <li>{t("blogPost7.trend3")}</li>
            <li>{t("blogPost7.trend4")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost7.gettingStarted")}
          </h2>

          <p className="mb-4">
            {t("blogPost7.gettingStartedDesc")}
          </p>

          <ol className="list-decimal pl-6 mb-4 space-y-2">
            <li>{t("blogPost7.started1")}</li>
            <li>{t("blogPost7.started2")}</li>
            <li>{t("blogPost7.started3")}</li>
            <li>{t("blogPost7.started4")}</li>
          </ol>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost7.conclusion")}
          </h2>

          <p className="mb-8">
            {t("blogPost7.conclusionDesc")}
          </p>

          <div className="mt-12 p-6 bg-primary/10 rounded-lg border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">{t("blogPost7.ctaTitle")}</h3>
            <p className="mb-4">
              {t("blogPost7.ctaDesc")}
            </p>
            <Button asChild size="lg" className="rounded-full">
              <a href="/login">{t("blogPost7.ctaButton")}</a>
            </Button>
          </div>
        </article>
      </main>
    </div>
  );
}

