import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function BlogPost8() {
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
            {t("blogPost8.title")}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {t("blogPost8.publishedOn")}
          </p>

          <div className="mb-8">
            <img
              src="/over100_3.webp"
              alt={t("blogPost8.altText")}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          <p className="text-lg mb-4">
            {t("blogPost8.intro")}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost8.understandingStyles")}
          </h2>

          <p className="mb-4">
            {t("blogPost8.understandingStylesDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost8.styles1")}</li>
            <li>{t("blogPost8.styles2")}</li>
            <li>{t("blogPost8.styles3")}</li>
            <li>{t("blogPost8.styles4")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost8.popularStyles")}
          </h2>

          <p className="mb-4">
            {t("blogPost8.popularStylesDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost8.popular1")}</strong></li>
            <li><strong>{t("blogPost8.popular2")}</strong></li>
            <li><strong>{t("blogPost8.popular3")}</strong></li>
            <li><strong>{t("blogPost8.popular4")}</strong></li>
            <li><strong>{t("blogPost8.popular5")}</strong></li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost8.creatingMultipleStyles")}
          </h2>

          <p className="mb-4">
            {t("blogPost8.creatingMultipleStylesDesc")}
          </p>

          <ol className="list-decimal pl-6 mb-4 space-y-2">
            <li>{t("blogPost8.creating1")}</li>
            <li>{t("blogPost8.creating2")}</li>
            <li>{t("blogPost8.creating3")}</li>
            <li>{t("blogPost8.creating4")}</li>
            <li>{t("blogPost8.creating5")}</li>
          </ol>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost8.customizingParameters")}
          </h2>

          <p className="mb-4">
            {t("blogPost8.customizingParametersDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost8.parameters1")}</strong></li>
            <li><strong>{t("blogPost8.parameters2")}</strong></li>
            <li><strong>{t("blogPost8.parameters3")}</strong></li>
            <li><strong>{t("blogPost8.parameters4")}</strong></li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost8.organizingPhotos")}
          </h2>

          <p className="mb-4">
            {t("blogPost8.organizingPhotosDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost8.organizing1")}</li>
            <li>{t("blogPost8.organizing2")}</li>
            <li>{t("blogPost8.organizing3")}</li>
            <li>{t("blogPost8.organizing4")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost8.tipsForSuccess")}
          </h2>

          <p className="mb-4">
            {t("blogPost8.tipsForSuccessDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost8.tip1")}</li>
            <li>{t("blogPost8.tip2")}</li>
            <li>{t("blogPost8.tip3")}</li>
            <li>{t("blogPost8.tip4")}</li>
            <li>{t("blogPost8.tip5")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost8.conclusion")}
          </h2>

          <p className="mb-8">
            {t("blogPost8.conclusionDesc")}
          </p>

          <div className="mt-12 p-6 bg-primary/10 rounded-lg border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">{t("blogPost8.ctaTitle")}</h3>
            <p className="mb-4">
              {t("blogPost8.ctaDesc")}
            </p>
            <Button asChild size="lg" className="rounded-full">
              <a href="/login">{t("blogPost8.ctaButton")}</a>
            </Button>
          </div>
        </article>
      </main>
    </div>
  );
}

