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
  BarChart3,
  Cpu,
  Shield,
  Zap,
  Target,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const DiversifiedEnergyProposal = () => {
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

      pdf.save("Diversified_Energy_Pilot_Proposal.pdf");
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
          <Badge className="mb-3 bg-blue-100 text-blue-700 border-blue-200 font-semibold">
            PILOT PROJECT PROPOSAL
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ color: "#1a1a2e" }}>
            AI-Powered Well Optimization
          </h1>
          <p className="text-lg font-medium" style={{ color: "#374151" }}>
            Pilot Partnership Proposal for Diversified Energy Company
          </p>
          <p className="text-sm mt-2" style={{ color: "#6b7280" }}>Date: {today}</p>
          <p className="text-sm" style={{ color: "#6b7280" }}>From: AI Smart Well, Inc. (SGOM Platform)</p>
        </div>

        <hr className="mb-8 border-gray-200" />

        {/* Addressee */}
        <div className="mb-6 text-sm" style={{ color: "#374151" }}>
          <p className="font-semibold">To: Diversified Energy Company (DEC)</p>
          <p>Attn: Technology & Operations Leadership</p>
          <p>Re: Pilot Project Proposal — AI-Driven Well Portfolio Optimization</p>
        </div>

        {/* Executive Summary */}
        <div className="space-y-4 text-sm leading-relaxed mb-8" style={{ color: "#374151" }}>
          <p>Dear Diversified Energy Team,</p>

          <p>
            We are writing to propose a <strong>no-cost pilot project</strong> to demonstrate how AI Smart Well's
            SGOM platform can optimize well performance and reduce operational costs across your extensive
            portfolio of <strong>~70,000 natural gas wells</strong> in the Appalachian and Central regions.
          </p>

          <p>
            Diversified Energy's strategy of responsible stewardship and smarter asset management aligns
            perfectly with our platform's mission: leveraging <strong>NVIDIA GPU-accelerated AI</strong> to
            maximize production efficiency from mature wells while minimizing environmental impact.
          </p>

          <p>
            We propose a <strong>30-day pilot on 50–100 wells</strong> to demonstrate measurable ROI
            before any commercial commitment.
          </p>
        </div>

        {/* Why DEC + SGOM */}
        <div className="mb-8 rounded-xl border-2 border-blue-200 p-6" style={{ background: "#eff6ff" }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "#1a1a2e" }}>
            <Target className="h-5 w-5 text-blue-600" />
            Why Diversified Energy + SGOM
          </h2>
          <div className="space-y-3 text-sm" style={{ color: "#374151" }}>
            {[
              {
                title: "Massive Mature Well Portfolio",
                desc: "Your ~70,000 wells represent the ideal use case for AI-driven optimization — incremental production gains at scale create significant value.",
              },
              {
                title: "Asset Stewardship Philosophy",
                desc: "Our platform aligns with DEC's focus on maximizing value from existing assets rather than exploration, extending well economic life by 3–7 years.",
              },
              {
                title: "Decarbonization Synergy",
                desc: "AI-optimized production reduces unnecessary energy consumption and emissions per barrel — supporting your sustainability commitments.",
              },
              {
                title: "Appalachian & Central Region Expertise",
                desc: "Our ML models are trained on geological data from Oklahoma and Texas — adaptable to Appalachian formations with minimal calibration.",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-blue-100 bg-white">
                <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold" style={{ color: "#1a1a2e" }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Capabilities */}
        <div className="mb-8 rounded-xl border-2 border-gray-200 p-6" style={{ background: "#f9fafb" }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "#1a1a2e" }}>
            <Cpu className="h-5 w-5 text-indigo-600" />
            SGOM Platform Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: BarChart3,
                label: "AI Well Ranking",
                value: "ML-based scoring of well candidates for treatment prioritization",
              },
              {
                icon: Cpu,
                label: "Computer Vision Core Analysis",
                value: "GPU-accelerated geological core image analysis (NVIDIA)",
              },
              {
                icon: TrendingUp,
                label: "SPT Production Projection",
                value: "AI forecasting of post-treatment production uplift",
              },
              {
                icon: Shield,
                label: "Economic Analysis",
                value: "Automated ROI calculation per well with risk scoring",
              },
              {
                icon: Zap,
                label: "Real-Time Monitoring",
                value: "Live telemetry dashboards with anomaly detection alerts",
              },
              {
                icon: Clock,
                label: "10-Stage Analysis Pipeline",
                value: "End-to-end workflow: Data → Analysis → Decision → Action",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                <item.icon className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium" style={{ color: "#6b7280" }}>{item.label}</p>
                  <p className="text-sm font-semibold" style={{ color: "#1a1a2e" }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pilot Proposal */}
        <div className="mb-8 rounded-xl border-2 border-green-200 p-6" style={{ background: "#f0fdf4" }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "#1a1a2e" }}>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Pilot Project Structure
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: "#374151" }}>
              <thead>
                <tr className="border-b border-green-200">
                  <th className="text-left py-2 pr-4 font-semibold" style={{ color: "#1a1a2e" }}>Parameter</th>
                  <th className="text-left py-2 font-semibold" style={{ color: "#1a1a2e" }}>Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100">
                {[
                  { param: "Duration", detail: "30 days" },
                  { param: "Scope", detail: "50–100 wells (DEC selected)" },
                  { param: "Region", detail: "Appalachian Basin (preferred) or Central" },
                  { param: "Cost to DEC", detail: "No cost — fully funded pilot" },
                  { param: "Data Required", detail: "Well headers, production history (CSV/API)" },
                  { param: "Deliverables", detail: "AI ranking report, SPT projections, economic analysis per well" },
                  { param: "Success Metric", detail: "Identification of 10–15% production uplift opportunities" },
                  { param: "Follow-up", detail: "Joint review meeting + commercial proposal if results positive" },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-4 font-medium" style={{ color: "#1a1a2e" }}>{row.param}</td>
                    <td className="py-2" style={{ color: "#374151" }}>{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expected Results */}
        <div className="mb-8 rounded-xl border-2 border-amber-200 p-6" style={{ background: "#fffbeb" }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "#1a1a2e" }}>
            <TrendingUp className="h-5 w-5 text-amber-600" />
            Expected Pilot Outcomes
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "10–15%", label: "Production uplift identified" },
              { value: "94%", label: "ML prediction accuracy" },
              { value: "< 48h", label: "Full portfolio analysis" },
              { value: "$0", label: "Cost to Diversified" },
            ].map((m, i) => (
              <div key={i} className="text-center p-4 rounded-lg border border-amber-100 bg-white">
                <div className="text-2xl font-bold" style={{ color: "#d97706" }}>{m.value}</div>
                <div className="text-xs mt-1" style={{ color: "#6b7280" }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* About AI Smart Well */}
        <div className="mb-8 rounded-xl border border-gray-200 p-6" style={{ background: "#ffffff" }}>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#1a1a2e" }}>About AI Smart Well</h2>
          <div className="space-y-2 text-sm" style={{ color: "#374151" }}>
            <p>
              <strong>AI Smart Well, Inc.</strong> develops the SGOM platform — an AI-powered SaaS solution
              for oil & gas operators that automates geological analysis, well selection, and production optimization.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                "NVIDIA Inception Member",
                "GPU-Accelerated AI",
                "Patented SPT Technology (US8863823)",
                "15,000+ Wells Analyzed",
                "Oklahoma & Texas Operations",
              ].map((tag, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 border border-gray-200" style={{ color: "#374151" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Leadership */}
        <div className="mb-8 rounded-xl border border-gray-200 p-6" style={{ background: "#ffffff" }}>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#1a1a2e" }}>Leadership Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {[
              { name: "Edward Rubinstein", role: "CEO · Co-Founder · Strategy & Partnerships" },
              { name: "Natalia Zaruchevskaya", role: "Co-Founder · Business Development" },
              { name: "Anatoliy Nikouline", role: "CEO of Maxxwell Production · SPT Technology" },
              { name: "Alexander Alishoev", role: "CTO · Platform Architecture" },
            ].map((person, i) => (
              <div key={i} className="p-3 rounded-lg border border-gray-100" style={{ background: "#f9fafb" }}>
                <p className="font-semibold" style={{ color: "#1a1a2e" }}>{person.name}</p>
                <p className="text-xs" style={{ color: "#6b7280" }}>{person.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="mb-8 rounded-xl border-2 border-indigo-200 p-6" style={{ background: "#eef2ff" }}>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#1a1a2e" }}>Proposed Next Steps</h2>
          <div className="space-y-3 text-sm" style={{ color: "#374151" }}>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li><strong>Introductory call</strong> — 30-minute overview of SGOM platform capabilities</li>
              <li><strong>Data sharing agreement</strong> — NDA + pilot data scope definition</li>
              <li><strong>Pilot kickoff</strong> — DEC selects 50–100 wells, we begin analysis</li>
              <li><strong>Results review</strong> — Joint presentation of findings at Day 30</li>
              <li><strong>Commercial discussion</strong> — If results meet expectations, discuss SaaS subscription</li>
            </ol>
          </div>
        </div>

        {/* Closing */}
        <div className="mb-8 text-sm" style={{ color: "#374151" }}>
          <p className="leading-relaxed">
            We believe the combination of Diversified Energy's unmatched well portfolio and AI Smart Well's
            GPU-accelerated analytics platform represents a compelling opportunity to unlock significant
            value from mature assets. We would welcome the opportunity to discuss this proposal further.
          </p>
          <p className="mt-6 font-medium">Best regards,</p>
          <p className="font-bold mt-1" style={{ color: "#1a1a2e" }}>Edward Rubinstein</p>
          <p className="text-xs" style={{ color: "#6b7280" }}>CEO · Co-Founder</p>
          <p className="text-xs" style={{ color: "#6b7280" }}>AI Smart Well, Inc. — SGOM Platform</p>
          <p className="text-xs" style={{ color: "#6b7280" }}>NVIDIA Inception Member</p>
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-gray-200">
          <p className="text-xs mb-4" style={{ color: "#6b7280" }}>
            Confidential — Prepared exclusively for Diversified Energy Company (NYSE: DEC)
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
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

export default DiversifiedEnergyProposal;
