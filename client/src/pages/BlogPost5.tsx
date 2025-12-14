import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function BlogPost5() {
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
            {t("blogPost5.title")}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {t("blogPost5.publishedOn")}
          </p>

          <div className="mb-8">
            <img
              src="/image_101.webp"
              alt={t("blogPost5.altText")}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          <p className="text-lg mb-4">
            {t("blogPost5.intro")}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost5.costComparison")}
          </h2>

          <p className="mb-4">
            {t("blogPost5.costComparisonDesc")}
          </p>

          <div className="mb-6 p-6 bg-muted rounded-lg">
            <h3 className="text-xl font-bold mb-4">{t("blogPost5.traditionalPhotography")}</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("blogPost5.traditional1")}</li>
              <li>{t("blogPost5.traditional2")}</li>
              <li>{t("blogPost5.traditional3")}</li>
              <li>{t("blogPost5.traditional4")}</li>
            </ul>
            <p className="mt-4 font-bold text-lg">{t("blogPost5.traditionalTotal")}</p>
          </div>

          <div className="mb-6 p-6 bg-primary/10 rounded-lg border border-primary/20">
            <h3 className="text-xl font-bold mb-4">{t("blogPost5.aiPhotography")}</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("blogPost5.ai1")}</li>
              <li>{t("blogPost5.ai2")}</li>
              <li>{t("blogPost5.ai3")}</li>
              <li>{t("blogPost5.ai4")}</li>
            </ul>
            <p className="mt-4 font-bold text-lg">{t("blogPost5.aiTotal")}</p>
          </div>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost5.timeComparison")}
          </h2>

          <p className="mb-4">
            {t("blogPost5.timeComparisonDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost5.time1")}</strong></li>
            <li><strong>{t("blogPost5.time2")}</strong></li>
            <li><strong>{t("blogPost5.time3")}</strong></li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost5.qualityComparison")}
          </h2>

          <p className="mb-4">
            {t("blogPost5.qualityComparisonDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost5.quality1")}</li>
            <li>{t("blogPost5.quality2")}</li>
            <li>{t("blogPost5.quality3")}</li>
            <li>{t("blogPost5.quality4")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost5.whenToChoose")}
          </h2>

          <p className="mb-4">
            {t("blogPost5.whenToChooseDesc")}
          </p>

          <div className="mb-6 p-6 bg-muted rounded-lg">
            <h3 className="text-xl font-bold mb-4">{t("blogPost5.chooseTraditional")}</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("blogPost5.traditionalWhen1")}</li>
              <li>{t("blogPost5.traditionalWhen2")}</li>
              <li>{t("blogPost5.traditionalWhen3")}</li>
            </ul>
          </div>

          <div className="mb-6 p-6 bg-primary/10 rounded-lg border border-primary/20">
            <h3 className="text-xl font-bold mb-4">{t("blogPost5.chooseAI")}</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("blogPost5.aiWhen1")}</li>
              <li>{t("blogPost5.aiWhen2")}</li>
              <li>{t("blogPost5.aiWhen3")}</li>
              <li>{t("blogPost5.aiWhen4")}</li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost5.conclusion")}
          </h2>

          <p className="mb-8">
            {t("blogPost5.conclusionDesc")}
          </p>

          <div className="mt-12 p-6 bg-primary/10 rounded-lg border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">{t("blogPost5.ctaTitle")}</h3>
            <p className="mb-4">
              {t("blogPost5.ctaDesc")}
            </p>
            <Button asChild size="lg" className="rounded-full">
              <a href="/login">{t("blogPost5.ctaButton")}</a>
            </Button>
          </div>
        </article>
      </main>
    </div>
  );
}

