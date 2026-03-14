 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import {
   ArrowLeft,
   Play,
   Pause,
   RotateCcw,
   Database,
   Filter,
   TrendingUp,
   Calculator,
   CheckCircle2,
   Clock,
   AlertTriangle,
   Droplets,
   Fuel,
   DollarSign,
   MapPin,
   ArrowRight,
   Zap,
   FileText,
   Settings,
   BarChart3,
 } from "lucide-react";
 import {
   LineChart,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   AreaChart,
   Area,
 } from "recharts";
 
  // Workflow stages
  const WORKFLOW_STAGES = [
    {
      id: 1,
      title: "Field Scanning",
      description: "Automated weekly scan of oil & gas fields",
      icon: Database,
      route: "/dashboard/field-scanning",
      details: [
        "Interactive map scanning of predefined field squares",
        "Scheduled collection (configurable, default: weekly)",
        "Identification of low-productive operating wells",
        "Automatic removal of closed wells from database",
      ],
    },
    {
      id: 2,
      title: "Data Classification",
      description: "Download and categorize well information",
      icon: Filter,
      route: "/dashboard/data-classification",
      details: [
        "Monthly production history (oil, gas, water)",
        "Initial production rates",
        "Casing and tubing pressure data",
        "Accident reports and test results",
        "Productive interval transitions",
      ],
    },
    {
      id: 3,
      title: "Cumulative Analysis",
      description: "Mathematical-graphical reserve calculation",
      icon: TrendingUp,
      route: "/dashboard/cumulative-analysis",
      details: [
        "Initial well reserves estimation",
        "Produced volume calculation",
        "Remaining oil, gas, water reserves",
        "Decline curve analysis",
      ],
    },
    {
      id: 4,
      title: "SPT Projection",
      description: "Calculate redevelopment potential",
      icon: Calculator,
      route: "/dashboard/spt-projection",
      details: [
        "Expected inflow: 25-35 bbl/day average",
        "Useful reserve estimation",
        "Development timeline (15+ years = promising)",
        "Water cut filtering (exclude excessive watering)",
      ],
    },
    {
      id: 5,
      title: "Economic Analysis",
      description: "ROI and profitability calculations",
      icon: DollarSign,
      route: "/dashboard/economic-analysis",
      details: [
        "Payback period calculation",
        "Annual gross profit projection",
        "Net profit estimation",
        "Full operational period returns",
      ],
    },
    {
      id: 6,
      title: "Geophysical Review",
      description: "Expert analysis of well logs",
      icon: FileText,
      route: "/dashboard/geophysical",
      details: [
        "Well log study by geophysicists",
        "Identification of best productive layers",
        "Missed interval detection",
        "Formation evaluation report",
      ],
    },
    {
      id: 7,
      title: "SPT Parameters",
      description: "Treatment parameters provided by Maxxwell Production",
      icon: Settings,
      route: null,
      details: [
        "Slot perforation pattern visualization",
        "Treatment parameters from Maxxwell engineer",
        "Equipment specifications reference",
        "Read-only informational view",
      ],
    },
  ];
 
 // Demo well data for the database
 const DEMO_WELLS = [
   { id: "W-101", field: "Permian Basin", status: "promising", reserves: 45000, years: 18, roi: 285, waterCut: 32 },
   { id: "W-102", field: "Anadarko", status: "promising", reserves: 38000, years: 22, roi: 340, waterCut: 28 },
   { id: "W-103", field: "Delaware Basin", status: "analyzing", reserves: 52000, years: 15, roi: 220, waterCut: 45 },
   { id: "W-104", field: "Permian Basin", status: "rejected", reserves: 12000, years: 8, roi: 85, waterCut: 78 },
   { id: "W-105", field: "Anadarko", status: "promising", reserves: 41000, years: 20, roi: 310, waterCut: 35 },
   { id: "W-106", field: "Delaware Basin", status: "analyzing", reserves: 33000, years: 16, roi: 195, waterCut: 42 },
   { id: "W-107", field: "Permian Basin", status: "rejected", reserves: 8500, years: 5, roi: 45, waterCut: 85 },
   { id: "W-108", field: "Anadarko", status: "promising", reserves: 48000, years: 25, roi: 380, waterCut: 25 },
 ];
 
 // Cumulative production chart data
 const CUMULATIVE_DATA = [
   { month: "Jan", actual: 12000, projected: 12500, sptProjected: 15000 },
   { month: "Feb", actual: 23500, projected: 24800, sptProjected: 31000 },
   { month: "Mar", actual: 34200, projected: 36500, sptProjected: 48500 },
   { month: "Apr", actual: 44100, projected: 47800, sptProjected: 67000 },
   { month: "May", actual: 53200, projected: 58500, sptProjected: 86500 },
   { month: "Jun", actual: 61500, projected: 68800, sptProjected: 107000 },
   { month: "Jul", actual: 69000, projected: 78500, sptProjected: 128500 },
   { month: "Aug", actual: 75800, projected: 87800, sptProjected: 151000 },
   { month: "Sep", actual: 81900, projected: 96500, sptProjected: 174500 },
   { month: "Oct", actual: 87300, projected: 104800, sptProjected: 199000 },
   { month: "Nov", actual: 92100, projected: 112500, sptProjected: 224500 },
   { month: "Dec", actual: 96200, projected: 119800, sptProjected: 251000 },
 ];
 
 const EOROptimization = () => {
   const navigate = useNavigate();
   const [activeStage, setActiveStage] = useState(1);
   const [isRunning, setIsRunning] = useState(false);
   const [progress, setProgress] = useState(0);
   const [processedWells, setProcessedWells] = useState(0);
 
   // Simulate workflow progression
   useEffect(() => {
     if (!isRunning) return;
 
     const interval = setInterval(() => {
       setProgress((prev) => {
         if (prev >= 100) {
           if (activeStage < 7) {
             setActiveStage((s) => s + 1);
             setProcessedWells((w) => w + Math.floor(Math.random() * 3) + 1);
             return 0;
           } else {
             setIsRunning(false);
             return 100;
           }
         }
         return prev + 2;
       });
     }, 100);
 
     return () => clearInterval(interval);
   }, [isRunning, activeStage]);
 
   const handleStart = () => {
     setIsRunning(true);
     setActiveStage(1);
     setProgress(0);
     setProcessedWells(0);
   };
 
   const handlePause = () => {
     setIsRunning(false);
   };
 
   const handleReset = () => {
     setIsRunning(false);
     setActiveStage(1);
     setProgress(0);
     setProcessedWells(0);
   };
 
   const getStatusColor = (status: string) => {
     switch (status) {
       case "promising":
         return "text-green-400";
       case "analyzing":
         return "text-yellow-400";
       case "rejected":
         return "text-red-400";
       default:
         return "text-muted-foreground";
     }
   };
 
   const getStatusBadge = (status: string) => {
     switch (status) {
       case "promising":
         return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Promising</Badge>;
       case "analyzing":
         return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Analyzing</Badge>;
       case "rejected":
         return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
       default:
         return null;
     }
   };
 
   return (
     <div className="p-8 space-y-6">
       {/* Header */}
       <div className="flex items-center justify-between">
         <div>
           <Button
             variant="ghost"
             size="sm"
             onClick={() => navigate("/dashboard")}
             className="mb-2"
           >
             <ArrowLeft className="mr-2 h-4 w-4" />
             Back to Dashboard
           </Button>
           <div className="flex items-center gap-3 mb-2">
             <span className="text-3xl">🧠</span>
             <h1 className="text-3xl font-bold">AI EOR SPT Optimization</h1>
           </div>
           <p className="text-muted-foreground max-w-2xl">
             Intelligent program for optimizing Enhanced Oil Recovery through automated
             geological analysis and SPT well selection
           </p>
         </div>
         <div className="flex gap-3">
            <Badge variant="outline" className="text-primary border-primary">
              <Zap className="mr-1 h-3 w-3" />
              Stage 9
            </Badge>
           <div className="flex gap-2">
             {!isRunning ? (
               <Button onClick={handleStart} className="gap-2">
                 <Play className="h-4 w-4" />
                 Run Analysis
               </Button>
             ) : (
               <Button onClick={handlePause} variant="secondary" className="gap-2">
                 <Pause className="h-4 w-4" />
                 Pause
               </Button>
             )}
             <Button onClick={handleReset} variant="outline" size="icon">
               <RotateCcw className="h-4 w-4" />
             </Button>
           </div>
         </div>
       </div>
 
       {/* Workflow Pipeline Visualization */}
       <Card className="border-primary/20">
         <CardHeader className="pb-4">
           <div className="flex items-center justify-between">
             <div>
               <CardTitle className="flex items-center gap-2">
                 <BarChart3 className="h-5 w-5 text-primary" />
                 Analysis Pipeline
               </CardTitle>
               <CardDescription>
                 7-stage automated workflow for well redevelopment assessment
               </CardDescription>
             </div>
             <div className="flex items-center gap-4 text-sm">
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="h-4 w-4 text-green-400" />
                 <span>Wells Processed: {processedWells}</span>
               </div>
               <div className="flex items-center gap-2">
                 <Clock className="h-4 w-4 text-muted-foreground" />
                 <span>Stage {activeStage}/7</span>
               </div>
             </div>
           </div>
         </CardHeader>
         <CardContent>
           {/* Pipeline Stages */}
           <div className="relative">
             {/* Connection Line */}
             <div className="absolute top-8 left-0 right-0 h-1 bg-muted rounded-full" />
             <div
               className="absolute top-8 left-0 h-1 bg-primary rounded-full transition-all duration-500"
               style={{ width: `${((activeStage - 1) / 6) * 100 + (progress / 100) * (100 / 7)}%` }}
             />
 
             {/* Stage Icons */}
             <div className="relative flex justify-between">
               {WORKFLOW_STAGES.map((stage, index) => {
                 const Icon = stage.icon;
                 const isCompleted = stage.id < activeStage;
                 const isActive = stage.id === activeStage;
 
                 return (
                   <div
                     key={stage.id}
                     className="flex flex-col items-center cursor-pointer group"
                     onClick={() => !isRunning && setActiveStage(stage.id)}
                   >
                     <div
                       className={`
                         relative z-10 w-16 h-16 rounded-full flex items-center justify-center
                         transition-all duration-300 border-2
                         ${isCompleted
                           ? "bg-primary border-primary text-primary-foreground"
                           : isActive
                           ? "bg-primary/20 border-primary text-primary animate-pulse"
                           : "bg-muted border-muted-foreground/30 text-muted-foreground"
                         }
                         group-hover:scale-110
                       `}
                     >
                       {isCompleted ? (
                         <CheckCircle2 className="h-6 w-6" />
                       ) : (
                         <Icon className="h-6 w-6" />
                       )}
                     </div>
                     <span
                       className={`
                         mt-3 text-xs font-medium text-center max-w-[80px]
                         ${isActive ? "text-primary" : "text-muted-foreground"}
                       `}
                     >
                       {stage.title}
                     </span>
                   </div>
                 );
               })}
             </div>
           </div>
 
           {/* Active Stage Progress */}
           {isRunning && (
             <div className="mt-6 p-4 bg-muted/50 rounded-lg">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm font-medium">
                   {WORKFLOW_STAGES[activeStage - 1].title}
                 </span>
                 <span className="text-sm text-muted-foreground">{progress}%</span>
               </div>
               <Progress value={progress} className="h-2" />
               <p className="mt-2 text-xs text-muted-foreground">
                 {WORKFLOW_STAGES[activeStage - 1].description}
               </p>
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* Main Content Tabs */}
       <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="details">Stage Details</TabsTrigger>
            <TabsTrigger value="database">Well Database</TabsTrigger>
            <TabsTrigger value="analysis">Cumulative Analysis</TabsTrigger>
            <TabsTrigger value="economics">Economic Model</TabsTrigger>
            <TabsTrigger value="spt-parameters">SPT Parameters</TabsTrigger>
          </TabsList>
 
         {/* Stage Details */}
         <TabsContent value="details" className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {WORKFLOW_STAGES.map((stage) => {
               const Icon = stage.icon;
               const isCompleted = stage.id < activeStage;
               const isActive = stage.id === activeStage;
 
               return (
                 <Card
                   key={stage.id}
                   className={`
                     transition-all duration-300 cursor-pointer
                     ${isActive ? "border-primary ring-2 ring-primary/20" : ""}
                     ${isCompleted ? "border-green-500/30 bg-green-500/5" : ""}
                     hover:border-primary/50
                   `}
                   onClick={() => !isRunning && setActiveStage(stage.id)}
                 >
                   <CardHeader className="pb-3">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div
                           className={`
                             p-2 rounded-lg
                             ${isCompleted ? "bg-green-500/20" : isActive ? "bg-primary/20" : "bg-muted"}
                           `}
                         >
                           <Icon
                             className={`h-5 w-5 ${
                               isCompleted ? "text-green-400" : isActive ? "text-primary" : "text-muted-foreground"
                             }`}
                           />
                         </div>
                         <div>
                           <CardTitle className="text-base">
                             Stage {stage.id}: {stage.title}
                           </CardTitle>
                         </div>
                       </div>
                       {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                       {isActive && isRunning && (
                         <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                       )}
                     </div>
                   </CardHeader>
                   <CardContent>
                     <p className="text-sm text-muted-foreground mb-3">{stage.description}</p>
                     <ul className="space-y-1.5">
                        {stage.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <ArrowRight className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                      {stage.route ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-3 w-full text-xs text-primary hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(stage.route);
                          }}
                        >
                          Open Stage {stage.id} →
                        </Button>
                      ) : (
                        <Badge variant="outline" className="mt-3 w-full justify-center text-xs">
                          Informational — provided by Maxxwell Production
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
 
         {/* Well Database */}
         <TabsContent value="database">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Database className="h-5 w-5 text-primary" />
                 Prospect Wells Database
               </CardTitle>
               <CardDescription>
                 Fresh database of promising wells for redevelopment, updated weekly
               </CardDescription>
             </CardHeader>
             <CardContent>
               <ScrollArea className="h-[400px]">
                 <div className="space-y-3">
                   {DEMO_WELLS.map((well) => (
                     <div
                       key={well.id}
                       className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                     >
                       <div className="flex items-center gap-4">
                         <div className="p-2 bg-primary/10 rounded-lg">
                           <Droplets className="h-5 w-5 text-primary" />
                         </div>
                         <div>
                           <div className="flex items-center gap-2">
                             <span className="font-medium">{well.id}</span>
                             {getStatusBadge(well.status)}
                           </div>
                           <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                             <MapPin className="h-3 w-3" />
                             {well.field}
                           </div>
                         </div>
                       </div>
                       <div className="flex items-center gap-8 text-sm">
                         <div className="text-center">
                           <div className="text-muted-foreground text-xs">Reserves</div>
                           <div className="font-medium">{(well.reserves / 1000).toFixed(1)}k bbl</div>
                         </div>
                         <div className="text-center">
                           <div className="text-muted-foreground text-xs">Dev. Years</div>
                           <div className={`font-medium ${well.years >= 15 ? "text-green-400" : "text-yellow-400"}`}>
                             {well.years} yrs
                           </div>
                         </div>
                         <div className="text-center">
                           <div className="text-muted-foreground text-xs">Water Cut</div>
                           <div className={`font-medium ${well.waterCut > 70 ? "text-red-400" : ""}`}>
                             {well.waterCut}%
                           </div>
                         </div>
                         <div className="text-center">
                           <div className="text-muted-foreground text-xs">ROI</div>
                           <div className="font-medium text-green-400">{well.roi}%</div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </ScrollArea>
             </CardContent>
           </Card>
         </TabsContent>
 
         {/* Cumulative Analysis */}
         <TabsContent value="analysis">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <TrendingUp className="h-5 w-5 text-primary" />
                 Cumulative Production Analysis
               </CardTitle>
               <CardDescription>
                 Mathematical-graphical method comparing actual vs projected production with SPT enhancement
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="h-[400px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={CUMULATIVE_DATA}>
                     <defs>
                       <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
                         <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                       </linearGradient>
                       <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                         <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                       </linearGradient>
                       <linearGradient id="colorSPT" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                         <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                     <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                     <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                     <Tooltip
                       contentStyle={{
                         backgroundColor: "hsl(var(--card))",
                         border: "1px solid hsl(var(--border))",
                         borderRadius: "8px",
                       }}
                     />
                     <Area
                       type="monotone"
                       dataKey="actual"
                       stroke="hsl(var(--muted-foreground))"
                       fill="url(#colorActual)"
                       name="Actual Production"
                     />
                     <Area
                       type="monotone"
                       dataKey="projected"
                       stroke="hsl(var(--primary))"
                       fill="url(#colorProjected)"
                       name="Decline Projection"
                     />
                     <Area
                       type="monotone"
                       dataKey="sptProjected"
                       stroke="#22c55e"
                       fill="url(#colorSPT)"
                       name="With SPT Treatment"
                     />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
               <div className="flex items-center justify-center gap-6 mt-4">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                   <span className="text-sm">Actual Production</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-primary" />
                   <span className="text-sm">Decline Projection</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-green-500" />
                   <span className="text-sm">With SPT Enhancement</span>
                 </div>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
 
         {/* Economic Model */}
         <TabsContent value="economics">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
             <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
               <CardContent className="pt-6">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-green-500/20 rounded-lg">
                     <DollarSign className="h-5 w-5 text-green-400" />
                   </div>
                   <div>
                     <p className="text-xs text-muted-foreground">Avg. Payback Period</p>
                     <p className="text-2xl font-bold text-green-400">8.5 months</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
             <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
               <CardContent className="pt-6">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-500/20 rounded-lg">
                     <TrendingUp className="h-5 w-5 text-blue-400" />
                   </div>
                   <div>
                     <p className="text-xs text-muted-foreground">Annual Gross Profit</p>
                     <p className="text-2xl font-bold text-blue-400">$285K</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
             <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
               <CardContent className="pt-6">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-purple-500/20 rounded-lg">
                     <Calculator className="h-5 w-5 text-purple-400" />
                   </div>
                   <div>
                     <p className="text-xs text-muted-foreground">Net Profit Margin</p>
                     <p className="text-2xl font-bold text-purple-400">42%</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
             <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
               <CardContent className="pt-6">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-amber-500/20 rounded-lg">
                     <Fuel className="h-5 w-5 text-amber-400" />
                   </div>
                   <div>
                     <p className="text-xs text-muted-foreground">SPT Inflow Rate</p>
                     <p className="text-2xl font-bold text-amber-400">25-35 bbl/day</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
 
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Calculator className="h-5 w-5 text-primary" />
                 Economic Projection Model
               </CardTitle>
               <CardDescription>
                 ROI calculation based on current oil/gas prices and SPT treatment outcomes
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <h4 className="font-medium flex items-center gap-2">
                     <AlertTriangle className="h-4 w-4 text-yellow-400" />
                     Selection Criteria
                   </h4>
                   <div className="space-y-3 text-sm">
                     <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                       <span className="text-muted-foreground">Min. Development Period</span>
                       <span className="font-medium text-green-400">15+ years</span>
                     </div>
                     <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                       <span className="text-muted-foreground">Max. Water Cut</span>
                       <span className="font-medium text-yellow-400">&lt; 70%</span>
                     </div>
                     <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                       <span className="text-muted-foreground">Expected SPT Inflow</span>
                       <span className="font-medium">25-35 bbl/day</span>
                     </div>
                     <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                       <span className="text-muted-foreground">Well Status</span>
                       <span className="font-medium">Operating Low-Productive</span>
                     </div>
                   </div>
                 </div>
                 <div className="space-y-4">
                   <h4 className="font-medium flex items-center gap-2">
                     <DollarSign className="h-4 w-4 text-green-400" />
                     Profit Calculations
                   </h4>
                   <div className="space-y-3 text-sm">
                     <div className="flex justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                       <span className="text-muted-foreground">Avg. Treatment Cost</span>
                       <span className="font-medium">$45,000</span>
                     </div>
                     <div className="flex justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                       <span className="text-muted-foreground">Monthly Revenue (30 bbl/day)</span>
                       <span className="font-medium text-green-400">$63,000</span>
                     </div>
                     <div className="flex justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                       <span className="text-muted-foreground">Payback Period</span>
                       <span className="font-medium text-green-400">&lt; 1 month</span>
                     </div>
                     <div className="flex justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                       <span className="text-muted-foreground">15-Year Net Profit</span>
                       <span className="font-medium text-green-400">$11.3M+</span>
                     </div>
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>
          </TabsContent>

          {/* SPT Parameters Tab */}
          <TabsContent value="spt-parameters">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    SPT Technology Reference
                  </CardTitle>
                  <CardDescription>
                    Slot Perforation Technology — Patent US 8,863,823 by Maxxwell Production
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">Max Slots per Row</span>
                      <span className="font-medium">4</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">Nozzle Count</span>
                      <span className="font-medium">2–4</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">Cut Speed (Cased)</span>
                      <span className="font-medium">50 min/ft</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">Cut Speed (Open Hole)</span>
                      <span className="font-medium">30 min/ft</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">Max Slot Depth</span>
                      <span className="font-medium">5 ft</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">Permeability Increase</span>
                      <span className="font-medium text-primary">30–50%</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">Porosity Increase</span>
                      <span className="font-medium text-primary">30–50%</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">Expected Inflow Increase</span>
                      <span className="font-medium text-primary">5–10×</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-primary" />
                    Drainage Area by Nozzle Count
                  </CardTitle>
                  <CardDescription>
                    Parameters provided by Maxxwell Production engineer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">2 Nozzles</span>
                        <Badge variant="outline" className="border-primary/30 text-primary">13 ft²/ft</Badge>
                      </div>
                      <Progress value={43} className="h-2" />
                    </div>
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">3 Nozzles</span>
                        <Badge variant="outline" className="border-primary/30 text-primary">18 ft²/ft</Badge>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">4 Nozzles</span>
                        <Badge variant="outline" className="border-primary/30 text-primary">23 ft²/ft</Badge>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground">
                      <strong>Note:</strong> All treatment parameters are defined and entered by Maxxwell Production engineers. 
                      This tab provides reference information only. For treatment program details, contact the SPT engineering team.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
       </Tabs>
     </div>
   );
 };
 
 export default EOROptimization;