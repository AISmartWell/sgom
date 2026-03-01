import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { FileSpreadsheet, PenLine, Cloud, Database } from "lucide-react";
import { CSVUpload } from "@/components/data-import/CSVUpload";
import { ManualWellEntry } from "@/components/data-import/ManualWellEntry";
import { APIIntegrationPanel } from "@/components/data-import/APIIntegrationPanel";
import { ImportedWellsTable } from "@/components/data-import/ImportedWellsTable";

const DataImport = () => {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [wellCount, setWellCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadCompany = async () => {
    const { data } = await supabase.from("user_companies").select("company_id").limit(1).maybeSingle();
    if (data) setCompanyId(data.company_id);
  };

  const loadCount = async () => {
    const { count } = await supabase.from("wells").select("*", { count: "exact", head: true });
    setWellCount(count || 0);
  };

  useEffect(() => {
    loadCompany();
    loadCount();
  }, []);

  const handleImportComplete = () => {
    loadCount();
    setRefreshTrigger((t) => t + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          Data Import
          <Badge className="bg-primary/20 text-primary border-primary/30 text-sm">
            {wellCount.toLocaleString()} wells in database
          </Badge>
        </h1>
        <p className="text-muted-foreground mt-1">
          Import well data from CSV files, manual entry, or connect to commercial data providers.
        </p>
      </div>

      <Tabs defaultValue="csv" className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="csv" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            CSV / Excel
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <PenLine className="h-4 w-4" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            API Providers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="csv">
          <CSVUpload companyId={companyId} onImportComplete={handleImportComplete} />
        </TabsContent>

        <TabsContent value="manual">
          <ManualWellEntry companyId={companyId} onImportComplete={handleImportComplete} />
        </TabsContent>

        <TabsContent value="api">
          <APIIntegrationPanel />
        </TabsContent>
      </Tabs>

      <ImportedWellsTable refreshTrigger={refreshTrigger} />
    </div>
  );
};

export default DataImport;
