import { Eye } from "lucide-react";
import { ROLE_LABELS, type AppRole } from "@/hooks/useUserRole";

interface Props {
  role: AppRole;
  locked: boolean;
}

const ReadOnlyBanner = ({ role, locked }: Props) => (
  <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-primary/20 bg-primary/10 px-6 py-2 backdrop-blur">
    <Eye className="h-4 w-4 text-primary shrink-0" />
    <p className="text-xs font-mono tracking-wide text-primary">
      {ROLE_LABELS[role].toUpperCase()} — READ-ONLY ACCESS
    </p>
    <span className="text-xs text-muted-foreground">
      {locked
        ? "Data entry on this screen is disabled. Ask an engineer to upload or edit data."
        : "You can review conclusions, forecasts and reports. Saving data is disabled."}
    </span>
  </div>
);

export default ReadOnlyBanner;
