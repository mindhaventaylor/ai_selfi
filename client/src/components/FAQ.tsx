import { useTranslation } from "@/hooks/useTranslation";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ() {
  const { t } = useTranslation();
  const questions = t("faq.questions", { returnObjects: true }) as Array<{ q: string; a: string }>;
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const handleViewAll = (e: React.MouseEvent) => {
    e.preventDefault();
    if (expandedItems.length === questions.length) {
      // Se todos estão expandidos, colapsar todos
      setExpandedItems([]);
    } else {
      // Expandir todos
      setExpandedItems(questions.map((_, idx) => `item-${idx}`));
    }
  };

  return (
    <section id="faq" className="py-20 bg-card">
      <div className="container max-w-4xl">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">{t("faq.title")}</h2>
        <Accordion 
          type="multiple" 
          value={expandedItems}
          onValueChange={setExpandedItems}
          className="w-full space-y-4"
        >
          {questions.map((item, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-lg px-6">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="text-center mt-8">
          <button 
            onClick={handleViewAll}
            className="text-primary hover:underline text-lg cursor-pointer"
          >
            {expandedItems.length === questions.length ? "Ocultar todas" : t("faq.viewAll")}
          </button>
        </div>
      </div>
    </section>
  );
}
