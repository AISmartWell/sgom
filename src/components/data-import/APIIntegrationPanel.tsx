import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cloud, Lock, ExternalLink, CheckCircle2, Clock } from "lucide-react";

const PROVIDERS = [
  {
    name: "Enverus (DrillingInfo)",
    description: "Comprehensive well production data, decline curves, completions. Industry standard.",
    price: "From $3,000/mo",
    features: ["Production volumes", "Decline curves", "Completion data", "Permits & filings"],
    status: "planned" as const,
    url: "https://www.enverus.com",
  },
  {
    name: "IHS Markit (S&P Global)",
    description: "Global well and production database with advanced analytics.",
    price: "From $5,000/mo",
    features: ["Global coverage", "Production history", "Well economics", "Basin analytics"],
    status: "planned" as const,
    url: "https://www.spglobal.com/commodityinsights",
  },
  {
    name: "Novi Labs",
    description: "AI-powered well completion optimization and type curve generation.",
    price: "From $2,000/mo",
    features: ["Type curves", "Completion optimization", "ML predictions", "Basin benchmarks"],
    status: "planned" as const,
    url: "https://www.novilabs.com",
  },
  {
    name: "Oklahoma OCC (Free)",
    description: "Oklahoma Corporation Commission public ArcGIS well data.",
    price: "Free",
    features: ["Well metadata", "Locations", "Permits", "Operator info"],
    status: "active" as const,
    url: "https://oklahoma.gov/occ.html",
  },
  {
    name: "Texas RRC (Free)",
    description: "Texas Railroad Commission public ArcGIS well records.",
    price: "Free",
    features: ["Well metadata", "Permits", "Locations", "Completions"],
    status: "active" as const,
    url: "https://www.rrc.texas.gov",
  },
];

export const APIIntegrationPanel = () => {
  return (
    <Card className="glass-card border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          API Integrations — Data Providers
        </CardTitle>
        <CardDescription>
          Connect to commercial and public data sources for automated well data import.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {PROVIDERS.map((provider) => (
          <div
            key={provider.name}
            className="p-4 border rounded-xl bg-card/50 hover:bg-card/80 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  {provider.name}
                  {provider.status === "active" ? (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />Planned
                    </Badge>
                  )}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">{provider.description}</p>
              </div>
              <Badge variant="secondary">{provider.price}</Badge>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {provider.features.map((f) => (
                <Badge key={f} variant="outline" className="text-xs">
                  {f}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              {provider.status === "active" ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={provider.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />Visit
                  </a>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <Lock className="h-3 w-3 mr-1" />Configure API Key
                </Button>
              )}
            </div>
          </div>
        ))}

        <div className="p-4 bg-muted/20 rounded-xl text-sm text-muted-foreground">
          <p className="font-medium mb-1">How API Integration Works:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Subscribe to a data provider (Enverus, IHS, or Novi Labs)</li>
            <li>Enter your API key in the configuration above</li>
            <li>Platform automatically syncs well data & production volumes</li>
            <li>Data flows into your company's isolated database (RLS-protected)</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
