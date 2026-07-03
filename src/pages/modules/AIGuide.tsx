import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Bot,
  Plus,
  Send,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useVoiceInput } from "@/hooks/useVoiceInput";

const SUGGESTED_QUESTIONS = [
  "What is SGOM?",
  "How does the MCDA scoring work?",
  "What makes AI Smart Well different from competitors?",
  "Which wells has SGOM been tested on?",
  "What is the market opportunity?",
  "How does the SPT technology work?",
];

type Role = "user" | "assistant" | "system";

interface ChatMessage {
  id?: string;
  role: Role;
  content: string;
  sources?: { slug: string; title: string }[];
  created_at?: string;
}

interface Thread {
  id: string;
  title: string;
  last_message_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string;

const AIGuide = () => {
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [pendingAssistant, setPendingAssistant] = useState("");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const voice = useVoiceInput({
    lang: "en-US",
    onResult: (t) => setInput((prev) => (prev ? prev + " " : "") + t),
    onError: (e) => toast.error(e),
  });

  const speak = useCallback((id: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported in this browser");
      return;
    }
    window.speechSynthesis.cancel();
    if (speakingId === id) {
      setSpeakingId(null);
      return;
    }
    const utter = new SpeechSynthesisUtterance(text.replace(/[#*_`>-]/g, ""));
    utter.lang = "en-US";
    utter.rate = 1.0;
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utter);
  }, [speakingId]);

  // Load threads
  const loadThreads = useCallback(async () => {
    const { data, error } = await supabase
      .from("sgom_chat_threads")
      .select("id, title, last_message_at")
      .eq("is_archived", false)
      .order("last_message_at", { ascending: false })
      .limit(50);
    if (error) return;
    setThreads(data ?? []);
    if (!activeId && data && data.length > 0) setActiveId(data[0].id);
  }, [activeId]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Load messages when thread changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("sgom_chat_messages")
        .select("id, role, content, sources, created_at")
        .eq("thread_id", activeId)
        .order("created_at", { ascending: true });
      if (error) return;
      setMessages(
        (data ?? []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: Array.isArray(m.sources) ? m.sources : [],
          created_at: m.created_at,
        })),
      );
    })();
  }, [activeId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, pendingAssistant]);

  // Focus composer
  useEffect(() => {
    if (!streaming) inputRef.current?.focus();
  }, [streaming, activeId]);

  const createThread = async (): Promise<string | null> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Please sign in first");
      return null;
    }
    const { data, error } = await supabase
      .from("sgom_chat_threads")
      .insert({ user_id: auth.user.id, title: "New conversation" })
      .select("id, title, last_message_at")
      .single();
    if (error) {
      toast.error("Failed to create thread: " + error.message);
      return null;
    }
    setThreads((t) => [data as Thread, ...t]);
    setActiveId(data.id);
    setMessages([]);
    return data.id;
  };

  const deleteThread = async (id: string) => {
    const { error } = await supabase
      .from("sgom_chat_threads")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Delete failed");
      return;
    }
    setThreads((t) => t.filter((x) => x.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  };

  const renameThreadFromFirst = async (id: string, firstMsg: string) => {
    const title = firstMsg.trim().slice(0, 60).replace(/\s+/g, " ");
    if (!title) return;
    await supabase
      .from("sgom_chat_threads")
      .update({ title })
      .eq("id", id);
    setThreads((t) => t.map((x) => (x.id === id ? { ...x, title } : x)));
  };

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || streaming) return;

    let threadId = activeId;
    const isNewThread = !threadId || messages.length === 0;
    if (!threadId) {
      threadId = await createThread();
      if (!threadId) return;
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Please sign in first");
      return;
    }

    // Insert user message
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setPendingAssistant("");
    setStreaming(true);

    const { data: insertedUser, error: userErr } = await supabase
      .from("sgom_chat_messages")
      .insert({
        thread_id: threadId,
        user_id: auth.user.id,
        role: "user",
        content: text,
      })
      .select("id")
      .single();
    if (userErr) {
      toast.error("Save failed: " + userErr.message);
      setStreaming(false);
      return;
    }

    if (isNewThread) renameThreadFromFirst(threadId, text);

    // Stream from edge function
    const started = Date.now();
    let assistantText = "";
    let sources: { slug: string; title: string }[] = [];
    let model = "nvidia/llama-3.3-nemotron-super-49b-v1";

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const outbound = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(
        `${SUPABASE_URL}/functions/v1/sgom-guide-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session?.access_token ?? SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: outbound }),
        },
      );

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(errText || `Status ${resp.status}`);
      }

      const srcHeader = resp.headers.get("X-Sgom-Sources");
      if (srcHeader) {
        try {
          sources = JSON.parse(decodeURIComponent(srcHeader));
        } catch {}
      }
      model = resp.headers.get("X-Sgom-Model") ?? model;

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            const data = line.replace(/^data:\s*/, "");
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content ?? "";
              if (delta) {
                assistantText += delta;
                setPendingAssistant(assistantText);
              }
            } catch {
              /* ignore keepalives */
            }
          }
        }
      }

      // Persist assistant message
      const { data: insertedAssistant } = await supabase
        .from("sgom_chat_messages")
        .insert({
          thread_id: threadId,
          user_id: auth.user.id,
          role: "assistant",
          content: assistantText || "(empty response)",
          sources,
          model,
          latency_ms: Date.now() - started,
        })
        .select("id")
        .single();

      setMessages((m) => [
        ...m,
        {
          id: insertedAssistant?.id,
          role: "assistant",
          content: assistantText,
          sources,
        },
      ]);
      setPendingAssistant("");
    } catch (e: any) {
      toast.error("Maria failed to respond: " + (e?.message ?? "unknown"));
      setPendingAssistant("");
    } finally {
      setStreaming(false);
    }
  };

  const sendFeedback = async (messageId: string, rating: 1 | -1) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("sgom_chat_feedback").upsert(
      {
        message_id: messageId,
        user_id: auth.user.id,
        rating,
      },
      { onConflict: "message_id,user_id" },
    );
    if (error) toast.error("Feedback failed");
    else toast.success(rating > 0 ? "Thanks! 👍" : "Noted 👎");
  };

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId),
    [threads, activeId],
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Threads sidebar */}
      <aside className="w-72 border-r border-border/50 bg-card/30 flex flex-col">
        <div className="p-3 border-b border-border/50">
          <Button
            onClick={createThread}
            className="w-full justify-start gap-2"
            variant="secondary"
          >
            <Plus className="h-4 w-4" /> New conversation
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {threads.length === 0 && (
              <p className="text-xs text-muted-foreground p-3">
                No conversations yet. Ask Maria anything.
              </p>
            )}
            {threads.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer text-sm hover:bg-accent/40 transition",
                  activeId === t.id && "bg-accent/60",
                )}
                onClick={() => setActiveId(t.id)}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{t.title}</span>
                <button
                  aria-label="Delete conversation"
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteThread(t.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Chat pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Maria header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card/20 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-[hsl(140_60%_20%)] border border-[hsl(140_70%_35%)] flex items-center justify-center">
              <Bot className="h-6 w-6 text-[hsl(140_80%_60%)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground">Maria</h1>
                <Badge className="bg-[hsl(140_60%_25%)] text-[hsl(140_90%_70%)] border-[hsl(140_70%_35%)] hover:bg-[hsl(140_60%_25%)]">
                  SGOM AI
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                AI Smart Well · Powered by NVIDIA Nemotron
              </p>
            </div>
          </div>
          <div className="inline-flex rounded-md border border-border/50 bg-card/40 p-0.5">
            <button
              onClick={() => setMode("text")}
              className={cn(
                "px-4 py-1.5 text-sm rounded transition",
                mode === "text"
                  ? "bg-[hsl(90_80%_55%)] text-black font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Text
            </button>
            <button
              onClick={() => {
                setMode("voice");
                toast.info("Voice mode coming next — text works now");
              }}
              className={cn(
                "px-4 py-1.5 text-sm rounded transition",
                mode === "voice"
                  ? "bg-[hsl(90_80%_55%)] text-black font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Voice
            </button>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
            {messages.length === 0 && !pendingAssistant && (
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">
                    Suggested questions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => send(q)}
                        disabled={streaming}
                        className="text-sm px-4 py-2 rounded-full border border-border/60 bg-card/40 hover:bg-accent/40 hover:border-[hsl(140_70%_35%)] text-foreground/90 transition disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                <MessageBubble
                  message={{
                    id: "welcome",
                    role: "assistant",
                    content:
                      "Hello! I'm Maria, your AI guide to SGOM — AI Smart Well's platform for automated well restoration assessment. What would you like to know about our technology?",
                  }}
                  onSpeak={(text) => speak("welcome", text)}
                  isSpeaking={speakingId === "welcome"}
                />
              </div>
            )}

            {messages.map((m, i) => (
              <MessageBubble
                key={m.id ?? `m-${i}`}
                message={m}
                onFeedback={
                  m.id && m.role === "assistant"
                    ? (r) => sendFeedback(m.id!, r)
                    : undefined
                }
              />
            ))}

            {pendingAssistant && (
              <MessageBubble
                message={{ role: "assistant", content: pendingAssistant }}
              />
            )}

            {streaming && !pendingAssistant && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Maria is thinking…
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border/50 bg-card/20 p-4">
          <div className="max-w-3xl mx-auto flex gap-2 items-end">
            {voice.isSupported && (
              <Button
                type="button"
                size="lg"
                variant={voice.isListening ? "default" : "outline"}
                onClick={voice.toggle}
                disabled={streaming}
                className={cn(
                  voice.isListening &&
                    "bg-[hsl(140_70%_40%)] hover:bg-[hsl(140_70%_45%)] text-black",
                )}
                aria-label={voice.isListening ? "Stop recording" : "Start voice input"}
              >
                {voice.isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask Maria about SGOM…"
              rows={2}
              className="resize-none bg-background/60"
              disabled={streaming}
            />
            <Button
              onClick={() => send()}
              disabled={streaming || !input.trim()}
              size="lg"
            >
              {streaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="max-w-3xl mx-auto text-[11px] text-muted-foreground mt-3 text-center">
            AI Smart Well, Inc. · SGOM Platform · Powered by{" "}
            <span className="text-[hsl(140_80%_60%)]">NVIDIA Nemotron</span>
            {activeThread && <span className="opacity-60"> · {activeThread.title}</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
  onFeedback?: (rating: 1 | -1) => void;
}

const MessageBubble = ({ message, onFeedback }: MessageBubbleProps) => {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-8 w-8 shrink-0 rounded-full bg-[hsl(140_60%_20%)] border border-[hsl(140_70%_35%)] flex items-center justify-center">
          <Bot className="h-4 w-4 text-[hsl(140_80%_60%)]" />
        </div>
      )}
      <div className={cn("max-w-[85%]", isUser && "text-right")}>
        {isUser ? (
          <div className="inline-block rounded-lg px-4 py-2 bg-primary text-primary-foreground text-sm whitespace-pre-wrap">
            {message.content}
          </div>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none text-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || "…"}
            </ReactMarkdown>
            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/40 not-prose">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                  Sources
                </p>
                <ul className="text-xs space-y-0.5">
                  {message.sources.map((s) => (
                    <li key={s.slug} className="text-muted-foreground">
                      • {s.title}{" "}
                      <span className="opacity-60">(/{s.slug})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {onFeedback && (
              <div className="mt-2 flex gap-1 not-prose">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => onFeedback(1)}
                  aria-label="Helpful"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => onFeedback(-1)}
                  aria-label="Not helpful"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIGuide;
