import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "investor" | "engineer" | "geologist" | "production";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrator",
  engineer: "Engineer (data entry)",
  geologist: "Geologist (read-only)",
  production: "Production engineer (read-only)",
  investor: "Investor (read-only)",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: "Full access: data entry, analysis, agents and user management.",
  engineer: "Enters and uploads well data, runs OCR, imports and pipelines.",
  geologist: "Reviews geological conclusions, logs and agent verdicts. No data entry.",
  production: "Reviews production forecasts, economics and work orders. No data entry.",
  investor: "Limited read-only access to selected demo modules.",
};

export const ALL_ROLES: AppRole[] = ["admin", "engineer", "geologist", "production", "investor"];

// Roles allowed to create / modify data
const EDITOR_ROLES: AppRole[] = ["admin", "engineer"];

export const useUserRole = () => {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching role:", error);
          // No role assigned → default to admin (team member)
          setRole("admin");
        } else if (data) {
          setRole(data.role as AppRole);
        } else {
          // No role record → treat as admin (team)
          setRole("admin");
        }
      } catch (err) {
        console.error("Role fetch error:", err);
        setRole("admin");
      } finally {
        setLoading(false);
      }
    };

    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const isInvestor = role === "investor";
  const isAdmin = role === "admin";
  const isEngineer = role === "engineer";
  const isGeologist = role === "geologist";
  const isProduction = role === "production";
  const canEdit = !!role && EDITOR_ROLES.includes(role);

  return {
    role,
    loading,
    isInvestor,
    isAdmin,
    isEngineer,
    isGeologist,
    isProduction,
    canEdit,
    isReadOnly: !!role && !canEdit,
  };
};

// Routes accessible to investors
export const INVESTOR_ALLOWED_ROUTES = [
  "/dashboard",
  "/dashboard/oklahoma-pilot",
  "/dashboard/geophysical",
  "/dashboard/ocr",
  "/dashboard/ocr-well-log",
  "/dashboard/ocr-paper-log",
  "/dashboard/paper-well-log",
  "/dashboard/ingest-diagnostics",
  "/investor-deck",
  "/dashboard/saas-business-model",
  "/dashboard/profitability-model",
  "/budget",
  "/docs",
];

// Sidebar items visible to investors (by href)
export const INVESTOR_SIDEBAR_ITEMS = new Set(INVESTOR_ALLOWED_ROUTES);

// Routes only an administrator may open
export const ADMIN_ONLY_ROUTES = ["/dashboard/user-roles"];
