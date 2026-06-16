/**
 * Legal disclaimer shown on pages that mention NVIDIA technologies.
 * Clarifies that NVIDIA marks are property of NVIDIA Corporation and
 * that SGOM Physics Simulator is an independent AI Smart Well product.
 */
const TrademarkDisclaimer = () => (
  <div className="mt-12 border-t border-border/50 pt-6 pb-4 px-4 max-w-5xl mx-auto">
    <p className="text-[11px] leading-relaxed text-muted-foreground text-center">
      NVIDIA<sup>®</sup>, NVIDIA NIM<sup>™</sup>, NVIDIA API Catalog<sup>™</sup>, and NVIDIA Inception<sup>™</sup> are
      trademarks of NVIDIA Corporation. <span className="text-foreground font-medium">SGOM Physics Simulator</span> is
      an independent product of AI Smart Well Inc. and is not affiliated with, endorsed by, or sponsored by
      NVIDIA Corporation. References to NVIDIA technologies indicate that AI Smart Well consumes publicly
      available NVIDIA NIM inference endpoints via the NVIDIA API Catalog under standard developer terms.
    </p>
  </div>
);

export default TrademarkDisclaimer;
