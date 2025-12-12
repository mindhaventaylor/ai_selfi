import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function BlogPost9() {
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
            {t("blogPost9.title")}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {t("blogPost9.publishedOn")}
          </p>

          <div className="mb-8">
            <img
              src="/over100_4.webp"
              alt={t("blogPost9.altText")}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          <p className="text-lg mb-4">
            {t("blogPost9.intro")}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost9.whatIsAI")}
          </h2>

          <p className="mb-4">
            {t("blogPost9.whatIsAIDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost9.whatIsAI1")}</li>
            <li>{t("blogPost9.whatIsAI2")}</li>
            <li>{t("blogPost9.whatIsAI3")}</li>
            <li>{t("blogPost9.whatIsAI4")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost9.howItWorks")}
          </h2>

          <p className="mb-4">
            {t("blogPost9.howItWorksDesc")}
          </p>

          <ol className="list-decimal pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost9.works1")}</strong></li>
            <li><strong>{t("blogPost9.works2")}</strong></li>
            <li><strong>{t("blogPost9.works3")}</strong></li>
            <li><strong>{t("blogPost9.works4")}</strong></li>
            <li><strong>{t("blogPost9.works5")}</strong></li>
          </ol>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost9.benefits")}
          </h2>

          <p className="mb-4">
            {t("blogPost9.benefitsDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost9.benefit1")}</strong></li>
            <li><strong>{t("blogPost9.benefit2")}</strong></li>
            <li><strong>{t("blogPost9.benefit3")}</strong></li>
            <li><strong>{t("blogPost9.benefit4")}</strong></li>
            <li><strong>{t("blogPost9.benefit5")}</strong></li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost9.useCases")}
          </h2>

          <p className="mb-4">
            {t("blogPost9.useCasesDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost9.useCase1")}</li>
            <li>{t("blogPost9.useCase2")}</li>
            <li>{t("blogPost9.useCase3")}</li>
            <li>{t("blogPost9.useCase4")}</li>
            <li>{t("blogPost9.useCase5")}</li>
            <li>{t("blogPost9.useCase6")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost9.choosingPlatform")}
          </h2>

          <p className="mb-4">
            {t("blogPost9.choosingPlatformDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost9.choosing1")}</strong></li>
            <li><strong>{t("blogPost9.choosing2")}</strong></li>
            <li><strong>{t("blogPost9.choosing3")}</strong></li>
            <li><strong>{t("blogPost9.choosing4")}</strong></li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost9.futureOfAI")}
          </h2>

          <p className="mb-4">
            {t("blogPost9.futureOfAIDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost9.future1")}</li>
            <li>{t("blogPost9.future2")}</li>
            <li>{t("blogPost9.future3")}</li>
            <li>{t("blogPost9.future4")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost9.conclusion")}
          </h2>

          <p className="mb-8">
            {t("blogPost9.conclusionDesc")}
          </p>

          <div className="mt-12 p-6 bg-primary/10 rounded-lg border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">{t("blogPost9.ctaTitle")}</h3>
            <p className="mb-4">
              {t("blogPost9.ctaDesc")}
            </p>
            <Button asChild size="lg" className="rounded-full">
              <a href="/login">{t("blogPost9.ctaButton")}</a>
            </Button>
          </div>
        </article>
      </main>
    </div>
  );
}

