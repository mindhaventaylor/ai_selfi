import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function BlogPost4() {
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
            {t("blogPost4.title")}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {t("blogPost4.publishedOn")}
          </p>

          <div className="mb-8">
            <img
              src="/image_100.webp"
              alt={t("blogPost4.altText")}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          <p className="text-lg mb-4">
            {t("blogPost4.intro")}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost4.whyLinkedIn")}
          </h2>

          <p className="mb-4">
            {t("blogPost4.whyLinkedInDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost4.whyLinkedIn1")}</li>
            <li>{t("blogPost4.whyLinkedIn2")}</li>
            <li>{t("blogPost4.whyLinkedIn3")}</li>
            <li>{t("blogPost4.whyLinkedIn4")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost4.choosingRightPhoto")}
          </h2>

          <p className="mb-4">
            {t("blogPost4.choosingRightPhotoDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost4.choosing1")}</strong></li>
            <li><strong>{t("blogPost4.choosing2")}</strong></li>
            <li><strong>{t("blogPost4.choosing3")}</strong></li>
            <li><strong>{t("blogPost4.choosing4")}</strong></li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost4.uploadingToLinkedIn")}
          </h2>

          <p className="mb-4">
            {t("blogPost4.uploadingToLinkedInDesc")}
          </p>

          <ol className="list-decimal pl-6 mb-4 space-y-2">
            <li>{t("blogPost4.uploading1")}</li>
            <li>{t("blogPost4.uploading2")}</li>
            <li>{t("blogPost4.uploading3")}</li>
            <li>{t("blogPost4.uploading4")}</li>
            <li>{t("blogPost4.uploading5")}</li>
          </ol>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost4.optimizingProfile")}
          </h2>

          <p className="mb-4">
            {t("blogPost4.optimizingProfileDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>{t("blogPost4.optimizing1")}</strong></li>
            <li><strong>{t("blogPost4.optimizing2")}</strong></li>
            <li><strong>{t("blogPost4.optimizing3")}</strong></li>
            <li><strong>{t("blogPost4.optimizing4")}</strong></li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost4.bestPractices")}
          </h2>

          <p className="mb-4">
            {t("blogPost4.bestPracticesDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("blogPost4.practice1")}</li>
            <li>{t("blogPost4.practice2")}</li>
            <li>{t("blogPost4.practice3")}</li>
            <li>{t("blogPost4.practice4")}</li>
            <li>{t("blogPost4.practice5")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("blogPost4.conclusion")}
          </h2>

          <p className="mb-8">
            {t("blogPost4.conclusionDesc")}
          </p>

          <div className="mt-12 p-6 bg-primary/10 rounded-lg border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">{t("blogPost4.ctaTitle")}</h3>
            <p className="mb-4">
              {t("blogPost4.ctaDesc")}
            </p>
            <Button asChild size="lg" className="rounded-full">
              <a href="/login">{t("blogPost4.ctaButton")}</a>
            </Button>
          </div>
        </article>
      </main>
    </div>
  );
}

