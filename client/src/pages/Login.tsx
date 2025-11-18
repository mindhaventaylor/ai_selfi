import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, APP_LOGO } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Sparkles, Shield, Zap } from "lucide-react";

export default function Login() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Se já estiver autenticado, redirecionar para dashboard
  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img src={APP_LOGO} alt="AISelfi" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-3xl font-bold">Bem-vindo ao AISelfi</CardTitle>
          <CardDescription className="text-base">
            Crie fotos profissionais com IA em minutos
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Fotos Profissionais com IA</h4>
                <p className="text-xs text-muted-foreground">Mais de 100 estilos disponíveis</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Resultados em Minutos</h4>
                <p className="text-xs text-muted-foreground">Sem espera, sem fotógrafo</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">100% Seguro e Privado</h4>
                <p className="text-xs text-muted-foreground">Suas fotos são apenas suas</p>
              </div>
            </div>
          </div>

          {/* Login Button */}
          <Button 
            asChild 
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            <a href={getLoginUrl()}>
              Iniciar Sessão
            </a>
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ao continuar, você concorda com nossos{" "}
            <a href="#" className="underline hover:text-primary">Termos de Serviço</a>
            {" "}e{" "}
            <a href="#" className="underline hover:text-primary">Política de Privacidade</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
