import { useState, useRef, useEffect } from "react";
import { Bot, Upload, BarChart3, Presentation, User, ChevronRight, Loader2, FileText, CheckCircle, TrendingUp, Drill, Cpu, Zap, Database } from "lucide-react";
import RealDataTab from "@/components/ai-analyst/RealDataTab";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface WellData {
  id: string;
  region: string;
  depth: string;
  status: "High" | "Medium" | "Low";
  score: number;
  uplift: string;
}

interface UploadedFile {
  name: string;
  size: string;
  status: "ready" | "analyzing" | "done";
  result?: string;
  file: File;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AI_ANALYST_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/spt-chat`;

const SYSTEM_PROMPT = `You are AI Smart Well, an expert geological analyst for the AI Smart Well platform.
You analyze oil well data, interpret geological information, and assess the restoration potential of abandoned wells.

Platform context:
- AI Smart Well — 9-module AI platform using computer vision and machine learning
- Partnership with Maxxwell Production, Slot Perforation Technology (US Patent #8,863,823)
- Production uplift with SPT: 75%+
- Analysis cost: $6K vs $50–200K via traditional methods (90% savings)
- Total Addressable Market: $32B

Respond as a professional geological AI analyst. Provide specific, actionable technical recommendations.
Always respond in English.`;

const WELL_METRICS = [
  { label: "Wells Analyzed", value: "2,847", delta: "+124 this month", positive: true },
  { label: "Restoration Potential", value: "73%", delta: "+5.2% vs forecast", positive: true },
  { label: "Production Uplift (SPT)", value: "78%", delta: "US Patent #8,863,823", positive: true },
  { label: "Analysis Cost Savings", value: "90%", delta: "$6K vs $60K traditional", positive: true },
];

const SAMPLE_WELLS: WellData[] = [
  { id: "W-2841", region: "Permian Basin", depth: "3,420m", status: "High", score: 94, uplift: "+82%" },
  { id: "W-1993", region: "Eagle Ford", depth: "2,890m", status: "Medium", score: 71, uplift: "+44%" },
  { id: "W-3107", region: "Bakken", depth: "3,810m", status: "High", score: 88, uplift: "+67%" },
  { id: "W-0554", region: "DJ Basin", depth: "2,120m", status: "Low", score: 38, uplift: "+12%" },
  { id: "W-4421", region: "Anadarko", depth: "4,050m", status: "High", score: 91, uplift: "+75%" },
];

const MODULES = [
  { n: "01", name: "Core Sample Vision", desc: "CNN-powered core sample analysis" },
  { n: "02", name: "Well Log Interpretation", desc: "GR, SP, Resistivity, Neutron, Density" },
  { n: "03", name: "Seismic Processing", desc: "3D seismic & structural analysis" },
  { n: "04", name: "Decline Curve Analysis", desc: "Production forecasting & DCA" },
  { n: "05", name: "Reservoir Pressure", desc: "Formation energy assessment" },
  { n: "06", name: "Geomechanical Modeling", desc: "Stress & fracture characterization" },
  { n: "07", name: "SPT Candidate Selection", desc: "Slot Perforation Technology ranking" },
  { n: "08", name: "Well Economics", desc: "NPV, IRR, breakeven analysis" },
  { n: "09", name: "Reporting & Export", desc: "PDF, Excel, API integration" },
];

const INVESTOR_SLIDES = [
  {
    title: "The Problem",
    icon: "⚠️",
    points: [
      "1.2M abandoned wells in the US alone",
      "Traditional geo-analysis: $50–200K per well",
      "Analysis timeline: 3–6 months",
      "Lost production potential: $32B annually",
    ],
  },
  {
    title: "The SGOM Solution",
    icon: "🤖",
    points: [
      "AI analysis in hours, not months",
      "Cost: $6K vs $50–200K (−90%)",
      "9-module computer vision platform",
      "Candidate identification accuracy: 94%",
    ],
  },
  {
    title: "SPT Technology",
    icon: "⚙️",
    points: [
      "Slot Perforation Technology (US Pat. #8,863,823)",
      "Production uplift: 75%+",
      "Partner: Maxxwell Production",
      "Proven in West Siberia & Kazakhstan",
    ],
  },
  {
    title: "Business Model",
    icon: "💰",
    points: [
      "SaaS tiers: $2K / $6K / $15K per month",
      "TAM: $32B (global market)",
      "SAM: $4.8B (US + CIS)",
      "Breakeven: 18 Explorer clients",
    ],
  },
  {
    title: "Funding Round",
    icon: "🚀",
    points: [
      "Seed round: $2.4M",
      "Working prototype: all 9 modules active",
      "NVIDIA Inception Program — active member",
      "Target investors: EIC, NGP Energy, SAEV",
    ],
  },
];

// ─── AI helper ────────────────────────────────────────────────────────────────

async function callClaude(messages: { role: string; content: string }[], system: string): Promise<string> {
  const res = await fetch(AI_ANALYST_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      messages,
      systemPrompt: system,
      stream: false,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `AI request failed (${res.status})`);
  }

  return data?.choices?.[0]?.message?.content?.trim() || "Error retrieving response.";
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WellData["status"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-semibold",
        status === "High" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
        status === "Medium" && "border-amber-500/40 bg-amber-500/10 text-amber-400",
        status === "Low" && "border-slate-500/40 bg-slate-500/10 text-slate-400"
      )}
    >
      {status}
    </Badge>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {WELL_METRICS.map((m, i) => (
          <Card key={i} className="border-t-2 border-t-amber-500 bg-slate-900 border-slate-800">
            <CardContent className="pt-5">
              <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-1">{m.label}</p>
              <p className="text-3xl font-bold font-mono text-white">{m.value}</p>
              <p className={cn("mt-1 text-xs flex items-center gap-1", m.positive ? "text-emerald-400" : "text-red-400")}>
                {m.positive ? "▲" : "▼"} {m.delta}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Wells Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base text-white">Well Restoration Candidates</CardTitle>
          <span className="text-xs text-amber-500 cursor-pointer hover:underline">View all →</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {["Well ID", "Region", "Depth", "Potential", "AI Score", "Prod. Uplift"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-600 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SAMPLE_WELLS.map((w) => (
                  <tr key={w.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-blue-400">{w.id}</td>
                    <td className="px-4 py-3 text-slate-400">{w.region}</td>
                    <td className="px-4 py-3 text-slate-400">{w.depth}</td>
                    <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={w.score}
                          className="h-1.5 w-16 bg-slate-800"
                        />
                        <span className="text-white font-mono text-xs">{w.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-emerald-400 font-semibold">{w.uplift}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 9 Modules */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <Card key={m.n} className="bg-slate-900 border-slate-800 flex flex-row items-start gap-3 p-4">
            <span className="font-mono text-[11px] font-bold text-amber-500 mt-0.5 min-w-[24px]">{m.n}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{m.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── AI Smart Well Analysis Tab ───────────────────────────────────────────────

function AnalysisTab() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "👋 Hello! I'm your AI Smart Well geological analyst. Ask me about well candidates, log interpretation, restoration potential, or Slot Perforation Technology. How can I help?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const QUICK_PROMPTS = [
    "Assess restoration potential of well W-2841",
    "How does Slot Perforation Technology work?",
    "Explain the Well Score methodology",
    "Top Eagle Ford SPT candidates",
  ];

  async function send(text?: string) {
    const q = text ?? input.trim();
    if (!q || loading) return;
    setInput("");
    const newMsgs: Message[] = [...messages, { role: "user", content: q }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const reply = await callClaude(newMsgs, SYSTEM_PROMPT);
      setMessages([...newMsgs, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMsgs, { role: "assistant", content: "⚠️ Connection error to AI Smart Well." }]);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <h3 className="text-lg font-semibold text-white">AI Smart Well Analyst</h3>
        <p className="text-sm text-slate-500">AI-powered geological well analysis in real time</p>
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-400 hover:border-amber-500 hover:text-amber-400 transition-colors bg-slate-900"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <Card className="flex-1 bg-slate-900 border-slate-800">
        <ScrollArea className="h-[400px] p-4">
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm",
                  m.role === "user" ? "bg-blue-900 text-blue-300" : "bg-amber-900 text-amber-300"
                )}>
                  {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "rounded-xl px-4 py-3 text-sm leading-relaxed max-w-[80%]",
                  m.role === "user"
                    ? "bg-blue-900/30 border border-blue-800/30 text-slate-200 whitespace-pre-wrap"
                    : "bg-slate-800 border border-slate-700 text-slate-300"
                )}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-td:p-1 prose-th:p-1 prose-table:text-xs">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-900 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-amber-300" />
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </Card>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about wells, geology, SPT technology..."
          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-amber-500"
        />
        <Button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold shrink-0"
        >
          Analyze <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── Upload Data Tab ──────────────────────────────────────────────────────────

function UploadTab() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [analyzingIdx, setAnalyzingIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return;
    setFiles((prev) => [
      ...prev,
      ...Array.from(incoming).map((f) => ({
        name: f.name,
        size: (f.size / 1024).toFixed(1) + " KB",
        status: "ready" as const,
        file: f,
      })),
    ]);
  }

  async function analyzeFile(idx: number) {
    const f = files[idx];
    setAnalyzingIdx(idx);
    setFiles((prev) => prev.map((x, i) => i === idx ? { ...x, status: "analyzing" } : x));
    try {
      const text = await f.file.text().catch(() => null);
      const prompt = text
        ? `Analyze the following well data from file "${f.name}":\n\n${text.slice(0, 3000)}\n\nProvide a concise professional analysis: data type, quality, key parameters, and AI Smart Well recommendations.`
        : `File "${f.name}" (${f.size}) uploaded for analysis. Describe what such files typically contain and how AI Smart Well processes them.`;
      const result = await callClaude([{ role: "user", content: prompt }], SYSTEM_PROMPT);
      setFiles((prev) => prev.map((x, i) => i === idx ? { ...x, status: "done", result } : x));
    } catch {
      setFiles((prev) => prev.map((x, i) => i === idx ? { ...x, status: "done", result: "⚠️ Analysis error." } : x));
    }
    setAnalyzingIdx(null);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white">Upload Well Data</h3>
        <p className="text-sm text-slate-500">LAS, CSV, Excel, PDF well log data — automatic AI-powered analysis</p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-amber-500/30 rounded-xl p-12 text-center cursor-pointer hover:border-amber-500/60 hover:bg-amber-500/5 transition-all bg-slate-900"
      >
        <input ref={fileRef} type="file" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" accept=".las,.csv,.xlsx,.pdf,.txt,.log" />
        <Upload className="w-10 h-10 text-amber-500/60 mx-auto mb-3" />
        <p className="text-white font-semibold mb-1">Drag & drop files or click to browse</p>
        <p className="text-slate-500 text-sm">LAS, CSV, Excel, PDF, TXT — well logs, production data, geological reports</p>
      </div>

      {/* File list */}
      {files.length > 0 ? (
        <div className="space-y-3">
          {files.map((f, i) => (
            <Card key={i} className="bg-slate-900 border-slate-800">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{f.name}</p>
                    <p className="text-xs text-slate-500">{f.size}</p>
                  </div>
                  {f.status === "done" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => analyzeFile(i)}
                      disabled={analyzingIdx === i}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-semibold shrink-0"
                    >
                      {analyzingIdx === i ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Analyzing...</> : "Run Analysis"}
                    </Button>
                  )}
                </div>
                {f.result && (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-400 leading-relaxed prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{f.result}</ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <BarChart3 className="w-7 h-7 text-amber-500" />, label: "LAS Files", desc: "Well Log ASCII Standard" },
            { icon: <TrendingUp className="w-7 h-7 text-amber-500" />, label: "CSV Data", desc: "Production time series" },
            { icon: <Zap className="w-7 h-7 text-amber-500" />, label: "Seismic", desc: "SEG-Y, SEG-2 formats" },
          ].map((t, i) => (
            <Card key={i} className="bg-slate-900 border-slate-800 text-center p-4">
              <div className="flex justify-center mb-2">{t.icon}</div>
              <p className="text-sm font-semibold text-white">{t.label}</p>
              <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Investor Demo Tab ────────────────────────────────────────────────────────

function InvestorTab() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [pitch, setPitch] = useState("");
  const [loading, setLoading] = useState(false);

  async function generatePitch() {
    setLoading(true);
    try {
      const reply = await callClaude([{
        role: "user",
        content: "Write a compelling 3–4 paragraph investment pitch summary for AI Smart Well / SGOM. Include: $2.4M Seed round, $32B TAM, 90% cost savings, 75%+ SPT production uplift, NVIDIA Inception membership. Tone: confident and professional, targeting energy investors at EIC / NGP Energy level.",
      }], SYSTEM_PROMPT);
      setPitch(reply);
    } catch { setPitch("Generation error."); }
    setLoading(false);
  }

  const slide = INVESTOR_SLIDES[activeIdx];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Investor Demo</h3>
        <p className="text-sm text-slate-500">Interactive investor presentation with AI-powered pitch generation</p>
      </div>

      <div className="grid grid-cols-[180px_1fr] gap-4">
        {/* Slide nav */}
        <div className="space-y-2">
          {INVESTOR_SLIDES.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all border",
                activeIdx === i
                  ? "bg-amber-500/15 border-amber-500 text-amber-400 font-semibold"
                  : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
              )}
            >
              {s.icon} {s.title}
            </button>
          ))}
        </div>

        {/* Slide content */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-8 pb-8 px-8">
            <div className="text-5xl mb-5">{slide.icon}</div>
            <h3 className="text-2xl font-bold text-white mb-6">{slide.title}</h3>
            <div className="space-y-4">
              {slide.points.map((p, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-amber-500 mt-0.5 shrink-0">◆</span>
                  <span className="text-slate-200 text-base">{p}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Pitch generator */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base text-white">AI Investment Pitch (generated by Claude)</CardTitle>
          <Button onClick={generatePitch} disabled={loading} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</> : "✨ Generate Pitch"}
          </Button>
        </CardHeader>
        <CardContent>
          {pitch
            ? <div className="text-slate-400 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{pitch}</ReactMarkdown></div>
            : <p className="text-slate-600 text-sm">Click the button to generate an AI-powered investor pitch</p>
          }
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Client Portal Tab ────────────────────────────────────────────────────────

function ClientTab() {
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateReport() {
    setLoading(true);
    try {
      const reply = await callClaude([{
        role: "user",
        content: "Generate a professional monthly report for client Maxxwell Production — March 2026. Include: well analysis status (10 wells processed), TOP-3 SPT candidates with AI Scores, prioritization recommendations, and production uplift forecast.",
      }], SYSTEM_PROMPT);
      setReport(reply);
    } catch { setReport("Generation error."); }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Client Portal</h3>
          <p className="text-sm text-slate-500">Maxxwell Production — Professional Plan · $6,000/mo</p>
        </div>
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">● Active</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Wells in Progress", value: "10", icon: <Drill className="w-7 h-7 text-amber-500" /> },
          { label: "SPT Treated", value: "3", icon: <Cpu className="w-7 h-7 text-amber-500" /> },
          { label: "Production Uplift", value: "74%", icon: <TrendingUp className="w-7 h-7 text-amber-500" /> },
        ].map((s, i) => (
          <Card key={i} className="bg-slate-900 border-slate-800 text-center">
            <CardContent className="pt-5 pb-4">
              <div className="flex justify-center mb-2">{s.icon}</div>
              <p className="text-2xl font-bold font-mono text-amber-400">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Portfolio table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-white">Client Well Portfolio</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["ID", "Region", "SGOM Score", "Status", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-slate-600 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE_WELLS.slice(0, 4).map((w) => (
                <tr key={w.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-blue-400">{w.id}</td>
                  <td className="px-4 py-3 text-slate-400">{w.region}</td>
                  <td className="px-4 py-3 font-mono font-bold text-sm" style={{ color: w.score > 80 ? "#34d399" : "#f59e0b" }}>{w.score}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs", w.status === "High" ? "text-emerald-400" : "text-amber-400")}>
                      {w.status === "High" ? "✓ Recommended" : "⏳ Under Review"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:text-white h-7 text-xs">Report</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Monthly report */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base text-white">Monthly SGOM Report</CardTitle>
          <Button onClick={generateReport} disabled={loading} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</> : "✨ Generate Report"}
          </Button>
        </CardHeader>
        <CardContent>
          {report
            ? <div className="text-slate-400 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown></div>
            : <p className="text-slate-600 text-sm">Click to generate an automated SGOM monthly report</p>
          }
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { value: "overview", label: "Overview", icon: BarChart3 },
  { value: "realdata", label: "Real Data", icon: Database },
  { value: "analysis", label: "AI Analysis", icon: Bot },
  { value: "upload", label: "Upload Data", icon: Upload },
  { value: "investor", label: "Investor Demo", icon: Presentation },
  { value: "client", label: "Client Portal", icon: User },
];

const AIAnalyst = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-500">AI Smart Well</div>
            <div className="text-xl font-extrabold tracking-tight">SGOM Platform</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Claude AI · Connected
            <Badge variant="outline" className="ml-2 border-slate-700 text-slate-500 text-[10px]">NVIDIA Inception</Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="overview">
          <TabsList className="bg-slate-900 border border-slate-800 h-auto p-1 mb-8 flex flex-wrap gap-1">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-black data-[state=active]:font-bold text-slate-400 flex items-center gap-2 px-4 py-2 rounded-md"
              >
                <Icon className="w-4 h-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="realdata"><RealDataTab /></TabsContent>
          <TabsContent value="analysis"><AnalysisTab /></TabsContent>
          <TabsContent value="upload"><UploadTab /></TabsContent>
          <TabsContent value="investor"><InvestorTab /></TabsContent>
          <TabsContent value="client"><ClientTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIAnalyst;
