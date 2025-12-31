import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";
import { Component, ReactNode } from "react";
import i18n from "@/i18n/config";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
  }

  handleClearDataAndReload = () => {
    try {
      // Clear potentially corrupted localStorage data
      if (typeof window !== 'undefined' && window.localStorage) {
        // Clear app-specific data that might be corrupted
        const keysToRemove = [
          'manus-runtime-user-info',
          'aiselfi_dashboard_variant',
          'aiselfi_first_dashboard_variant',
          'dashboardV2_data',
          'theme',
          'i18nextLng',
        ];
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            // Ignore errors
          }
        });
      }
    } catch (e) {
      console.warn('[ErrorBoundary] Could not clear localStorage:', e);
    }
    // Reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || '';
      const isStorageError = errorMessage.includes('localStorage') || 
                              errorMessage.includes('QuotaExceeded') ||
                              errorMessage.includes('storage');

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">{i18n.t("errorBoundary.title")}</h2>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6 max-h-48">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.message}
              </pre>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 cursor-pointer"
                )}
              >
                <RotateCcw size={16} />
                {i18n.t("errorBoundary.reloadPage")}
              </button>
              
              {/* Show clear data button for storage-related errors or always as a recovery option */}
              <button
                onClick={this.handleClearDataAndReload}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-secondary text-secondary-foreground",
                  "hover:opacity-90 cursor-pointer"
                )}
              >
                <Trash2 size={16} />
                {i18n.t("errorBoundary.clearDataAndReload", { defaultValue: "Clear Data & Reload" })}
              </button>
            </div>
            
            {isStorageError && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                {i18n.t("errorBoundary.storageError", { 
                  defaultValue: "This error might be caused by corrupted local data. Try clearing your browser data or using incognito mode." 
                })}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
