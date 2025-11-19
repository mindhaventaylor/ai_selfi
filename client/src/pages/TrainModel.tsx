import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
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
        alert("Solo se permiten archivos JPG o PNG");
        return;
      }

      // Validate file size (3MB)
      if (file.size > 3 * 1024 * 1024) {
        alert("El archivo es demasiado grande. Máximo 3MB por imagen.");
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

  const handleUpload = () => {
    if (!modelName.trim()) {
      alert("Por favor ingresa un nombre para el modelo");
      return;
    }

    if (!gender) {
      alert("Por favor selecciona el género");
      return;
    }

    if (uploadedFiles.length === 0) {
      alert("Por favor sube al menos una imagen");
      return;
    }

    if (uploadedFiles.length > 5) {
      alert("Máximo 5 imágenes permitidas");
      return;
    }

    // TODO: Implement actual upload logic
    console.log("Uploading model:", {
      modelName,
      gender,
      files: uploadedFiles.map((f) => f.file),
    });

    // Show success modal
    setShowSuccessModal(true);
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
          Entrenar Nuevo Modelo
          <ArrowRight className="w-6 h-6" />
        </h1>

        {/* Upload Section */}
        <Card className="bg-card/50 border-border mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="space-y-6">
              {/* Section Title */}
              <div>
                <h2 className="text-xl font-bold mb-2">Sube tus imágenes</h2>
                <p className="text-sm text-muted-foreground">
                  Sube de 1 a 5 fotos de la persona que quieres generar. Estas
                  imágenes se usarán para entrenar tu modelo.
                </p>
              </div>

              {/* Model Name and Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model-name">Nombre del Modelo</Label>
                  <Input
                    id="model-name"
                    type="text"
                    placeholder="Ingresa el nombre del modelo"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Tipo</Label>
                  <Select value={gender} onValueChange={(value: "hombre" | "mujer") => setGender(value)}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Selecciona género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hombre">Hombre</SelectItem>
                      <SelectItem value="mujer">Mujer</SelectItem>
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
                    <p className="text-lg font-medium mb-2">Sube tus imágenes</p>
                    <p className="text-sm text-muted-foreground">
                      o arrastra y suelta. JPG o PNG hasta 3MB cada una
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Mínimo 1 imagen, máximo 5 imágenes
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Images Section */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3 relative">
                  <h3 className="text-lg font-semibold">Preview Images</h3>
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
                            Necesitas créditos de entrenamiento para subir imágenes.
                          </p>
                          <Button
                            onClick={() => setLocation("/dashboard/credits/buy")}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                            size="sm"
                          >
                            Comprar Créditos
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
                Subir Imágenes
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {/* Training Credits */}
              <p className="text-sm text-muted-foreground text-center">
                Créditos de entrenamiento disponibles: {trainingCredits}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6">
              Consejos para obtener los mejores resultados
            </h2>

            <div className="space-y-8">
              {/* Good Photos */}
              <div className="space-y-4">
                <div className="inline-block px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg">
                  <span className="text-green-400 font-semibold">Fotos Buenas</span>
                </div>
                <ul className="space-y-2 text-sm list-disc list-inside text-muted-foreground">
                  <li>Fotos recientes de los últimos 2 años</li>
                  <li>Mezcla de primeros planos y fotos de cuerpo entero</li>
                  <li>Preferiblemente fotos de alta calidad</li>
                  <li>Variedad de ángulos, expresiones y outfits</li>
                  <li>Solo una persona en la foto</li>
                  <li className="font-semibold text-foreground mt-2">
                    CONSEJO: Selecciona fotos donde te veas BIEN
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
                  <span className="text-red-400 font-semibold">Fotos Malas</span>
                </div>
                <ul className="space-y-2 text-sm list-disc list-inside text-muted-foreground">
                  <li>Capturas de pantalla de Zoom, Instagram o Facebook</li>
                  <li>Mala luz, borrosas, pixeladas, baja calidad, fuera de foco o con mucho maquillaje</li>
                  <li>Fotos grupales, otras personas o mascotas</li>
                  <li>Expresiones graciosas</li>
                  <li>Fotos muy antiguas que ya no te representan</li>
                  <li>Sujeto cortado o no completamente visible</li>
                  <li>Usar accesorios como gafas, sombreros o máscaras</li>
                  <li>Fondos ocupados o escenas con patrones</li>
                  <li>Fotos tomadas desde muy lejos</li>
                  <li className="font-semibold text-foreground mt-2">
                    CONSEJO: NO selecciones fotos donde te veas MAL
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
              ¡Subida Exitosa! 👏
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <p className="text-center text-sm text-muted-foreground">
              Tus imágenes se han subido exitosamente y tu modelo está siendo
              entrenado. ¡Puedes empezar a crear tus fotos ahora mismo!
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  setLocation("/dashboard/generate");
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
              >
                Crear Mis Fotos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

