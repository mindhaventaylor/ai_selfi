import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Image as ImageIcon, Sparkles, Clock, CheckCircle2, LogOut, User } from "lucide-react";

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  // Mock data
  const mockPhotos = [
    { id: 1, url: "/image.webp", style: "Professional", status: "completed" },
    { id: 2, url: "/image_1.webp", style: "Casual", status: "completed" },
    { id: 3, url: "/image_10.webp", style: "Business", status: "completed" },
    { id: 4, url: "/image_100.jpg", style: "Creative", status: "processing" },
    { id: 5, url: "/image_101.jpg", style: "Formal", status: "completed" },
    { id: 6, url: "/image_102.jpg", style: "Modern", status: "completed" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Gerencie suas fotos profissionais com IA</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
              <User className="w-5 h-5" />
              <span className="font-medium">{user?.name || user?.email || "Usuário"}</span>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fotos Geradas</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48</div>
              <p className="text-xs text-muted-foreground">+12 este mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estilos Disponíveis</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">100+</div>
              <p className="text-xs text-muted-foreground">Profissionais e criativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5 min</div>
              <p className="text-xs text-muted-foreground">Por sessão</p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Criar Nova Sessão de Fotos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Faça upload das suas selfies</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Arraste e solte ou clique para selecionar 10-20 fotos suas
              </p>
              <Button size="lg">
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Fotos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Photos Gallery */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Suas Fotos Profissionais</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Baixar Todas
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mockPhotos.map((photo) => (
                <div key={photo.id} className="group relative">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                    <img
                      src={photo.url}
                      alt={photo.style}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    {photo.status === "completed" ? (
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Pronta
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Processando
                      </Badge>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary">
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="mt-2 text-sm font-medium">{photo.style}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Style Selection Preview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Escolha Seus Estilos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                "Profissional",
                "Executivo",
                "Casual",
                "Criativo",
                "Formal",
                "Moderno",
                "Empresarial",
                "LinkedIn",
                "Artístico",
                "Minimalista",
                "Colorido",
                "Outdoor",
              ].map((style, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xs">{style}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
