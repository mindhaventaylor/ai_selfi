import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, LogOut } from "lucide-react";

export default function SettingsGeneral() {
  const { logout } = useAuth();
  const [language, setLanguage] = useState("es");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Ajustes</h1>
        </div>

        <div className="space-y-6">
          {/* Language Section */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Idioma</h2>
                    <p className="text-sm text-muted-foreground">
                      Elige tu idioma preferido
                    </p>
                  </div>
                </div>

                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">
                      <div className="flex items-center gap-2">
                        <span>🇪🇸</span>
                        <span>Español</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pt">
                      <div className="flex items-center gap-2">
                        <span>🇧🇷</span>
                        <span>Português</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="en">
                      <div className="flex items-center gap-2">
                        <span>🇬🇧</span>
                        <span>English</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Account Section */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Cuenta</h2>
                    <p className="text-sm text-muted-foreground">
                      Gestiona tu cuenta y sesión
                    </p>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  className="rounded-full"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

