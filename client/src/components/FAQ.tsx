import { useTranslation } from "@/hooks/useTranslation";
import { useState } from "react";
import { usePostHogVariant } from "@/hooks/usePostHogVariant";
import { useAuth } from "@/_core/hooks/useAuth";
import { safeLocalStorage } from "@/utils/localStorage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { variant: posthogVariant } = usePostHogVariant(user?.id);
  const questions = t("faq.questions", { returnObjects: true }) as Array<{ q: string; a: string }>;
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Detect variant 3
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const urlVariant = urlParams.get("variant") as "page1" | "page2" | "page3" | null;
  const cachedVariant = safeLocalStorage.getItem("aiselfi_dashboard_variant") as "page1" | "page2" | "page3" | null;
  const firstVariant = safeLocalStorage.getItem("aiselfi_first_dashboard_variant") as "page1" | "page2" | "page3" | null;
  const isPage3Variant = posthogVariant === "page3" || urlVariant === "page3" || cachedVariant === "page3" || firstVariant === "page3";

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

  const bgClass = isPage3Variant ? "bg-gray-900" : "bg-background";
  const textClass = isPage3Variant ? "text-white" : "text-foreground";
  const cardBgClass = isPage3Variant ? "bg-gray-800" : "bg-card";
  const borderClass = isPage3Variant ? "border-gray-700" : "border-border";
  const textMutedClass = isPage3Variant ? "text-gray-300" : "text-muted-foreground";

  return (
    <section id="faq" className={`py-20 ${bgClass}`}>
      <div className="container max-w-7xl mx-auto px-4">
        <h2 className={`text-4xl md:text-5xl font-bold text-left mb-12 ${textClass}`}>{t("faq.title")}</h2>
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Side - Image with Badge */}
          <div className="relative">
            <div className={`relative rounded-2xl overflow-hidden ${cardBgClass} border ${borderClass}`}>
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
                  className={`border ${borderClass} ${cardBgClass} rounded-lg px-6 ${isPage3Variant ? 'data-[state=open]:bg-gray-800' : 'data-[state=open]:bg-card'}`}
                >
                  <AccordionTrigger className={`text-left text-base font-medium hover:no-underline ${textClass}`}>
                {item.q}
              </AccordionTrigger>
                  <AccordionContent className={textMutedClass}>{item.a}</AccordionContent>
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
