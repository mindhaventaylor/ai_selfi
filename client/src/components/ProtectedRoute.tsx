import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to landing page with returnUrl and variant params
      const currentPath = window.location.pathname + window.location.search;
      const params = new URLSearchParams(window.location.search);
      const variant = params.get("variant");
      
      let redirectUrl = `/?returnUrl=${encodeURIComponent(currentPath)}`;
      if (variant) {
        redirectUrl += `&variant=${variant}`;
      }
      
      setLocation(redirectUrl);
    }
  }, [user, loading, setLocation]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderizar nada (vai redirecionar)
  if (!user) {
    return null;
  }

  // Usuário autenticado, renderizar conteúdo
  return <>{children}</>;
}
