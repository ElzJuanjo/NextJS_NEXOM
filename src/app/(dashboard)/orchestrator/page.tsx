"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send, Bot, User, Loader2, GitBranch,
  Plus, MessageSquare, Trash2, Edit3, Check, X,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { useConversations, useConversation, useSendMessage, useDeleteConversation, useUpdateConversation } from "@/hooks/use-conversations";
import { useFlows } from "@/hooks/use-flows";
import { cn, formatRelativeTime } from "@/lib/utils";
import { AGENT_META, type ConversationMessageResponse } from "@/types";
import { useQueryClient } from "@tanstack/react-query";


export default function OrchestratorPage() {
  const { data: conversations } = useConversations();
  const { data: flows } = useFlows();
  const sendMessage = useSendMessage();
  const deleteConvo = useDeleteConversation();
  const updateConvo = useUpdateConversation();

  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const { data: activeConvo } = useConversation(activeConvoId);

  const [input, setInput] = useState("");
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [pendingMessages, setPendingMessages] = useState<ConversationMessageResponse[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const allMessages = [...(activeConvo?.messages ?? []), ...pendingMessages];
  const queryClient = useQueryClient();

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || sendMessage.isPending) return;

    const tempUserMsg: ConversationMessageResponse = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      agent_type: null,
      meta_data: null,
      created_at: new Date().toISOString(),
    };
    setPendingMessages((prev) => [...prev, tempUserMsg]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "36px";

    sendMessage.mutate(
      { content: text, conversation_id: activeConvoId ?? undefined },
      {
        onSuccess: (data) => {
          setActiveConvoId(data.conversation_id);
          setPendingMessages([]);
        },
        onError: () => setPendingMessages([]),
      }
    );
  };

  const handleNewChat = () => {
    setActiveConvoId(null);
    setPendingMessages([]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Orquestador" subtitle="Gestiona y coordina los flujos entre agentes" />

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* ── Chat Panel ── */}
        <div className="flex-1 flex flex-col border-r border-border min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {allMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                <Bot className="w-12 h-12 text-violet-400 mb-3" />
                <p className="text-sm text-foreground font-medium">Hola, soy el Orquestador de NexOS</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Puedo ayudarte con búsqueda de productos, branding, copywriting, ads, landing pages y más. Detecto automáticamente qué agente necesitas según tu mensaje.
                </p>
              </div>
            )}

            {allMessages.map((msg) => {
              const isUser = msg.role === "user";
              const meta = AGENT_META.find((a) => a.id === msg.agent_type);
              const msgMeta = msg.meta_data as Record<string, unknown> | null;
              const images = msgMeta?.images as string[] | undefined;

              return (
                <div key={msg.id} className={cn("flex gap-3 animate-fade-in group", isUser ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    isUser
                      ? "bg-gradient-to-br from-slate-600 to-slate-700 border border-border"
                      : "bg-gradient-to-br from-violet-500 to-indigo-600"
                  )}>
                    {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>

                  <div className={cn("max-w-[75%] space-y-1 flex flex-col", isUser ? "items-end" : "items-start")}>
                    {!isUser && meta && (
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", meta.color, meta.activeBg)}>
                        {meta.label}
                      </span>
                    )}
                    <div className={cn("rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border border-border text-foreground rounded-tl-sm"
                    )}>
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <>
                          <MarkdownRenderer content={msg.content} />
                          {msg.content.includes("⚠️ *Response truncated") && (
                            <button
                              onClick={() => {
                                const truncatedContent = msg.content.slice(-500).replace("---\n⚠️ *Response truncated due to limit.*", "").trim();
                                sendMessage.mutate(
                                  {
                                    content: `Continue generating from exactly where you left off. The last part of your response was: "${truncatedContent.slice(-200)}..." — pick up right there without repeating anything.`,
                                    conversation_id: activeConvoId ?? undefined,
                                  },
                                  {
                                    onSuccess: (data) => {
                                      setActiveConvoId(data.conversation_id);
                                      setPendingMessages([]);
                                    },
                                  }
                                );
                              }}
                              disabled={sendMessage.isPending}
                              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-medium hover:bg-amber-400/20 transition-colors disabled:opacity-50"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                              {sendMessage.isPending ? "Generando..." : "Continue generating"}
                            </button>
                          )}
                          {images && images.length > 0 && (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {images.map((src, i) => (
                                <ImageWithLightbox key={i} src={src} onOpenLightbox={setLightboxSrc} />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <CopyButton text={msg.content} />
                    </div>
                  </div>
                </div>
              );
            })}

            {sendMessage.isPending && (
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
              <textarea ref={inputRef} value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  const el = e.target;
                  el.style.height = "0";
                  el.style.height = Math.min(el.scrollHeight, 200) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje — el orquestador detecta automáticamente qué agente usar..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none leading-relaxed scrollbar-thin"
                style={{ minHeight: "36px", maxHeight: "200px" }}
              />
              <button onClick={handleSend} disabled={!input.trim() || sendMessage.isPending}
                className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 transition-all hover:opacity-90">
                {sendMessage.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="w-full lg:w-80 xl:w-96 overflow-y-auto p-4 space-y-4 shrink-0 border-t lg:border-t-0 border-border">
          <button onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Nuevo chat
          </button>

          {/* Recent conversations */}
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-2">
              <MessageSquare className="w-3.5 h-3.5" /> Conversaciones
            </h2>

            {!conversations?.length ? (
              <p className="text-xs text-muted-foreground text-center py-4">Sin conversaciones aún</p>
            ) : (
              <div className="space-y-1">
                {conversations.map((convo) => {
                  const isActive = activeConvoId === convo.id;
                  const agentMeta = AGENT_META.find((a) => a.id === convo.agent_type);

                  return (
                    <div key={convo.id}
                      className={cn("group flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
                        isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <div className="flex-1 min-w-0" onClick={() => { setActiveConvoId(convo.id); setPendingMessages([]); }}>
                        {editingTitle === convo.id ? (
                          <div className="flex items-center gap-1">
                            <input value={editTitleValue} onChange={(e) => setEditTitleValue(e.target.value)}
                              className="flex-1 bg-secondary border border-border rounded px-1.5 py-0.5 text-xs text-foreground outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") { updateConvo.mutate({ id: convo.id, title: editTitleValue }); setEditingTitle(null); }
                                if (e.key === "Escape") setEditingTitle(null);
                              }}
                            />
                            <button onClick={() => { updateConvo.mutate({ id: convo.id, title: editTitleValue }); setEditingTitle(null); }}
                              className="p-0.5 text-emerald-400"><Check className="w-3 h-3" /></button>
                            <button onClick={() => setEditingTitle(null)} className="p-0.5 text-muted-foreground"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs font-medium truncate">{convo.title ?? "Sin título"}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {convo.message_count} msgs
                              {agentMeta && <> · <span className={agentMeta.color}>{agentMeta.label}</span></>}
                              {convo.last_message_at && <> · {formatRelativeTime(convo.last_message_at)}</>}
                            </p>
                          </>
                        )}
                      </div>

                      {editingTitle !== convo.id && (
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); setEditingTitle(convo.id); setEditTitleValue(convo.title ?? ""); }}
                            className="p-1 rounded hover:bg-accent"><Edit3 className="w-3 h-3" /></button>
                          <button onClick={(e) => { e.stopPropagation(); if (confirm("¿Eliminar conversación?")) { deleteConvo.mutate(convo.id); if (activeConvoId === convo.id) handleNewChat(); } }}
                            className="p-1 rounded hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Flows */}
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-2">
              <GitBranch className="w-3.5 h-3.5" /> Flujos
            </h2>
            {!flows?.length ? (
              <p className="text-xs text-muted-foreground text-center py-4">Sin flujos activos</p>
            ) : (
              <div className="space-y-2">
                {flows.slice(0, 5).map((flow) => (
                  <div key={flow.id} className="bg-card border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground truncate">{flow.name}</p>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                        flow.status === "running" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-muted-foreground bg-muted border-border"
                      )}>{flow.status}</span>
                    </div>
                    {flow.status === "running" && (
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700" style={{ width: `${flow.progress_pct}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Lightbox */}
      {lightboxSrc && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
          onClick={() => setLightboxSrc(null)}>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button onClick={async (e) => {
              e.stopPropagation();
              try {
                const res = await fetch(lightboxSrc);
                const blob = await res.blob();
                const ext = blob.type.includes("jpeg") ? "jpg" : blob.type.includes("webp") ? "webp" : "png";
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `nexos_${new Date().toISOString().slice(0, 10)}.${ext}`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch { /* ignore */ }
            }} className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors" title="Descargar">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
            <button onClick={() => setLightboxSrc(null)}
              className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors" title="Cerrar">
              <X className="w-5 h-5" />
            </button>
          </div>
          <img src={lightboxSrc} alt="Imagen expandida"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}


function ImageWithLightbox({ src, onOpenLightbox }: { src: string; onOpenLightbox: (src: string) => void }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="rounded-xl border border-border bg-muted/50 p-4 flex items-center justify-center text-xs text-muted-foreground">
        Imagen no disponible
      </div>
    );
  }

  return (
    <div className="relative group cursor-pointer" onClick={() => onOpenLightbox(src)}>
      <img src={src} alt="Imagen generada"
        className="rounded-xl border border-border w-full shadow-lg hover:shadow-xl transition-shadow"
        style={{ maxHeight: "400px", objectFit: "contain", background: "hsl(var(--muted))" }}
        onError={() => setImgError(true)}
      />
      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 rounded-xl transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="w-10 h-10 rounded-full bg-card/90 border border-border flex items-center justify-center">
          <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </div>
      </div>
    </div>
  );
}


function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <button onClick={handleCopy}
      className={cn(
        "p-1 rounded-md transition-all",
        copied
          ? "text-emerald-400"
          : "text-muted-foreground/0 group-hover:text-muted-foreground/60 hover:!text-foreground hover:bg-accent"
      )}
      title="Copiar mensaje">
      {copied ? (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      )}
    </button>
  );
}