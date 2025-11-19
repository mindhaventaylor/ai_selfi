import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Type,
  Image as ImageIcon,
  Brain,
  Camera,
  Play,
  Zap,
  Sparkles,
} from "lucide-react";

export default function Pro() {
  const { t } = useTranslation();
  const features = [
    {
      id: 1,
      title: t("pro.textToImage"),
      description: t("pro.textToImageDesc"),
      icon: Type,
      buttonText: t("pro.generateImages"),
      buttonColor: "bg-purple-500 hover:bg-purple-600",
      comingSoon: false,
    },
    {
      id: 2,
      title: t("pro.backgroundRemoval"),
      description: t("pro.backgroundRemovalDesc"),
      icon: ImageIcon,
      buttonText: t("pro.removeBackgrounds"),
      buttonColor: "bg-yellow-500 hover:bg-yellow-600",
      comingSoon: false,
    },
    {
      id: 3,
      title: t("pro.styleTransfer"),
      description: t("pro.styleTransferDesc"),
      icon: Brain,
      buttonText: t("pro.tryStyleTransfer"),
      buttonColor: "bg-purple-500 hover:bg-purple-600",
      comingSoon: false,
    },
    {
      id: 4,
      title: t("pro.imageRestoration"),
      description: t("pro.imageRestorationDesc"),
      icon: Camera,
      buttonText: t("pro.restoreImages"),
      buttonColor: "bg-orange-500 hover:bg-orange-600",
      comingSoon: false,
    },
    {
      id: 5,
      title: t("pro.youtubeThumbnails"),
      description: t("pro.youtubeThumbnailsDesc"),
      icon: Play,
      buttonText: t("pro.proSubscriptionRequired"),
      buttonColor: "bg-muted hover:bg-muted/80 text-muted-foreground",
      comingSoon: true,
    },
    {
      id: 6,
      title: t("pro.imageUpscaling"),
      description: t("pro.imageUpscalingDesc"),
      icon: Zap,
      buttonText: t("pro.proSubscriptionRequired"),
      buttonColor: "bg-muted hover:bg-muted/80 text-muted-foreground",
      comingSoon: true,
    },
  ];

  // Placeholder images - using gradient backgrounds as placeholders
  const placeholderImages = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t("pro.title")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("pro.subtitle")}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card
                key={feature.id}
                className="bg-card/50 border-border overflow-hidden relative group"
              >
                {/* Blurred Background Image */}
                <div
                  className="absolute inset-0 opacity-20 blur-2xl scale-110"
                  style={{
                    background: placeholderImages[index],
                  }}
                />
                <div className="absolute inset-0 bg-background/60" />

                <CardContent className="p-6 relative z-10">
                  <div className="space-y-4">
                    {/* Coming Soon Badge */}
                    {feature.comingSoon && (
                      <div className="absolute top-4 right-4 z-20">
                        <Badge className="bg-orange-500 text-orange-900 border-orange-500">
                          {t("pro.comingSoon")}
                        </Badge>
                      </div>
                    )}

                    {/* Icon */}
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        <IconComponent className="w-8 h-8 text-primary" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-center">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground text-center min-h-[40px]">
                      {feature.description}
                    </p>

                    {/* Button */}
                    <Button
                      className={`w-full ${feature.buttonColor} text-white rounded-full h-11 text-sm font-semibold shadow-lg hover:shadow-xl transition-all ${
                        feature.comingSoon ? "cursor-not-allowed" : ""
                      }`}
                      size="lg"
                      disabled={feature.comingSoon}
                    >
                      {!feature.comingSoon && (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      {feature.comingSoon && (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      {feature.buttonText}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

