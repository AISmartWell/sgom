import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  FileText,
  DollarSign,
  Percent,
  Calendar,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const CounterProposal = () => {
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

      pdf.save("Counter-Proposal_AI_Smart_Well.pdf");
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#ffffff", color: "#1a1a2e" }}>
      <div ref={contentRef} className="max-w-5xl mx-auto p-6 md:p-10" style={{ background: "#ffffff" }}>
        {/* Header */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 text-gray-700 hover:text-gray-900 hover:bg-gray-100">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-8">
          <Badge className="mb-3 bg-blue-100 text-blue-700 border-blue-200 font-semibold">CONFIDENTIAL</Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ color: "#1a1a2e" }}>Counter-Proposal</h1>
          <p className="text-lg font-medium" style={{ color: "#374151" }}>
            AI Smart Well — SGOM Platform · Development Agreement
          </p>
          <p className="text-sm mt-1 font-medium" style={{ color: "#6b7280" }}>
            Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <hr className="mb-8 border-gray-200" />

        {/* Context — Risk Assessment */}
        <div className="mb-8 rounded-xl border-2 border-red-200" style={{ background: "#fef2f2" }}>
          <div className="p-6 pb-3">
            <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: "#1a1a2e" }}>
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Original Proposal — Risk Assessment
            </h2>
          </div>
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-lg border border-gray-200" style={{ background: "#ffffff" }}>
                <p className="text-sm font-medium" style={{ color: "#6b7280" }}>Cash Fee</p>
                <p className="text-2xl font-bold" style={{ color: "#1a1a2e" }}>$37,500</p>
              </div>
              <div className="p-4 rounded-lg border border-gray-200" style={{ background: "#ffffff" }}>
                <p className="text-sm font-medium" style={{ color: "#6b7280" }}>Equity Requested</p>
                <p className="text-2xl font-bold text-red-600">25%</p>
              </div>
              <div className="p-4 rounded-lg border border-gray-200" style={{ background: "#ffffff" }}>
                <p className="text-sm font-medium" style={{ color: "#6b7280" }}>Implied Total Value</p>
                <p className="text-2xl font-bold text-red-600">~$637,500+</p>
                <p className="text-xs font-medium" style={{ color: "#6b7280" }}>at $2.39M Pre-Seed valuation</p>
              </div>
            </div>
            <div className="space-y-2 text-sm font-medium" style={{ color: "#374151" }}>
              <p className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                25% equity dilution is excessive for an 18-week development contract
              </p>
              <p className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                Combined cost (~$637K) is 4.8× the full-market MVP estimate ($133K)
              </p>
              <p className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                No vesting or cliff — immediate ownership without performance guarantees
              </p>
            </div>
          </div>
        </div>

        {/* Option A */}
        <div className="mb-6 rounded-xl border-2 border-blue-200" style={{ background: "#f0f9ff" }}>
          <div className="p-6 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="mb-2 bg-blue-100 text-blue-700 border-blue-200 font-semibold">RECOMMENDED</Badge>
                <h2 className="text-xl font-bold" style={{ color: "#1a1a2e" }}>Option A — Higher Cash, Minimal Equity</h2>
                <p className="text-sm" style={{ color: "#6b7280" }}>Reduced dilution with fair market compensation</p>
              </div>
              <Scale className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold" style={{ color: "#1a1a2e" }}>Development Fee: $60,000 — $80,000</p>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      Payment schedule: 30% upfront, 40% at Milestone 3, 30% upon delivery
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Percent className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold" style={{ color: "#1a1a2e" }}>Equity: 3% — 5%</p>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      Performance-based, contingent upon full MVP delivery and acceptance
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold" style={{ color: "#1a1a2e" }}>Vesting Schedule</p>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      4-year vesting · 1-year cliff · Monthly vesting thereafter
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold" style={{ color: "#1a1a2e" }}>Protections</p>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      IP assignment clause · Non-compete (12 months) · NDA
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg p-4" style={{ background: "#e8f4fd" }}>
              <h4 className="font-semibold mb-3 text-sm" style={{ color: "#1a1a2e" }}>Vesting Terms — Option A</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {[
                  { period: "Year 1 (Cliff)", value: "0%", note: "Must complete MVP" },
                  { period: "Year 1 (Post-cliff)", value: "25% vested", note: "~0.75% — 1.25%" },
                  { period: "Year 2", value: "50% vested", note: "~1.5% — 2.5%" },
                  { period: "Year 4", value: "100% vested", note: "3% — 5%" },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded border border-gray-200" style={{ background: "#ffffff" }}>
                    <p className="text-xs font-medium" style={{ color: "#6b7280" }}>{item.period}</p>
                    <p className="font-bold" style={{ color: "#1a1a2e" }}>{item.value}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-4 rounded-lg border border-blue-200" style={{ background: "#eff6ff" }}>
              <p className="text-sm" style={{ color: "#1a1a2e" }}>
                <span className="font-semibold text-blue-700">Total implied value:</span>{" "}
                $60K–$80K cash + $71K–$120K equity = <span className="font-bold">$131K–$200K</span>
              </p>
              <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                Fair and aligned with market rates for 18-week MVP development
              </p>
            </div>
          </div>
        </div>

        {/* Option B */}
        <div className="mb-8 rounded-xl border-2 border-amber-200" style={{ background: "#fffbeb" }}>
          <div className="p-6 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="mb-2 bg-amber-100 text-amber-700 border-amber-200 font-semibold">ALTERNATIVE</Badge>
                <h2 className="text-xl font-bold" style={{ color: "#1a1a2e" }}>Option B — Lower Cash, Moderate Equity</h2>
                <p className="text-sm" style={{ color: "#6b7280" }}>Budget-friendly with structured equity incentive</p>
              </div>
              <Scale className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold" style={{ color: "#1a1a2e" }}>Development Fee: $37,500</p>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      Original cash amount maintained · Same milestone-based payments
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Percent className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold" style={{ color: "#1a1a2e" }}>Equity: 5% — 8%</p>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      Subject to 4-year vesting with 1-year cliff and milestone triggers
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold" style={{ color: "#1a1a2e" }}>Vesting Schedule</p>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      4-year vesting · 1-year cliff · Quarterly vesting thereafter
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold" style={{ color: "#1a1a2e" }}>Acceleration Clause</p>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      50% acceleration on successful fundraise ($2M+) within 12 months
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg p-4" style={{ background: "#fef3c7" }}>
              <h4 className="font-semibold mb-3 text-sm" style={{ color: "#1a1a2e" }}>Vesting Terms — Option B</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {[
                  { period: "Year 1 (Cliff)", value: "0%", note: "MVP must pass QA" },
                  { period: "Year 1 (Post-cliff)", value: "25% vested", note: "~1.25% — 2%" },
                  { period: "Year 2", value: "50% vested", note: "~2.5% — 4%" },
                  { period: "Year 4", value: "100% vested", note: "5% — 8%" },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded border border-gray-200" style={{ background: "#ffffff" }}>
                    <p className="text-xs font-medium" style={{ color: "#6b7280" }}>{item.period}</p>
                    <p className="font-bold" style={{ color: "#1a1a2e" }}>{item.value}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-4 rounded-lg border border-amber-200" style={{ background: "#fefce8" }}>
              <p className="text-sm" style={{ color: "#1a1a2e" }}>
                <span className="font-semibold text-amber-700">Total implied value:</span>{" "}
                $37.5K cash + $120K–$191K equity = <span className="font-bold">$157K–$229K</span>
              </p>
              <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                Preserves cash while providing meaningful upside participation
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-8 rounded-xl border border-gray-200" style={{ background: "#ffffff" }}>
          <div className="p-6 pb-3">
            <h2 className="text-lg font-bold" style={{ color: "#1a1a2e" }}>Side-by-Side Comparison</h2>
          </div>
          <div className="px-6 pb-6">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium" style={{ color: "#6b7280" }}>Term</th>
                    <th className="text-center py-3 px-4 font-medium text-red-600">Original</th>
                    <th className="text-center py-3 px-4 font-medium text-blue-600">Option A</th>
                    <th className="text-center py-3 px-4 font-medium text-amber-600">Option B</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100" style={{ color: "#1a1a2e" }}>
                  <tr>
                    <td className="py-3 px-4">Cash Fee</td>
                    <td className="py-3 px-4 text-center">$37,500</td>
                    <td className="py-3 px-4 text-center font-semibold">$60K–$80K</td>
                    <td className="py-3 px-4 text-center">$37,500</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Equity</td>
                    <td className="py-3 px-4 text-center text-red-600 font-bold">25%</td>
                    <td className="py-3 px-4 text-center text-blue-600 font-bold">3–5%</td>
                    <td className="py-3 px-4 text-center text-amber-600 font-bold">5–8%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Vesting</td>
                    <td className="py-3 px-4 text-center text-red-600">None</td>
                    <td className="py-3 px-4 text-center">4yr / 1yr cliff</td>
                    <td className="py-3 px-4 text-center">4yr / 1yr cliff</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Total Value</td>
                    <td className="py-3 px-4 text-center text-red-600">~$637K</td>
                    <td className="py-3 px-4 text-center text-blue-600">$131K–$200K</td>
                    <td className="py-3 px-4 text-center text-amber-600">$157K–$229K</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">IP Protection</td>
                    <td className="py-3 px-4 text-center text-red-600">Undefined</td>
                    <td className="py-3 px-4 text-center text-blue-600">Full assignment</td>
                    <td className="py-3 px-4 text-center text-amber-600">Full assignment</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Founder Dilution</td>
                    <td className="py-3 px-4 text-center text-red-600 font-bold">Critical</td>
                    <td className="py-3 px-4 text-center text-blue-600 font-bold">Minimal</td>
                    <td className="py-3 px-4 text-center text-amber-600 font-bold">Moderate</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Key Conditions */}
        <div className="mb-8 rounded-xl border border-gray-200" style={{ background: "#ffffff" }}>
          <div className="p-6 pb-3">
            <h2 className="text-lg font-bold" style={{ color: "#1a1a2e" }}>Mandatory Conditions (Both Options)</h2>
          </div>
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "IP Assignment", desc: "All code, models, and documentation become sole property of the Company upon creation" },
                { title: "Non-Compete", desc: "12-month non-compete in oil & gas AI/ML platforms upon termination" },
                { title: "Confidentiality (NDA)", desc: "Perpetual NDA covering proprietary technology, SPT methodology, and business data" },
                { title: "Milestone Acceptance", desc: "Each milestone requires written acceptance before payment release" },
                { title: "Code Quality Standards", desc: "TypeScript strict mode, >80% test coverage, CI/CD pipeline operational" },
                { title: "Good Leaver / Bad Leaver", desc: "Unvested equity forfeited on termination for cause; pro-rata vesting on good departure" },
                { title: "Anti-Dilution", desc: "Standard weighted-average anti-dilution protection for vested shares" },
                { title: "Right of First Refusal", desc: "Company retains ROFR on any equity transfer by development team" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "#f9fafb" }}>
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm" style={{ color: "#1a1a2e" }}>{item.title}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
            This document is for discussion purposes only and does not constitute a binding agreement.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => window.print()} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <FileText className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleExportPDF} disabled={exporting} className="bg-blue-600 hover:bg-blue-700 text-white">
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

export default CounterProposal;
