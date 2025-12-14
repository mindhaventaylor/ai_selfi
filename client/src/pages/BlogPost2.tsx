import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function BlogPost2() {
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
            {t("blogPost2.title")}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {t("blogPost2.publishedOn")}
          </p>

          <div className="mb-8">
            <img
              src="/image_1.webp"
              alt={t("blogPost2.altText")}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          <p className="text-lg mb-4">
            {t("blogPost2.intro")}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost2.reason1")}
          </h2>

          <p className="mb-4">
            {t("blogPost2.reason1Desc")}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost2.reason2")}
          </h2>

          <p className="mb-4">
            {t("blogPost2.reason2Desc")}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost2.reason3")}
          </h2>

          <p className="mb-4">
            {t("blogPost2.reason3Desc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost2.variety1")}</li>
            <li>{t("blogPost2.variety2")}</li>
            <li>{t("blogPost2.variety3")}</li>
            <li>{t("blogPost2.variety4")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost2.reason4")}
          </h2>

          <p className="mb-4">
            {t("blogPost2.reason4Desc")}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost2.reason5")}
          </h2>

          <p className="mb-4">
            {t("blogPost2.reason5Desc")}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost2.future")}
          </h2>

          <p className="mb-8">
            {t("blogPost2.futureDesc")}
          </p>

          <div className="mt-12 p-6 bg-primary/10 rounded-lg border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">{t("blogPost2.ctaTitle")}</h3>
            <p className="mb-4">
              {t("blogPost2.ctaDesc")}
            </p>
            <Button asChild size="lg" className="rounded-full">
              <a href="/login">{t("blogPost2.ctaButton")}</a>
            </Button>
          </div>
        </article>
      </main>
    </div>
  );
}

