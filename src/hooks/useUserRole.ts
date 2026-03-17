import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "investor";

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

  return { role, loading, isInvestor, isAdmin };
};

// Routes accessible to investors
export const INVESTOR_ALLOWED_ROUTES = [
  "/dashboard",
  "/dashboard/oklahoma-pilot",
  "/dashboard/geophysical",
  "/investor-deck",
  "/dashboard/saas-business-model",
  "/budget",
  "/docs",
];

// Sidebar items visible to investors (by href)
export const INVESTOR_SIDEBAR_ITEMS = new Set(INVESTOR_ALLOWED_ROUTES);
