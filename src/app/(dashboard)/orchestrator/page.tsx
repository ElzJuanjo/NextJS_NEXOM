"use client";

import { useState, useRef, useEffect } from "react";
import {
  GitBranch, Send, Bot, User, Loader2, Sparkles, ChevronDown,
  CheckCircle2, Circle, XCircle, Clock,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { Header } from "@/components/layout/Header";
import { useOrchestrator } from "@/hooks/use-orchestrator";
import { useFlows } from "@/hooks/use-flows";
import { cn, formatRelativeTime, getStatusColor } from "@/lib/utils";
import { AGENT_META, type OrchestratorResponse } from "@/types";
import { useFadeIn } from "@/hooks/use-anime";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  agent?: string;
  raw?: OrchestratorResponse;
  timestamp: Date;
}

function formatResponse(raw: OrchestratorResponse | undefined): string {
  if (!raw) return "Sin respuesta";
  return raw.content ?? raw.error ?? JSON.stringify(raw, null, 2);
}

const PROMPTS = [
  { text: "Busca productos de skincare en Dropi", agent: "dropi_connector" },
  { text: "Crea un copy para Instagram", agent: "copywriting" },
  { text: "Genera ideas de branding para mi marca", agent: "branding" },
  { text: "Analiza mis productos más rentables", agent: "product_search" },
  { text: "Optimiza mi tasa de conversión", agent: "conversion_opt" },
];

export default function OrchestratorPage() {
  const { data: flows } = useFlows();
  const orchestrator = useOrchestrator();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hola, soy el Orquestador de NexOS. Puedo ayudarte con búsqueda de productos, branding, copywriting, ads, landing pages y más. ¿En qué te puedo ayudar hoy?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("general_assistant");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const currentAgent = AGENT_META.find((a) => a.id === selectedAgent) ?? AGENT_META[0];

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || orchestrator.isPending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      agent: selectedAgent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    orchestrator.mutate(
      { user_input: text, context: {}, force_agent: selectedAgent },
      {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: formatResponse(data),
              agent: data.selected_agent ?? selectedAgent,
              raw: data,
              timestamp: new Date(),
            },
          ]);
        },
        onError: (err) => {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: `Error: ${err.message}`,
              timestamp: new Date(),
            },
          ]);
        },
        onSettled: () => inputRef.current?.focus(),
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Agente Orquestador" subtitle="Gestiona y coordina los flujos entre agentes" />

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Chat panel */}
        <div className="flex-1 flex flex-col border-r border-border min-h-0">
          {/* Agent selector */}
          <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 overflow-x-auto scrollbar-thin shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">Agente:</span>
            <div className="flex gap-1.5 flex-nowrap">
              {AGENT_META.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all",
                    selectedAgent === agent.id
                      ? `${agent.color} ${agent.activeBg} border-current/20`
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {agent.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex gap-3 animate-fade-in", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === "assistant"
                    ? "bg-gradient-to-br from-violet-500 to-indigo-600"
                    : "bg-gradient-to-br from-slate-600 to-slate-700 border border-border"
                )}>
                  {msg.role === "assistant" ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                </div>

                <div className={cn("max-w-[75%] space-y-1 flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                  {msg.role === "assistant" && msg.agent && msg.id !== "welcome" && (() => {
                    const meta = AGENT_META.find((a) => a.id === msg.agent);
                    return (
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", meta?.color, meta?.activeBg)}>
                        {meta?.label ?? msg.agent}
                      </span>
                    );
                  })()}
                  <div className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border text-foreground rounded-tl-sm"
                  )}>
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <>
                        <MarkdownRenderer content={msg.content} />
                        {msg.raw?.images && msg.raw.images.length > 0 && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.raw.images.map((src, i) => (
                              <img
                                key={i}
                                src={src}
                                alt={`Imagen generada ${i + 1}`}
                                className="rounded-xl border border-border w-full shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                                style={{ maxHeight: "400px", objectFit: "contain", background: "hsl(var(--muted))" }}
                                onClick={() => {
                                  const w = window.open("", "_blank");
                                  if (w) {
                                    w.document.write(`
                                      <html><head><title>Imagen generada</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0a0a0a;}</style></head>
                                      <body><img src="${src}" style="max-width:100%;max-height:100vh;object-fit:contain;" /></body></html>
                                    `);
                                    w.document.close();
                                  }
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground px-1">
                    {msg.timestamp.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}

            {orchestrator.isPending && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-slow" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border shrink-0">
            <div className="flex items-end gap-2 bg-secondary border border-border rounded-xl overflow-hidden focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-all p-3">
              <button className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border shrink-0", currentAgent.color, currentAgent.activeBg)}>
                <Sparkles className="w-3 h-3" />
                {currentAgent.label}
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none max-h-32 leading-relaxed"
                style={{ minHeight: "24px" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || orchestrator.isPending}
                className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 transition-all hover:opacity-90"
              >
                {orchestrator.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Processes panel */}
        <div className="w-full lg:w-80 xl:w-96 overflow-y-auto p-4 space-y-4 shrink-0 border-t lg:border-t-0 border-border">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5" /> Flujos
          </h2>

          {!flows?.length ? (
            <div className="text-center py-8">
              <GitBranch className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Sin flujos activos</p>
            </div>
          ) : (
            flows.slice(0, 5).map((flow) => (
              <div key={flow.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{flow.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(flow.created_at)}</p>
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium",
                    flow.status === "running" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-muted-foreground bg-muted border-border"
                  )}>
                    {flow.status}
                  </span>
                </div>
                {flow.status === "running" && (
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progreso</span>
                      <span className="font-medium text-foreground">{flow.progress_pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700" style={{ width: `${flow.progress_pct}%` }} />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5 pt-1 border-t border-border">
                  {flow.steps.map((step) => {
                    const Icon = step.status === "completed" ? CheckCircle2 : step.status === "error" ? XCircle : step.status === "running" ? Loader2 : Circle;
                    return (
                      <div key={step.id} className="flex items-center gap-2">
                        <Icon className={cn("w-3.5 h-3.5 shrink-0", getStatusColor(step.status), step.status === "running" && "animate-spin")} />
                        <p className={cn("text-xs flex-1 truncate", step.status === "idle" ? "text-muted-foreground" : "text-foreground")}>{step.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Quick prompts */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Prompts rápidos</h3>
            <div className="space-y-1.5">
              {PROMPTS.map((p) => (
                <button
                  key={p.text}
                  onClick={() => { setSelectedAgent(p.agent); setInput(p.text); inputRef.current?.focus(); }}
                  className="w-full text-left px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  {p.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
