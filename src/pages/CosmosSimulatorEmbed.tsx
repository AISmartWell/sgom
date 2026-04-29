import CosmosSimulator from "@/components/cosmos/CosmosSimulator";

/**
 * Standalone embed version of the Cosmos Simulator.
 * No header, no navigation — designed to be loaded inside an <iframe>
 * on external sites (e.g. www.aismartwell.com).
 */
const CosmosSimulatorEmbed = () => {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <CosmosSimulator />
    </div>
  );
};

export default CosmosSimulatorEmbed;
