import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Scan } from "lucide-react";

import sampleSeismic from "@/assets/sample-seismic-section.jpg";
import sampleTimeslice from "@/assets/sample-seismic-timeslice.jpg";
import sampleAmplitude from "@/assets/sample-amplitude-map.jpg";
import sampleSalt from "@/assets/sample-seismic-salt.jpg";

interface SeismicSampleGalleryProps {
  onSelectSample: (imageDataUrl: string, name: string) => void;
}

const SAMPLES = [
  {
    name: "2D Seismic Section — Gulf Basin",
    src: sampleSeismic,
    type: "2D Post-stack",
    basin: "Gulf Coast Basin",
    depth: "0–4,500 m",
    features: "Faults, Bright Spots",
  },
  {
    name: "3D Time-Slice — Salt Dome",
    src: sampleTimeslice,
    type: "3D Time-slice",
    basin: "Permian Basin",
    depth: "TWT 1,200 ms",
    features: "Salt Dome, Channels",
  },
  {
    name: "RMS Amplitude Map — Reservoir",
    src: sampleAmplitude,
    type: "Attribute Map",
    basin: "North Sea",
    depth: "Top Reservoir",
    features: "Bright Spots, DHI",
  },
  {
    name: "Salt Diapir Section — Deepwater",
    src: sampleSalt,
    type: "2D Post-stack",
    basin: "Deepwater GoM",
    depth: "0–6,000 m",
    features: "Salt Body, Traps",
  },
];

export const SeismicSampleGallery = ({ onSelectSample }: SeismicSampleGalleryProps) => {
  const handleSelect = async (sample: (typeof SAMPLES)[0]) => {
    const response = await fetch(sample.src);
    const blob = await response.blob();
    const reader = new FileReader();
    reader.onload = () => {
      onSelectSample(reader.result as string, sample.name);
    };
    reader.readAsDataURL(blob);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Sample Seismic Gallery
        </CardTitle>
        <CardDescription className="text-xs">
          Select a pre-loaded seismic section for instant CV analysis
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
                  <span>{sample.type}</span>
                  <span>•</span>
                  <span>{sample.depth}</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px] h-5">{sample.basin}</Badge>
                  <Badge variant="outline" className="text-[10px] h-5">{sample.features}</Badge>
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
