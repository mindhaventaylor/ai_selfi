import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Send, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function SupportSuggestFeature() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    useCase: "",
  });

  const suggestFeatureMutation = trpc.support.suggestFeature.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error(t("supportSuggestFeature.fillRequired") || "Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await suggestFeatureMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        useCase: formData.useCase || undefined,
      });

      setIsSubmitted(true);
      toast.success(t("supportSuggestFeature.success") || "Feature suggestion submitted successfully!");
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        useCase: "",
      });
    } catch (error: any) {
      console.error("Error submitting feature suggestion:", error);
      toast.error(error?.message || t("supportSuggestFeature.error") || "Failed to submit feature suggestion");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">{t("supportSuggestFeature.thankYou") || "Thank You!"}</h2>
            <p className="text-muted-foreground">
              {t("supportSuggestFeature.successMessage") || "Your feature suggestion has been submitted successfully. We'll review it and consider it for future updates."}
            </p>
            <Button
              onClick={() => setIsSubmitted(false)}
              className="w-full"
            >
              {t("supportSuggestFeature.suggestAnother") || "Suggest Another Feature"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-primary" />
            {t("supportSuggestFeature.title") || "Suggest a Feature"}
          </h1>
          <p className="text-muted-foreground">
            {t("supportSuggestFeature.subtitle") || "Have an idea? We'd love to hear it!"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("supportSuggestFeature.formTitle") || "Feature Suggestion Form"}</CardTitle>
            <CardDescription>
              {t("supportSuggestFeature.formDescription") || "Share your ideas to help us improve"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">
                  {t("supportSuggestFeature.titleLabel") || "Feature Title"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t("supportSuggestFeature.titlePlaceholder") || "Brief name for your feature idea"}
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  {t("supportSuggestFeature.descriptionLabel") || "Description"} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t("supportSuggestFeature.descriptionPlaceholder") || "Detailed description of the feature you'd like to see"}
                  required
                  rows={6}
                  maxLength={5000}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="useCase">
                  {t("supportSuggestFeature.useCaseLabel") || "Use Case"}
                </Label>
                <Textarea
                  id="useCase"
                  value={formData.useCase}
                  onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                  placeholder={t("supportSuggestFeature.useCasePlaceholder") || "How would you use this feature? What problem would it solve?"}
                  rows={4}
                  maxLength={2000}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {t("supportSuggestFeature.submitting") || "Submitting..."}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t("supportSuggestFeature.submit") || "Submit Suggestion"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
