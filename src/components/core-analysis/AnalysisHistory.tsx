import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  History,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Loader2,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

interface CoreAnalysisRecord {
  id: string;
  sample_name: string | null;
  image_url: string | null;
  analysis: string;
  rock_type: string | null;
  created_at: string;
}

export const AnalysisHistory = () => {
  const [records, setRecords] = useState<CoreAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CoreAnalysisRecord | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("core_analyses" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setRecords((data as any[]) || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase
        .from("core_analyses" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success("Analysis deleted");
    } catch (err) {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  if (selected) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex-1">
              <CardTitle className="text-base">
                {selected.sample_name || "Core Analysis"}
              </CardTitle>
              <CardDescription>
                {format(new Date(selected.created_at), "PPpp")}
                {selected.rock_type && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {selected.rock_type}
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {selected.image_url && (
            <div>
              <img
                src={selected.image_url}
                alt="Core sample"
                className="w-full rounded-lg border border-border object-cover max-h-[400px]"
              />
            </div>
          )}
          <ScrollArea className={selected.image_url ? "max-h-[500px]" : "max-h-[600px] lg:col-span-2"}>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{selected.analysis}</ReactMarkdown>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Analysis History
        </CardTitle>
        <CardDescription>
          Previous core sample analyses saved to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No analyses saved yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Run a core analysis and it will be automatically saved here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all cursor-pointer group"
                onClick={() => setSelected(record)}
              >
                {record.image_url ? (
                  <img
                    src={record.image_url}
                    alt=""
                    className="w-14 h-14 rounded-md object-cover border border-border flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {record.sample_name || "Core Analysis"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(record.created_at), "PP · p")}
                  </p>
                  {record.rock_type && (
                    <Badge variant="secondary" className="text-[10px] mt-1">
                      {record.rock_type}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(record.id);
                    }}
                    disabled={deleting === record.id}
                  >
                    {deleting === record.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
