import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "./Sidebar";
import SPTChatWidget from "@/components/chat/SPTChatWidget";
import { Loader2, ShieldAlert } from "lucide-react";
import { useUserRole, INVESTOR_ALLOWED_ROUTES, ADMIN_ONLY_ROUTES } from "@/hooks/useUserRole";
import ReadOnlyBanner from "./ReadOnlyBanner";

// Screens where data is created or uploaded — locked for read-only roles
const DATA_ENTRY_ROUTES = [
  "/dashboard/ocr",
  "/dashboard/ocr-well-log",
  "/dashboard/ocr-paper-log",
  "/dashboard/ocr-formation-demo",
  "/dashboard/data-import",
  "/dashboard/data-collection",
  "/dashboard/production-history",
  "/dashboard/document-vault",
  "/dashboard/admin-import",
  "/dashboard/automation",
  "/dashboard/autonomous-scan",
  "/dashboard/ml-training",
  "/dashboard/user-roles",
];

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { role, isInvestor, isAdmin, isReadOnly, loading: roleLoading } = useUserRole();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Check if investor is accessing a restricted route
  const currentPath = location.pathname;
  const investorAllowed = !isInvestor || INVESTOR_ALLOWED_ROUTES.some(
    (route) => currentPath === route || (route === "/dashboard" && currentPath === "/dashboard")
  );
  const adminAllowed = isAdmin || !ADMIN_ONLY_ROUTES.includes(currentPath);
  const isAllowed = investorAllowed && adminAllowed;
  const isDataEntryScreen = DATA_ENTRY_ROUTES.includes(currentPath);
  const lockInputs = isReadOnly && isDataEntryScreen;

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 overflow-auto flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <ShieldAlert className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Access Restricted</h2>
            <p className="text-muted-foreground max-w-md">
              This module is not available with your current access level. 
              Please contact the team for full platform access.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="relative flex-1 overflow-auto">
        {/* Ambient cinematic backdrop */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 opacity-[0.35]"
          style={{
            background:
              "radial-gradient(900px 420px at 78% -8%, hsl(var(--primary) / 0.10), transparent 60%), radial-gradient(700px 380px at 8% 105%, hsl(var(--primary-glow) / 0.08), transparent 62%)",
          }}
        />
        <div className="relative">
          <Outlet />
        </div>
      </main>
      <SPTChatWidget />
    </div>
  );
};

export default DashboardLayout;
