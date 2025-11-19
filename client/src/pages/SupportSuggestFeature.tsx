import { useTranslation } from "@/hooks/useTranslation";

export default function SupportSuggestFeature() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">{t("supportSuggestFeature.title")}</h1>
        <p className="text-muted-foreground">{t("supportSuggestFeature.comingSoon")}</p>
      </div>
    </div>
  );
}

