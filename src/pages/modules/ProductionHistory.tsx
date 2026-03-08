import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductionHistoryUpload from "@/components/production-history/ProductionHistoryUpload";

const ProductionHistory = () => {
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setCompanyId(data.company_id);
    };
    fetchCompany();
  }, []);

  return <ProductionHistoryUpload companyId={companyId} />;
};

export default ProductionHistory;
