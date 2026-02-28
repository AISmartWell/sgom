import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Scan } from "lucide-react";

import sampleCore from "@/assets/sample-core.jpg";
import sampleDolomite from "@/assets/sample-core-dolomite.jpg";
import sampleLimestone from "@/assets/sample-core-limestone.jpg";
import sampleShale from "@/assets/sample-core-shale.jpg";

interface SampleGalleryProps {
  onSelectSample: (imageDataUrl: string, name: string) => void;
}

const SAMPLES = [
  {
    name: "Sandstone (Quartz Arenite)",
    src: sampleCore,
    rockType: "Sandstone",
    formation: "Permian Basin",
    depth: "2,450 m",
  },
  {
    name: "Dolomite",
    src: sampleDolomite,
    rockType: "Dolomite",
    formation: "Ellenburger Group",
    depth: "3,100 m",
  },
  {
    name: "Limestone (Oolitic)",
    src: sampleLimestone,
    rockType: "Limestone",
    formation: "Austin Chalk",
    depth: "1,800 m",
  },
  {
    name: "Shale (Organic-rich)",
    src: sampleShale,
    rockType: "Shale",
    formation: "Eagle Ford",
    depth: "2,900 m",
  },
];

export const SampleGallery = ({ onSelectSample }: SampleGalleryProps) => {
  const handleSelect = async (sample: typeof SAMPLES[0]) => {
    // Convert imported image to data URL for the analysis function
    const response = await fetch(sample.src);
    const blob = await response.blob();
    const reader = new FileReader();
    reader.onload = () => {
      onSelectSample(reader.result as string, sample.name);
    };
    reader.readAsDataURL(blob);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Sample Gallery
        </CardTitle>
        <CardDescription>
          Select a pre-loaded core sample for instant AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SAMPLES.map((sample) => (
            <div
              key={sample.name}
              className="group relative rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all cursor-pointer"
              onClick={() => handleSelect(sample)}
            >
              <img
                src={sample.src}
                alt={sample.name}
                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
                <p className="text-sm font-semibold">{sample.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{sample.formation}</span>
                  <span>•</span>
                  <span>{sample.depth}</span>
                </div>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge className="bg-primary/90 text-primary-foreground gap-1 text-[10px]">
                  <Scan className="h-3 w-3" />
                  Analyze
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
