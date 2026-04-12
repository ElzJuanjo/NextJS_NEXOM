"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send, Bot, User, Loader2,
  Plus, MessageSquare, Trash2, Edit3, Check, X, ChevronDown,
  Copy, Camera, Video, Sparkles, ImagePlus,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { useConversations, useConversation, useSendMessageStream, useDeleteConversation, useUpdateConversation, useUploadChatImage } from "@/hooks/use-conversations";
import { cn, formatRelativeTime } from "@/lib/utils";
import { AGENT_META, type ConversationMessageResponse } from "@/types";
import { useSearchParams } from "next/navigation";


const AGENT_OPTIONS = [
  { id: null, label: "Orquestador", description: "Decide automáticamente el mejor agente", credits: "dinámico", color: "text-violet-400" },
  { id: "branding", label: "Branding", description: "Identidad de marca, brand book, logo", credits: "17", color: "text-pink-400" },
  { id: "copywriting", label: "Copywriting", description: "Textos de venta, headlines, emails", credits: "17", color: "text-emerald-400" },
  { id: "image_gen", label: "Imágenes", description: "Generación de imágenes de producto", credits: "15", color: "text-rose-400" },
  { id: "landing_page", label: "Landing Page", description: "Páginas de venta de alta conversión", credits: "14", color: "text-blue-400" },
  { id: "store_dev", label: "Tienda", description: "Configuración de tienda online", credits: "14", color: "text-indigo-400" },
  { id: "ads", label: "Anuncios", description: "Campañas Meta Ads, Google Ads, TikTok", credits: "4", color: "text-orange-400" },
  { id: "product_search", label: "Productos", description: "Búsqueda y análisis de mercado", credits: "4", color: "text-emerald-400" },
  { id: "conversion_opt", label: "Conversión", description: "Análisis de métricas y CRO", credits: "4", color: "text-amber-400" },
  { id: "dropi_connector", label: "Dropi", description: "Búsqueda y sync con Dropi", credits: "2", color: "text-cyan-400" },
];


