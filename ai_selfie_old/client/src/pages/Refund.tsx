import { useTranslation } from "@/hooks/useTranslation";

export default function Refund() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-4xl mx-auto px-4 py-16">
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t("refund.title")}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {t("refund.lastUpdated")}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("refund.fullRefundGuarantee")}
          </h2>

          <p className="mb-4">
            {t("refund.fullRefundDescription")}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("refund.refundEligibility")}
          </h2>

          <p className="mb-4">
            {t("refund.eligibleIf")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("refund.eligible1")}</li>
            <li>{t("refund.eligible2")}</li>
            <li>{t("refund.eligible3")}</li>
            <li>{t("refund.eligible4")}</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("refund.howToRequest")}
          </h2>

          <p className="mb-4">
            {t("refund.howToRequestDesc")}
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>{t("refund.method1")}</li>
            <li>{t("refund.method2")}</li>
            <li>{t("refund.method3")}</li>
          </ul>

          <p className="mb-4">
            {t("refund.requestDetails")}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("refund.refundProcessing")}
          </h2>

          <p className="mb-4">
            {t("refund.refundProcessingDesc")}
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            {t("refund.questions")}
          </h2>

          <p className="mb-8">
            {t("refund.questionsDesc")}
          </p>
        </article>
      </main>
    </div>
  );
}

