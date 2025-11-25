import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bug, Send, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function SupportReportBug() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    stepsToReproduce: "",
    expectedBehavior: "",
    actualBehavior: "",
    browserInfo: "",
    deviceInfo: "",
  });

  const reportBugMutation = trpc.support.reportBug.useMutation();

  // Auto-detect browser and device info
  useEffect(() => {
    if (typeof window !== "undefined") {
      const browserInfo = `${navigator.userAgent}`;
      const deviceInfo = `${window.screen.width}x${window.screen.height} - ${navigator.platform}`;
      setFormData(prev => ({
        ...prev,
        browserInfo,
        deviceInfo,
      }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error(t("supportReportBug.fillRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      await reportBugMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        stepsToReproduce: formData.stepsToReproduce || undefined,
        expectedBehavior: formData.expectedBehavior || undefined,
        actualBehavior: formData.actualBehavior || undefined,
        browserInfo: formData.browserInfo || undefined,
        deviceInfo: formData.deviceInfo || undefined,
      });

      setIsSubmitted(true);
      toast.success(t("supportReportBug.success"));
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        stepsToReproduce: "",
        expectedBehavior: "",
        actualBehavior: "",
        browserInfo: formData.browserInfo,
        deviceInfo: formData.deviceInfo,
      });
    } catch (error: any) {
      console.error("Error submitting bug report:", error);
      toast.error(error?.message || t("supportReportBug.error"));
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
            <h2 className="text-2xl font-bold">{t("supportReportBug.thankYou")}</h2>
            <p className="text-muted-foreground">
              {t("supportReportBug.successMessage")}
            </p>
            <Button
              onClick={() => setIsSubmitted(false)}
              className="w-full"
            >
              {t("supportReportBug.submitAnother")}
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
            <Bug className="w-8 h-8 text-primary" />
            {t("supportReportBug.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("supportReportBug.subtitle")}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("supportReportBug.formTitle")}</CardTitle>
            <CardDescription>
              {t("supportReportBug.formDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">
                  {t("supportReportBug.titleLabel")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t("supportReportBug.titlePlaceholder")}
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  {t("supportReportBug.descriptionLabel")} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t("supportReportBug.descriptionPlaceholder")}
                  required
                  rows={6}
                  maxLength={5000}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stepsToReproduce">
                  {t("supportReportBug.stepsLabel")}
                </Label>
                <Textarea
                  id="stepsToReproduce"
                  value={formData.stepsToReproduce}
                  onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
                  placeholder={t("supportReportBug.stepsPlaceholder")}
                  rows={4}
                  maxLength={2000}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedBehavior">
                    {t("supportReportBug.expectedLabel")}
                  </Label>
                  <Textarea
                    id="expectedBehavior"
                    value={formData.expectedBehavior}
                    onChange={(e) => setFormData({ ...formData, expectedBehavior: e.target.value })}
                    placeholder={t("supportReportBug.expectedPlaceholder")}
                    rows={3}
                    maxLength={1000}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualBehavior">
                    {t("supportReportBug.actualLabel")}
                  </Label>
                  <Textarea
                    id="actualBehavior"
                    value={formData.actualBehavior}
                    onChange={(e) => setFormData({ ...formData, actualBehavior: e.target.value })}
                    placeholder={t("supportReportBug.actualPlaceholder")}
                    rows={3}
                    maxLength={1000}
                  />
                </div>
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
                      {t("supportReportBug.submitting")}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t("supportReportBug.submit")}
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
