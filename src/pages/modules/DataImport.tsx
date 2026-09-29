import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { FileSpreadsheet, PenLine, Cloud, Database, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CSVUpload } from "@/components/data-import/CSVUpload";
import { ManualWellEntry } from "@/components/data-import/ManualWellEntry";
import { APIIntegrationPanel } from "@/components/data-import/APIIntegrationPanel";
import { ImportedWellsTable } from "@/components/data-import/ImportedWellsTable";
import { FormationAssistCard } from "@/components/data-import/FormationAssistCard";
import { InjectionSalinityForm } from "@/components/data-import/InjectionSalinityForm";

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

      <section className="border-y border-border py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="waterflood-checklist-title">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 id="waterflood-checklist-title" className="font-semibold">Watered-out well data checklist</h2>
            <p className="text-sm text-muted-foreground">Well logs, production, injection volumes, water salinity and reservoir temperature.</p>
            <p className="text-xs text-muted-foreground mt-1">Data request only. Enter salinity and injection volumes in the Injection &amp; Water Salinity form below to feed Stage 8.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <Button variant="outline" size="sm" asChild>
            <a href="/checklists/sgom-data-checklist-en.pdf" download="sgom-data-checklist-en.pdf" type="application/pdf">
              <Download className="mr-2 h-4 w-4" aria-hidden="true" /> English PDF
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/checklists/sgom-data-checklist-ru.pdf" download="sgom-data-checklist-ru.pdf" type="application/pdf">
              <Download className="mr-2 h-4 w-4" aria-hidden="true" /> Русский PDF
            </a>
          </Button>
        </div>
      </section>

      <InjectionSalinityForm />

      <FormationAssistCard />



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
