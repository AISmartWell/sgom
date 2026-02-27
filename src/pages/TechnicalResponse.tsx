import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const TechnicalResponse = () => {
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

      pdf.save("Technical_Response_MVP_Roadmap.pdf");
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const confirmedItems = [
    {
      title: "Python ML Service (Modules 4, 5)",
      text: "Approved. Dedicated FastAPI service on AWS/GCP for inference. Deno Edge Functions will act as a secure API gateway/proxy layer.",
      clarification:
        "One clarification: Gemini (via Lovable AI) should remain the primary engine for text-based analysis and classification tasks (data classification, report generation). The Python service should focus exclusively on numerical ML models (decline curve fitting, well ranking algorithms, recovery factor prediction). This avoids duplicating capabilities and reduces infrastructure cost.",
    },
    {
      title: "Reservoir Simulation (Module 9)",
      text: "Confirmed. MVP scope is analytical modeling only: material balance, Arps decline analysis, Buckley-Leverett displacement, recovery factor estimation. No finite-difference numerical solver. This is the correct tradeoff for timeline and budget.",
    },
    {
      title: "IoT / Telemetry (Modules 11–12)",
      text: "Confirmed. MVP deliverables: ingestion API, MQTT endpoint, device registry, software sensor simulator. SCADA integration deferred to post-MVP.",
    },
    {
      title: "Security Audit (Milestone 6)",
      text: "Confirmed. Internal structured audit covering RLS policies, API endpoint protection, auth flow validation, and access control matrix. Third-party pentest scheduled post-launch.",
    },
    {
      title: "Additional Items",
      text: "Confirmed inclusion of: OpenAPI/Swagger documentation, full mobile responsiveness, Investor Deck & Budget page refinements (existing pages, not rebuild), technical handover documentation.",
    },
  ];

  const actionItems = [
    { item: "Provide adjusted milestone schedule with Texas integration", owner: "Dev Team", status: "Pending" },
    { item: "Confirm Gemini vs Python ML scope boundary", owner: "Both", status: "Proposed above" },
    { item: "Confirm billing approach (Option A or B)", owner: "Dev Team", status: "Pending" },
    { item: "Define Oklahoma-only fallback criteria for Texas", owner: "Dev Team", status: "Pending" },
    { item: "Review interactive MVP Scope specification", owner: "Dev Team", status: "Ready for Review" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#ffffff", color: "#1a1a2e" }}>
      <div ref={contentRef} className="max-w-5xl mx-auto p-6 md:p-10" style={{ background: "#ffffff" }}>
        {/* Header */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-8">
          <Badge className="mb-3 bg-blue-100 text-blue-700 border-blue-200 font-semibold">CONFIDENTIAL</Badge>
          <p className="text-sm font-medium mb-1" style={{ color: "#6b7280" }}>
            Subject: RE: Technical Clarifications — MVP Roadmap Alignment
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ color: "#1a1a2e" }}>
            Technical Response
          </h1>
          <p className="text-lg font-medium" style={{ color: "#374151" }}>
            AI Smart Well — SGOM Platform · Product Team Response
          </p>
          <p className="text-sm mt-1 font-medium" style={{ color: "#6b7280" }}>
            Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <hr className="mb-8 border-gray-200" />

        {/* Intro */}
        <div className="mb-8">
          <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
            Team,
          </p>
          <p className="text-sm leading-relaxed mt-3" style={{ color: "#374151" }}>
            Thank you for the detailed technical review. We've analyzed each point and are largely aligned.
            Below is our formal response with confirmations and open items.
          </p>
        </div>

        {/* Confirmed & Agreed */}
        <div className="mb-8 rounded-xl border-2 border-green-200" style={{ background: "#f0fdf4" }}>
          <div className="p-6 pb-3">
            <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: "#1a1a2e" }}>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              ✅ Confirmed & Agreed
            </h2>
          </div>
          <div className="px-6 pb-6 space-y-4">
            {confirmedItems.map((item, i) => (
              <div key={i} className="p-4 rounded-lg border border-gray-200" style={{ background: "#ffffff" }}>
                <p className="font-semibold text-sm mb-1" style={{ color: "#1a1a2e" }}>
                  {i + 1}. {item.title}
                </p>
                <p className="text-sm" style={{ color: "#374151" }}>{item.text}</p>
                {item.clarification && (
                  <p className="text-sm mt-2 p-3 rounded" style={{ background: "#f0fdf4", color: "#374151" }}>
                    {item.clarification}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Open Items */}
        <div className="mb-8 rounded-xl border-2 border-amber-200" style={{ background: "#fffbeb" }}>
          <div className="p-6 pb-3">
            <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: "#1a1a2e" }}>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              ⚠️ Open Items — Decision Required
            </h2>
          </div>
          <div className="px-6 pb-6 space-y-6">
            {/* Item 6 — Texas API */}
            <div className="p-4 rounded-lg border border-gray-200" style={{ background: "#ffffff" }}>
              <p className="font-semibold text-sm mb-2" style={{ color: "#1a1a2e" }}>
                6. Texas API Integration (Module 2)
              </p>
              <p className="text-sm mb-3" style={{ color: "#374151" }}>
                We acknowledge the complexity: no clean REST API, custom ETL/scraping required, larger dataset,
                additional 2–3 weeks.
              </p>
              <p className="text-sm font-medium mb-2" style={{ color: "#1a1a2e" }}>Questions:</p>
              <ul className="space-y-2 text-sm" style={{ color: "#374151" }}>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  Does this +2–3 weeks extend the total timeline from 18 to 20–21 weeks, or is it absorbed by
                  parallelizing with other modules?
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  Please provide a proposed adjusted milestone schedule showing where Texas work fits.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  What is the fallback if a reliable data route cannot be validated within week 2? Do we proceed with
                  Oklahoma-only for initial launch?
                </li>
              </ul>
            </div>

            {/* Item 7 — Stripe Billing */}
            <div className="p-4 rounded-lg border border-gray-200" style={{ background: "#ffffff" }}>
              <p className="font-semibold text-sm mb-2" style={{ color: "#1a1a2e" }}>
                7. Stripe Billing (Module 13)
              </p>
              <p className="text-sm mb-3" style={{ color: "#374151" }}>
                We need to make a decision here. Two options on the table:
              </p>
              <div className="overflow-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-medium" style={{ color: "#6b7280" }}></th>
                      <th className="text-center py-2 px-3 font-medium text-blue-600">Option A: Manual Billing</th>
                      <th className="text-center py-2 px-3 font-medium text-amber-600">Option B: Full Stripe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100" style={{ color: "#374151" }}>
                    <tr>
                      <td className="py-2 px-3 font-medium" style={{ color: "#6b7280" }}>Scope</td>
                      <td className="py-2 px-3 text-center text-sm">Admin UI + subscription structure + invoice generation</td>
                      <td className="py-2 px-3 text-center text-sm">Full Stripe: automated recurring billing, usage metering, customer portal</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium" style={{ color: "#6b7280" }}>Timeline</td>
                      <td className="py-2 px-3 text-center">None (fits current schedule)</td>
                      <td className="py-2 px-3 text-center">+2–3 weeks</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium" style={{ color: "#6b7280" }}>Cost</td>
                      <td className="py-2 px-3 text-center">Within $125K</td>
                      <td className="py-2 px-3 text-center">Within $125K (compresses other work)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium" style={{ color: "#6b7280" }}>Risk</td>
                      <td className="py-2 px-3 text-center">Manual effort post-launch</td>
                      <td className="py-2 px-3 text-center">Additional integration complexity</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-3 rounded-lg border border-blue-200" style={{ background: "#eff6ff" }}>
                <p className="text-sm" style={{ color: "#374151" }}>
                  <span className="font-semibold text-blue-700">Our recommendation:</span> Option A for MVP launch,
                  with Stripe automation as a fast-follow in Sprint 1 post-launch. This keeps the critical path clean.
                  Please confirm your agreement or propose an alternative.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MVP Scope — Ready for Review */}
        <div className="mb-8 rounded-xl border-2 border-indigo-200" style={{ background: "#eef2ff" }}>
          <div className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold mb-3" style={{ color: "#1a1a2e" }}>
              <Target className="h-5 w-5 text-indigo-600" />
              📋 MVP Scope — Interactive Specification Ready
            </h2>
            <p className="text-sm mb-3" style={{ color: "#374151" }}>
              We have prepared a comprehensive, interactive technical specification (TZ) covering all 10 Phase 1 modules.
              The document includes detailed inputs/outputs, acceptance criteria, inter-module dependencies, and individual
              budget allocations from the $125K total.
            </p>
            <div className="p-3 mb-3 rounded-lg border border-indigo-300" style={{ background: "#e0e7ff" }}>
              <p className="text-sm font-semibold" style={{ color: "#4338ca" }}>
                📢 Please review the new module. The full interactive specification is ready for your analysis.
              </p>
            </div>
            <p className="text-sm mb-4" style={{ color: "#374151" }}>
              Please review the specification thoroughly before our next alignment meeting. We expect your feedback on:
            </p>
            <ul className="space-y-1 text-sm mb-4" style={{ color: "#374151" }}>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                Module scope boundaries and acceptance criteria
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                Data dependency chain feasibility
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                Budget allocation per module
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                Technical feasibility of proposed architecture decisions
              </li>
            </ul>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/mvp-scope")}
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View MVP Scope Specification →
            </Button>
          </div>
        </div>

        {/* Action Items */}
        <div className="mb-8 rounded-xl border border-gray-200" style={{ background: "#ffffff" }}>
          <div className="p-6 pb-3">
            <h2 className="text-lg font-bold" style={{ color: "#1a1a2e" }}>📋 Summary of Action Items</h2>
          </div>
          <div className="px-6 pb-6">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium" style={{ color: "#6b7280" }}>#</th>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: "#6b7280" }}>Item</th>
                    <th className="text-center py-2 px-3 font-medium" style={{ color: "#6b7280" }}>Owner</th>
                    <th className="text-center py-2 px-3 font-medium" style={{ color: "#6b7280" }}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100" style={{ color: "#1a1a2e" }}>
                  {actionItems.map((row, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3">{i + 1}</td>
                      <td className="py-2 px-3">{row.item}</td>
                      <td className="py-2 px-3 text-center">{row.owner}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge
                          className={
                            row.status === "Pending"
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : row.status === "Ready for Review"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-blue-100 text-blue-700 border-blue-200"
                          }
                        >
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Closing */}
        <div className="mb-8">
          <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
            Please respond with your position on items 6 and 7 so we can finalize the milestone schedule.
          </p>
          <p className="text-sm mt-4 font-medium" style={{ color: "#374151" }}>
            Best regards,
          </p>
          <p className="text-sm font-bold" style={{ color: "#1a1a2e" }}>
            SGOM Platform — Product Team
          </p>
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-gray-200">
          <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
            This document is for internal discussion purposes only and does not constitute a binding agreement.
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

export default TechnicalResponse;
