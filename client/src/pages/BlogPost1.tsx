import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function BlogPost1() {
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
            {t("blogPost1.title")}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {t("blogPost1.publishedOn")}
          </p>

          <div className="mb-8">
            <img
              src="/image.jpg"
              alt={t("blogPost1.altText")}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          <p className="text-lg mb-4">
            {t("blogPost1.intro")}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost1.powerOfPhotography")}
          </h2>

          <p className="mb-4">
            {t("blogPost1.powerDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost1.power1")}</li>
            <li>{t("blogPost1.power2")}</li>
            <li>{t("blogPost1.power3")}</li>
            <li>{t("blogPost1.power4")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost1.traditionalChallenge")}
          </h2>

          <p className="mb-4">
            {t("blogPost1.traditionalDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost1.traditional1")}</strong></li>
            <li><strong>{t("blogPost1.traditional2")}</strong></li>
            <li><strong>{t("blogPost1.traditional3")}</strong></li>
            <li><strong>{t("blogPost1.traditional4")}</strong></li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost1.aiSolution")}
          </h2>

          <p className="mb-4">
            {t("blogPost1.aiSolutionDesc")}
          </p>

          <ol className="list-decimal pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost1.aiSolution1")}</strong></li>
            <li><strong>{t("blogPost1.aiSolution2")}</strong></li>
            <li><strong>{t("blogPost1.aiSolution3")}</strong></li>
            <li><strong>{t("blogPost1.aiSolution4")}</strong></li>
          </ol>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost1.benefits")}
          </h2>

          <p className="mb-4">
            {t("blogPost1.benefitsDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost1.benefit1")}</strong></li>
            <li><strong>{t("blogPost1.benefit2")}</strong></li>
            <li><strong>{t("blogPost1.benefit3")}</strong></li>
            <li><strong>{t("blogPost1.benefit4")}</strong></li>
            <li><strong>{t("blogPost1.benefit5")}</strong></li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost1.applications")}
          </h2>

          <p className="mb-4">
            {t("blogPost1.applicationsDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost1.application1")}</li>
            <li>{t("blogPost1.application2")}</li>
            <li>{t("blogPost1.application3")}</li>
            <li>{t("blogPost1.application4")}</li>
            <li>{t("blogPost1.application5")}</li>
            <li>{t("blogPost1.application6")}</li>
            <li>{t("blogPost1.application7")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost1.conclusion")}
          </h2>

          <p className="mb-8">
            {t("blogPost1.conclusionDesc")}
          </p>

          <div className="mt-12 p-6 bg-primary/10 rounded-lg border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">{t("blogPost1.ctaTitle")}</h3>
            <p className="mb-4">
              {t("blogPost1.ctaDesc")}
            </p>
            <Button asChild size="lg" className="rounded-full">
              <a href="/login">{t("blogPost1.ctaButton")}</a>
            </Button>
          </div>
        </article>
      </main>
    </div>
  );
}

