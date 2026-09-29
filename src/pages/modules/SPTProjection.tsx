import SPTProjectionDemo from "@/components/spt-projection/SPTProjectionDemo";
import SPTApplicabilityCard from "@/components/spt-projection/SPTApplicabilityCard";

const SPTProjection = () => {
  return (
    <div className="p-8 space-y-6">
      <SPTApplicabilityCard />
      <SPTProjectionDemo />
    </div>
  );
};

export default SPTProjection;
