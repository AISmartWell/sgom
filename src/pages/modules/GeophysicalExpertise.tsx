import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WellLogAnalysisDemo } from "@/components/geophysical/WellLogAnalysisDemo";

const GeophysicalExpertise = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8">
      {/* Header */}
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
            <span className="text-3xl">📊</span>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Geophysical Expertise</h1>
              <Badge className="text-xs">Stage 6</Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            AI-powered well log interpretation and formation evaluation
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          <Activity className="mr-1 h-3 w-3" />
          Well Log AI
        </Badge>
      </div>

      <div className="max-w-4xl mx-auto">
        <WellLogAnalysisDemo />
      </div>
    </div>
  );
};

export default GeophysicalExpertise;
