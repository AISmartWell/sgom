import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Droplets, ArrowRight, BarChart3, Target, Cpu, FileText, Zap, TrendingUp, Shield, Lightbulb } from "lucide-react";
import nvidiaInceptionBadgeBw from "@/assets/nvidia-inception-badge-bw.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.2) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(var(--primary) / 0.2) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Decorative blurs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-20">
             <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center glow-primary">
                <Droplets className="h-7 w-7 text-primary" />
              </div>
              <span className="text-2xl font-bold">AI Smart Well</span>
               <img 
                  src={nvidiaInceptionBadgeBw} 
                  alt="NVIDIA Inception Program" 
                  className="h-10 cursor-pointer hover:opacity-80 transition-opacity hidden sm:block"
                  onClick={() => navigate("/nvidia-inception")}
                />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate("/investor-deck")}>
                <FileText className="mr-2 h-4 w-4" />
                Investor Deck
              </Button>
              <Button onClick={() => navigate("/auth")}>
                Enter Platform
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">Innovative Solutions</span>
              <br />
              for Oil Production
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              AI-powered platform for identifying optimal well locations, boosting production, 
              cutting costs, and improving decision-making accuracy in oil & gas industry.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/auth")} className="glow-primary">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto">
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <p className="text-3xl font-bold text-primary mb-2">15,000+</p>
              <p className="text-sm text-muted-foreground">Wells Analyzed</p>
            </div>
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-accent" />
              </div>
              <p className="text-3xl font-bold text-accent mb-2">94%</p>
              <p className="text-sm text-muted-foreground">AI Accuracy</p>
            </div>
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-success/20 flex items-center justify-center mx-auto mb-4">
                <Cpu className="h-6 w-6 text-success" />
              </div>
               <p className="text-3xl font-bold text-success mb-2">Significant</p>
               <p className="text-sm text-muted-foreground">Productivity Increase</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">SGOM Platform Modules</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Complete cycle of oil production analysis and optimization powered by artificial intelligence
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { emoji: "📡", title: "Data Collection", desc: "Well data from Oklahoma & Texas databases" },
            { emoji: "🗺️", title: "Geological Analysis", desc: "AI seismic & well log analysis" },
            { emoji: "🎯", title: "AI Well Selection", desc: "ML-based potential ranking" },
            { emoji: "📊", title: "Reservoir Simulation", desc: "Dynamic reservoir modeling" },
            { emoji: "💰", title: "Financial Forecast", desc: "ROI & investment analysis" },
            { emoji: "🔧", title: "SPT Treatment", desc: "Hydro-slotting technology" },
          ].map((feature, index) => (
            <div key={index} className="glass-card rounded-xl p-6 hover:border-primary/30 transition-colors">
              <span className="text-4xl mb-4 block">{feature.emoji}</span>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
       </div>
      </div>

      {/* Why AI Smart Well Section */}
      <div className="relative max-w-7xl mx-auto px-6 py-24 border-t border-border overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <p className="text-primary font-semibold text-sm tracking-widest uppercase text-center mb-3">Our Advantage</p>
          <h2 className="text-4xl font-bold text-center mb-4">Why AI Smart Well?</h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            We combine patented downhole technology with cutting-edge AI to unlock production potential that traditional methods miss.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all group">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors glow-primary">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Maximize Production</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    AI algorithms identify highest-potential well locations and optimal treatment parameters, turning marginal wells into profitable assets.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6 hover:border-accent/30 transition-all group">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                  <Zap className="h-7 w-7 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Reduce Costs & Risk</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Data-driven decisions eliminate guesswork. Predict ROI before investing, reducing dry hole risk and operational expenses significantly.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6 hover:border-success/30 transition-all group">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-success/20 flex items-center justify-center group-hover:bg-success/30 transition-colors">
                  <Shield className="h-7 w-7 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Patented SPT Technology</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    US Patent 8,863,823 — Slot Perforating Technology by Maxxwell Production with decades of verified field results. Proven to revive declining and marginal wells.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all group">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors glow-primary">
                  <Lightbulb className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">NVIDIA-Powered AI</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    As an NVIDIA Inception member, we leverage GPU-accelerated ML for seismic analysis, core imaging, and real-time production forecasting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            <span className="font-medium">AI Smart Well</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 AI Smart Well & Maxxwell Production. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
