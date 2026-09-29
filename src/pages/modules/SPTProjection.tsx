import SPTProjectionDemo from "@/components/spt-projection/SPTProjectionDemo";
import SPTLogRanking from "@/components/spt-projection/SPTLogRanking";
import SPTApplicabilityCard from "@/components/spt-projection/SPTApplicabilityCard";

const SPTProjection = () => {
  return (
    <div className="p-8 space-y-6">
      <SPTApplicabilityCard />
      <SPTLogRanking />
      <SPTProjectionDemo />
    </div>
  );
};

export default SPTProjection;
