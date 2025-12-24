import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePostHogVariant } from "@/hooks/usePostHogVariant";
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
  PlusCircle,
  Image as ImageIcon,
  Sparkles,
  CreditCard,
  Settings,
  ChevronRight,
  ChevronDown,
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
import { safeLocalStorage } from "@/utils/localStorage";
import { LoginModal } from "@/components/LoginModal";

// menuItems will be created inside component to use translation

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = safeLocalStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    safeLocalStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  // Allow rendering even without user - login will be required only for payment
  // The actual dashboard pages will handle their own logic and redirect to login when needed

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
  const { t, changeLanguage, currentLanguage } = useTranslation();
  const { user, logout } = useAuth();
  const { variant } = usePostHogVariant(user?.id);
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Check for variant in URL and localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const urlVariantRaw = urlParams.get("variant") as "page1" | "page2" | "page3" | null;
  // Normalize page1 to page2 - page1 should never be used
  const urlVariant = urlVariantRaw === "page1" ? "page2" : urlVariantRaw;
  const cachedVariantRaw = safeLocalStorage.getItem("aiselfi_dashboard_variant") as "page1" | "page2" | "page3" | null;
  const cachedVariant = cachedVariantRaw === "page1" ? "page2" : cachedVariantRaw;
  const firstVariantRaw = safeLocalStorage.getItem("aiselfi_first_dashboard_variant") as "page1" | "page2" | "page3" | null;
  const firstVariant = firstVariantRaw === "page1" ? "page2" : firstVariantRaw;
  const isPage2Variant = variant === "page2" || urlVariant === "page2" || cachedVariant === "page2" || firstVariant === "page2";
  const isPage3Variant = variant === "page3" || urlVariant === "page3" || cachedVariant === "page3" || firstVariant === "page3";
  
  // Determine current variant to pass to generate page (normalized)
  // Default to page2 if no variant is found
  const currentVariant = urlVariant || firstVariant || cachedVariant || variant || "page2";
  const createPath =
    currentVariant === "page3"
      ? "/dashboard?variant=page3"
      : `/dashboard/generate?variant=${currentVariant}`;
  
  const allMenuItems = [
    { icon: HelpCircle, label: t("dashboardLayout.startHere"), path: "/dashboard/start" },
    { icon: PlusCircle, label: t("dashboardLayout.create"), path: createPath },
    { icon: ImageIcon, label: t("dashboardLayout.gallery"), path: "/dashboard/gallery" },
    { icon: Sparkles, label: t("dashboardLayout.proFeatures"), path: "/dashboard/pro" },
    { icon: CreditCard, label: t("dashboardLayout.buyCredits"), path: "/dashboard/credits/buy" },
    { icon: Settings, label: t("dashboardLayout.settings"), path: "/dashboard/settings/general" },
  ];
  
  // Filter out models menu item for page2 variant (but keep Start Here)
  const menuItems = isPage2Variant
    ? allMenuItems.filter(item => item.path !== "/dashboard/models")
    : allMenuItems;
  
  const activeMenuItem = menuItems.find(item => item.path === location);
  const [supportOpen, setSupportOpen] = useState(() => {
    return location.startsWith("/dashboard/support");
  });
  const [languageOpen, setLanguageOpen] = useState(false);
  
  // Track URL search params to detect changes (wouter's location only gives pathname)
  const [urlSearch, setUrlSearch] = useState(() => window.location.search);
  
  // Poll for URL search changes to catch programmatic navigation
  useEffect(() => {
    const checkUrlSearch = () => {
      if (window.location.search !== urlSearch) {
        setUrlSearch(window.location.search);
      }
    };
    
    // Check immediately and on a short interval to catch navigation
    const intervalId = setInterval(checkUrlSearch, 50);
    
    // Also check on popstate
    window.addEventListener('popstate', checkUrlSearch);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('popstate', checkUrlSearch);
    };
  }, [urlSearch]);
  
  // Check if we're on /dashboard/generate with variant=page2 and no batchId
  // This determines if DashboardV2 will be rendered (which hides the layout)
  // We need to check this synchronously to avoid showing the header during redirects
  const shouldHideLayout = (() => {
    const urlParams = new URLSearchParams(urlSearch);
    const urlVariant = urlParams.get("variant");
    const batchId = urlParams.get("batchId");
    
    if (location === "/dashboard/generate") {
      // If variant is page2 and no batchId, DashboardV2 will be rendered, so hide layout
      return urlVariant === "page2" && !batchId;
    }
    if (location === "/dashboard") {
      // For /dashboard route, check if variant=page2 (DashboardV2 will be rendered)
      return urlVariant === "page2";
    }
    return false;
  })();
  
  const [showFullLayout, setShowFullLayout] = useState(!shouldHideLayout); // Start with correct state

  // Listen for layout mode changes from DashboardV2
  useEffect(() => {
    const handleLayoutMode = (event: CustomEvent<{ showFullLayout: boolean }>) => {
      setShowFullLayout(event.detail.showFullLayout);
    };

    window.addEventListener('aiselfi-dashboard-layout-mode', handleLayoutMode as EventListener);
    
    return () => {
      window.removeEventListener('aiselfi-dashboard-layout-mode', handleLayoutMode as EventListener);
    };
  }, []);
  
  // Update layout visibility when location or URL search changes
  // But only if no event was dispatched (events take precedence)
  useEffect(() => {
    // Don't override if GenerateImages or DashboardV2 dispatched an event
    // Events are handled separately and take precedence
    setShowFullLayout(!shouldHideLayout);
  }, [location, urlSearch, shouldHideLayout]);

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
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
      {showFullLayout && !isPage3Variant && (
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
                    className="h-8 w-8 rounded-lg object-cover cursor-pointer"
                    alt="Logo"
                    onClick={() => setLocation(createPath)}
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 flex items-center justify-center bg-accent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <PanelLeft className="h-4 w-4 text-foreground" />
                  </button>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setLocation(createPath)}
                >
                    <img
                      src={APP_LOGO}
                    className="h-10 w-10 rounded-lg object-cover shrink-0"
                      alt="Logo"
                    />
                  <span className="font-bold text-lg bg-gradient-to-r from-pink-400 to-orange-500 bg-clip-text text-transparent">
                    Alselfie
                    </span>
                </div>
              )}
            </div>
            
            {/* User Profile Section */}
            {!isCollapsed && (
              <div className="mt-6 space-y-3">
                {user ? (
                  <>
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setLocation("/dashboard/settings/general")}
                    >
                      <Avatar className="h-12 w-12 border-2 border-border">
                        <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || "User"} />
                        <AvatarFallback className="text-sm font-medium">
                          {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div 
                      className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        // If credits are 0, redirect to buy credits page
                        if ((user?.credits ?? 0) <= 0) {
                          setLocation("/dashboard/credits/buy");
                        }
                      }}
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{user?.credits ?? 0} {t("dashboardLayout.creditsLabel")}</span>
                    </div>
                  </>
                ) : (
                  <Button
                    onClick={() => setShowLoginModal(true)}
                    className="w-full rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    {t("header.signIn")}
                  </Button>
                )}
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
              
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 space-y-2 border-t border-border">
            {/* Support with Dropdown */}
            <SidebarMenuItem>
              <Collapsible open={supportOpen} onOpenChange={setSupportOpen}>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={t("dashboardLayout.support")}
                    className="h-10 transition-all font-normal w-full"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span>{t("dashboardLayout.support")}</span>
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
                      onClick={() => setLocation("/dashboard/support/report-bug")}
                      className={`text-sm w-full text-left px-2 py-1 rounded-md hover:bg-accent transition-colors ${
                        location === "/dashboard/support/report-bug"
                          ? "text-foreground bg-accent font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t("dashboardLayout.reportBug")}
                    </button>
                    <button
                      onClick={() => setLocation("/dashboard/support/suggest-feature")}
                      className={`text-sm w-full text-left px-2 py-1 rounded-md hover:bg-accent transition-colors ${
                        location === "/dashboard/support/suggest-feature"
                          ? "text-foreground bg-accent font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t("dashboardLayout.suggestFeature")}
                </button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
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
                <a
                  href="https://wa.me/18137291689"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="WhatsApp"
                >
                  <svg 
                    className="h-4 w-4" 
                    style={{ transform: 'scale(1.15)' }}
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/>
                    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>
                  </svg>
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
      )}

      <SidebarInset style={!showFullLayout || isPage3Variant ? { marginLeft: 0 } : undefined}>
        {/* Top Header Bar - only show when full layout is enabled */}
        {showFullLayout && (
        <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-3 px-6">
            {/* Left side: Logo/Name for page3, empty for others */}
            {isPage3Variant ? (
              <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setLocation("/dashboard?variant=page3")}
              >
                <img
                  src={APP_LOGO}
                  className="h-8 w-8 rounded-lg object-cover shrink-0"
                  alt="Logo"
                />
                <span className="font-bold text-lg bg-gradient-to-r from-pink-400 to-orange-500 bg-clip-text text-transparent">
                  Alselfie
                </span>
              </div>
            ) : (
              <div />
            )}
            
            {/* Right side controls */}
            <div className="flex items-center gap-3">
            {/* Language Selector */}
            <DropdownMenu open={languageOpen} onOpenChange={setLanguageOpen}>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 rounded-full border border-border hover:bg-accent transition-colors flex items-center justify-center">
                  <span className="text-lg">
                    {currentLanguage === "es" ? "🇪🇸" : 
                     currentLanguage === "pt-BR" ? "🇧🇷" : 
                     currentLanguage === "it" ? "🇮🇹" : "🇬🇧"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => {
                    changeLanguage("es");
                    setLanguageOpen(false);
                  }}
                  className={currentLanguage === "es" ? "bg-accent" : ""}
                >
                  🇪🇸 {t("dashboardLayout.spanish")}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    changeLanguage("pt-BR");
                    setLanguageOpen(false);
                  }}
                  className={currentLanguage === "pt-BR" ? "bg-accent" : ""}
                >
                  🇧🇷 {t("dashboardLayout.portuguese")}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    changeLanguage("en");
                    setLanguageOpen(false);
                  }}
                  className={currentLanguage === "en" ? "bg-accent" : ""}
                >
                  🇬🇧 {t("dashboardLayout.english")}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    changeLanguage("it");
                    setLanguageOpen(false);
                  }}
                  className={currentLanguage === "it" ? "bg-accent" : ""}
                >
                  🇮🇹 {t("dashboardLayout.italian")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help/Book Icon - hidden for page3 */}
            {!isPage3Variant && (
              <button 
                className="h-9 w-9 rounded-full border border-border hover:bg-accent transition-colors flex items-center justify-center"
                onClick={() => setLocation("/dashboard/start")}
              >
                <BookOpen className="h-4 w-4" />
              </button>
            )}

            {/* Credits Button */}
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-full px-4 gap-2 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // If credits are 0 or less, redirect to buy credits page
                const userCredits = user?.credits ?? 0;
                if (userCredits <= 0) {
                  setLocation("/dashboard/credits/buy");
                } else {
                  // Even if user has credits, allow clicking to go to buy page
                  setLocation("/dashboard/credits/buy");
                }
              }}
            >
              <Clock className="h-4 w-4" />
              <span>{t("dashboardLayout.creditsLabel")}: {user?.credits ?? 0}</span>
            </Button>

            {/* User Avatar or Login Button */}
            {user ? (
              <Avatar 
                className="h-9 w-9 border-2 border-border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                onClick={() => setLocation("/dashboard/settings/general")}
              >
                <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || "User"} />
                <AvatarFallback className="text-xs font-medium">
                  {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Button
                onClick={() => setShowLoginModal(true)}
                variant="default"
                size="sm"
                className="rounded-full shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary border-0 px-6 font-semibold"
              >
                {t("header.signIn")}
              </Button>
            )}
            </div>
          </div>
        </div>
        )}

        {showFullLayout && isMobile && !isPage3Variant && (
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

      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        variant={isPage2Variant ? "page2" : isPage3Variant ? "page3" : undefined}
      />
    </>
  );
}
