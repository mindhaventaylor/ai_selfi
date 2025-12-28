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
    <section id="faq" className="py-20 bg-background">
      <div className="container max-w-7xl mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-left mb-12 text-foreground">{t("faq.title")}</h2>
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Side - Image with Badge */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden bg-card border border-border">
              <img
                src="/new_girl_generato_conAI.jpeg"
                alt="AI Generated Professional Photo"
                className="w-full h-full object-cover aspect-[3/4]"
              />
              {/* Badge */}
              <div className="absolute top-4 right-4">
                <div className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
                  {t("faq.badge")}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - FAQ List */}
          <div className="flex flex-col">
        <Accordion 
          type="multiple" 
          value={expandedItems}
          onValueChange={setExpandedItems}
              className="w-full space-y-3"
        >
          {questions.map((item, idx) => (
                <AccordionItem 
                  key={idx} 
                  value={`item-${idx}`} 
                  className="border border-border bg-card rounded-lg px-6 data-[state=open]:bg-card"
                >
                  <AccordionTrigger className="text-left text-base font-medium hover:no-underline text-foreground">
                {item.q}
              </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
            <div className="mt-8">
          <button 
            onClick={handleViewAll}
                className="text-primary hover:text-primary/80 text-lg cursor-pointer flex items-center gap-2 font-medium"
          >
            {expandedItems.length === questions.length ? t("faq.hideAll") : t("faq.viewAll")}
                <span>→</span>
          </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
