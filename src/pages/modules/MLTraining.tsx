 import { useState, useEffect } from "react";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Progress } from "@/components/ui/progress";
 import { Badge } from "@/components/ui/badge";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Slider } from "@/components/ui/slider";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Label } from "@/components/ui/label";
 import { toast } from "sonner";
 import {
   Brain,
   Upload,
   Play,
   Pause,
   RotateCcw,
   Download,
   TrendingUp,
   Database,
   Cpu,
   Zap,
   CheckCircle2,
   AlertCircle,
   BarChart3,
   LineChart,
 } from "lucide-react";
 import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
 
 // Mock training data
 const generateTrainingData = (epochs: number) => {
   const data = [];
   for (let i = 1; i <= epochs; i++) {
     const trainLoss = 1.5 * Math.exp(-0.08 * i) + 0.1 + Math.random() * 0.05;
     const valLoss = 1.6 * Math.exp(-0.07 * i) + 0.12 + Math.random() * 0.08;
     data.push({
       epoch: i,
       trainLoss: parseFloat(trainLoss.toFixed(4)),
       valLoss: parseFloat(valLoss.toFixed(4)),
       accuracy: parseFloat((100 - trainLoss * 30).toFixed(2)),
     });
   }
   return data;
 };
 
 const featureImportance = [
   { feature: "Reservoir Pressure", importance: 0.92 },
   { feature: "Water Cut", importance: 0.87 },
   { feature: "Permeability", importance: 0.81 },
   { feature: "Porosity", importance: 0.76 },
   { feature: "Well Depth", importance: 0.69 },
   { feature: "API Gravity", importance: 0.64 },
   { feature: "Gas-Oil Ratio", importance: 0.58 },
   { feature: "Formation Type", importance: 0.52 },
 ];
 
 const MLTraining = () => {
   const [activeTab, setActiveTab] = useState("data");
   const [isTraining, setIsTraining] = useState(false);
   const [trainingProgress, setTrainingProgress] = useState(0);
   const [currentEpoch, setCurrentEpoch] = useState(0);
   const [trainingData, setTrainingData] = useState<any[]>([]);
   const [dataUploaded, setDataUploaded] = useState(false);
   const [modelTrained, setModelTrained] = useState(false);
 
   // Hyperparameters
   const [epochs, setEpochs] = useState(100);
   const [learningRate, setLearningRate] = useState(0.001);
   const [batchSize, setBatchSize] = useState(32);
   const [modelType, setModelType] = useState("lstm");
   const [optimizer, setOptimizer] = useState("adam");
 
   // Mock dataset stats
   const datasetStats = {
     totalSamples: 15847,
     features: 24,
     trainSplit: 12678,
     valSplit: 1584,
     testSplit: 1585,
     timeRange: "2018-2024",
   };
 
   useEffect(() => {
     let interval: NodeJS.Timeout;
     if (isTraining && currentEpoch < epochs) {
       interval = setInterval(() => {
         setCurrentEpoch((prev) => {
           const next = prev + 1;
           setTrainingProgress((next / epochs) * 100);
           setTrainingData(generateTrainingData(next));
           if (next >= epochs) {
             setIsTraining(false);
             setModelTrained(true);
              toast.success("Training complete! Model is ready to use.");
           }
           return next;
         });
       }, 150);
     }
     return () => clearInterval(interval);
   }, [isTraining, currentEpoch, epochs]);
 
   const handleFileUpload = () => {
     setTimeout(() => {
       setDataUploaded(true);
        toast.success("Data loaded successfully! 15,847 records from OK & TX databases.");
       setActiveTab("config");
     }, 1500);
   };
 
   const startTraining = () => {
     setIsTraining(true);
     setCurrentEpoch(0);
     setTrainingProgress(0);
     setTrainingData([]);
     setModelTrained(false);
      toast.info("Model training started...");
   };
 
   const stopTraining = () => {
     setIsTraining(false);
      toast.warning("Training paused");
   };
 
   const resetTraining = () => {
     setIsTraining(false);
     setCurrentEpoch(0);
     setTrainingProgress(0);
     setTrainingData([]);
     setModelTrained(false);
   };
 
   const exportModel = () => {
      toast.success("Model exported in ONNX format for GPU inference");
   };
 
   const currentMetrics = trainingData.length > 0 ? trainingData[trainingData.length - 1] : null;
 
   return (
     <div className="p-8 space-y-6">
       {/* Header */}
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-3xl font-bold flex items-center gap-3">
             <Brain className="h-8 w-8 text-primary" />
             ML Model Training
           </h1>
           <p className="text-muted-foreground mt-1">
              Train neural networks for oil production forecasting from scratch
           </p>
         </div>
         <div className="flex items-center gap-2">
           <Badge variant="outline" className="flex items-center gap-1">
             <Cpu className="h-3 w-3" />
             GPU: NVIDIA CUDA
           </Badge>
           <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-warning" />
             TensorFlow 2.x
           </Badge>
         </div>
       </div>
 
       {/* Progress Overview */}
       <Card className="border-primary/20">
         <CardContent className="pt-6">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                 {dataUploaded ? (
                   <CheckCircle2 className="h-5 w-5 text-success" />
                 ) : (
                   <AlertCircle className="h-5 w-5 text-muted-foreground" />
                 )}
                 <span className={dataUploaded ? "text-success" : "text-muted-foreground"}>
                    1. Data
                 </span>
               </div>
               <div className="h-px w-8 bg-border" />
               <div className="flex items-center gap-2">
                 {trainingProgress > 0 ? (
                   <CheckCircle2 className="h-5 w-5 text-success" />
                 ) : (
                   <AlertCircle className="h-5 w-5 text-muted-foreground" />
                 )}
                 <span className={trainingProgress > 0 ? "text-success" : "text-muted-foreground"}>
                    2. Configuration
                 </span>
               </div>
               <div className="h-px w-8 bg-border" />
               <div className="flex items-center gap-2">
                 {isTraining || modelTrained ? (
                   <CheckCircle2 className="h-5 w-5 text-success" />
                 ) : (
                   <AlertCircle className="h-5 w-5 text-muted-foreground" />
                 )}
                 <span className={isTraining || modelTrained ? "text-success" : "text-muted-foreground"}>
                    3. Training
                 </span>
               </div>
               <div className="h-px w-8 bg-border" />
               <div className="flex items-center gap-2">
                 {modelTrained ? (
                   <CheckCircle2 className="h-5 w-5 text-success" />
                 ) : (
                   <AlertCircle className="h-5 w-5 text-muted-foreground" />
                 )}
                 <span className={modelTrained ? "text-success" : "text-muted-foreground"}>
                    4. Results
                 </span>
               </div>
             </div>
             {isTraining && (
               <div className="text-right">
                  <p className="text-sm text-muted-foreground">Epoch {currentEpoch} / {epochs}</p>
                 <p className="text-2xl font-bold text-primary">{trainingProgress.toFixed(1)}%</p>
               </div>
             )}
           </div>
           {(isTraining || trainingProgress > 0) && (
             <Progress value={trainingProgress} className="h-2" />
           )}
         </CardContent>
       </Card>
 
       <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
         <TabsList className="grid grid-cols-4 w-full max-w-2xl">
           <TabsTrigger value="data" className="flex items-center gap-2">
             <Database className="h-4 w-4" />
              Data
           </TabsTrigger>
           <TabsTrigger value="config" disabled={!dataUploaded} className="flex items-center gap-2">
             <Cpu className="h-4 w-4" />
              Configuration
           </TabsTrigger>
           <TabsTrigger value="training" disabled={!dataUploaded} className="flex items-center gap-2">
             <Brain className="h-4 w-4" />
              Training
           </TabsTrigger>
           <TabsTrigger value="results" disabled={!modelTrained} className="flex items-center gap-2">
             <BarChart3 className="h-4 w-4" />
              Results
           </TabsTrigger>
         </TabsList>
 
         {/* Data Tab */}
         <TabsContent value="data" className="space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Upload className="h-5 w-5" />
                  Data Upload
                 </CardTitle>
                 <CardDescription>
                  Upload historical production data to train the model
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div
                   className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                   onClick={handleFileUpload}
                 >
                   <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Drag & drop CSV/Excel file here</p>
                   <p className="text-sm text-muted-foreground mt-2">
                    or click to select a file
                   </p>
                   <div className="flex gap-2 justify-center mt-4">
                     <Badge variant="secondary">CSV</Badge>
                     <Badge variant="secondary">Excel</Badge>
                     <Badge variant="secondary">Parquet</Badge>
                   </div>
                 </div>
 
                 <div className="text-center">
                  <span className="text-muted-foreground">or</span>
                 </div>
 
                 <Button 
                   variant="outline" 
                   className="w-full"
                   onClick={handleFileUpload}
                 >
                   <Database className="h-4 w-4 mr-2" />
                  Load from OK & TX database
                 </Button>
               </CardContent>
             </Card>
 
             <Card>
               <CardHeader>
                <CardTitle>Dataset Statistics</CardTitle>
                 <CardDescription>
                  {dataUploaded ? "Data loaded successfully" : "Waiting for data upload"}
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 {dataUploaded ? (
                   <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-muted rounded-lg">
                         <p className="text-2xl font-bold text-primary">{datasetStats.totalSamples.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total Records</p>
                       </div>
                       <div className="p-4 bg-muted rounded-lg">
                         <p className="text-2xl font-bold text-primary">{datasetStats.features}</p>
                        <p className="text-sm text-muted-foreground">Features</p>
                       </div>
                     </div>
                     <div className="space-y-2">
                       <div className="flex justify-between text-sm">
                         <span>Train (80%)</span>
                         <span className="text-muted-foreground">{datasetStats.trainSplit.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                         <span>Validation (10%)</span>
                         <span className="text-muted-foreground">{datasetStats.valSplit.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                         <span>Test (10%)</span>
                         <span className="text-muted-foreground">{datasetStats.testSplit.toLocaleString()}</span>
                       </div>
                     </div>
                     <div className="pt-4 border-t">
                       <p className="text-sm text-muted-foreground">
                        Time Range: <span className="text-foreground font-medium">{datasetStats.timeRange}</span>
                       </p>
                     </div>
                   </div>
                 ) : (
                   <div className="flex items-center justify-center h-48 text-muted-foreground">
                    <p>Upload data to view statistics</p>
                   </div>
                 )}
               </CardContent>
             </Card>
           </div>
         </TabsContent>
 
         {/* Config Tab */}
         <TabsContent value="config" className="space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card>
               <CardHeader>
                <CardTitle>Model Architecture</CardTitle>
                <CardDescription>Select neural network type</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                  <Label>Model Type</Label>
                   <Select value={modelType} onValueChange={setModelType}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="lstm">LSTM (Long Short-Term Memory)</SelectItem>
                       <SelectItem value="gru">GRU (Gated Recurrent Unit)</SelectItem>
                       <SelectItem value="transformer">Transformer</SelectItem>
                       <SelectItem value="cnn-lstm">CNN-LSTM Hybrid</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
 
                 <div className="space-y-2">
                  <Label>Optimizer</Label>
                   <Select value={optimizer} onValueChange={setOptimizer}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="adam">Adam</SelectItem>
                       <SelectItem value="sgd">SGD</SelectItem>
                       <SelectItem value="rmsprop">RMSprop</SelectItem>
                       <SelectItem value="adamw">AdamW</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
 
                 <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-medium">Architecture: {modelType.toUpperCase()}</h4>
                   <p className="text-sm text-muted-foreground">
                     Input → LSTM(128) → Dropout(0.2) → LSTM(64) → Dense(32) → Output(1)
                   </p>
                   <p className="text-xs text-muted-foreground mt-2">
                    Parameters: ~245,000 | Size: ~1.2 MB
                   </p>
                 </div>
               </CardContent>
             </Card>
 
             <Card>
               <CardHeader>
                <CardTitle>Hyperparameters</CardTitle>
                <CardDescription>Configure training parameters</CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                 <div className="space-y-3">
                   <div className="flex justify-between">
                    <Label>Number of Epochs</Label>
                     <span className="text-sm font-medium">{epochs}</span>
                   </div>
                   <Slider
                     value={[epochs]}
                     onValueChange={(v) => setEpochs(v[0])}
                     min={10}
                     max={500}
                     step={10}
                   />
                 </div>
 
                 <div className="space-y-3">
                   <div className="flex justify-between">
                     <Label>Learning Rate</Label>
                     <span className="text-sm font-medium">{learningRate}</span>
                   </div>
                   <Slider
                     value={[learningRate * 1000]}
                     onValueChange={(v) => setLearningRate(v[0] / 1000)}
                     min={0.1}
                     max={10}
                     step={0.1}
                   />
                 </div>
 
                 <div className="space-y-3">
                   <div className="flex justify-between">
                     <Label>Batch Size</Label>
                     <span className="text-sm font-medium">{batchSize}</span>
                   </div>
                   <Slider
                     value={[batchSize]}
                     onValueChange={(v) => setBatchSize(v[0])}
                     min={8}
                     max={256}
                     step={8}
                   />
                 </div>
 
                 <Button 
                   className="w-full" 
                   size="lg"
                   onClick={() => {
                     setActiveTab("training");
                     startTraining();
                   }}
                 >
                   <Play className="h-4 w-4 mr-2" />
                  Start Training
                 </Button>
               </CardContent>
             </Card>
           </div>
         </TabsContent>
 
         {/* Training Tab */}
         <TabsContent value="training" className="space-y-6">
           <div className="flex gap-4 mb-6">
             {!isTraining ? (
               <Button onClick={startTraining} disabled={modelTrained}>
                 <Play className="h-4 w-4 mr-2" />
                {currentEpoch > 0 ? "Resume" : "Start"}
               </Button>
             ) : (
               <Button onClick={stopTraining} variant="outline">
                 <Pause className="h-4 w-4 mr-2" />
                Pause
               </Button>
             )}
             <Button variant="outline" onClick={resetTraining}>
               <RotateCcw className="h-4 w-4 mr-2" />
              Reset
             </Button>
           </div>
 
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Training Curve */}
             <Card className="lg:col-span-2">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <LineChart className="h-5 w-5" />
                    Training Curve
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="h-80">
                   <ResponsiveContainer width="100%" height="100%">
                     <RechartsLineChart data={trainingData}>
                       <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                       <XAxis dataKey="epoch" className="text-xs" />
                       <YAxis className="text-xs" />
                       <Tooltip
                         contentStyle={{
                           backgroundColor: "hsl(var(--card))",
                           border: "1px solid hsl(var(--border))",
                           borderRadius: "8px",
                         }}
                       />
                       <Line
                         type="monotone"
                         dataKey="trainLoss"
                         stroke="hsl(var(--primary))"
                         strokeWidth={2}
                         dot={false}
                         name="Train Loss"
                       />
                       <Line
                         type="monotone"
                         dataKey="valLoss"
                         stroke="hsl(var(--destructive))"
                         strokeWidth={2}
                         dot={false}
                         name="Val Loss"
                       />
                     </RechartsLineChart>
                   </ResponsiveContainer>
                 </div>
               </CardContent>
             </Card>
 
             {/* Live Metrics */}
             <Card>
               <CardHeader>
                  <CardTitle>Real-time Metrics</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Current Epoch</p>
                   <p className="text-3xl font-bold text-primary">{currentEpoch} / {epochs}</p>
                 </div>
 
                 {currentMetrics && (
                   <>
                     <div className="p-4 bg-muted rounded-lg">
                       <p className="text-sm text-muted-foreground">Train Loss</p>
                       <p className="text-2xl font-bold">{currentMetrics.trainLoss}</p>
                     </div>
                     <div className="p-4 bg-muted rounded-lg">
                       <p className="text-sm text-muted-foreground">Val Loss</p>
                       <p className="text-2xl font-bold">{currentMetrics.valLoss}</p>
                     </div>
                     <div className="p-4 bg-muted rounded-lg">
                       <p className="text-sm text-muted-foreground">Accuracy</p>
                       <p className="text-2xl font-bold text-success">{currentMetrics.accuracy}%</p>
                     </div>
                   </>
                 )}
 
                 {isTraining && (
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                     <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      GPU Active · ~2.3 TFLOPS
                   </div>
                 )}
               </CardContent>
             </Card>
           </div>
         </TabsContent>
 
         {/* Results Tab */}
         <TabsContent value="results" className="space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Model Performance */}
             <Card className="lg:col-span-2">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <TrendingUp className="h-5 w-5" />
                    Model Performance
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-4 gap-4 mb-6">
                   <div className="p-4 bg-muted rounded-lg text-center">
                     <p className="text-2xl font-bold text-success">94.2%</p>
                     <p className="text-xs text-muted-foreground">R² Score</p>
                   </div>
                   <div className="p-4 bg-muted rounded-lg text-center">
                     <p className="text-2xl font-bold">0.087</p>
                     <p className="text-xs text-muted-foreground">MAE (BBL)</p>
                   </div>
                   <div className="p-4 bg-muted rounded-lg text-center">
                     <p className="text-2xl font-bold">0.124</p>
                     <p className="text-xs text-muted-foreground">RMSE</p>
                   </div>
                   <div className="p-4 bg-muted rounded-lg text-center">
                     <p className="text-2xl font-bold">4.2%</p>
                     <p className="text-xs text-muted-foreground">MAPE</p>
                   </div>
                 </div>
 
                 <div className="space-y-3">
                    <h4 className="font-medium">Feature Importance</h4>
                   {featureImportance.map((item) => (
                     <div key={item.feature} className="space-y-1">
                       <div className="flex justify-between text-sm">
                         <span>{item.feature}</span>
                         <span className="text-muted-foreground">{(item.importance * 100).toFixed(0)}%</span>
                       </div>
                       <Progress value={item.importance * 100} className="h-2" />
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>
 
             {/* Export Options */}
             <Card>
               <CardHeader>
                  <CardTitle>Export Model</CardTitle>
                  <CardDescription>Download the trained model</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <Button className="w-full" onClick={exportModel}>
                   <Download className="h-4 w-4 mr-2" />
                    Export to ONNX
                 </Button>
                 <Button variant="outline" className="w-full" onClick={exportModel}>
                   <Download className="h-4 w-4 mr-2" />
                    Export to TensorFlow
                 </Button>
                 <Button variant="outline" className="w-full" onClick={exportModel}>
                   <Download className="h-4 w-4 mr-2" />
                    Export to PyTorch
                 </Button>
 
                 <div className="pt-4 border-t space-y-2">
                    <h4 className="font-medium text-sm">Model Information</h4>
                   <div className="text-sm space-y-1 text-muted-foreground">
                      <p>Type: {modelType.toUpperCase()}</p>
                      <p>Epochs: {epochs}</p>
                      <p>Size: ~1.2 MB</p>
                      <p>Parameters: ~245,000</p>
                      <p>Training Time: ~15 min</p>
                   </div>
                 </div>
 
                 <div className="pt-4 border-t">
                   <Badge className="w-full justify-center" variant="outline">
                     <Zap className="h-3 w-3 mr-1 text-warning" />
                      Ready for GPU Inference
                   </Badge>
                 </div>
               </CardContent>
             </Card>
           </div>
         </TabsContent>
       </Tabs>
     </div>
   );
 };
 
 export default MLTraining;