export default function OrchestratorPage() {
  const searchParams = useSearchParams();

  const { data: conversations } = useConversations();
  const { send: sendMessageStream, progress, isPending: sendPending } = useSendMessageStream();
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

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  const [convoSearch, setConvoSearch] = useState("");

  const uploadImage = useUploadChatImage();
  const [attachedImages, setAttachedImages] = useState<Array<{ url: string; file: File; preview: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  useEffect(() => {
    const convoParam = searchParams.get("convo");
    if (convoParam && convoParam !== activeConvoId) {
      setActiveConvoId(convoParam);
    }
  }, [searchParams]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files.slice(0, 5 - attachedImages.length)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) continue;

      const preview = URL.createObjectURL(file);
      setAttachedImages((prev) => [...prev, { url: "", file, preview }]);

      try {
        const result = await uploadImage.mutateAsync(file);
        setAttachedImages((prev) =>
          prev.map((img) => (img.preview === preview ? { ...img, url: result.url } : img))
        );
      } catch {
        setAttachedImages((prev) => prev.filter((img) => img.preview !== preview));
        URL.revokeObjectURL(preview);
      }
    }

    if (e.target) e.target.value = "";
  };

  const removeAttachedImage = (preview: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.preview !== preview));
    URL.revokeObjectURL(preview);
  };

  const handleSend = () => {
    const text = input.trim();
    const hasImages = attachedImages.length > 0 && attachedImages.every((img) => img.url);
    if ((!text && !hasImages) || sendPending) return;

    const imageUrls = hasImages ? attachedImages.map((img) => img.url) : undefined;

    const tempUserMsg: ConversationMessageResponse = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text || "(imagen adjunta)",
      agent_type: null,
      meta_data: imageUrls ? { images: imageUrls } : null,
      created_at: new Date().toISOString(),
    };
    setPendingMessages((prev) => [...prev, tempUserMsg]);
    setInput("");
    setAttachedImages([]);
    if (inputRef.current) inputRef.current.style.height = "36px";

    sendMessageStream(
      {
        content: text || "Analyze this image",
        conversation_id: activeConvoId ?? undefined,
        force_agent: selectedAgent ?? undefined,
        image_urls: imageUrls,
      },
      (data) => {
        setActiveConvoId(data.conversation_id);
        setPendingMessages([]);
      },
    );
  };

  const handleNewChat = () => {
    setActiveConvoId(null);
    setPendingMessages([]);
    setInput("");
    setAttachedImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Orquestador" subtitle="Gestiona y coordina los flujos entre agentes"
        search={{ placeholder: "Buscar conversaciones...", value: convoSearch, onChange: setConvoSearch }}
      />

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
        {/* ── Chat Panel ── */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {allMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                <Bot className="w-12 h-12 text-violet-400 mb-3" />
                <p className="text-sm text-foreground font-medium">Hola, soy el Orquestador de NEXOM</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Puedo ayudarte con búsqueda de productos, branding, copywriting, ads, landing pages y más.
                </p>
              </div>
            )}

            {allMessages.map((msg) => {
              const isUser = msg.role === "user";
              const meta = AGENT_META.find((a) => a.id === msg.agent_type);
              const msgMeta = msg.meta_data as Record<string, unknown> | null;
              const images = msgMeta?.images as string[] | undefined;
              const promptSuggestions = msgMeta?.prompt_suggestions as Array<{ type: string; category: string; prompt: string }> | undefined;

              return (
                <div key={msg.id} className={cn("flex gap-3 animate-fade-in group", isUser ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    isUser
                      ? "bg-gradient-to-br from-slate-600 to-slate-700 border border-border"
                      : "bg-gradient-to-br from-violet-500 to-indigo-600"
                  )}>
                    {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>

                  <div className={cn("max-w-[85%] lg:max-w-[75%] space-y-1 flex flex-col", isUser ? "items-end" : "items-start")}>
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
                        <>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          {images && images.length > 0 && (
                            <div className="mt-2 flex gap-2 flex-wrap">
                              {images.map((src, i) => (
                                <img
                                  key={i}
                                  src={src}
                                  alt="Attached"
                                  className="w-20 h-20 rounded-lg object-cover border border-white/20 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setLightboxSrc(src)}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <MarkdownRenderer content={msg.content} />
                          {msg.content.includes("⚠️ *Response truncated") && (
                            <button
                              onClick={() => {
                                sendMessageStream(
                                  { content: "Continue generating from exactly where you left off...", conversation_id: activeConvoId ?? undefined, force_agent: selectedAgent ?? undefined },
                                  (data) => { setActiveConvoId(data.conversation_id); setPendingMessages([]); },
                                );
                              }}
                              disabled={sendPending}
                              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-medium hover:bg-amber-400/20 transition-colors disabled:opacity-50"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                              {sendPending ? "Generando..." : "Continue generating"}
                            </button>
                          )}
                          {images && images.length > 0 && (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {images.map((src, i) => (
                                <ImageWithLightbox key={i} src={src} onOpenLightbox={setLightboxSrc} />
                              ))}
                            </div>
                          )}
                          {promptSuggestions && promptSuggestions.length > 0 && (
                            <PromptSuggestions suggestions={promptSuggestions} />
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

            {sendPending && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 min-w-[200px] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{progress?.message || "Processing..."}</span>
                    <span className="text-xs text-violet-400 font-medium">{progress?.pct ?? 0}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress?.pct ?? 0}%` }} />
                  </div>
                  {progress?.agent && (
                    <span className="text-[10px] text-muted-foreground">
                      Agent: {AGENT_META.find((a) => a.id === progress.agent)?.label ?? progress.agent}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 sm:p-4 border-t border-border shrink-0 space-y-1.5">
            {/* Image previews */}
            {attachedImages.length > 0 && (
              <div className="flex gap-2 px-1 pb-1 overflow-x-auto scrollbar-thin">
                {attachedImages.map((img) => (
                  <div key={img.preview} className="relative group shrink-0">
                    <img
                      src={img.preview}
                      alt="Attached"
                      className="w-16 h-16 rounded-lg object-cover border border-border"
                    />
                    {!img.url && (
                      <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachedImage(img.preview)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 bg-secondary border border-border rounded-xl focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-all p-2">
              {/* Image upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={attachedImages.length >= 5 || uploadImage.isPending}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 shrink-0"
                title="Adjuntar imagen"
              >
                {uploadImage.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImagePlus className="w-4 h-4" />
                )}
              </button>

              <textarea ref={inputRef} value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  const el = e.target;
                  el.style.height = "0";
                  el.style.height = Math.min(el.scrollHeight, 200) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none leading-relaxed scrollbar-thin min-w-0"
                style={{ minHeight: "36px", maxHeight: "200px" }}
              />
              <button onClick={handleSend} disabled={(!input.trim() && !attachedImages.some(i => i.url)) || sendPending}
                className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 transition-all hover:opacity-90">
                {sendPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-2 px-1">
              <AgentSelector selected={selectedAgent} onChange={setSelectedAgent} />
              <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                {selectedAgent
                  ? `${AGENT_OPTIONS.find(a => a.id === selectedAgent)?.label} · ${AGENT_OPTIONS.find(a => a.id === selectedAgent)?.credits} créditos/msg`
                  : "Créditos dinámicos según el agente"
                }
              </span>
            </div>
          </div>
        </div>

        {/* ── Mobile toggle for right panel ── */}
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="lg:hidden fixed bottom-24 right-4 z-20 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* ── Right Panel ── */}
        <div className={cn(
          "lg:w-80 xl:w-96 overflow-y-auto p-4 space-y-4 shrink-0 border-l border-border bg-background",
          "fixed inset-0 z-30 lg:static lg:z-auto transition-transform duration-300",
          showPanel ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          {/* Mobile close */}
          <div className="flex items-center justify-between lg:hidden mb-2">
            <span className="text-sm font-semibold text-foreground">Panel</span>
            <button onClick={() => setShowPanel(false)} className="p-1.5 rounded-lg hover:bg-accent">
              <X className="w-4 h-4" />
            </button>
          </div>

          <button onClick={() => { handleNewChat(); setShowPanel(false); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Nuevo chat
          </button>

          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-2">
              <MessageSquare className="w-3.5 h-3.5" /> Conversaciones
            </h2>

            {!conversations?.length ? (
              <p className="text-xs text-muted-foreground text-center py-4">Sin conversaciones aún</p>
            ) : (
              <div className="space-y-1">
                {conversations
                  .filter((convo) =>
                    !convoSearch || convo.title?.toLowerCase().includes(convoSearch.toLowerCase())
                  )
                  .map((convo) => {
                    const isActive = activeConvoId === convo.id;
                    const agentMeta = AGENT_META.find((a) => a.id === convo.agent_type);

                    return (
                      <div key={convo.id}
                        className={cn("group flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
                          isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        <div className="flex-1 min-w-0" onClick={() => { setActiveConvoId(convo.id); setPendingMessages([]); setShowPanel(false); }}>
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
                a.href = url; a.download = `nexom_${new Date().toISOString().slice(0, 10)}.${ext}`;
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


function AgentSelector({
  selected,
  onChange,
}: {
  selected: string | null;
  onChange: (agent: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = AGENT_OPTIONS.find((a) => a.id === selected) || AGENT_OPTIONS[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-accent transition-colors"
      >
        <div className={cn("w-2 h-2 rounded-full", selected ? "bg-current" : "bg-violet-400")}
          style={{ color: selected ? undefined : undefined }}
        />
        <span className={cn("font-medium", current.color)}>{current.label}</span>
        <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 w-72 bg-card border border-border rounded-xl shadow-xl z-40 py-1 max-h-80 overflow-y-auto scrollbar-thin animate-fade-in">
            {AGENT_OPTIONS.map((agent) => {
              const isActive = agent.id === selected;
              return (
                <button
                  key={agent.id ?? "orchestrator"}
                  onClick={() => { onChange(agent.id); setOpen(false); }}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent transition-colors",
                    isActive && "bg-accent"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", agent.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={cn("text-sm font-medium", agent.color)}>{agent.label}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {agent.credits === "dinámico" ? "créditos dinámicos" : `${agent.credits} créditos/msg`}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{agent.description}</p>
                  </div>
                  {isActive && (
                    <svg className="w-4 h-4 text-violet-400 shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Prompt Suggestions Component ─────────────────────────────────────────────

function PromptSuggestions({ suggestions }: { suggestions: Array<{ type: string; category: string; prompt: string }> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const imagePrompts = suggestions.filter((s) => s.type === "image");
  const videoPrompts = suggestions.filter((s) => s.type === "video");

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyAll = () => {
    const allText = suggestions
      .map((s) => `[${s.type.toUpperCase()} — ${s.category}]\n${s.prompt}`)
      .join("\n\n");
    navigator.clipboard.writeText(allText);
    setCopiedIdx(-1);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="mt-3 border border-border/50 rounded-xl overflow-hidden bg-background/30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-medium text-violet-400">
            Prompt Pack ({suggestions.length} prompts)
          </span>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-2">
          <div className="flex justify-end">
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {copiedIdx === -1 ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copiedIdx === -1 ? "Copied all!" : "Copy all"}
            </button>
          </div>

          {imagePrompts.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                <Camera className="w-3 h-3" />
                Images
              </div>
              {imagePrompts.map((s, i) => (
                <div
                  key={i}
                  className="group flex items-start gap-2 px-2.5 py-2 rounded-lg bg-accent/20 hover:bg-accent/40 transition-colors cursor-pointer"
                  onClick={() => handleCopy(s.prompt, i)}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold text-violet-400 block mb-0.5">{s.category}</span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">{s.prompt}</p>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {copiedIdx === i
                      ? <Check className="w-3.5 h-3.5 text-green-400" />
                      : <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {videoPrompts.length > 0 && (
            <div className="space-y-1.5 mt-2">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                <Video className="w-3 h-3" />
                Video
              </div>
              {videoPrompts.map((s, i) => {
                const globalIdx = imagePrompts.length + i;
                return (
                  <div
                    key={globalIdx}
                    className="group flex items-start gap-2 px-2.5 py-2 rounded-lg bg-accent/20 hover:bg-accent/40 transition-colors cursor-pointer"
                    onClick={() => handleCopy(s.prompt, globalIdx)}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-rose-400 block mb-0.5">{s.category}</span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">{s.prompt}</p>
                    </div>
                    <div className="shrink-0 mt-0.5">
                      {copiedIdx === globalIdx
                        ? <Check className="w-3.5 h-3.5 text-green-400" />
                        : <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}