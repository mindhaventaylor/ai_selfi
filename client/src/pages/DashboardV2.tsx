import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { exampleImages } from "@/data/exampleImages";
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
    { key: "welcome", number: 0, title: t("dashboardV2.welcome") || "Welcome" },
    { key: "gender", number: 1, title: t("dashboardV2.gender") || "Gender" },
    { key: "age", number: 2, title: t("dashboardV2.age") || "Age" },
    { key: "hairColor", number: 3, title: t("dashboardV2.hairColor") || "Hair Color" },
    { key: "hairLength", number: 4, title: t("dashboardV2.hairLength") || "Hair Length" },
    { key: "hairStyle", number: 5, title: t("dashboardV2.hairStyle") || "Hair Style" },
    { key: "ethnicity", number: 6, title: t("dashboardV2.ethnicity") || "Ethnicity" },
    { key: "bodyType", number: 7, title: t("dashboardV2.bodyType") || "Body Type" },
    { key: "attire", number: 8, title: t("dashboardV2.attire") || "Attire" },
    { key: "background", number: 9, title: t("dashboardV2.background") || "Background" },
    { key: "upload", number: 10, title: t("dashboardV2.upload") || "Upload Photos" },
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
              <span className="font-semibold text-lg">AI Selfi</span>
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
            {t("dashboardV2.back") || "Back"}
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
              />
            )}

            {currentStep === "ethnicity" && (
              <EthnicityStep
                value={formData.ethnicity}
                onChange={(value) => updateFormData("ethnicity", value)}
                onNext={handleNext}
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
              />
            )}

            {currentStep === "background" && (
              <BackgroundStep
                value={formData.backgrounds}
                onChange={(value) => toggleArrayValue("backgrounds", value)}
                onNext={handleNext}
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
        {t("dashboardV2.welcomeTitle") || "Create professional AI portraits"}
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        {t("dashboardV2.welcomeDescription") || "Transform your existing photos into realistic AI portrait photos for your resume, LinkedIn, and social media profiles."}
      </p>
      
      {/* Example Images Grid */}
      <div className="grid grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
        {displayImages.map((img) => (
          <div key={img.id} className="aspect-[3/4] rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors">
            <img
              src={img.url}
              alt={`Example ${img.id}`}
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
        {t("dashboardV2.createHeadshots") || "Create headshots"}
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
    { value: "man", label: t("dashboardV2.male") || "Male", icon: "♂" },
    { value: "woman", label: t("dashboardV2.female") || "Female", icon: "♀" },
    { value: "non-binary", label: t("dashboardV2.nonBinary") || "Non-binary", icon: "⚧" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.whatIsYourGender") || "What is your gender?"}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.genderDescription") || `We'd love to learn more about you, ${user?.name || "there"}! Help us generate perfect photos that reflect who you are.`}
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
        {t("dashboardV2.continue") || "Continue"}
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
        <h2 className="text-3xl font-bold">{t("dashboardV2.howOldAreYou") || "How old are you?"}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.ageDescription") || "We'd love to learn more about you! Help us generate perfect photos that reflect who you are."}
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
        {t("dashboardV2.continue") || "Continue"}
      </Button>
    </div>
  );
}

// Hair Color Step
function HairColorStep({ value, onChange, onNext }: { value: string; onChange: (value: string) => void; onNext: () => void }) {
  const { t } = useTranslation();

  const colors = [
    { value: "brown", label: t("dashboardV2.brown") || "Brown", color: "bg-amber-800" },
    { value: "black", label: t("dashboardV2.black") || "Black", color: "bg-black" },
    { value: "blonde", label: t("dashboardV2.blonde") || "Blonde", color: "bg-yellow-300" },
    { value: "gray", label: t("dashboardV2.gray") || "Gray", color: "bg-gray-400" },
    { value: "auburn", label: t("dashboardV2.auburn") || "Auburn", color: "bg-red-800" },
    { value: "red", label: t("dashboardV2.red") || "Red", color: "bg-red-500" },
    { value: "white", label: t("dashboardV2.white") || "White", color: "bg-white border" },
    { value: "other", label: t("dashboardV2.other") || "Other", color: "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" },
    { value: "bald", label: t("dashboardV2.bald") || "Bald", color: "bg-gray-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.whatIsYourHairColor") || "What is your hair color?"}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.hairColorDescription") || "Help us generate photos that truly represent you. If your hair color doesn't match any option exactly, choose the closest match."}
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
        {t("dashboardV2.continue") || "Continue"}
      </Button>
    </div>
  );
}

// Hair Length Step
function HairLengthStep({ value, onChange, onNext }: { value: string; onChange: (value: string) => void; onNext: () => void }) {
  const { t } = useTranslation();

  const lengths = [
    { value: "bald", label: t("dashboardV2.bald") || "Bald" },
    { value: "buzz", label: t("dashboardV2.buzzCut") || "Buzz cut" },
    { value: "short", label: t("dashboardV2.short") || "Short" },
    { value: "medium", label: t("dashboardV2.mediumLength") || "Medium length" },
    { value: "long", label: t("dashboardV2.long") || "Long" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.whatIsYourHairLength") || "What is the length of your hair?"}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.hairLengthDescription") || "Help us generate photos that truly represent you. If your hair length falls between options, choose the closest match."}
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4 mt-8">
        {lengths.map((length) => (
          <button
            key={length.value}
            onClick={() => onChange(length.value)}
            className={`p-6 rounded-lg border-2 transition-all aspect-square ${
              value === length.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 rounded-full bg-muted mb-2" />
              {value === length.value && (
                <Check className="h-5 w-5 text-primary mt-2" />
              )}
              <p className="text-sm font-semibold mt-2 text-center">{length.label}</p>
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
        {t("dashboardV2.continue") || "Continue"}
      </Button>
    </div>
  );
}

// Hair Style Step
function HairStyleStep({ value, onChange, onNext }: { value: string; onChange: (value: string) => void; onNext: () => void }) {
  const { t } = useTranslation();

  const styles = [
    { value: "straight", label: t("dashboardV2.straight") || "Straight" },
    { value: "wavy", label: t("dashboardV2.wavy") || "Wavy" },
    { value: "curly", label: t("dashboardV2.curly") || "Curly" },
    { value: "dreadlocks", label: t("dashboardV2.dreadlocks") || "Dreadlocks" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.whatIsYourHairType") || "What is your hair type?"}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.hairTypeDescription") || "Help us generate photos that truly represent you. If your hair type falls between options, choose the closest match."}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-8">
        {styles.map((style) => (
          <button
            key={style.value}
            onClick={() => onChange(style.value)}
            className={`p-6 rounded-lg border-2 transition-all ${
              value === style.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-muted mb-3" />
              {value === style.value && (
                <Check className="h-5 w-5 text-primary mb-2" />
              )}
              <p className="text-sm font-semibold">{style.label}</p>
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
        {t("dashboardV2.continue") || "Continue"}
      </Button>
    </div>
  );
}

// Ethnicity Step
function EthnicityStep({ value, onChange, onNext }: { value: string; onChange: (value: string) => void; onNext: () => void }) {
  const { t } = useTranslation();

  const ethnicities = [
    { value: "white", label: t("dashboardV2.whiteCaucasian") || "White / Caucasian" },
    { value: "black", label: t("dashboardV2.blackAfrican") || "Black / African descendant" },
    { value: "hispanic", label: t("dashboardV2.hispanicLatino") || "Hispanic, Latino, of Spanish origin" },
    { value: "asian-east", label: t("dashboardV2.asianEast") || "Central or East Asia" },
    { value: "asian-south", label: t("dashboardV2.asianSouth") || "South Asian (Indian, Pakistani, Bangladeshi, etc.)" },
    { value: "asian-southeast", label: t("dashboardV2.asianSoutheast") || "Southeast Asian (Vietnamese, Cambodian, etc.)" },
    { value: "middle-eastern", label: t("dashboardV2.middleEastern") || "Middle East, North Africa or Arab" },
    { value: "pacific-islander", label: t("dashboardV2.pacificIslander") || "Native Hawaiian or other Pacific Islander" },
    { value: "multiracial", label: t("dashboardV2.multiracial") || "Multiracial" },
    { value: "other", label: t("dashboardV2.other") || "Other" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.whatIsYourEthnicity") || "What is your ethnicity?"}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.ethnicityDescription") || "We'd love to learn more about you! Help us generate perfect photos that reflect who you are."}
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
        {t("dashboardV2.continue") || "Continue"}
      </Button>
    </div>
  );
}

// Body Type Step
function BodyTypeStep({ value, onChange, onNext }: { value: string; onChange: (value: string) => void; onNext: () => void }) {
  const { t } = useTranslation();

  const bodyTypes = [
    { value: "slim", label: t("dashboardV2.slim") || "Slim" },
    { value: "regular", label: t("dashboardV2.regular") || "Regular" },
    { value: "athletic", label: t("dashboardV2.athletic") || "Athletic" },
    { value: "medium-large", label: t("dashboardV2.mediumLarge") || "Medium large" },
    { value: "large", label: t("dashboardV2.large") || "Large" },
    { value: "plus", label: t("dashboardV2.plusSize") || "Plus size" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.whatIsYourBodyType") || "What is your body type?"}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.bodyTypeDescription") || "Help us generate photos that truly represent you. If you're between body type options, choose the closest match."}
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
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-muted mb-2" />
              {value === type.value && (
                <Check className="h-5 w-5 text-primary mt-1" />
              )}
              <p className="text-xs font-semibold mt-2 text-center">{type.label}</p>
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
        {t("dashboardV2.continue") || "Continue"}
      </Button>
    </div>
  );
}

// Attire Step
function AttireStep({ value, onChange, onNext }: { value: string[]; onChange: (value: string) => void; onNext: () => void }) {
  const { t } = useTranslation();

  const attires = [
    { value: "professional", label: t("dashboardV2.professionalBusiness") || "Professional Business", description: t("dashboardV2.professionalBusinessDesc") || "Formal shirts and suits with matching ties" },
    { value: "business-casual", label: t("dashboardV2.businessCasual") || "Business Casual", description: t("dashboardV2.businessCasualDesc") || "Blazers and jackets, long-sleeved shirts" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.selectYourAttire") || "Select your attire"}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.attireDescription") || "You will get an equal mix of results with the most popular attires."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {attires.map((attire) => {
          const isSelected = value.includes(attire.value);
          return (
            <button
              key={attire.value}
              onClick={() => onChange(attire.value)}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-20 h-20 rounded-lg bg-muted" />
                {isSelected && (
                  <Check className="h-6 w-6 text-primary" />
                )}
              </div>
              <h3 className="font-semibold text-lg mb-1">{attire.label}</h3>
              <p className="text-sm text-muted-foreground">{attire.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
        <p className="text-sm text-muted-foreground">
          {t("dashboardV2.attireNote") || "You can change your selections with our AI editing tools, even after your photos are generated."}
        </p>
      </div>

      <Button
        size="lg"
        onClick={onNext}
        disabled={value.length === 0}
        className="w-full mt-8 bg-primary hover:bg-primary/90 rounded-full"
      >
        {t("dashboardV2.continue") || "Continue"}
      </Button>
    </div>
  );
}

// Background Step
function BackgroundStep({ value, onChange, onNext }: { value: string[]; onChange: (value: string) => void; onNext: () => void }) {
  const { t } = useTranslation();

  const backgrounds = [
    { value: "city", label: t("dashboardV2.city") || "City", description: t("dashboardV2.cityDesc") || "Vibrant urban streets" },
    { value: "nature", label: t("dashboardV2.nature") || "Nature", description: t("dashboardV2.natureDesc") || "Outdoor parks or tree-lined streets" },
    { value: "office", label: t("dashboardV2.office") || "Office", description: t("dashboardV2.officeDesc") || "Bright and minimalist corporate office" },
    { value: "studio", label: t("dashboardV2.studio") || "Studio", description: t("dashboardV2.studioDesc") || "Professional photography studio" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.selectYourBackgrounds") || "Select your backgrounds"}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.backgroundDescription") || "Select the backgrounds you want! Most people choose all 4 backgrounds for greater variety."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {backgrounds.map((bg) => {
          const isSelected = value.includes(bg.value);
          return (
            <button
              key={bg.value}
              onClick={() => onChange(bg.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex flex-col items-center">
                <div className="w-full aspect-video rounded-lg bg-muted mb-3" />
                {isSelected && (
                  <Check className="h-5 w-5 text-primary mb-2" />
                )}
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
        {t("dashboardV2.continue") || "Continue"}
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
  fileInputRef: React.RefObject<HTMLInputElement>;
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
      toast.error(t("dashboardV2.maxFilesError") || "Too many files", {
        description: `You can select a maximum of ${maxFiles} images. You already have ${currentCount} and are trying to add ${files.length}.`,
      });
      return;
    }

    // Process each file
    for (const file of Array.from(files)) {
      // Check if we've reached the limit
      if (currentCount + newFiles.length >= maxFiles) {
        toast.error(t("dashboardV2.maxFilesError") || "Too many files", {
          description: `You can select a maximum of ${maxFiles} images`,
        });
        break;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        toast.error(t("dashboardV2.invalidFileType") || "Invalid file type", {
          description: `The file "${file.name}" is not a valid format. Please use PNG, JPG, HEIC, or WEBP.`,
        });
        continue;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        toast.error(t("dashboardV2.fileTooLarge") || "File too large", {
          description: `The file "${file.name}" is too large (maximum 120MB)`,
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
        `${newFiles.length} ${newFiles.length === 1 ? (t("dashboardV2.fileSelected") || "file selected") : (t("dashboardV2.filesSelected") || "files selected")}`,
        {
          description: t("dashboardV2.filesReady") || "Files are ready for upload",
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
    toast.success(t("dashboardV2.fileRemoved") || "File removed");
  };

  const handleContinue = async () => {
    if (uploadedFiles.length === 0) {
      toast.error(t("dashboardV2.noFilesSelected") || "No files selected", {
        description: t("dashboardV2.pleaseSelectFiles") || "Please select at least one photo to continue",
      });
      return;
    }

    if (uploadedFiles.length < 1) {
      toast.error(t("dashboardV2.minFilesError") || "Not enough files", {
        description: t("dashboardV2.pleaseSelectFiles") || "Please select at least 1 photo",
      });
      return;
    }

    if (!user?.id) {
      toast.error(t("dashboardV2.userNotAuthenticated") || "User not authenticated", {
        description: t("dashboardV2.pleaseLogin") || "Please log in to continue",
      });
      return;
    }

    // Generate images directly using new page2 API
    try {
      const loadingToast = toast.loading(t("dashboardV2.generatingImages") || "Generating images...");
      
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
        toast.success(t("dashboardV2.generationStarted") || "Image generation started!", {
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
        throw new Error("Failed to start generation: No batchId returned");
      }
    } catch (error: any) {
      toast.error(t("dashboardV2.generationError") || "Failed to generate images", {
        description: error?.message || "Please try again",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">{t("dashboardV2.uploadPhotos") || "Upload photos"}</h2>
        <p className="text-muted-foreground">
          {t("dashboardV2.uploadDescription") || "Now the fun begins! Select at least your best photos. Uploading a mix of close-ups, selfies, and medium-range photos can help the AI better capture your face and body type."}
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
        <p className="text-lg font-semibold mb-2">{t("dashboardV2.uploadFromComputer") || "Upload from your computer"}</p>
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
          {t("dashboardV2.uploadFiles") || "Upload files ↑"}
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          {t("dashboardV2.uploadFormats") || "or drag and drop your photos PNG, JPG, HEIC, WEBP up to 120MB"}
        </p>
      </div>

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">
              {t("dashboardV2.uploadedImages") || "Uploaded images"} {uploadedFiles.length} of {maxFiles}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                uploadedFiles.forEach(f => URL.revokeObjectURL(f.preview));
                setUploadedFiles([]);
              }}
            >
              {t("dashboardV2.clearAll") || "Clear all"}
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
                  {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedFiles.length === 0 && (
        <div className="mt-8">
          <p className="text-sm text-muted-foreground mb-4 text-center">
            {t("dashboardV2.uploadedImages") || "Uploaded images"} 0 of {maxFiles}
          </p>
        </div>
      )}

      <Button
        size="lg"
        onClick={handleContinue}
        disabled={uploadedFiles.length === 0}
        className="w-full mt-8 bg-primary hover:bg-primary/90 rounded-full disabled:opacity-50"
      >
        {t("dashboardV2.continue") || "Continue"}
      </Button>
    </div>
  );
}

