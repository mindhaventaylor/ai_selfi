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
import { toast } from "sonner";

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
}

export default function TrainModel() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [modelName, setModelName] = useState("");
  const [gender, setGender] = useState<"hombre" | "mujer" | "">("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showCreditsAlert, setShowCreditsAlert] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For now, use regular credits as training credits (can be separated later)
  const trainingCredits = user?.credits ?? 0;
  const hasTrainingCredits = trainingCredits > 0;

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    // Allow file selection even without credits - validation will happen on upload
    const newFiles: UploadedFile[] = [];
    const maxFiles = 5;
    const currentCount = uploadedFiles.length;

    Array.from(files).forEach((file) => {
      if (currentCount + newFiles.length >= maxFiles) {
        toast.error(t("trainModel.max5Images"), {
          description: "Você pode selecionar no máximo 5 imagens",
        });
        return;
      }
      
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
        toast.error(t("trainModel.onlyJpgPng"), {
          description: `O arquivo "${file.name}" não é um formato válido`,
        });
        return;
      }

      // Validate file size (3MB)
      if (file.size > 3 * 1024 * 1024) {
        toast.error(t("trainModel.fileTooLarge"), {
          description: `O arquivo "${file.name}" é muito grande (máximo 3MB)`,
        });
        return;
      }

      const id = `${Date.now()}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      newFiles.push({ id, file, preview });
    });

    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} ${newFiles.length === 1 ? "imagem selecionada" : "imagens selecionadas"}`, {
        description: "As imagens estão prontas para envio",
      });
    }
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
  const uploadImagesMutation = trpc.model.uploadTrainingImages.useMutation();

  const handleUpload = async () => {
    if (isUploading) {
      return;
    }

    if (!modelName.trim()) {
      toast.error(t("trainModel.pleaseEnterModelName"), {
        description: "Por favor, digite um nome para o modelo",
      });
      return;
    }

    if (!gender) {
      toast.error(t("trainModel.pleaseSelectGender"), {
        description: "Por favor, selecione o gênero do modelo",
      });
      return;
    }

    if (uploadedFiles.length === 0) {
      toast.error(t("trainModel.pleaseUploadAtLeastOne"), {
        description: "Você precisa selecionar pelo menos uma imagem",
      });
      return;
    }

    if (uploadedFiles.length > 5) {
      toast.error(t("trainModel.max5Images"), {
        description: "Você pode selecionar no máximo 5 imagens",
      });
      return;
    }

    if (!user?.id) {
      toast.error("Usuário não autenticado", {
        description: "Por favor, faça login novamente",
      });
      return;
    }

    // Check credits only when actually uploading (not when selecting files)
    if (!hasTrainingCredits) {
      toast.warning(t("trainModel.needTrainingCredits"), {
        description: "Você precisa de créditos para treinar modelos",
        action: {
          label: t("trainModel.buyCredits") || "Comprar Créditos",
          onClick: () => setLocation("/dashboard/credits/buy"),
        },
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload images via backend (bypasses RLS by using service role)
      // Convert files to base64 and send to backend
      const imagesToUpload = await Promise.all(
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

      // Upload via backend (uses service role, bypasses RLS)
      const { urls: uploadedUrls } = await uploadImagesMutation.mutateAsync({
        images: imagesToUpload,
      });

      // Ensure we have at least one image
      if (uploadedUrls.length === 0) {
        throw new Error(t("trainModel.couldNotUploadImages"));
      }

      // Create model record in database
      // IMPORTANT: The first image uploaded (uploadedFiles[0]) becomes uploadedUrls[0]
      // This first image will be used as previewImageUrl in the model
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
      
      toast.success(t("trainModel.uploadSuccess") || "Modelo criado com sucesso!", {
        description: "Suas imagens foram enviadas e o modelo está sendo treinado",
      });
    } catch (error: any) {
      const errorMessage = error?.message || t("trainModel.errorUploadingModel") || "Erro ao fazer upload do modelo";
      
      // Check if it's a session/auth error
      if (errorMessage.includes("sessão") || errorMessage.includes("session") || errorMessage.includes("expired") || errorMessage.includes("autenticação") || errorMessage.includes("authentication")) {
        toast.error("Sessão expirada", {
          description: "Sua sessão expirou. Por favor, faça login novamente.",
          action: {
            label: "Fazer Login",
            onClick: async () => {
              await logout();
            },
          },
          duration: 10000,
        });
      } else {
        toast.error("Erro ao criar modelo", {
          description: errorMessage,
        });
      }
    } finally {
      setIsUploading(false);
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
                className={`border-2 border-dashed rounded-lg p-8 md:p-12 transition-colors cursor-pointer relative ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
                style={{ minHeight: '200px' }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDrop(e);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDragOver(e);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDragLeave();
                }}
              >
                <input
                  id="file-upload-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  style={{ fontSize: 0 }}
                  onChange={(e) => {
                    handleFileSelect(e.target.files);
                    // Reset input to allow selecting same file again
                    e.target.value = '';
                  }}
                />
                <div 
                  className="text-center space-y-4 w-full h-full select-none pointer-events-none"
                >
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
                    {uploadedFiles.length > 0 && (
                      <p className="text-sm text-green-500 font-medium mt-2">
                        {uploadedFiles.length} {uploadedFiles.length === 1 ? "imagem selecionada" : "imagens selecionadas"}
                      </p>
                    )}
                    {!hasTrainingCredits && uploadedFiles.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {t("trainModel.needTrainingCredits")} {t("trainModel.buyCredits")} para fazer upload
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Images Section */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t("trainModel.previewImages")}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {uploadedFiles.length} {uploadedFiles.length === 1 ? "imagem pronta para enviar" : "imagens prontas para enviar"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    As imagens estão apenas no seu navegador. Clique em "Enviar Imagens" para fazer upload.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={file.id}
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-border group"
                      >
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.id);
                          }}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remover imagem"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                          {file.file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Summary */}
              {uploadedFiles.length > 0 && modelName && gender && !isUploading && (
                <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">Resumo do que será enviado:</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Modelo: <span className="font-medium text-foreground">{modelName}</span></p>
                    <p>• Tipo: <span className="font-medium text-foreground">{gender === "hombre" ? t("trainModel.male") : t("trainModel.female")}</span></p>
                    <p>• Imagens: <span className="font-medium text-foreground">{uploadedFiles.length} {uploadedFiles.length === 1 ? "imagem" : "imagens"}</span></p>
                    <p className="text-xs mt-2 text-muted-foreground">
                      As imagens serão enviadas para o servidor e o modelo será criado no banco de dados.
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isUploading) {
                      handleUpload();
                    }
                  }}
                  disabled={uploadedFiles.length === 0 || !modelName || !gender || isUploading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t("trainModel.uploading") || "Enviando..."}
                    </>
                  ) : (
                    <>
                      {t("trainModel.uploadImagesButton")}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
                {/* Help text when button is disabled */}
                {(uploadedFiles.length === 0 || !modelName || !gender) && !isUploading && (
                  <p className="text-xs text-muted-foreground text-center">
                    {uploadedFiles.length === 0 && t("trainModel.pleaseUploadAtLeastOne")}
                    {uploadedFiles.length > 0 && !modelName && t("trainModel.pleaseEnterModelName")}
                    {uploadedFiles.length > 0 && modelName && !gender && t("trainModel.pleaseSelectGender")}
                  </p>
                )}
              </div>

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

