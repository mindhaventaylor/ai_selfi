import { useTranslation } from "@/hooks/useTranslation";

export default function Terms() {
  const { t } = useTranslation();
  const section3Items = t("terms.section3.items", { returnObjects: true }) as string[];
  const section5Items = t("terms.section5.items", { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">{t("terms.title")}</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-bold mb-4">{t("terms.section1.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("terms.section1.description")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">{t("terms.section2.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("terms.section2.description")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">{t("terms.section3.title")}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t("terms.section3.description")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              {section3Items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">{t("terms.section4.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("terms.section4.description")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">{t("terms.section5.title")}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t("terms.section5.description")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              {section5Items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">{t("terms.section6.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("terms.section6.description")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">{t("terms.section7.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("terms.section7.description")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">{t("terms.section8.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("terms.section8.description")}
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-12">
            {t("terms.lastUpdated")} {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
