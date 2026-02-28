import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  CheckCircle2,
  TrendingUp,
  Users,
  DollarSign,
  Cpu,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const NvidiaCapitalConnectLetter = () => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }

      pdf.save("NVIDIA_Capital_Connect_Application.pdf");
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen" style={{ background: "#ffffff", color: "#1a1a2e" }}>
      <div ref={contentRef} className="max-w-4xl mx-auto p-6 md:p-10" style={{ background: "#ffffff" }}>
        {/* Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Letter Header */}
        <div className="mb-8">
          <Badge className="mb-3 bg-green-100 text-green-700 border-green-200 font-semibold">
            NVIDIA INCEPTION MEMBER
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ color: "#1a1a2e" }}>
            Capital Connect Access Request
          </h1>
          <p className="text-lg font-medium" style={{ color: "#374151" }}>
            SGOM Platform — AI Smart Well · VC Exposure Application
          </p>
          <p className="text-sm mt-2" style={{ color: "#6b7280" }}>Date: {today}</p>
        </div>

        <hr className="mb-8 border-gray-200" />

        {/* Addressee */}
        <div className="mb-6 text-sm" style={{ color: "#374151" }}>
          <p className="font-semibold">To: NVIDIA Inception Team</p>
          <p>Re: Request for Inception Capital Connect (ICC) Benefit Activation</p>
        </div>

        {/* Body */}
        <div className="space-y-4 text-sm leading-relaxed mb-8" style={{ color: "#374151" }}>
          <p>Dear NVIDIA Inception Team,</p>

          <p>
            We are writing to formally request activation of the <strong>Inception Capital Connect (ICC)</strong> benefit
            for <strong>SGOM Platform (AI Smart Well)</strong>, an active member of the NVIDIA Inception program.
          </p>

          <p>
            Our platform leverages NVIDIA technologies — including GPU-accelerated inference, computer vision for
            geological core analysis, and plans for DGX Cloud, TensorRT, and RAPIDS integration — to deliver
            AI-powered optimization for oil & gas production operations.
          </p>

          <p>
            We are currently raising a <strong>Pre-Seed / Seed round of $2.39M</strong> and would greatly benefit from
            exposure to the global network of venture capital firms participating in the ICC program.
          </p>
        </div>

        {/* Company Snapshot */}
        <div className="mb-8 rounded-xl border-2 border-gray-200 p-6" style={{ background: "#f9fafb" }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "#1a1a2e" }}>
            <TrendingUp className="h-5 w-5 text-green-600" />
            Company Snapshot for VC Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: DollarSign, label: "Funding Target", value: "$2.39M Pre-Seed / Seed" },
              { icon: TrendingUp, label: "Projected ROI", value: "312% within 24 months" },
              { icon: TrendingUp, label: "Year 1 EBITDA", value: "35–38% margin" },
              { icon: Users, label: "SAM (Serviceable Market)", value: "$3.2B" },
              { icon: Cpu, label: "Wells Analyzed", value: "15,000+ across OK & TX" },
              { icon: CheckCircle2, label: "ML Accuracy", value: "94% prediction accuracy" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                <item.icon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium" style={{ color: "#6b7280" }}>{item.label}</p>
                  <p className="text-sm font-semibold" style={{ color: "#1a1a2e" }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NVIDIA Technology Stack */}
        <div className="mb-8 rounded-xl border-2 border-green-200 p-6" style={{ background: "#f0fdf4" }}>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: "#1a1a2e" }}>
            <Cpu className="h-5 w-5 text-green-600" />
            NVIDIA Technology Integration
          </h2>
          <div className="space-y-2 text-sm" style={{ color: "#374151" }}>
            {[
              "GPU-accelerated inference for CV-based geological core analysis",
              "NVIDIA API Catalog integration for AI model deployment",
              "Planned migration to DGX Cloud for ML training workloads",
              "TensorRT optimization for production inference pipeline",
              "RAPIDS for high-performance well data processing",
              "Workloads: Data Science, Edge Computing, Agentic AI, MLOps",
            ].map((tech, i) => (
              <p key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{tech}</span>
              </p>
            ))}
          </div>
        </div>

        {/* Leadership */}
        <div className="mb-8 rounded-xl border border-gray-200 p-6" style={{ background: "#ffffff" }}>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#1a1a2e" }}>Leadership Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {[
              { name: "Edward Rubinstein", role: "CEO · Co-Founder · Strategy & Partnerships" },
              { name: "Natalia Zaruchevskaya", role: "Co-Founder · Business Development" },
              { name: "Anatoliy Nikouline", role: "CEO of Maxxwell Production" },
              { name: "Alexander Alishoev", role: "CTO" },
            ].map((person, i) => (
              <div key={i} className="p-3 rounded-lg border border-gray-100" style={{ background: "#f9fafb" }}>
                <p className="font-semibold" style={{ color: "#1a1a2e" }}>{person.name}</p>
                <p className="text-xs" style={{ color: "#6b7280" }}>{person.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Request */}
        <div className="mb-8 rounded-xl border-2 border-blue-200 p-6" style={{ background: "#eff6ff" }}>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#1a1a2e" }}>Request Summary</h2>
          <div className="space-y-3 text-sm" style={{ color: "#374151" }}>
            <p>We kindly request the following:</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li><strong>Activation of Capital Connect (ICC)</strong> benefit for our Inception profile</li>
              <li><strong>VC visibility enabled</strong> — our profile marked as "Looking for Funding"</li>
              <li><strong>Review of our updated profile</strong> including pitch deck, metrics, and NVIDIA technology usage</li>
            </ol>
            <p className="mt-4">
              We confirm that any prior funding requests in the portal have been deactivated, and our profile
              is updated with current metrics, pitch deck (PDF, 15 slides), and workload selections.
            </p>
          </div>
        </div>

        {/* Closing */}
        <div className="mb-8 text-sm" style={{ color: "#374151" }}>
          <p className="leading-relaxed">
            We appreciate NVIDIA's continued support through the Inception program and look forward to connecting
            with VC partners through Capital Connect.
          </p>
          <p className="mt-6 font-medium">Best regards,</p>
          <p className="font-bold mt-1" style={{ color: "#1a1a2e" }}>Edward Rubinstein</p>
          <p className="text-xs" style={{ color: "#6b7280" }}>CEO · Co-Founder</p>
          <p className="text-xs" style={{ color: "#6b7280" }}>SGOM Platform — AI Smart Well</p>
          <p className="text-xs" style={{ color: "#6b7280" }}>NVIDIA Inception Member</p>
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-gray-200">
          <p className="text-xs mb-4" style={{ color: "#6b7280" }}>
            This letter is prepared for submission to the NVIDIA Inception Capital Connect program.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <FileText className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={exporting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {exporting ? "Generating..." : "Save as PDF"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NvidiaCapitalConnectLetter;
