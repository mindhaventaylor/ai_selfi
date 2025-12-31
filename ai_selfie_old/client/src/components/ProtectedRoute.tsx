import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Only redirect if user is not authenticated, not loading, and we haven't redirected yet
    if (!loading && !user && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true; // Set immediately to prevent multiple calls
      
      // Redirect to login page instead of home to avoid loops
      const currentPath = window.location.pathname + window.location.search;
      
      // Use login page with returnUrl to avoid redirect loops
      const redirectUrl = `/login?returnUrl=${encodeURIComponent(currentPath)}`;
      
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
