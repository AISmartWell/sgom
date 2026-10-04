import { useState } from "react";
import SPTProjectionDemo from "@/components/spt-projection/SPTProjectionDemo";
import SPTLogRanking from "@/components/spt-projection/SPTLogRanking";
import SPTApplicabilityCard from "@/components/spt-projection/SPTApplicabilityCard";
import { CompanyWellPicker } from "@/components/wells/CompanyWellPicker";

const SPTProjection = () => {
  const [wellId, setWellId] = useState<string | null>(null);
  return (
    <div className="p-8 space-y-6">
      <CompanyWellPicker value={wellId} onChange={setWellId} />
      <SPTApplicabilityCard wellId={wellId ?? undefined} />
      <SPTLogRanking selectedId={wellId} />
      <SPTProjectionDemo />
    </div>
  );
};

export default SPTProjection;
