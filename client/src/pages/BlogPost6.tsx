import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function BlogPost6() {
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
            {t("blogPost6.title")}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {t("blogPost6.publishedOn")}
          </p>

          <div className="mb-8">
            <img
              src="/over100_1.webp"
              alt={t("blogPost6.altText")}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          <p className="text-lg mb-4">
            {t("blogPost6.intro")}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost6.selectingPhotos")}
          </h2>

          <p className="mb-4">
            {t("blogPost6.selectingPhotosDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost6.selecting1")}</strong></li>
            <li><strong>{t("blogPost6.selecting2")}</strong></li>
            <li><strong>{t("blogPost6.selecting3")}</strong></li>
            <li><strong>{t("blogPost6.selecting4")}</strong></li>
            <li><strong>{t("blogPost6.selecting5")}</strong></li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost6.photoQuality")}
          </h2>

          <p className="mb-4">
            {t("blogPost6.photoQualityDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost6.quality1")}</li>
            <li>{t("blogPost6.quality2")}</li>
            <li>{t("blogPost6.quality3")}</li>
            <li>{t("blogPost6.quality4")}</li>
            <li>{t("blogPost6.quality5")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost6.photoVariety")}
          </h2>

          <p className="mb-4">
            {t("blogPost6.photoVarietyDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost6.variety1")}</li>
            <li>{t("blogPost6.variety2")}</li>
            <li>{t("blogPost6.variety3")}</li>
            <li>{t("blogPost6.variety4")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost6.commonMistakes")}
          </h2>

          <p className="mb-4">
            {t("blogPost6.commonMistakesDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost6.mistake1")}</strong></li>
            <li><strong>{t("blogPost6.mistake2")}</strong></li>
            <li><strong>{t("blogPost6.mistake3")}</strong></li>
            <li><strong>{t("blogPost6.mistake4")}</strong></li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost6.trainingProcess")}
          </h2>

          <p className="mb-4">
            {t("blogPost6.trainingProcessDesc")}
          </p>

          <ol className="list-decimal pl-6 mb-4 space-y-2">
            <li>{t("blogPost6.process1")}</li>
            <li>{t("blogPost6.process2")}</li>
            <li>{t("blogPost6.process3")}</li>
            <li>{t("blogPost6.process4")}</li>
            <li>{t("blogPost6.process5")}</li>
          </ol>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost6.optimizingResults")}
          </h2>

          <p className="mb-4">
            {t("blogPost6.optimizingResultsDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost6.optimizing1")}</li>
            <li>{t("blogPost6.optimizing2")}</li>
            <li>{t("blogPost6.optimizing3")}</li>
            <li>{t("blogPost6.optimizing4")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost6.conclusion")}
          </h2>

          <p className="mb-8">
            {t("blogPost6.conclusionDesc")}
          </p>

          <div className="mt-12 p-6 bg-primary/10 rounded-lg border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">{t("blogPost6.ctaTitle")}</h3>
            <p className="mb-4">
              {t("blogPost6.ctaDesc")}
            </p>
            <Button asChild size="lg" className="rounded-full">
              <a href="/login">{t("blogPost6.ctaButton")}</a>
            </Button>
          </div>
        </article>
      </main>
    </div>
  );
}

