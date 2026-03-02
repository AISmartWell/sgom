import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  lang?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function VoiceInputButton({ onTranscript, lang = "ru-RU", className, size = "icon" }: VoiceInputButtonProps) {
  const { isListening, isSupported, toggle } = useVoiceInput({
    lang,
    onResult: onTranscript,
    onError: (err) => toast.error(err),
  });

  if (!isSupported) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={isListening ? "destructive" : "outline"}
          size={size}
          onClick={toggle}
          className={cn(isListening && "animate-pulse", className)}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isListening ? "Остановить запись" : "Голосовой ввод"}</TooltipContent>
    </Tooltip>
  );
}
