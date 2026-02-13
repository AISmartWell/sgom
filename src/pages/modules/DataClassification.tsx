import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FolderSearch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataClassificationDemo } from "@/components/data-classification/DataClassificationDemo";

const DataClassification = () => {
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
            <span className="text-3xl">📂</span>
            <h1 className="text-3xl font-bold">Data Classification</h1>
          </div>
          <p className="text-muted-foreground">
            Download and categorize well information into structured data categories
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          <FolderSearch className="mr-1 h-3 w-3" />
          Stage 2
        </Badge>
      </div>

      <div className="max-w-5xl mx-auto">
        <DataClassificationDemo />
      </div>
    </div>
  );
};

export default DataClassification;
