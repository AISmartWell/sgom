import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string;

interface State {
  speakingId: string | null;
  audio: HTMLAudioElement | null;
}

/**
 * useMariaVoice — server-side TTS via /functions/v1/maria-tts.
 * Returns an <audio> element for the caller (to pass into MariaAvatar for
 * amplitude-driven lipsync).
 */
export function useMariaVoice() {
  const [state, setState] = useState<State>({ speakingId: null, audio: null });
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (state.audio) {
      try {
        state.audio.pause();
        state.audio.src = "";
      } catch {}
    }
    setState({ speakingId: null, audio: null });
  }, [state.audio]);

  const speak = useCallback(
    async (id: string, text: string) => {
      // Toggle: same id -> stop
      if (state.speakingId === id) {
        stop();
        return;
      }
      stop();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const session = (await supabase.auth.getSession()).data.session;
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/maria-tts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session?.access_token ?? SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voice: "shimmer" }),
          signal: controller.signal,
        });
        if (!resp.ok) throw new Error(`TTS ${resp.status}`);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.crossOrigin = "anonymous";
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setState({ speakingId: null, audio: null });
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          setState({ speakingId: null, audio: null });
        };
        setState({ speakingId: id, audio });
        await audio.play();
      } catch (e) {
        if ((e as any)?.name !== "AbortError") {
          console.error("Maria TTS failed", e);
        }
        setState({ speakingId: null, audio: null });
      }
    },
    [state.speakingId, stop],
  );

  return {
    speak,
    stop,
    speakingId: state.speakingId,
    audio: state.audio,
    isSpeaking: !!state.speakingId,
  };
}
