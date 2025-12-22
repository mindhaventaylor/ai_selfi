import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default function DashboardV3Welcome() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl bg-card/50 border-border">
        <CardContent className="p-8 md:p-12 space-y-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Create professional AI portraits
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Transform your existing photos into realistic AI portrait photos for your resume, LinkedIn, and social media profiles.
            </p>
          </div>

          {/* Example Images */}
          <div className="flex justify-center gap-4 flex-wrap">
            <div className="w-full sm:w-[calc(33.333%-0.67rem)] aspect-[3/4] rounded-lg overflow-hidden border border-border">
              <img
                src="/image_selection/Man/1_man_office_elegant.webp"
                alt="Professional portrait example 1"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-full sm:w-[calc(33.333%-0.67rem)] aspect-[3/4] rounded-lg overflow-hidden border border-border">
              <img
                src="/image_selection/Woman/2_woman_studio_casual.webp"
                alt="Professional portrait example - woman"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-full sm:w-[calc(33.333%-0.67rem)] aspect-[3/4] rounded-lg overflow-hidden border border-border">
              <img
                src="/image_selection/Man/3_man_city_elegant.webp"
                alt="Professional portrait example 3"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg font-semibold shadow-lg"
              onClick={() => setLocation("/dashboard?variant=page3&step=create")}
            >
              Create headshots
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
