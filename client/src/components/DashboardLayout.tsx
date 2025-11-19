import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  HelpCircle,
  FlaskConical,
  PlusCircle,
  Image as ImageIcon,
  Sparkles,
  CreditCard,
  Settings,
  ChevronRight,
  ChevronDown,
  DollarSign,
  LogOut,
  PanelLeft,
  Clock,
  Linkedin,
  Twitter,
  Youtube,
  Instagram,
  Globe,
  BookOpen,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const menuItems = [
  { icon: HelpCircle, label: "Start Here", path: "/dashboard/start" },
  { icon: FlaskConical, label: "Models", path: "/dashboard/models" },
  { icon: PlusCircle, label: "Create", path: "/dashboard" },
  { icon: ImageIcon, label: "Gallery", path: "/dashboard/gallery" },
  { icon: Sparkles, label: "Funciones PRO", path: "/dashboard/pro" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="relative">
                <img
                  src={APP_LOGO}
                  alt={APP_TITLE}
                  className="h-20 w-20 rounded-xl object-cover shadow"
                />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">
                Please sign in to continue
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              window.location.href = "/login";
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();
  const [creditsOpen, setCreditsOpen] = useState(() => {
    return location.startsWith("/dashboard/credits");
  });
  const [settingsOpen, setSettingsOpen] = useState(() => {
    return location.startsWith("/dashboard/settings");
  });
  const [supportOpen, setSupportOpen] = useState(() => {
    return location.startsWith("/dashboard/support");
  });
  const [languageOpen, setLanguageOpen] = useState(false);

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    // Auto-open credits dropdown when on credits pages
    if (location.startsWith("/dashboard/credits")) {
      setCreditsOpen(true);
    }
    // Auto-open settings dropdown when on settings pages
    if (location.startsWith("/dashboard/settings")) {
      setSettingsOpen(true);
    }
    // Auto-open support dropdown when on support pages
    if (location.startsWith("/dashboard/support")) {
      setSupportOpen(true);
    }
  }, [location]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-auto p-4 pb-6">
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
              {isCollapsed ? (
                <div className="relative h-8 w-8 shrink-0 group">
                  <img
                    src={APP_LOGO}
                    className="h-8 w-8 rounded-lg object-cover"
                    alt="Logo"
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 flex items-center justify-center bg-accent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <PanelLeft className="h-4 w-4 text-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <img
                    src={APP_LOGO}
                    className="h-10 w-10 rounded-lg object-cover shrink-0"
                    alt="Logo"
                  />
                  <span className="font-bold text-lg bg-gradient-to-r from-pink-400 to-orange-500 bg-clip-text text-transparent">
                    Alselfi.es
                  </span>
                </>
              )}
            </div>
            
            {/* User Profile Section */}
            {!isCollapsed && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarImage src={user?.avatar_url} alt={user?.name} />
                    <AvatarFallback className="text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">0 Credits</span>
                </div>
              </div>
            )}
          </SidebarHeader>

          <SidebarContent className="gap-0 flex-1 overflow-y-auto">
            <SidebarMenu className="px-2 py-2">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-10 transition-all font-normal"
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              
              {/* Credits with Dropdown */}
              <SidebarMenuItem>
                <Collapsible open={creditsOpen} onOpenChange={setCreditsOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Credits"
                      className="h-10 transition-all font-normal w-full"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Credits</span>
                      {creditsOpen ? (
                        <ChevronDown className="ml-auto h-4 w-4" />
                      ) : (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pl-6 py-1 space-y-1">
                      <button 
                        onClick={() => setLocation("/dashboard/credits/buy")}
                        className={`text-sm w-full text-left px-2 py-1 rounded-md hover:bg-accent transition-colors ${
                          location === "/dashboard/credits/buy" 
                            ? "text-foreground bg-accent font-medium" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Buy Credits
                      </button>
                      <button 
                        onClick={() => setLocation("/dashboard/credits/gift-cards")}
                        className={`text-sm w-full text-left px-2 py-1 rounded-md hover:bg-accent transition-colors ${
                          location === "/dashboard/credits/gift-cards" 
                            ? "text-foreground bg-accent font-medium" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Gift Cards
                      </button>
                      <button 
                        onClick={() => setLocation("/dashboard/credits/empresas")}
                        className={`text-sm w-full text-left px-2 py-1 rounded-md hover:bg-accent transition-colors ${
                          location === "/dashboard/credits/empresas" 
                            ? "text-foreground bg-accent font-medium" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Empresas
                      </button>
                      <button 
                        onClick={() => setLocation("/dashboard/credits/coupons")}
                        className={`text-sm w-full text-left px-2 py-1 rounded-md hover:bg-accent transition-colors ${
                          location === "/dashboard/credits/coupons" 
                            ? "text-foreground bg-accent font-medium" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Coupons
                      </button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 space-y-2 border-t border-border">
            {/* Settings with Dropdown */}
            <SidebarMenuItem>
              <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip="Settings"
                    className="h-10 transition-all font-normal w-full"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                    {settingsOpen ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-6 py-1 space-y-1">
                    <button
                      onClick={() => setLocation("/dashboard/settings/general")}
                      className={`text-sm w-full text-left px-2 py-1 rounded-md hover:bg-accent transition-colors ${
                        location === "/dashboard/settings/general"
                          ? "text-foreground bg-accent font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      General
                    </button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>

            {/* Support with Dropdown */}
            <SidebarMenuItem>
              <Collapsible open={supportOpen} onOpenChange={setSupportOpen}>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip="Support"
                    className="h-10 transition-all font-normal w-full"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span>Support</span>
                    {supportOpen ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-6 py-1 space-y-1">
                    <button
                      onClick={() => setLocation("/dashboard/support/general")}
                      className={`text-sm w-full text-left px-2 py-1 rounded-md hover:bg-accent transition-colors ${
                        location === "/dashboard/support/general"
                          ? "text-foreground bg-accent font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      General
                    </button>
                    <button
                      onClick={() => setLocation("/dashboard/support/report-bug")}
                      className={`text-sm w-full text-left px-2 py-1 rounded-md hover:bg-accent transition-colors ${
                        location === "/dashboard/support/report-bug"
                          ? "text-foreground bg-accent font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Report a Bug
                    </button>
                    <button
                      onClick={() => setLocation("/dashboard/support/suggest-feature")}
                      className={`text-sm w-full text-left px-2 py-1 rounded-md hover:bg-accent transition-colors ${
                        location === "/dashboard/support/suggest-feature"
                          ? "text-foreground bg-accent font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Suggest a Feature
                    </button>
                    <button
                      onClick={() => setLocation("/dashboard/support/whatsapp")}
                      className={`text-sm w-full text-left px-2 py-1 rounded-md hover:bg-accent transition-colors ${
                        location === "/dashboard/support/whatsapp"
                          ? "text-foreground bg-accent font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() => setLocation("/dashboard/support/reviews")}
                      className={`text-sm w-full text-left px-2 py-1 rounded-md hover:bg-accent transition-colors ${
                        location === "/dashboard/support/reviews"
                          ? "text-foreground bg-accent font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Reviews
                    </button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>

            {/* Afiliados */}
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Afiliados"
                className="h-10 transition-all font-normal"
                onClick={() => setLocation("/dashboard/afiliados")}
              >
                <DollarSign className="h-4 w-4" />
                <span>Afiliados</span>
                <span className="ml-auto">💰</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Social Media Links */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-center gap-3 px-2">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Top Header Bar */}
        <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
          <div className="flex h-14 items-center justify-end gap-3 px-6">
            {/* Language Selector */}
            <DropdownMenu open={languageOpen} onOpenChange={setLanguageOpen}>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 rounded-full border border-border hover:bg-accent transition-colors flex items-center justify-center">
                  <span className="text-lg">🇪🇸</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguageOpen(false)}>
                  🇪🇸 Español
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguageOpen(false)}>
                  🇧🇷 Português
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguageOpen(false)}>
                  🇬🇧 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help/Book Icon */}
            <button className="h-9 w-9 rounded-full border border-border hover:bg-accent transition-colors flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </button>

            {/* Credits Button */}
            <Button
              variant="outline"
              className="h-9 rounded-full px-4 gap-2"
            >
              <Clock className="h-4 w-4" />
              <span>Credits: 0</span>
            </Button>

            {/* User Avatar */}
            <Avatar className="h-9 w-9 border-2 border-border cursor-pointer hover:ring-2 hover:ring-primary transition-all">
              <AvatarImage src={user?.avatar_url} alt={user?.name} />
              <AvatarFallback className="text-xs font-medium">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? APP_TITLE}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </>
  );
}
