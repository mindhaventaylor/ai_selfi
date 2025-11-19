import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FlaskConical,
  Sparkles,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Image as ImageIcon,
} from "lucide-react";

export default function ViewModels() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [filterStatus, setFilterStatus] = useState<"all" | "training" | "ready" | "failed">("all");
  
  // Fetch models from backend
  const { data: modelsData, isLoading, refetch } = trpc.model.list.useQuery();
  const deleteModelMutation = trpc.model.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const models = modelsData || [];

  const filteredModels =
    filterStatus === "all"
      ? models
      : models.filter((model) => model.status === filterStatus);

  const getStatusBadge = (status: Model["status"]) => {
    switch (status) {
      case "ready":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t("viewModels.ready")}
          </Badge>
        );
      case "training":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
            <Clock className="w-3 h-3 mr-1 animate-spin" />
            {t("viewModels.training")}
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
            <XCircle className="w-3 h-3 mr-1" />
            {t("viewModels.failed")}
          </Badge>
        );
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleUseModel = (modelId: number) => {
    // Navigate to generate page with model selected
    setLocation(`/dashboard/generate?modelId=${modelId}`);
  };

  const handleDeleteModel = async (modelId: number) => {
    if (confirm(t("viewModels.areYouSureDeleteModel"))) {
      try {
        await deleteModelMutation.mutateAsync({ modelId });
      } catch (error: any) {
        alert(error?.message || t("viewModels.errorDeletingModel"));
      }
    }
  };

  const handleRetrainModel = (modelId: number) => {
    // Navigate to train page with model data
    setLocation(`/dashboard/models/train?retrain=${modelId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {t("viewModels.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("viewModels.subtitle")}
            </p>
          </div>
          <Button
            onClick={() => setLocation("/dashboard/models/train")}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full h-11 px-6 font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t("viewModels.trainNewModel")}
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <Select value={filterStatus} onValueChange={(value: typeof filterStatus) => setFilterStatus(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("viewModels.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("viewModels.allModels")}</SelectItem>
              <SelectItem value="ready">{t("viewModels.ready")}</SelectItem>
              <SelectItem value="training">{t("viewModels.training")}</SelectItem>
              <SelectItem value="failed">{t("viewModels.failed")}</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filteredModels.length} {filteredModels.length === 1 ? t("viewModels.model") : t("viewModels.models")}
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-muted-foreground">{t("viewModels.loadingModels")}</p>
            </div>
          </div>
        )}

        {/* Models Grid */}
        {!isLoading && filteredModels.length === 0 ? (
          <Card className="bg-card/50 border-border">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  <FlaskConical className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {filterStatus === "all"
                      ? t("viewModels.noTrainedModels")
                      : `${t("viewModels.noModelsWithStatus")} "${filterStatus}"`}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {filterStatus === "all"
                      ? t("viewModels.startTrainingFirst")
                      : t("viewModels.tryAnotherFilter")}
                  </p>
                  {filterStatus === "all" && (
                    <Button
                      onClick={() => setLocation("/dashboard/models/train")}
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      {t("viewModels.trainFirstModel")}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : !isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((model) => (
              <Card
                key={model.id}
                className="bg-card/50 border-border hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Preview Image */}
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border-2 border-border">
                      {model.previewImageUrl ? (
                        <img
                          src={model.previewImageUrl}
                          alt={model.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://picsum.photos/400/400?random=${model.id}`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      {/* Status Badge Overlay */}
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(model.status)}
                      </div>
                    </div>

                    {/* Model Info */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold">{model.name}</h3>
                      </div>
                      {model.gender && (
                        <p className="text-sm text-muted-foreground capitalize">
                          {model.gender}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {t("viewModels.created")}: {formatDate(model.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {model.status === "ready" && (
                        <Button
                          onClick={() => handleUseModel(model.id)}
                          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white rounded-full text-sm"
                          size="sm"
                        >
                          <Sparkles className="w-4 h-4 mr-1" />
                          {t("viewModels.useModel")}
                        </Button>
                      )}
                      {model.status === "failed" && (
                        <Button
                          onClick={() => handleRetrainModel(model.id)}
                          variant="outline"
                          className="flex-1 rounded-full text-sm"
                          size="sm"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          {t("viewModels.retrain")}
                        </Button>
                      )}
                      {model.status === "training" && (
                        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1 animate-spin" />
                          {t("viewModels.training")}...
                        </div>
                      )}
                      <Button
                        onClick={() => handleDeleteModel(model.id)}
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                        disabled={deleteModelMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

