import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SectionCapture {
  ref: React.RefObject<HTMLDivElement>;
  title: string;
}

export function useFullReportExport() {
  const [exporting, setExporting] = useState(false);

  const roiRef = useRef<HTMLDivElement>(null);
  const sensitivityRef = useRef<HTMLDivElement>(null);
  const monteCarloRef = useRef<HTMLDivElement>(null);
  const profitRef = useRef<HTMLDivElement>(null);
  const cumulativeRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const kpiRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const exportFullPDF = async () => {
    setExporting(true);
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const contentW = pageW - margin * 2;

      // Title page
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageW, pageH, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.text("Economic Analysis", pageW / 2, pageH / 2 - 30, { align: "center" });
      pdf.text("Full Report", pageW / 2, pageH / 2 - 5, { align: "center" });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text("AI Smart Well Platform", pageW / 2, pageH / 2 + 20, { align: "center" });
      pdf.setFontSize(10);
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });
      pdf.text(`Generated: ${dateStr}`, pageW / 2, pageH / 2 + 35, { align: "center" });
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text("Confidential — For Internal Use Only", pageW / 2, pageH - 20, { align: "center" });

      // Content pages
      const sections: SectionCapture[] = [
        { ref: kpiRef, title: "Key Performance Indicators" },
        { ref: paramsRef, title: "Scenario Parameters" },
        { ref: roiRef, title: "ROI & Payback Analysis" },
        { ref: sensitivityRef, title: "Sensitivity Analysis" },
        { ref: monteCarloRef, title: "Monte Carlo Risk Analysis" },
        { ref: profitRef, title: "Profit Projections" },
        { ref: cumulativeRef, title: "Cumulative Net Profit" },
        { ref: detailsRef, title: "Per-Well Economic Summary" },
        { ref: summaryRef, title: "Summary" },
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

        // Always start each major section on a new page
        pdf.addPage();
        let yPos = margin;

        // Section header bar
        pdf.setFillColor(15, 23, 42);
        pdf.rect(0, 0, pageW, 18, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(section.title, margin, 12);
        pdf.setTextColor(0, 0, 0);
        yPos = 24;

        // If image is taller than one page, split it across pages
        let remainingH = imgH;
        let srcY = 0;
        const availH = pageH - yPos - margin;

        while (remainingH > 0) {
          const drawH = Math.min(remainingH, yPos === 24 ? availH : pageH - margin * 2);
          const srcH = (drawH / imgH) * canvas.height;

          // Create a temp canvas for this slice
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = srcH;
          const ctx = sliceCanvas.getContext("2d")!;
          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

          const sliceData = sliceCanvas.toDataURL("image/png");
          pdf.addImage(sliceData, "PNG", margin, yPos, imgW, drawH);

          remainingH -= drawH;
          srcY += srcH;

          if (remainingH > 0) {
            pdf.addPage();
            yPos = margin;
          }
        }
      }

      // Footer on all pages
      const totalPages = pdf.getNumberOfPages();
      for (let i = 2; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Page ${i - 1} of ${totalPages - 1}`, pageW - margin - 22, pageH - 6);
        pdf.text("AI Smart Well — Confidential", margin, pageH - 6);
      }

      pdf.save("Economic_Analysis_Full_Report.pdf");
      toast.success("Full economic report exported successfully");
    } catch (err) {
      console.error("Full PDF export error:", err);
      toast.error("Failed to export full report");
    } finally {
      setExporting(false);
    }
  };

  return {
    exporting,
    exportFullPDF,
    refs: { roiRef, sensitivityRef, monteCarloRef, profitRef, cumulativeRef, detailsRef, kpiRef, paramsRef, summaryRef },
  };
}

export const ExportFullReportButton = ({
  exporting,
  onClick,
}: {
  exporting: boolean;
  onClick: () => void;
}) => (
  <Button variant="default" size="sm" onClick={onClick} disabled={exporting} className="gap-2">
    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
    {exporting ? "Generating Report…" : "Export Full Report"}
  </Button>
);
