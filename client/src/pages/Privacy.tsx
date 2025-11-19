import { useTranslation } from "@/hooks/useTranslation";

export default function Privacy() {
  const { t } = useTranslation();
  const section1Items = t("privacy.section1.items", { returnObjects: true }) as string[];
  const section2Items = t("privacy.section2.items", { returnObjects: true }) as string[];
  const section4Items = t("privacy.section4.items", { returnObjects: true }) as string[];
  const section5Items = t("privacy.section5.items", { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">{t("privacy.title")}</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-bold mb-4">{t("privacy.section1.title")}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t("privacy.section1.description")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              {section1Items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">{t("privacy.section2.title")}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t("privacy.section2.description")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              {section2Items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">{t("privacy.section3.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacy.section3.description")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">{t("privacy.section4.title")}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t("privacy.section4.description")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              {section4Items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">{t("privacy.section5.title")}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t("privacy.section5.description")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              {section5Items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">{t("privacy.section6.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacy.section6.description")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">{t("privacy.section7.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacy.section7.description")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">{t("privacy.section8.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacy.section8.description")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">{t("privacy.section9.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacy.section9.description")}
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-12">
            {t("privacy.lastUpdated")} {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
