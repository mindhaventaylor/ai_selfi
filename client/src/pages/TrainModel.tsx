import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X, ArrowRight, XCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
}

export default function TrainModel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [modelName, setModelName] = useState("");
  const [gender, setGender] = useState<"hombre" | "mujer" | "">("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showCreditsAlert, setShowCreditsAlert] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For now, use regular credits as training credits (can be separated later)
  const trainingCredits = user?.credits ?? 0;
  const hasTrainingCredits = trainingCredits > 0;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    // Check if user has training credits
    if (!hasTrainingCredits) {
      setShowCreditsAlert(true);
      return;
    }

    const newFiles: UploadedFile[] = [];
    const maxFiles = 5;
    const currentCount = uploadedFiles.length;

    Array.from(files).forEach((file) => {
      if (currentCount + newFiles.length >= maxFiles) return;
      
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
        alert(t("trainModel.onlyJpgPng"));
        return;
      }

      // Validate file size (3MB)
      if (file.size > 3 * 1024 * 1024) {
        alert(t("trainModel.fileTooLarge"));
        return;
      }

      const id = `${Date.now()}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      newFiles.push({ id, file, preview });
    });

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setShowCreditsAlert(false);
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
  };

  const createModelMutation = trpc.model.create.useMutation();

  const handleUpload = async () => {
    if (!modelName.trim()) {
      alert(t("trainModel.pleaseEnterModelName"));
      return;
    }

    if (!gender) {
      alert(t("trainModel.pleaseSelectGender"));
      return;
    }

    if (uploadedFiles.length === 0) {
      alert(t("trainModel.pleaseUploadAtLeastOne"));
      return;
    }

    if (uploadedFiles.length > 5) {
      alert(t("trainModel.max5Images"));
      return;
    }

    try {
      // Upload images to Supabase Storage
      // IMPORTANT: Upload in order to preserve the sequence - first uploaded = first in array
      const uploadedUrls: string[] = [];
      const baseTimestamp = Date.now();
      
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i].file;
        // Use baseTimestamp + index to ensure order is preserved
        const fileName = `training/${user?.id}/${baseTimestamp}-${i}-${file.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("model-training-images")
          .upload(fileName, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          throw new Error(`${t("trainModel.errorUploadingImage")}: ${uploadError.message}`);
        }

        // Get signed URL for private bucket (valid for 1 hour)
        // For private buckets, we need signed URLs instead of public URLs
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("model-training-images")
          .createSignedUrl(fileName, 3600); // 1 hour expiry

        if (signedUrlError || !signedUrlData) {
          console.error("Error creating signed URL:", signedUrlError);
          throw new Error(`${t("trainModel.errorCreatingSignedUrl")}: ${signedUrlError?.message || 'Unknown error'}`);
        }

        uploadedUrls.push(signedUrlData.signedUrl);
      }

      // Ensure we have at least one image
      if (uploadedUrls.length === 0) {
        throw new Error(t("trainModel.couldNotUploadImages"));
      }

      // Create model record in database
      // IMPORTANT: The first image uploaded (uploadedFiles[0]) becomes uploadedUrls[0]
      // This first image will be used as previewImageUrl in the model
      console.log("Uploading model with images:", {
        firstImage: uploadedUrls[0],
        totalImages: uploadedUrls.length,
        firstFile: uploadedFiles[0]?.file?.name
      });
      
      await createModelMutation.mutateAsync({
        name: modelName,
        gender: gender as "hombre" | "mujer",
        trainingImageUrls: uploadedUrls, // Array order matches uploadedFiles order - [0] is first uploaded
        trainingCreditsUsed: 0, // For now, training is free
      });

      // Show success modal
      setShowSuccessModal(true);
      
      // Reset form
      setModelName("");
      setGender("");
      setUploadedFiles([]);
    } catch (error: any) {
      console.error("Error uploading model:", error);
      alert(error?.message || t("trainModel.errorUploadingModel"));
    }
  };

  // Good photos examples
  const goodPhotos = [
    "/image.webp",
    "/image_1.webp",
    "/image_10.webp",
    "/image_100.jpg",
    "/image_101.jpg",
    "/image_102.jpg",
  ];

  // Bad photos examples (with red X)
  const badPhotos = [
    "/image.webp",
    "/image_1.webp",
    "/image_10.webp",
    "/image_100.jpg",
    "/image_101.jpg",
    "/image_102.jpg",
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <h1 className="text-3xl md:text-4xl font-bold mb-8 flex items-center gap-2">
          {t("trainModel.title")}
          <ArrowRight className="w-6 h-6" />
        </h1>

        {/* Upload Section */}
        <Card className="bg-card/50 border-border mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="space-y-6">
              {/* Section Title */}
              <div>
                <h2 className="text-xl font-bold mb-2">{t("trainModel.uploadImages")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("trainModel.uploadImagesDesc")}
                </p>
              </div>

              {/* Model Name and Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model-name">{t("trainModel.modelName")}</Label>
                  <Input
                    id="model-name"
                    type="text"
                    placeholder={t("trainModel.enterModelName")}
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">{t("trainModel.type")}</Label>
                  <Select value={gender} onValueChange={(value: "hombre" | "mujer") => setGender(value)}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder={t("trainModel.selectGender")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hombre">{t("trainModel.male")}</SelectItem>
                      <SelectItem value="mujer">{t("trainModel.female")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 md:p-12 transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => {
                  if (!hasTrainingCredits) {
                    setShowCreditsAlert(true);
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-medium mb-2">{t("trainModel.uploadYourImages")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("trainModel.orDragAndDrop")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("trainModel.minMaxImages")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Images Section */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3 relative">
                  <h3 className="text-lg font-semibold">{t("trainModel.previewImages")}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-border group"
                      >
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.id);
                          }}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Credits Alert Popup */}
                  {showCreditsAlert && (
                    <div className="absolute top-0 right-0 bg-[#F5F5DC] border border-border rounded-lg p-4 shadow-lg z-10 max-w-xs">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground mb-3">
                            {t("trainModel.needTrainingCredits")}
                          </p>
                          <Button
                            onClick={() => setLocation("/dashboard/credits/buy")}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                            size="sm"
                          >
                            {t("trainModel.buyCredits")}
                          </Button>
                        </div>
                        <button
                          onClick={() => setShowCreditsAlert(false)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={uploadedFiles.length === 0 || !modelName || !gender}
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                {t("trainModel.uploadImagesButton")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {/* Training Credits */}
              <p className="text-sm text-muted-foreground text-center">
                {t("trainModel.availableTrainingCredits")}: {trainingCredits}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6">
              {t("trainModel.tipsForBestResults")}
            </h2>

            <div className="space-y-8">
              {/* Good Photos */}
              <div className="space-y-4">
                <div className="inline-block px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg">
                  <span className="text-green-400 font-semibold">{t("trainModel.goodPhotos")}</span>
                </div>
                <ul className="space-y-2 text-sm list-disc list-inside text-muted-foreground">
                  <li>{t("trainModel.recentPhotos")}</li>
                  <li>{t("trainModel.mixCloseupsFullBody")}</li>
                  <li>{t("trainModel.preferablyHighQuality")}</li>
                  <li>{t("trainModel.varietyAnglesExpressions")}</li>
                  <li>{t("trainModel.onlyOnePerson")}</li>
                  <li className="font-semibold text-foreground mt-2">
                    {t("trainModel.tipSelectGoodPhotos")}
                  </li>
                </ul>
                {/* Good Photos Examples */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
                  {goodPhotos.map((photo, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-green-500/30"
                    >
                      <img
                        src={photo}
                        alt={`Good photo example ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://picsum.photos/200/200?random=${index}`;
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Bad Photos */}
              <div className="space-y-4">
                <div className="inline-block px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <span className="text-red-400 font-semibold">{t("trainModel.badPhotos")}</span>
                </div>
                <ul className="space-y-2 text-sm list-disc list-inside text-muted-foreground">
                  <li>{t("trainModel.screenshotsZoomInstagram")}</li>
                  <li>{t("trainModel.badLightBlurry")}</li>
                  <li>{t("trainModel.groupPhotosOthers")}</li>
                  <li>{t("trainModel.funnyExpressions")}</li>
                  <li>{t("trainModel.veryOldPhotos")}</li>
                  <li>{t("trainModel.subjectCutOff")}</li>
                  <li>{t("trainModel.accessoriesGlasses")}</li>
                  <li>{t("trainModel.busyBackgrounds")}</li>
                  <li>{t("trainModel.photosFromFarAway")}</li>
                  <li className="font-semibold text-foreground mt-2">
                    {t("trainModel.tipDontSelectBadPhotos")}
                  </li>
                </ul>
                {/* Bad Photos Examples with Red X */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
                  {badPhotos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-red-500/30"
                    >
                      <img
                        src={photo}
                        alt={`Bad photo example ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://picsum.photos/200/200?random=${index + 10}`;
                        }}
                      />
                      {/* Red X Mark */}
                      <div className="absolute top-1 right-1 bg-red-500 rounded-full p-1">
                        <XCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-white text-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {t("trainModel.uploadSuccess")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <p className="text-center text-sm text-muted-foreground">
              {t("trainModel.imagesUploadedSuccessfully")}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg"
              >
                {t("trainModel.close")}
              </Button>
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  setLocation("/dashboard/generate");
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
              >
                {t("trainModel.createMyPhotos")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

