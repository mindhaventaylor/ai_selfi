import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import GenerateImages from "./pages/GenerateImages";
import Coupons from "./pages/Coupons";
import Empresas from "./pages/Empresas";
import GiftCards from "./pages/GiftCards";
import BuyCredits from "./pages/BuyCredits";
import Pro from "./pages/Pro";
import Gallery from "./pages/Gallery";
import Models from "./pages/Models";
import StartHere from "./pages/StartHere";
import SettingsGeneral from "./pages/SettingsGeneral";
import SupportGeneral from "./pages/SupportGeneral";
import SupportReportBug from "./pages/SupportReportBug";
import SupportSuggestFeature from "./pages/SupportSuggestFeature";
import SupportWhatsApp from "./pages/SupportWhatsApp";
import SupportReviews from "./pages/SupportReviews";
import Login from "./pages/Login";
import OAuthCallback from "./pages/OAuthCallback";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { WhatsAppButton } from "./components/WhatsAppButton";
import { ProtectedRoute } from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import "./i18n/config";

function Router() {
  const [location] = useLocation();
  const isDashboard = location.startsWith("/dashboard");

  return (
    <>
      {!isDashboard && <Header />}
      <main>
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/login"} component={Login} />
          <Route path={"/oauth/callback"} component={OAuthCallback} />
          <Route path={"/terms"} component={Terms} />
          <Route path={"/privacy"} component={Privacy} />
          <Route path={"/dashboard"}>
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path={"/dashboard/generate"}>
            <ProtectedRoute>
              <DashboardLayout>
                <GenerateImages />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path={"/dashboard/pro"}>
            <ProtectedRoute>
              <DashboardLayout>
                <Pro />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path={"/dashboard/gallery"}>
            <ProtectedRoute>
              <DashboardLayout>
                <Gallery />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path={"/dashboard/models"}>
            <ProtectedRoute>
              <DashboardLayout>
                <Models />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path={"/dashboard/start"}>
            <ProtectedRoute>
              <DashboardLayout>
                <StartHere />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path={"/dashboard/settings/general"}>
            <ProtectedRoute>
              <DashboardLayout>
                <SettingsGeneral />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path={"/dashboard/support/general"}>
            <ProtectedRoute>
              <DashboardLayout>
                <SupportGeneral />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path={"/dashboard/support/report-bug"}>
            <ProtectedRoute>
              <DashboardLayout>
                <SupportReportBug />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path={"/dashboard/support/suggest-feature"}>
            <ProtectedRoute>
              <DashboardLayout>
                <SupportSuggestFeature />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path={"/dashboard/support/whatsapp"}>
            <ProtectedRoute>
              <DashboardLayout>
                <SupportWhatsApp />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path={"/dashboard/support/reviews"}>
            <ProtectedRoute>
              <DashboardLayout>
                <SupportReviews />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path={"/dashboard/credits/coupons"}>
            <ProtectedRoute>
              <DashboardLayout>
                <Coupons />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path={"/dashboard/credits/buy"}>
            <ProtectedRoute>
              <DashboardLayout>
                <BuyCredits />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path={"/dashboard/credits/gift-cards"}>
            <ProtectedRoute>
              <DashboardLayout>
                <GiftCards />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path={"/dashboard/credits/empresas"}>
            <ProtectedRoute>
              <DashboardLayout>
                <Empresas />
              </DashboardLayout>
            </ProtectedRoute>
          </Route>
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isDashboard && <Footer />}
      {!isDashboard && <WhatsAppButton />}
    </>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
