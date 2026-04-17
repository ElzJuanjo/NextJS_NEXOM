"use client";

import { useState, useRef } from "react";
import { Workflow, Play, Trash2, Zap, ChevronDown, ChevronRight, ChevronUp, CheckCircle2, AlertCircle, Loader2, X, ArrowRight, ImagePlus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ProductSelectionCard } from "@/components/ui/ProductSelectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

import { useRouter } from "next/navigation";
import {
  useFlows, useFlowTemplates, useCreateFlow, useDeleteFlow,
  useExecuteFlowStream, useCreateFromTemplate,
} from "@/hooks/use-flows";
import { useUploadEphemeralImage } from "@/hooks/use-conversations";
import { cn, formatRelativeTime } from "@/lib/utils";
import { AGENT_META, type CandidateProduct } from "@/types";
import toast from "react-hot-toast";

export default function FlowsPage() {
  const router = useRouter();

  const { data: flows, isLoading } = useFlows();
  const { data: templates } = useFlowTemplates();
  const createFlow = useCreateFlow();
  const deleteFlow = useDeleteFlow();
  const createFromTemplate = useCreateFromTemplate();
  const { execute: executeFlowStream, resumeWithSelection, progress, stepStatuses, isPending: flowRunning, result: flowResult, reset: resetFlow } = useExecuteFlowStream();

  const [showCreate, setShowCreate] = useState(false);
  const [showExecute, setShowExecute] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ name: "" });
  const [customSteps, setCustomSteps] = useState<Array<{ agent_type: string; name: string }>>([]);
  const [contextForm, setContextForm] = useState({
    brand: "", product: "", niche: "", market: "", audience: "", tone: "",
  });

  // ── Reference image for flows ──
  // dataUrl: el upload ephemeral retorna un data:image/...;base64,... que se
  // pasa directo a los agentes (no toca S3). Mantenemos el File local como
  // fallback por si el upload aún no terminó cuando el usuario presiona Execute.
  const [referenceImage, setReferenceImage] = useState<{ file: File; preview: string; dataUrl?: string } | null>(null);
  const [isUploadingRef, setIsUploadingRef] = useState(false);
  const uploadRefImage = useUploadEphemeralImage();
  const refFileInputRef = useRef<HTMLInputElement>(null);

  // Convierte un File a data:image/...;base64,... directamente en el cliente.
  // Fallback usado cuando el upload ephemeral al backend aún no resolvió.
  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("read error"));
      reader.readAsDataURL(file);
    });

  const toggleFlow = (id: string) => {
    setExpandedFlows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleExecute = async (flowId: string) => {
    const ctx: Record<string, unknown> = {};
    if (contextForm.brand) ctx.brand = contextForm.brand;
    if (contextForm.product) ctx.product = contextForm.product;
    if (contextForm.niche) ctx.niche = contextForm.niche;
    if (contextForm.market) ctx.market = contextForm.market;
    if (contextForm.audience) ctx.audience = contextForm.audience;
    if (contextForm.tone) ctx.tone = contextForm.tone;

    // Resolver imagen de referencia: priorizar el dataUrl del upload ephemeral;
    // si no está listo, convertimos el File localmente (fallback robusto).
    let refImageUrl: string | undefined = referenceImage?.dataUrl;
    if (referenceImage && !refImageUrl) {
      try {
        refImageUrl = await fileToDataUrl(referenceImage.file);
      } catch {
        toast.error("No se pudo leer la imagen de referencia");
        return;
      }
    }

    executeFlowStream(
      {
        flow_id: flowId,
        context: Object.keys(ctx).length > 0 ? ctx : undefined,
        reference_image_url: refImageUrl,
      },
      () => {
        setShowExecute(null);
        setShowResult(true);
        if (referenceImage) {
          URL.revokeObjectURL(referenceImage.preview);
          setReferenceImage(null);
        }
      },
    );
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Flujos de Automatización" subtitle="Orquesta agentes en secuencias automáticas"
        action={{ label: "Nuevo flow", onClick: () => setShowCreate(true) }} />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Templates */}
        {templates && templates.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-400" /> Templates
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {templates.map((tpl) => (
                <button key={tpl.template_id}
                  onClick={() => createFromTemplate.mutate({ template_id: tpl.template_id, auto_execute: false })}
                  disabled={createFromTemplate.isPending}
                  className="bg-card border border-border rounded-xl p-4 text-left hover:bg-accent/50 transition-colors group disabled:opacity-50">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tpl.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-muted-foreground">{tpl.total_steps} steps</span>
                    <div className="flex -space-x-1">
                      {tpl.agents.slice(0, 5).map((a) => {
                        const meta = AGENT_META.find((m) => m.id === a);
                        return (
                          <span key={a} className={cn("w-5 h-5 rounded-full border-2 border-card text-[7px] flex items-center justify-center font-bold", meta?.activeBg, meta?.color)}>
                            {(meta?.label ?? a).charAt(0)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Flows list */}
        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : !flows?.length ? (
          <EmptyState icon={Workflow} title="No flows yet"
            description="Create a flow or use a template to orchestrate multiple agents automatically."
            action={{ label: "Create flow", onClick: () => setShowCreate(true) }} />
        ) : (
          <div className="space-y-3">
            {flows.map((flow) => {
              const isExpanded = expandedFlows.has(flow.id);
              return (
                <div key={flow.id} className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
                  {/* Flow header */}
                  <div
                    onClick={() => toggleFlow(flow.id)}
                    className="flex items-center gap-3 px-5 py-4 hover:bg-accent/30 transition-colors cursor-pointer"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <Workflow className="w-4 h-4 text-violet-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{flow.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {flow.steps.length} steps · {formatRelativeTime(flow.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={flow.status} />
                    {flow.status === "paused" && (
                      <button onClick={(e) => {
                        e.stopPropagation();
                        // Flow pausado: re-ejecutar dispara el fix del backend
                        // que devuelve el estado de pausa rehidratado, abriendo
                        // el modal de selección directamente sin pedir contexto.
                        executeFlowStream(
                          { flow_id: flow.id },
                          () => { setShowResult(true); },
                        );
                      }}
                        className="p-1.5 rounded-md hover:bg-amber-400/10 transition-colors" title="Resume from selection">
                        <Play className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    )}
                    {flow.status !== "running" && flow.status !== "paused" && (
                      <button onClick={(e) => { e.stopPropagation(); setShowExecute(flow.id); setContextForm({ brand: "", product: "", niche: "", market: "", audience: "", tone: "" }); }}
                        className="p-1.5 rounded-md hover:bg-emerald-400/10 transition-colors" title="Execute">
                        <Play className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete this flow?")) deleteFlow.mutate(flow.id); }}
                      className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>

                  {/* Progress bar if running */}
                  {flow.status === "running" && (
                    <div className="px-5 pb-2">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700" style={{ width: `${flow.progress_pct}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Steps detail */}
                  {isExpanded && (
                    <div className="px-5 pb-4 pt-1 border-t border-border space-y-2">
                      {flow.steps.map((step, idx) => {
                        const meta = AGENT_META.find((m) => m.id === step.agent_type);
                        const liveStatus = stepStatuses[step.agent_type];
                        const displayStatus = liveStatus?.status || step.status;

                        return (
                          <div key={step.id}>
                            <div
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/50 border border-border"
                            >
                              {/* Step status icon */}
                              {displayStatus === "completed" ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : displayStatus === "running" ? (
                                <Loader2 className="w-4 h-4 text-violet-400 animate-spin shrink-0" />
                              ) : displayStatus === "error" ? (
                                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
                              )}

                              {/* Step info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={cn("text-xs font-medium", meta?.color)}>{step.name}</span>
                                  {idx < flow.steps.length - 1 && (
                                    <ArrowRight className="w-3 h-3 text-muted-foreground hidden sm:inline" />
                                  )}
                                </div>
                                {liveStatus?.detail && displayStatus === "running" && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{liveStatus.detail}</p>
                                )}
                              </div>

                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {step.completed_at ? formatRelativeTime(step.completed_at) : displayStatus}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════ Execute Flow Modal ══════ */}
      <Modal open={!!showExecute} onClose={() => !flowRunning && setShowExecute(null)} title="Ejecutar Flujo" className="max-w-lg">
        {showExecute && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Proporcionar contexto a los agentes. Cuanto más detalles proporciones, mejores serán los resultados.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Nombre de marca</label>
                <input value={contextForm.brand} onChange={(e) => setContextForm({ ...contextForm, brand: e.target.value })}
                  placeholder="Ej: NEXOM" disabled={flowRunning}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all disabled:opacity-50" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Producto</label>
                <input value={contextForm.product} onChange={(e) => setContextForm({ ...contextForm, product: e.target.value })}
                  placeholder="Ej: Auriculares inalámbricos" disabled={flowRunning}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all disabled:opacity-50" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Nicho</label>
                <input value={contextForm.niche} onChange={(e) => setContextForm({ ...contextForm, niche: e.target.value })}
                  placeholder="Ej: Accesorios tecnológicos" disabled={flowRunning}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all disabled:opacity-50" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Mercado</label>
                <input value={contextForm.market} onChange={(e) => setContextForm({ ...contextForm, market: e.target.value })}
                  placeholder="Ej: Colombia, LATAM" disabled={flowRunning}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all disabled:opacity-50" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Público objetivo</label>
                <input value={contextForm.audience} onChange={(e) => setContextForm({ ...contextForm, audience: e.target.value })}
                  placeholder="Ej: Jóvenes profesionales 25-35" disabled={flowRunning}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all disabled:opacity-50" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Tono</label>
                <input value={contextForm.tone} onChange={(e) => setContextForm({ ...contextForm, tone: e.target.value })}
                  placeholder="Ej: Premium, moderno" disabled={flowRunning}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all disabled:opacity-50" />
              </div>
            </div>

            {/* Live progress */}
            {flowRunning && progress && (
              <div className="space-y-3 py-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{progress.message}</span>
                  <span className="text-xs text-violet-400 font-semibold">{progress.pct}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress.pct}%` }} />
                </div>

                {/* Step-by-step status */}
                <div className="space-y-1.5">
                  {Object.values(stepStatuses).map((s) => (
                    <div key={s.agent} className="flex items-center gap-2 text-xs">
                      {s.status === "completed" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : s.status === "running" ? (
                        <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin shrink-0" />
                      ) : s.status === "error" ? (
                        <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />
                      )}
                      <span className={cn("font-medium", AGENT_META.find(a => a.id === s.agent)?.color)}>
                        {AGENT_META.find(a => a.id === s.agent)?.label ?? s.agent}
                      </span>
                      <span className="text-muted-foreground truncate">{s.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Reference image uploader ── */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">
                Imagen de referencia <span className="text-muted-foreground/60">(opcional)</span>
              </label>
              <input
                ref={refFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={flowRunning}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith("image/")) return;
                  const preview = URL.createObjectURL(file);
                  setReferenceImage({ file, preview });
                  setIsUploadingRef(true);
                  try {
                    const result = await uploadRefImage.mutateAsync(file);
                    setReferenceImage((prev) =>
                      prev ? { ...prev, dataUrl: result.url } : null
                    );
                  } catch {
                    // Si el upload falla, igual conservamos el File local —
                    // handleExecute hará fallback con FileReader.
                    toast("Upload del backend falló, usando imagen local", { icon: "⚠️" });
                  } finally {
                    setIsUploadingRef(false);
                    if (e.target) e.target.value = "";
                  }
                }}
              />
              {!referenceImage ? (
                <button
                  type="button"
                  onClick={() => refFileInputRef.current?.click()}
                  disabled={flowRunning}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-border hover:border-violet-400/50 hover:bg-accent/30 transition-all text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <ImagePlus className="w-4 h-4" />
                  Subir imagen de referencia
                </button>
              ) : (
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-accent/20">
                  <img
                    src={referenceImage.preview}
                    alt="Referencia"
                    className="w-12 h-12 rounded object-cover border border-border shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground font-medium truncate">{referenceImage.file.name}</p>
                    {isUploadingRef ? (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" /> Subiendo...
                      </p>
                    ) : referenceImage.dataUrl ? (
                      <p className="text-[10px] text-emerald-400">✓ Lista para usar en el flow</p>
                    ) : (
                      <p className="text-[10px] text-amber-400">Lista (modo local)</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(referenceImage.preview);
                      setReferenceImage(null);
                    }}
                    disabled={flowRunning}
                    className="p-1 rounded hover:bg-accent shrink-0 disabled:opacity-40"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => handleExecute(showExecute)}
              disabled={flowRunning || isUploadingRef}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
            >
              {flowRunning ? (
                <><Spinner className="w-4 h-4 text-primary-foreground" /> Running...</>
              ) : (
                <><Play className="w-4 h-4" /> Iniciar</>
              )}
            </button>
          </div>
        )}
      </Modal>

      {/* ══════ Flow Result Modal ══════ */}
      <Modal open={showResult && !!flowResult} onClose={() => { setShowResult(false); resetFlow(); }} title="Flow Results" className="max-w-2xl">
        {flowResult && (() => {
          const fr = flowResult as {
            flow_id: string;
            status: string;
            paused?: boolean;
            pause_reason?: string;
            pause_step_id?: string;
            candidate_products?: CandidateProduct[];
            completed_steps: number;
            total_steps: number;
            credits_consumed: number;
            conversation_id: string | null;
            step_results: Record<string, {
              agent_type: string;
              status: string;
              content_preview: string;
              duration_ms: number;
              error: string | null;
              candidate_products?: CandidateProduct[];
            }>;
          };

          // ── Estado pausado: mostrar selector de productos ──
          if (fr.paused && fr.candidate_products && fr.candidate_products.length > 0) {
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <StatusBadge status="paused" />
                  <span className="text-xs text-muted-foreground">
                    {fr.completed_steps}/{fr.total_steps} pasos ejecutados — esperando tu selección
                  </span>
                </div>

                {/* Barra de progreso persistente: muestra el % del run anterior
                    y se reanima cuando el usuario confirma la selección */}
                {(progress || flowRunning) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {progress?.message ?? "Listo para continuar"}
                      </span>
                      <span className="text-xs text-violet-400 font-semibold">
                        {progress?.pct ?? Math.round((fr.completed_steps / Math.max(fr.total_steps, 1)) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${progress?.pct ?? Math.round((fr.completed_steps / Math.max(fr.total_steps, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  El agente <span className="text-emerald-400 font-medium">product_search</span> encontró{" "}
                  <span className="text-foreground font-medium">{fr.candidate_products.length}</span>{" "}
                  productos. Elige cuáles quieres guardar y con cuáles continuar el resto del flow.
                </p>

                <ProductSelectionCard
                  messageId={fr.flow_id}
                  candidateProducts={fr.candidate_products}
                  flowMode
                  isConfirming={flowRunning}
                  onSelectionConfirmed={async (picked) => {
                    await resumeWithSelection(fr.flow_id, picked);
                  }}
                  onCancel={() => {
                    // Cancelar = cerrar modal, el flow queda en estado paused
                    // y el usuario puede retomarlo más tarde desde la lista de flows.
                    toast("Flow pausado guardado. Puedes retomarlo cuando quieras.", { icon: "💾" });
                    setShowResult(false);
                    resetFlow();
                  }}
                />
              </div>
            );
          }

          // ── Estado pausado SIN candidatos: edge case ──
          if (fr.paused && (!fr.candidate_products || fr.candidate_products.length === 0)) {
            return (
              <div className="space-y-3">
                <StatusBadge status="paused" />
                <p className="text-sm text-amber-300">
                  El flow se pausó tras product_search pero no se encontraron productos
                  candidatos. Esto puede pasar si el scraping no devolvió resultados o
                  si el agente no logró clasificar ninguno. Revisa los parámetros de
                  búsqueda y vuelve a ejecutar el flow.
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={fr.status} />
                  <span className="text-xs text-muted-foreground">
                    {fr.completed_steps}/{fr.total_steps} steps completed
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {fr.credits_consumed} credits used
                </span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                {Object.entries(fr.step_results).map(([stepId, step]) => {
                  const meta = AGENT_META.find(a => a.id === step.agent_type);

                  return (
                    <div key={stepId} className="border border-border rounded-lg overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3">
                        {step.status === "completed" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                        )}
                        <span className={cn("text-sm font-medium flex-1", meta?.color)}>
                          {meta?.label ?? step.agent_type}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {(step.duration_ms / 1000).toFixed(1)}s
                        </span>
                      </div>

                      {/* Selector de productos para flows ya completados (legacy view) */}
                      {step.agent_type === "product_search" &&
                        (step.candidate_products?.length ?? 0) > 0 && (
                          <div className="px-4 pb-3">
                            <ProductSelectionCard
                              messageId={stepId}
                              candidateProducts={step.candidate_products ?? []}
                            />
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
              {fr.conversation_id && (
                <button
                  onClick={() => {
                    setShowResult(false);
                    resetFlow();
                    router.push(`/orchestrator?convo=${fr.conversation_id}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
                >
                  <ArrowRight className="w-4 h-4" /> Continue in chat
                </button>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* ══════ Create Flow Modal ══════ */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setCustomSteps([]); setForm({ name: "" }); }} title="Nuevo flujo" className="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Nombre del flujo</label>
            <input value={form.name} onChange={(e) => setForm({ name: e.target.value })}
              placeholder="Ej: Campaña de lanzamiento de producto"
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
          </div>

          {/* Steps builder */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Pasos ({customSteps.length})</label>

            {customSteps.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {customSteps.map((step, idx) => {
                  const meta = AGENT_META.find(a => a.id === step.agent_type);
                  return (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg">
                      <span className="text-xs text-muted-foreground font-mono w-5">{idx + 1}.</span>
                      <span className={cn("text-xs font-medium flex-1", meta?.color)}>{step.name}</span>
                      <button type="button" onClick={() => {
                        setCustomSteps(prev => {
                          const next = [...prev];
                          if (idx > 0) { [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]; }
                          return next;
                        });
                      }} disabled={idx === 0}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button type="button" onClick={() => {
                        setCustomSteps(prev => {
                          const next = [...prev];
                          if (idx < next.length - 1) { [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]; }
                          return next;
                        });
                      }} disabled={idx === customSteps.length - 1}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <button type="button" onClick={() => setCustomSteps(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-muted-foreground hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add step dropdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {AGENT_META.filter(a => a.id !== "general_assistant").map((agent) => {
                const alreadyAdded = customSteps.some(s => s.agent_type === agent.id);
                return (
                  <button key={agent.id} type="button"
                    onClick={() => setCustomSteps(prev => [...prev, {
                      agent_type: agent.id,
                      name: agent.label,
                    }])}
                    disabled={alreadyAdded}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs text-left transition-all",
                      alreadyAdded
                        ? "border-border bg-muted/30 opacity-40 cursor-not-allowed"
                        : "border-border hover:bg-accent hover:border-violet-400/30"
                    )}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", agent.color)} />
                    <span className="font-medium">{agent.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => {
              if (!form.name.trim() || customSteps.length < 2) return;
              createFlow.mutate(
                {
                  name: form.name.trim(),
                  steps: customSteps.map((s, idx) => ({
                    agent_type: s.agent_type,
                    name: s.name,
                    order: idx + 1,
                    depends_on_step_id: undefined,
                  })),
                },
                {
                  onSuccess: () => {
                    setShowCreate(false);
                    setForm({ name: "" });
                    setCustomSteps([]);
                  },
                }
              );
            }}
            disabled={createFlow.isPending || !form.name.trim() || customSteps.length < 2}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
          >
            {createFlow.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : customSteps.length < 2 ? `Agrega al menos 2 pasos (${customSteps.length}/2)` : `Crear flujo (${customSteps.length} pasos)`}
          </button>
        </div>
      </Modal>
    </div>
  );
}