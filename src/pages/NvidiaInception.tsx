 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Progress } from "@/components/ui/progress";
 import {
   ArrowLeft,
   Brain,
   Cpu,
   Database,
   Eye,
   Layers,
   Zap,
   TrendingUp,
   Server,
   GitBranch,
   CheckCircle2,
   Circle,
   ArrowRight,
   Sparkles,
 } from "lucide-react";
 import { useNavigate } from "react-router-dom";
 
 const NvidiaInception = () => {
   const navigate = useNavigate();
 
   const aiComponents = [
     {
       name: "Core Sample Vision AI",
       description: "Computer vision analysis of geological core samples using multimodal LLMs",
       model: "Google Gemini 2.5 Flash",
       capabilities: ["Rock type classification", "Porosity estimation", "Fracture detection", "Mineral composition"],
       gpuPotential: "Custom CNN/Vision Transformer on NVIDIA A100",
       status: "production",
     },
     {
       name: "Well Ranking Intelligence",
       description: "AI-powered scoring system for SPT treatment candidate selection",
       model: "Google Gemini 3 Flash Preview",
       capabilities: ["Multi-factor analysis", "Production forecasting", "ROI prediction", "Risk assessment"],
       gpuPotential: "Fine-tuned LLM on DGX Cloud",
       status: "production",
     },
     {
       name: "EOR Optimization Engine",
       description: "Cumulative production analysis and SPT parameter calculation",
       model: "Mathematical + AI Hybrid",
       capabilities: ["Decline curve analysis", "Reserve estimation", "Economic modeling", "Parameter optimization"],
       gpuPotential: "Physics-informed neural networks (PINNs)",
       status: "development",
     },
     {
       name: "Seismic Interpretation",
       description: "AI-assisted seismic data visualization and anomaly detection",
       model: "Planned: Custom U-Net",
       capabilities: ["Horizon picking", "Fault detection", "Attribute analysis", "3D visualization"],
       gpuPotential: "3D CNN on multi-GPU cluster",
       status: "planned",
     },
   ];
 
   const nvidiaIntegrations = [
     {
       resource: "DGX Cloud",
       useCase: "Training custom vision models for core sample analysis",
       benefit: "100x faster training vs CPU",
       priority: "high",
     },
     {
       resource: "NVIDIA NGC",
       useCase: "Pre-trained models for geological image segmentation",
       benefit: "Reduce development time by 60%",
       priority: "high",
     },
     {
       resource: "TensorRT",
       useCase: "Optimize inference for real-time well monitoring",
       benefit: "10x faster inference latency",
       priority: "medium",
     },
     {
       resource: "RAPIDS",
       useCase: "GPU-accelerated data processing for seismic datasets",
       benefit: "Process TB-scale data in minutes",
       priority: "medium",
     },
     {
       resource: "Triton Inference Server",
       useCase: "Scalable model serving for production deployment",
       benefit: "Handle 1000+ concurrent requests",
       priority: "high",
     },
   ];
 
   const roadmap = [
     { phase: "Q1 2025", title: "MVP Validation", items: ["Core Vision AI", "Well Ranking", "Basic EOR"], status: "completed" },
     { phase: "Q2 2025", title: "NVIDIA Integration", items: ["DGX Cloud setup", "Custom model training", "TensorRT optimization"], status: "current" },
     { phase: "Q3 2025", title: "Advanced AI", items: ["Seismic interpretation", "Real-time monitoring", "Predictive maintenance"], status: "planned" },
     { phase: "Q4 2025", title: "Scale & Deploy", items: ["Multi-field deployment", "Edge inference", "Enterprise API"], status: "planned" },
   ];
 
   return (
     <div className="min-h-screen bg-background">
       {/* Header */}
       <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
         <div className="max-w-7xl mx-auto px-6 py-4">
           <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-2">
             <ArrowLeft className="mr-2 h-4 w-4" />
             Back to Platform
           </Button>
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#76B900] to-[#1A1A1A] flex items-center justify-center">
                 <Cpu className="h-6 w-6 text-white" />
               </div>
               <div>
                 <h1 className="text-2xl font-bold">NVIDIA Inception Application</h1>
                 <p className="text-muted-foreground">Technical Architecture & AI Components</p>
               </div>
             </div>
             <Badge className="bg-[#76B900] text-white hover:bg-[#76B900]/90">
               <Sparkles className="mr-1 h-3 w-3" />
               AI-Powered O&G Platform
             </Badge>
           </div>
         </div>
       </div>
 
       <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
         {/* Executive Summary */}
         <Card className="border-[#76B900]/30 bg-gradient-to-r from-[#76B900]/5 to-transparent">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Brain className="h-5 w-5 text-[#76B900]" />
               Executive Summary
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <p className="text-lg">
               <strong>SGO.ai</strong> is an AI-powered platform for optimizing Enhanced Oil Recovery (EOR) 
               using Slot Perforation Technology (SPT). We leverage computer vision and large language models 
               to automate geological analysis and well selection, reducing decision time from weeks to minutes.
             </p>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
               <div className="text-center p-4 rounded-lg bg-primary/10">
                 <div className="text-3xl font-bold text-primary">4</div>
                 <div className="text-sm text-muted-foreground">AI Modules</div>
               </div>
               <div className="text-center p-4 rounded-lg bg-[#76B900]/10">
                 <div className="text-3xl font-bold text-[#76B900]">85%</div>
                 <div className="text-sm text-muted-foreground">Automation Rate</div>
               </div>
               <div className="text-center p-4 rounded-lg bg-accent/10">
                 <div className="text-3xl font-bold text-accent">10x</div>
                 <div className="text-sm text-muted-foreground">Faster Analysis</div>
               </div>
               <div className="text-center p-4 rounded-lg bg-success/10">
                 <div className="text-3xl font-bold text-success">$2M+</div>
                 <div className="text-sm text-muted-foreground">Potential Savings/Field</div>
               </div>
             </div>
           </CardContent>
         </Card>
 
         <Tabs defaultValue="architecture" className="space-y-6">
           <TabsList className="grid w-full max-w-2xl grid-cols-4">
             <TabsTrigger value="architecture">Architecture</TabsTrigger>
             <TabsTrigger value="ai-components">AI Components</TabsTrigger>
             <TabsTrigger value="nvidia">NVIDIA Integration</TabsTrigger>
             <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
           </TabsList>
 
           {/* Architecture Tab */}
           <TabsContent value="architecture" className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Layers className="h-5 w-5" />
                   System Architecture
                 </CardTitle>
                 <CardDescription>End-to-end AI pipeline for EOR optimization</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-6">
                   {/* Architecture Diagram */}
                   <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                     {/* Data Sources */}
                     <div className="space-y-2">
                       <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data Sources</div>
                       <div className="space-y-2">
                         <div className="p-3 rounded-lg bg-muted/50 text-sm flex items-center gap-2">
                           <Database className="h-4 w-4 text-primary" />
                           Well Logs
                         </div>
                         <div className="p-3 rounded-lg bg-muted/50 text-sm flex items-center gap-2">
                           <Eye className="h-4 w-4 text-primary" />
                           Core Images
                         </div>
                         <div className="p-3 rounded-lg bg-muted/50 text-sm flex items-center gap-2">
                           <TrendingUp className="h-4 w-4 text-primary" />
                           Production Data
                         </div>
                       </div>
                     </div>
 
                     <div className="hidden md:flex justify-center">
                       <ArrowRight className="h-6 w-6 text-muted-foreground" />
                     </div>
 
                     {/* AI Processing */}
                     <div className="space-y-2">
                       <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Processing</div>
                       <div className="p-4 rounded-lg bg-[#76B900]/10 border border-[#76B900]/30 space-y-2">
                         <div className="flex items-center gap-2 text-sm font-medium">
                           <Cpu className="h-4 w-4 text-[#76B900]" />
                           NVIDIA GPU Cluster
                         </div>
                         <div className="text-xs text-muted-foreground">
                           • Vision AI Models<br />
                           • LLM Inference<br />
                           • Real-time Analytics
                         </div>
                       </div>
                     </div>
 
                     <div className="hidden md:flex justify-center">
                       <ArrowRight className="h-6 w-6 text-muted-foreground" />
                     </div>
 
                     {/* Outputs */}
                     <div className="space-y-2">
                       <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outputs</div>
                       <div className="space-y-2">
                         <div className="p-3 rounded-lg bg-success/10 text-sm flex items-center gap-2">
                           <CheckCircle2 className="h-4 w-4 text-success" />
                           Well Rankings
                         </div>
                         <div className="p-3 rounded-lg bg-success/10 text-sm flex items-center gap-2">
                           <CheckCircle2 className="h-4 w-4 text-success" />
                           SPT Parameters
                         </div>
                         <div className="p-3 rounded-lg bg-success/10 text-sm flex items-center gap-2">
                           <CheckCircle2 className="h-4 w-4 text-success" />
                           ROI Forecasts
                         </div>
                       </div>
                     </div>
                   </div>
 
                   {/* Tech Stack */}
                   <div className="pt-6 border-t border-border">
                     <div className="text-sm font-medium mb-4">Technology Stack</div>
                     <div className="flex flex-wrap gap-2">
                       {["React", "TypeScript", "Supabase", "Edge Functions", "Gemini AI", "Three.js", "Recharts", "TailwindCSS"].map((tech) => (
                         <Badge key={tech} variant="secondary">{tech}</Badge>
                       ))}
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </TabsContent>
 
           {/* AI Components Tab */}
           <TabsContent value="ai-components" className="space-y-4">
             {aiComponents.map((component) => (
               <Card key={component.name} className="overflow-hidden">
                 <CardHeader className="pb-2">
                   <div className="flex items-start justify-between">
                     <div>
                       <CardTitle className="text-lg flex items-center gap-2">
                         <Brain className="h-5 w-5 text-primary" />
                         {component.name}
                       </CardTitle>
                       <CardDescription>{component.description}</CardDescription>
                     </div>
                     <Badge 
                       variant={component.status === "production" ? "default" : component.status === "development" ? "secondary" : "outline"}
                       className={component.status === "production" ? "bg-success" : ""}
                     >
                       {component.status}
                     </Badge>
                   </div>
                 </CardHeader>
                 <CardContent>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                       <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Current Model</div>
                       <div className="text-sm font-medium">{component.model}</div>
                     </div>
                     <div>
                       <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Capabilities</div>
                       <div className="flex flex-wrap gap-1">
                         {component.capabilities.map((cap) => (
                           <Badge key={cap} variant="outline" className="text-xs">{cap}</Badge>
                         ))}
                       </div>
                     </div>
                     <div>
                       <div className="text-xs font-medium text-muted-foreground uppercase mb-2">NVIDIA Upgrade Path</div>
                       <div className="text-sm text-[#76B900] font-medium">{component.gpuPotential}</div>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </TabsContent>
 
           {/* NVIDIA Integration Tab */}
           <TabsContent value="nvidia" className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Server className="h-5 w-5 text-[#76B900]" />
                   NVIDIA Resources & Use Cases
                 </CardTitle>
                 <CardDescription>How we plan to leverage NVIDIA Inception benefits</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   {nvidiaIntegrations.map((item) => (
                     <div key={item.resource} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                       <div className="h-10 w-10 rounded-lg bg-[#76B900]/20 flex items-center justify-center flex-shrink-0">
                         <Zap className="h-5 w-5 text-[#76B900]" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-1">
                           <span className="font-medium">{item.resource}</span>
                           <Badge variant={item.priority === "high" ? "default" : "secondary"} className="text-xs">
                             {item.priority} priority
                           </Badge>
                         </div>
                         <p className="text-sm text-muted-foreground">{item.useCase}</p>
                       </div>
                       <div className="text-right flex-shrink-0">
                         <div className="text-sm font-medium text-[#76B900]">{item.benefit}</div>
                       </div>
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>
 
             {/* GPU Requirements */}
             <Card>
               <CardHeader>
                 <CardTitle>Estimated GPU Requirements</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span>Training (Monthly)</span>
                       <span className="font-medium">200-500 GPU hours</span>
                     </div>
                     <Progress value={35} className="h-2" />
                   </div>
                   <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span>Inference (Daily)</span>
                       <span className="font-medium">50-100 GPU hours</span>
                     </div>
                     <Progress value={20} className="h-2" />
                   </div>
                   <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span>Data Processing</span>
                       <span className="font-medium">100-200 GPU hours</span>
                     </div>
                     <Progress value={25} className="h-2" />
                   </div>
                 </div>
               </CardContent>
             </Card>
           </TabsContent>
 
           {/* Roadmap Tab */}
           <TabsContent value="roadmap">
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <GitBranch className="h-5 w-5" />
                   Development Roadmap
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-6">
                   {roadmap.map((phase, index) => (
                     <div key={phase.phase} className="flex gap-4">
                       <div className="flex flex-col items-center">
                         <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                           phase.status === "completed" ? "bg-success text-success-foreground" :
                           phase.status === "current" ? "bg-[#76B900] text-white" :
                           "bg-muted text-muted-foreground"
                         }`}>
                           {phase.status === "completed" ? (
                             <CheckCircle2 className="h-5 w-5" />
                           ) : (
                             <Circle className="h-5 w-5" />
                           )}
                         </div>
                         {index < roadmap.length - 1 && (
                           <div className={`w-0.5 h-full mt-2 ${
                             phase.status === "completed" ? "bg-success" : "bg-border"
                           }`} />
                         )}
                       </div>
                       <div className="pb-8">
                         <div className="flex items-center gap-2 mb-1">
                           <span className="font-medium">{phase.phase}</span>
                           <span className="text-muted-foreground">—</span>
                           <span className="text-muted-foreground">{phase.title}</span>
                         </div>
                         <div className="flex flex-wrap gap-2">
                           {phase.items.map((item) => (
                             <Badge key={item} variant="outline" className="text-xs">
                               {item}
                             </Badge>
                           ))}
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
 
         {/* CTA */}
         <Card className="bg-gradient-to-r from-[#76B900]/10 via-primary/5 to-accent/10 border-[#76B900]/30">
           <CardContent className="py-8">
             <div className="text-center space-y-4">
               <h2 className="text-2xl font-bold">Ready for NVIDIA Inception</h2>
               <p className="text-muted-foreground max-w-2xl mx-auto">
                 Our platform demonstrates production-ready AI capabilities with clear GPU acceleration opportunities.
                 With NVIDIA Inception support, we can scale from prototype to enterprise deployment.
               </p>
               <div className="flex justify-center gap-4 pt-4">
                 <Button size="lg" className="bg-[#76B900] hover:bg-[#76B900]/90">
                   <Cpu className="mr-2 h-4 w-4" />
                   Apply to Inception
                 </Button>
                 <Button size="lg" variant="outline" onClick={() => navigate("/dashboard")}>
                   Explore Platform
                 </Button>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 };
 
 export default NvidiaInception;