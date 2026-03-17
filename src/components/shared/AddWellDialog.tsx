import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface AddedWell {
  id: string;
  well_name: string | null;
  api_number: string | null;
  formation: string | null;
  total_depth: number | null;
}

interface AddWellDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string | null;
  onWellAdded: (well: AddedWell) => void;
}

const isApiNumber = (v: string) => /^\d{2,}/.test(v.replace(/[-\s]/g, ""));

export const AddWellDialog = ({ open, onOpenChange, companyId, onWellAdded }: AddWellDialogProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [searchMode, setSearchMode] = useState<"api" | "name">("api");
  const [selectedState, setSelectedState] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "searching" | "found" | "not_found">("idle");

  const handleLookup = async () => {
    if (!searchValue.trim()) { toast.error("Enter an API number or well name"); return; }
    if (!companyId) { toast.error("No company found. Please log in first."); return; }

    setIsLoading(true);
    setStatus("searching");

    try {
      const body: Record<string, string> = { company_id: companyId };
      if (searchMode === "api") {
        body.api_number = searchValue.trim();
      } else {
        body.well_name = searchValue.trim();
        if (selectedState !== "all") body.state = selectedState;
      }

      const { data, error } = await supabase.functions.invoke("lookup-well-by-api", { body });

      if (error) throw error;

      if (data?.success && data.well) {
        setStatus("found");
        toast.success(`Well "${data.well.well_name}" added from state registry`);
        onWellAdded(data.well);
        setSearchValue("");
        setStatus("idle");
        onOpenChange(false);
      } else {
        setStatus("not_found");
        toast.error(data?.error || "Well not found in state registries");
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setStatus("not_found");
      toast.error(err instanceof Error ? err.message : "Failed to lookup well");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setStatus("idle"); setSearchValue(""); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Add Well
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Search by API number or well name — the system will fetch data from state registries (OK OCC, TX RRC, KS KGS).
        </p>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={searchMode === "api" ? "default" : "outline"}
              size="sm"
              onClick={() => { setSearchMode("api"); setStatus("idle"); }}
              className="flex-1"
            >
              API Number
            </Button>
            <Button
              variant={searchMode === "name" ? "default" : "outline"}
              size="sm"
              onClick={() => { setSearchMode("name"); setStatus("idle"); }}
              className="flex-1"
            >
              Well Name
            </Button>
          </div>

          <div>
            <Label htmlFor="dlg-well-lookup">
              {searchMode === "api" ? "API Number" : "Well Name"}
            </Label>
            <Input
              id="dlg-well-lookup"
              placeholder={searchMode === "api" ? "e.g. 3500100001 or 42467309790000" : "e.g. Brawner, Smith #1"}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setStatus("idle");
                if (isApiNumber(e.target.value) && searchMode === "name") setSearchMode("api");
                if (!isApiNumber(e.target.value) && e.target.value.length > 2 && searchMode === "api") setSearchMode("name");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              disabled={isLoading}
            />
            {searchMode === "api" ? (
              <p className="text-xs text-muted-foreground mt-1">
                Prefix: 35=OK, 42=TX, 15=KS — or enter full API
              </p>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">State:</Label>
                <select
                  className="text-xs h-7 px-2 rounded border border-input bg-background"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                >
                  <option value="all">All states</option>
                  <option value="OK">Oklahoma</option>
                  <option value="TX">Texas</option>
                  <option value="KS">Kansas</option>
                </select>
              </div>
            )}
          </div>

          {status === "not_found" && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              Well not found. {searchMode === "api" ? "Check the API number" : "Try a different name or state"} and try again.
            </div>
          )}

          <Button onClick={handleLookup} disabled={isLoading || !searchValue.trim()} className="w-full">
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Searching registries...</>
            ) : (
              <><Search className="mr-2 h-4 w-4" />Find & Add Well</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
