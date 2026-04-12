import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExportSection {
  ref: React.RefObject<HTMLDivElement>;
  title: string;
}

export function useMonteCarloExport() {
  const [exporting, setExporting] = useState(false);
  const histogramRef = useRef<HTMLDivElement>(null);
  const kpiRef = useRef<HTMLDivElement>(null);
  const percentilesRef = useRef<HTMLDivElement>(null);
  const tornadoRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef<HTMLDivElement>(null);

  const exportPDF = async () => {
    setExporting(true);
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentW = pageW - margin * 2;

      // Header
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageW, 35, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Monte Carlo Simulation Report", margin, 18);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(`AI Smart Well — Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin, 28);
      pdf.setTextColor(0, 0, 0);

      let yPos = 45;

      const sections: ExportSection[] = [
        { ref: paramsRef, title: "Simulation Parameters" },
        { ref: kpiRef, title: "Key Risk Metrics" },
        { ref: histogramRef, title: "ROI Distribution Histogram" },
        { ref: percentilesRef, title: "Percentile Summary" },
        { ref: tornadoRef, title: "Tornado Chart — Sensitivity Analysis" },
      ];

      for (const section of sections) {
        if (!section.ref.current) continue;

        const canvas = await html2canvas(section.ref.current, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
        });

        const imgData = canvas.toDataURL("image/png");
        const imgW = contentW;
        const imgH = (canvas.height / canvas.width) * imgW;

        // Check if we need a new page
        if (yPos + imgH + 12 > pageH - margin) {
          pdf.addPage();
          yPos = margin;
        }

        // Section title
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 64, 175);
        pdf.text(section.title, margin, yPos);
        yPos += 6;

        pdf.addImage(imgData, "PNG", margin, yPos, imgW, imgH);
        yPos += imgH + 10;
      }

      // Footer on last page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Page ${i} of ${totalPages}`, pageW - margin - 20, pageH - 8);
        pdf.text("AI Smart Well — Confidential", margin, pageH - 8);
      }

      pdf.save("Monte_Carlo_Report.pdf");
      toast.success("PDF report downloaded successfully");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  return {
    exporting,
    exportPDF,
    refs: { histogramRef, kpiRef, percentilesRef, tornadoRef, paramsRef },
  };
}

export const ExportPDFButton = ({ exporting, onClick }: { exporting: boolean; onClick: () => void }) => (
  <Button
    variant="outline"
    size="sm"
    onClick={onClick}
    disabled={exporting}
    className="gap-2"
  >
    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
    {exporting ? "Exporting…" : "Export PDF"}
  </Button>
);
