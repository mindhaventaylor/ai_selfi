import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Star } from "lucide-react";
import { safeLocalStorage } from "@/utils/localStorage";

interface DiscountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiscountModal({ open, onOpenChange }: DiscountModalProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    
    setIsSubmitting(true);
    // TODO: Add API call to submit email for discount
    // For now, just close the modal and save to localStorage
    safeLocalStorage.setItem("discount_email_submitted", email);
    safeLocalStorage.setItem("discount_modal_closed", "true");
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gray-50 border-gray-200 p-0 gap-0" showCloseButton={false}>
        <div className="relative p-6 sm:p-8">
          {/* Close button */}
          <button
            onClick={() => {
              safeLocalStorage.setItem("discount_modal_closed", "true");
              onOpenChange(false);
            }}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl sm:text-4xl font-bold text-left">
              {(() => {
                const text = t("discountModal.title") || "Obtenha 15% de desconto";
                const parts = text.split(/(15%|desconto)/i);
                return (
                  <>
                    {parts.map((part, idx) => {
                      const isHighlighted = /^(15%|desconto)$/i.test(part);
                      return isHighlighted ? (
                        <span key={idx} className="text-primary">{part}</span>
                      ) : (
                        <span key={idx}>{part}</span>
                      );
                    })}
                  </>
                );
              })()}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-700 mt-3 text-left">
              {t("discountModal.description") || "Get your AI generated headshot today. As a New Year's Eve offer, get 15% off on your purchase."}
            </DialogDescription>
          </DialogHeader>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                {t("discountModal.emailLabel") || "Email address"}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t("discountModal.emailPlaceholder") || "Email address"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 text-white font-semibold py-6 text-base rounded-lg shadow-md"
            >
              {t("discountModal.cta") || "Obter desconto"}
            </Button>
          </form>

          {/* Testimonial */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 font-semibold text-sm">DD</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 italic mb-2">
                  {t("discountModal.testimonial") || '"Fantastic technology. Use this application! The result is photos that look just like me. The user interface is very easy to use."'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {t("discountModal.testimonialAuthor") || "Douglass Davidoff"}
                  </span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-green-500 text-green-500" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

