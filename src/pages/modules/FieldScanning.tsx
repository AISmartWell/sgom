import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Radar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FieldScanDemo } from "@/components/data-collection/FieldScanDemo";

const FieldScanning = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🛰️</span>
            <h1 className="text-3xl font-bold">Field Scanning</h1>
          </div>
          <p className="text-muted-foreground">
            Automated weekly scanning of oil & gas fields with well detection and cleanup
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          <Radar className="mr-1 h-3 w-3" />
          Auto Scan
        </Badge>
      </div>

      <div className="max-w-4xl mx-auto">
        <FieldScanDemo />
      </div>
    </div>
  );
};

export default FieldScanning;
