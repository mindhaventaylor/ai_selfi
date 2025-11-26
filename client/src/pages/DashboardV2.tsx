import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { exampleImages, filterExampleImages } from "@/data/exampleImages";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles,
  Upload,
  Check,
  User,
  Calendar,
  Palette,
  Scissors,
  Shirt,
  Image as ImageIcon,
  Camera,
  X
} from "lucide-react";

type Step = "welcome" | "gender" | "age" | "hairColor" | "hairLength" | "hairStyle" | "ethnicity" | "bodyType" | "attire" | "background" | "upload";

type UploadedFile = {
  id: string;
  file: File;
  preview: string;
};

export default function DashboardV2() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    gender: "",
    age: "",
    hairColor: "",
    hairLength: "",
    hairStyle: "",
    ethnicity: "",
    bodyType: "",
    attire: [] as string[],
    backgrounds: [] as string[],
  });

  const steps: { key: Step; number: number; title: string }[] = [
    { key: "welcome", number: 0, title: t("dashboardV2.welcome") },
    { key: "gender", number: 1, title: t("dashboardV2.gender") },
    { key: "age", number: 2, title: t("dashboardV2.age") },
    { key: "hairColor", number: 3, title: t("dashboardV2.hairColor") },
    { key: "hairLength", number: 4, title: t("dashboardV2.hairLength") },
    { key: "hairStyle", number: 5, title: t("dashboardV2.hairStyle") },
    { key: "ethnicity", number: 6, title: t("dashboardV2.ethnicity") },
    { key: "bodyType", number: 7, title: t("dashboardV2.bodyType") },
    { key: "attire", number: 8, title: t("dashboardV2.attire") },
    { key: "background", number: 9, title: t("dashboardV2.background") },
    { key: "upload", number: 10, title: t("dashboardV2.upload") },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    } else {
      // Navigate to upload/generate page with variant=page2 to maintain the flow
      setLocation("/dashboard/generate?variant=page2");
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  // Initialize mutations at component level (hooks must be at top level)
  const generateFromPage2Mutation = trpc.photo.generateFromPage2.useMutation();

  const updateFormData = (key: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayValue = (key: "attire" | "backgrounds", value: string) => {
    setFormData(prev => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(value) 
          ? arr.filter(v => v !== value)
          : [...arr, value]
      };
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Progress */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">{t("dashboardV2.appName")}</span>
            </div>
            <div className="flex-1 max-w-md mx-4">
              <Progress value={progress} className="h-2" />
            </div>
            <div className="text-sm text-muted-foreground">
              {currentStepIndex + 1} / {steps.length}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Button */}
        {currentStepIndex > 0 && (
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("dashboardV2.back")}
          </Button>
        )}

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{currentStepIndex + 1}</span>
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-8 md:p-12">
            {currentStep === "welcome" && (
              <WelcomeStep onNext={handleNext} />
            )}

            {currentStep === "gender" && (
              <GenderStep
                value={formData.gender}
                onChange={(value) => updateFormData("gender", value)}
                onNext={handleNext}
              />
            )}

            {currentStep === "age" && (
              <AgeStep
                value={formData.age}
                onChange={(value) => updateFormData("age", value)}
                onNext={handleNext}
              />
            )}

            {currentStep === "hairColor" && (
              <HairColorStep
                value={formData.hairColor}
                onChange={(value) => updateFormData("hairColor", value)}
                onNext={handleNext}
              />
            )}

            {currentStep === "hairLength" && (
              <HairLengthStep
                value={formData.hairLength}
                onChange={(value) => updateFormData("hairLength", value)}
                onNext={handleNext}
              />
            )}

            {currentStep === "hairStyle" && (
              <HairStyleStep
                value={formData.hairStyle}
                onChange={(value) => updateFormData("hairStyle", value)}
                onNext={handleNext}
                formData={formData}
              />
            )}

            {currentStep === "ethnicity" && (
              <EthnicityStep
                value={formData.ethnicity}
                onChange={(value) => updateFormData("ethnicity", value)}
                onNext={handleNext}
                formData={formData}
              />
            )}

            {currentStep === "bodyType" && (
              <BodyTypeStep
                value={formData.bodyType}
                onChange={(value) => updateFormData("bodyType", value)}
                onNext={handleNext}
              />
            )}

            {currentStep === "attire" && (
              <AttireStep
                value={formData.attire}
                onChange={(value) => toggleArrayValue("attire", value)}
                onNext={handleNext}
                formData={formData}
              />
            )}

            {currentStep === "background" && (
              <BackgroundStep
                value={formData.backgrounds}
                onChange={(value) => toggleArrayValue("backgrounds", value)}
                onNext={handleNext}
                formData={formData}
              />
            )}

            {currentStep === "upload" && (
              <UploadStep 
                onNext={handleNext}
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFiles}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                fileInputRef={fileInputRef}
                user={user}
                formData={formData}
                generateFromPage2Mutation={generateFromPage2Mutation}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Welcome Step
function WelcomeStep({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  // Get a mix of example images for display (6 images)
  const displayImages = exampleImages.slice(0, 6);

  return (
    <div className="text-center space-y-6">
      <h1 className="text-4xl md:text-5xl font-bold">
        {t("dashboardV2.welcomeTitle")}
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        {t("dashboardV2.welcomeDescription")}
      </p>
      
      {/* Example Images Grid */}
      <div className="grid grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
        {displayImages.map((img) => (
          <div key={img.id} className="aspect-[3/4] rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors">
            <img
              src={img.url}
              alt={t("dashboardV2.exampleAlt", { id: img.id })}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      <Button
        size="lg"
        onClick={onNext}
        className="mt-8 bg-primary hover:bg-primary/90 rounded-full px-8 py-6 text-lg"
      >
        {t("dashboardV2.createHeadshots")}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}

// Gender Step
function GenderStep({ value, onChange, onNext }: { value: string; onChange: (value: string) => void; onNext: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const options = [
    { value: "man", label: t("dashboardV2.male"), icon: "♂" },
    { value: "woman", label: t("dashboardV2.female"), icon: "♀" },
    { value: "non-binary", label: t("dashboardV2.nonBinary"), icon: "⚧" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.whatIsYourGender")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.genderDescription", { name: user?.name ? `, ${user.name}` : "" })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`p-6 rounded-lg border-2 transition-all ${
              value === option.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-4xl">{option.icon}</span>
              <div className={`w-5 h-5 rounded-full border-2 ${
                value === option.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground"
              }`}>
                {value === option.value && (
                  <div className="w-full h-full rounded-full bg-primary" />
                )}
              </div>
            </div>
            <p className="mt-4 font-semibold text-left">{option.label}</p>
          </button>
        ))}
      </div>

      <Button
        size="lg"
        onClick={onNext}
        disabled={!value}
        className="w-full mt-8 bg-primary hover:bg-primary/90 rounded-full"
      >
        {t("dashboardV2.continue")}
      </Button>
    </div>
  );
}

// Age Step
function AgeStep({ value, onChange, onNext }: { value: string; onChange: (value: string) => void; onNext: () => void }) {
  const { t } = useTranslation();

  const ageRanges = ["18-20", "21-24", "25-29", "30-40", "41-50", "51-65", "65+"];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.howOldAreYou")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.ageDescription")}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-8">
        {ageRanges.map((range) => (
          <button
            key={range}
            onClick={() => onChange(range)}
            className={`px-6 py-3 rounded-lg border-2 transition-all ${
              value === range
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold">{range}</span>
              <div className={`w-4 h-4 rounded-full border-2 ${
                value === range
                  ? "border-primary bg-primary"
                  : "border-muted-foreground"
              }`} />
            </div>
          </button>
        ))}
      </div>

      <Button
        size="lg"
        onClick={onNext}
        disabled={!value}
        className="w-full mt-8 bg-primary hover:bg-primary/90 rounded-full"
      >
        {t("dashboardV2.continue")}
      </Button>
    </div>
  );
}

// Hair Color Step
function HairColorStep({ value, onChange, onNext }: { value: string; onChange: (value: string) => void; onNext: () => void }) {
  const { t } = useTranslation();

  const colors = [
    { value: "brown", label: t("dashboardV2.brown"), color: "bg-amber-800" },
    { value: "black", label: t("dashboardV2.black"), color: "bg-black" },
    { value: "blonde", label: t("dashboardV2.blonde"), color: "bg-yellow-300" },
    { value: "gray", label: t("dashboardV2.gray"), color: "bg-gray-400" },
    { value: "auburn", label: t("dashboardV2.auburn"), color: "bg-red-800" },
    { value: "red", label: t("dashboardV2.red"), color: "bg-red-500" },
    { value: "white", label: t("dashboardV2.white"), color: "bg-white border" },
    { value: "other", label: t("dashboardV2.other"), color: "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" },
    { value: "bald", label: t("dashboardV2.bald"), color: "bg-gray-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.whatIsYourHairColor")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.hairColorDescription")}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-8">
        {colors.map((color) => (
          <button
            key={color.value}
            onClick={() => onChange(color.value)}
            className={`p-4 rounded-lg border-2 transition-all ${
              value === color.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-full ${color.color}`} />
              {value === color.value && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
            <p className="text-sm font-semibold text-left">{color.label}</p>
          </button>
        ))}
      </div>

      <Button
        size="lg"
        onClick={onNext}
        disabled={!value}
        className="w-full mt-8 bg-primary hover:bg-primary/90 rounded-full"
      >
        {t("dashboardV2.continue")}
      </Button>
    </div>
  );
}

// Hair Length Step
function HairLengthStep({ value, onChange, onNext }: { value: string; onChange: (value: string) => void; onNext: () => void }) {
  const { t } = useTranslation();

  const lengths = [
    { value: "bald", label: t("dashboardV2.bald") },
    { value: "buzz", label: t("dashboardV2.buzzCut") },
    { value: "short", label: t("dashboardV2.short") },
    { value: "medium", label: t("dashboardV2.mediumLength") },
    { value: "long", label: t("dashboardV2.long") },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.whatIsYourHairLength")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.hairLengthDescription")}
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4 mt-8">
        {lengths.map((length) => (
          <button
            key={length.value}
            onClick={() => onChange(length.value)}
            className={`p-4 rounded-lg border-2 transition-all ${
              value === length.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              {value === length.value && (
                <Check className="h-5 w-5 text-primary mb-2" />
              )}
              <p className="text-sm font-semibold text-center">{length.label}</p>
            </div>
          </button>
        ))}
      </div>

      <Button
        size="lg"
        onClick={onNext}
        disabled={!value}
        className="w-full mt-8 bg-primary hover:bg-primary/90 rounded-full"
      >
        {t("dashboardV2.continue")}
      </Button>
    </div>
  );
}

// Hair Style Step
function HairStyleStep({ value, onChange, onNext, formData }: { value: string; onChange: (value: string) => void; onNext: () => void; formData: any }) {
  const { t } = useTranslation();

  const styles = [
    { value: "straight", label: t("dashboardV2.straight") },
    { value: "wavy", label: t("dashboardV2.wavy") },
    { value: "curly", label: t("dashboardV2.curly") },
    { value: "dreadlocks", label: t("dashboardV2.dreadlocks") },
  ];

  // Filter example images based on selected gender, attire (styles), and backgrounds
  const gender = formData.gender === "man" || formData.gender === "woman" ? formData.gender : "man";
  const selectedStyles = formData.attire || [];
  const selectedBackgrounds = formData.backgrounds || [];
  const filteredImages = filterExampleImages(exampleImages, gender, selectedStyles, selectedBackgrounds);
  const displayImages = filteredImages.length > 0 ? filteredImages.slice(0, 6) : exampleImages.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.whatIsYourHairType")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.hairTypeDescription")}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-8">
        {styles.map((style, index) => {
          // Get an example image for this button (cycle through available images)
          const imageIndex = index % displayImages.length;
          const exampleImage = displayImages[imageIndex];
          
          return (
            <button
              key={style.value}
              onClick={() => onChange(style.value)}
              className={`relative p-0 rounded-lg border-2 transition-all overflow-hidden ${
                value === style.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex flex-col items-center">
                {/* Example image inside button */}
                <div className="w-full aspect-[3/4] relative">
                  <img
                    src={exampleImage.url}
                    alt={t("dashboardV2.exampleForAlt", { label: style.label })}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {value === style.value && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="h-8 w-8 text-primary bg-background rounded-full p-1" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold p-3">{style.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      <Button
        size="lg"
        onClick={onNext}
        disabled={!value}
        className="w-full mt-8 bg-primary hover:bg-primary/90 rounded-full"
      >
        {t("dashboardV2.continue")}
      </Button>
    </div>
  );
}

// Ethnicity Step
function EthnicityStep({ value, onChange, onNext, formData }: { value: string; onChange: (value: string) => void; onNext: () => void; formData: any }) {
  const { t } = useTranslation();

  const ethnicities = [
    { value: "white", label: t("dashboardV2.whiteCaucasian") },
    { value: "black", label: t("dashboardV2.blackAfrican") },
    { value: "hispanic", label: t("dashboardV2.hispanicLatino") },
    { value: "asian-east", label: t("dashboardV2.asianEast") },
    { value: "asian-south", label: t("dashboardV2.asianSouth") },
    { value: "asian-southeast", label: t("dashboardV2.asianSoutheast") },
    { value: "middle-eastern", label: t("dashboardV2.middleEastern") },
    { value: "pacific-islander", label: t("dashboardV2.pacificIslander") },
    { value: "multiracial", label: t("dashboardV2.multiracial") },
    { value: "other", label: t("dashboardV2.other") },
  ];

  // Filter example images based on selected gender, attire (styles), and backgrounds
  const gender = formData.gender === "man" || formData.gender === "woman" ? formData.gender : "man";
  const selectedStyles = formData.attire || [];
  const selectedBackgrounds = formData.backgrounds || [];
  const filteredImages = filterExampleImages(exampleImages, gender, selectedStyles, selectedBackgrounds);
  const displayImages = filteredImages.length > 0 ? filteredImages.slice(0, 6) : exampleImages.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.whatIsYourEthnicity")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.ethnicityDescription")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
        {ethnicities.map((ethnicity) => (
          <button
            key={ethnicity.value}
            onClick={() => onChange(ethnicity.value)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              value === ethnicity.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{ethnicity.label}</span>
              <div className={`w-5 h-5 rounded-full border-2 ${
                value === ethnicity.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground"
              }`} />
            </div>
          </button>
        ))}
      </div>

      <Button
        size="lg"
        onClick={onNext}
        disabled={!value}
        className="w-full mt-8 bg-primary hover:bg-primary/90 rounded-full"
      >
        {t("dashboardV2.continue")}
      </Button>
    </div>
  );
}

// Body Type Step
function BodyTypeStep({ value, onChange, onNext }: { value: string; onChange: (value: string) => void; onNext: () => void }) {
  const { t } = useTranslation();

  const bodyTypes = [
    { value: "slim", label: t("dashboardV2.slim") },
    { value: "regular", label: t("dashboardV2.regular") },
    { value: "athletic", label: t("dashboardV2.athletic") },
    { value: "medium-large", label: t("dashboardV2.mediumLarge") },
    { value: "large", label: t("dashboardV2.large") },
    { value: "plus", label: t("dashboardV2.plusSize") },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.whatIsYourBodyType")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.bodyTypeDescription")}
        </p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-8">
        {bodyTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => onChange(type.value)}
            className={`p-4 rounded-lg border-2 transition-all ${
              value === type.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              {value === type.value && (
                <Check className="h-5 w-5 text-primary mb-2" />
              )}
              <p className="text-xs font-semibold text-center">{type.label}</p>
            </div>
          </button>
        ))}
      </div>

      <Button
        size="lg"
        onClick={onNext}
        disabled={!value}
        className="w-full mt-8 bg-primary hover:bg-primary/90 rounded-full"
      >
        {t("dashboardV2.continue")}
      </Button>
    </div>
  );
}

// Attire Step
function AttireStep({ value, onChange, onNext, formData }: { value: string[]; onChange: (value: string) => void; onNext: () => void; formData: any }) {
  const { t } = useTranslation();

  const attires = [
    { value: "professional", label: t("dashboardV2.professionalBusiness"), description: t("dashboardV2.professionalBusinessDesc") },
    { value: "business-casual", label: t("dashboardV2.businessCasual"), description: t("dashboardV2.businessCasualDesc") },
  ];

  // Filter example images based on selected gender and backgrounds only
  // Don't filter by current attire selection to keep images stable
  const gender = formData.gender === "man" || formData.gender === "woman" ? formData.gender : "man";
  const selectedBackgrounds = formData.backgrounds || [];
  // Filter by gender and backgrounds only, not by attire styles
  const filteredImages = filterExampleImages(exampleImages, gender, [], selectedBackgrounds);
  // Get first 2 images for the 2 attire options - these will be fixed
  const displayImages = filteredImages.length >= 2 
    ? filteredImages.slice(0, 2) 
    : (filteredImages.length > 0 ? filteredImages : exampleImages.slice(0, 2));

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.selectYourAttire")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.attireDescription")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {attires.map((attire, index) => {
          const isSelected = value.includes(attire.value);
          // Assign fixed images: first attire gets first image, second attire gets second image
          const exampleImage = displayImages[index] || displayImages[0];
          
          return (
            <button
              key={attire.value}
              onClick={() => onChange(attire.value)}
              className={`relative rounded-lg border-2 transition-all overflow-hidden ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {/* Example image at the top */}
              <div className="w-full aspect-[3/4] relative">
                <img
                  src={exampleImage.url}
                  alt={t("dashboardV2.exampleForAlt", { label: attire.label })}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-6 w-6 text-primary bg-background rounded-full p-1" />
                  </div>
                )}
              </div>
              {/* Label and description at the bottom */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{attire.label}</h3>
                <p className="text-sm text-muted-foreground">{attire.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
        <p className="text-sm text-muted-foreground">
          {t("dashboardV2.attireNote")}
        </p>
      </div>

      <Button
        size="lg"
        onClick={onNext}
        disabled={value.length === 0}
        className="w-full mt-8 bg-primary hover:bg-primary/90 rounded-full"
      >
        {t("dashboardV2.continue")}
      </Button>
    </div>
  );
}

// Background Step
function BackgroundStep({ value, onChange, onNext, formData }: { value: string[]; onChange: (value: string) => void; onNext: () => void; formData: any }) {
  const { t } = useTranslation();

  const backgrounds = [
    { value: "city", label: t("dashboardV2.city"), description: t("dashboardV2.cityDesc") },
    { value: "nature", label: t("dashboardV2.nature"), description: t("dashboardV2.natureDesc") },
    { value: "office", label: t("dashboardV2.office"), description: t("dashboardV2.officeDesc") },
    { value: "studio", label: t("dashboardV2.studio"), description: t("dashboardV2.studioDesc") },
  ];

  // Filter example images based on selected gender and attire (styles)
  // Filter by specific background to get images that match each background type
  const gender = formData.gender === "man" || formData.gender === "woman" ? formData.gender : "man";
  const attireToStyleMap: Record<string, string> = {
    "professional": "professional",
    "business-casual": "casual"
  };
  const selectedStyles = (formData.attire || []).map((attire: string) => attireToStyleMap[attire] || attire).filter(Boolean);
  
  // Get images for each background - filter by background value
  const getImagesForBackground = (bgValue: string) => {
    const filtered = filterExampleImages(exampleImages, gender, selectedStyles, [bgValue]);
    return filtered.length > 0 ? filtered : exampleImages.filter(img => img.gender === gender || img.gender === "both");
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.selectYourBackgrounds")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.backgroundDescription")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {backgrounds.map((bg, index) => {
          const isSelected = value.includes(bg.value);
          // Get images filtered by this specific background
          const backgroundImages = getImagesForBackground(bg.value);
          // Use different image for each background (index 0, 1, 2, 3) to ensure they're different
          // If not enough images for this background, get from all filtered images
          const exampleImage = backgroundImages[index] || backgroundImages[0] || exampleImages[index] || exampleImages[0];
          
          return (
            <button
              key={bg.value}
              onClick={() => onChange(bg.value)}
              className={`relative rounded-lg border-2 transition-all overflow-hidden ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {/* Example image */}
              <div className="w-full aspect-video relative">
                <img
                  src={exampleImage.url}
                  alt={t("dashboardV2.exampleForAlt", { label: bg.label })}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-5 w-5 text-primary bg-background rounded-full p-0.5" />
                  </div>
                )}
              </div>
              {/* Label and description */}
              <div className="p-3">
                <h3 className="font-semibold mb-1">{bg.label}</h3>
                <p className="text-xs text-muted-foreground text-center">{bg.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <Button
        size="lg"
        onClick={onNext}
        disabled={value.length === 0}
        className="w-full mt-8 bg-primary hover:bg-primary/90 rounded-full"
      >
        {t("dashboardV2.continue")}
      </Button>
    </div>
  );
}

// Upload Step
function UploadStep({ 
  onNext,
  uploadedFiles,
  setUploadedFiles,
  isDragging,
  setIsDragging,
  fileInputRef,
  user,
  formData,
  generateFromPage2Mutation,
}: { 
  onNext: () => void;
  uploadedFiles: UploadedFile[];
  setUploadedFiles: (files: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[])) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  user: any;
  formData: any;
  generateFromPage2Mutation: ReturnType<typeof trpc.photo.generateFromPage2.useMutation>;
}) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const maxFiles = 10;
  const maxFileSize = 120 * 1024 * 1024; // 120MB

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const newFiles: UploadedFile[] = [];
    const currentCount = uploadedFiles.length;
    const totalFiles = currentCount + files.length;

    // Check total files limit
    if (totalFiles > maxFiles) {
      toast.error(t("dashboardV2.maxFilesError"), {
        description: t("dashboardV2.maxFilesErrorDesc", { maxFiles, currentCount, newCount: files.length }),
      });
      return;
    }

    // Process each file
    for (const file of Array.from(files)) {
      // Check if we've reached the limit
      if (currentCount + newFiles.length >= maxFiles) {
        toast.error(t("dashboardV2.maxFilesError"), {
          description: t("dashboardV2.maxFilesErrorDescSimple", { maxFiles }),
        });
        break;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        toast.error(t("dashboardV2.invalidFileType"), {
          description: t("dashboardV2.invalidFileTypeDesc", { fileName: file.name }),
        });
        continue;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        toast.error(t("dashboardV2.fileTooLarge"), {
          description: t("dashboardV2.fileTooLargeDesc", { fileName: file.name }),
        });
        continue;
      }

      const id = `${Date.now()}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      newFiles.push({ id, file, preview });
    }

    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      toast.success(
        `${newFiles.length} ${newFiles.length === 1 ? t("dashboardV2.fileSelected") : t("dashboardV2.filesSelected")}`,
        {
          description: t("dashboardV2.filesReady"),
        }
      );
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
    toast.success(t("dashboardV2.fileRemoved"));
  };

  const handleContinue = async () => {
    if (uploadedFiles.length === 0) {
      toast.error(t("dashboardV2.noFilesSelected"), {
        description: t("dashboardV2.pleaseSelectFiles"),
      });
      return;
    }

    if (uploadedFiles.length < 1) {
      toast.error(t("dashboardV2.minFilesError"), {
        description: t("dashboardV2.pleaseSelectFiles"),
      });
      return;
    }

    if (!user?.id) {
      toast.error(t("dashboardV2.userNotAuthenticated"), {
        description: t("dashboardV2.pleaseLogin"),
      });
      return;
    }

    // Generate images directly using new page2 API
    try {
      const loadingToast = toast.loading(t("dashboardV2.generatingImages"));
      
      // Convert files to base64
      const userImages = await Promise.all(
        uploadedFiles.map(async (file) => {
          return new Promise<{ data: string; fileName: string; contentType: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1]; // Remove data:image/jpeg;base64, prefix
              resolve({
                data: base64,
                fileName: file.file.name,
                contentType: file.file.type,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file.file);
          });
        })
      );

      // Call new page2 generation API
      const result = await generateFromPage2Mutation.mutateAsync({
        userImages,
        formData,
        exampleImageId: 1, // Use first example image
        aspectRatio: "9:16",
        numImagesPerExample: 4,
      });

      toast.dismiss(loadingToast);
      
      console.log("[DashboardV2] Generation result:", result);
      
      if (result.batchId) {
        console.log("[DashboardV2] Redirecting to generate page with batchId:", result.batchId);
        
        // Show success toast briefly
        toast.success(t("dashboardV2.generationStarted"), {
          duration: 1500,
        });
        
        // Navigate immediately - use window.location as fallback if setLocation doesn't work
        const redirectUrl = `/dashboard/generate?variant=page2&batchId=${result.batchId}`;
        console.log("[DashboardV2] Navigating to:", redirectUrl);
        
        try {
          setLocation(redirectUrl);
          // Fallback: if setLocation doesn't work, use window.location
          setTimeout(() => {
            if (window.location.pathname + window.location.search !== redirectUrl) {
              console.warn("[DashboardV2] setLocation didn't work, using window.location");
              window.location.href = redirectUrl;
            }
          }, 100);
        } catch (error) {
          console.error("[DashboardV2] Error with setLocation, using window.location:", error);
          window.location.href = redirectUrl;
        }
      } else {
        console.error("[DashboardV2] No batchId in result:", result);
        throw new Error(t("generateImages.failedToStartGeneration"));
      }
    } catch (error: any) {
      toast.error(t("dashboardV2.generationError"), {
        description: error?.message || t("generateImages.pleaseTryAgain"),
      });
    }
  };

  // Filter example images based on selected gender, attire (styles), and backgrounds
  const gender = formData.gender === "man" || formData.gender === "woman" ? formData.gender : "man";
  const selectedStyles = formData.attire || [];
  const selectedBackgrounds = formData.backgrounds || [];
  const filteredImages = filterExampleImages(exampleImages, gender, selectedStyles, selectedBackgrounds);
  const displayImages = filteredImages.length > 0 ? filteredImages.slice(0, 6) : exampleImages.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.uploadPhotos")}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.uploadDescription")}
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center mt-8 transition-colors ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-semibold mb-2">{t("dashboardV2.uploadFromComputer")}</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/heic,image/webp"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => fileInputRef.current?.click()}
        >
          {t("dashboardV2.uploadFiles")}
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          {t("dashboardV2.uploadFormats")}
        </p>
      </div>

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">
              {t("dashboardV2.uploadedImages")} {uploadedFiles.length} {t("dashboardV2.of")} {maxFiles}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                uploadedFiles.forEach(f => URL.revokeObjectURL(f.preview));
                setUploadedFiles([]);
              }}
            >
              {t("dashboardV2.clearAll")}
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedFiles.map((uploadedFile) => (
              <div key={uploadedFile.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-border">
                  <img
                    src={uploadedFile.preview}
                    alt={uploadedFile.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeFile(uploadedFile.id)}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="text-xs text-muted-foreground mt-1 truncate" title={uploadedFile.file.name}>
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} {t("dashboardV2.fileSizeUnit")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedFiles.length === 0 && (
        <div className="mt-8">
          <p className="text-sm text-muted-foreground mb-4 text-center">
            {t("dashboardV2.uploadedImages")} 0 {t("dashboardV2.of")} {maxFiles}
          </p>
        </div>
      )}

      <Button
        size="lg"
        onClick={handleContinue}
        disabled={uploadedFiles.length === 0}
        className="w-full mt-8 bg-primary hover:bg-primary/90 rounded-full disabled:opacity-50"
      >
        {t("dashboardV2.continue")}
      </Button>
    </div>
  );
}

