"use client";

import { useState } from "react";
import { Workflow, Play, Trash2, Zap, ChevronDown, ChevronRight, ChevronUp, CheckCircle2, AlertCircle, Loader2, X, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

import { useRouter } from "next/navigation";
import {
  useFlows, useFlowTemplates, useCreateFlow, useDeleteFlow,
  useExecuteFlowStream, useCreateFromTemplate,
} from "@/hooks/use-flows";
import { cn, formatRelativeTime } from "@/lib/utils";
import { AGENT_META } from "@/types";

export default function FlowsPage() {
  const router = useRouter();

  const { data: flows, isLoading } = useFlows();
  const { data: templates } = useFlowTemplates();
  const createFlow = useCreateFlow();
  const deleteFlow = useDeleteFlow();
  const createFromTemplate = useCreateFromTemplate();
  const { execute: executeFlowStream, progress, stepStatuses, isPending: flowRunning, result: flowResult, reset: resetFlow } = useExecuteFlowStream();

  const [showCreate, setShowCreate] = useState(false);
  const [showExecute, setShowExecute] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ name: "" });
  const [customSteps, setCustomSteps] = useState<Array<{ agent_type: string; name: string }>>([]);
  const [contextForm, setContextForm] = useState({
    brand: "", product: "", niche: "", market: "", audience: "", tone: "",
  });

  const toggleFlow = (id: string) => {
    setExpandedFlows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleExecute = (flowId: string) => {
    const ctx: Record<string, unknown> = {};
    if (contextForm.brand) ctx.brand = contextForm.brand;
    if (contextForm.product) ctx.product = contextForm.product;
    if (contextForm.niche) ctx.niche = contextForm.niche;
    if (contextForm.market) ctx.market = contextForm.market;
    if (contextForm.audience) ctx.audience = contextForm.audience;
    if (contextForm.tone) ctx.tone = contextForm.tone;

    executeFlowStream(
      { flow_id: flowId, context: Object.keys(ctx).length > 0 ? ctx : undefined },
      () => {
        setShowExecute(null);
        setShowResult(true);
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
                    {flow.status !== "running" && (
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
      <Modal open={!!showExecute} onClose={() => !flowRunning && setShowExecute(null)} title="Execute Flow" className="max-w-lg">
        {showExecute && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Provide context for the agents. The more detail you give, the better the results.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Brand name</label>
                <input value={contextForm.brand} onChange={(e) => setContextForm({ ...contextForm, brand: e.target.value })}
                  placeholder="e.g. NexOS" disabled={flowRunning}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all disabled:opacity-50" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Product</label>
                <input value={contextForm.product} onChange={(e) => setContextForm({ ...contextForm, product: e.target.value })}
                  placeholder="e.g. Wireless earbuds" disabled={flowRunning}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all disabled:opacity-50" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Niche</label>
                <input value={contextForm.niche} onChange={(e) => setContextForm({ ...contextForm, niche: e.target.value })}
                  placeholder="e.g. Tech accessories" disabled={flowRunning}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all disabled:opacity-50" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Market</label>
                <input value={contextForm.market} onChange={(e) => setContextForm({ ...contextForm, market: e.target.value })}
                  placeholder="e.g. Colombia, LATAM" disabled={flowRunning}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all disabled:opacity-50" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Target audience</label>
                <input value={contextForm.audience} onChange={(e) => setContextForm({ ...contextForm, audience: e.target.value })}
                  placeholder="e.g. Young professionals 25-35" disabled={flowRunning}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all disabled:opacity-50" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Tone</label>
                <input value={contextForm.tone} onChange={(e) => setContextForm({ ...contextForm, tone: e.target.value })}
                  placeholder="e.g. Premium, modern" disabled={flowRunning}
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

            <button
              onClick={() => handleExecute(showExecute)}
              disabled={flowRunning}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
            >
              {flowRunning ? (
                <><Spinner className="w-4 h-4 text-primary-foreground" /> Running...</>
              ) : (
                <><Play className="w-4 h-4" /> Execute Flow</>
              )}
            </button>
          </div>
        )}
      </Modal>

      {/* ══════ Flow Result Modal ══════ */}
      <Modal open={showResult && !!flowResult} onClose={() => { setShowResult(false); resetFlow(); }} title="Flow Results" className="max-w-2xl">
        {flowResult && (() => {
          const fr = flowResult as {
            status: string;
            completed_steps: number;
            total_steps: number;
            credits_consumed: number;
            conversation_id: string | null;
            step_results: Record<string, { agent_type: string; status: string; content_preview: string; duration_ms: number; error: string | null }>;
          };

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
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setCustomSteps([]); setForm({ name: "" }); }} title="New flow" className="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Flow name</label>
            <input value={form.name} onChange={(e) => setForm({ name: e.target.value })}
              placeholder="e.g. Product launch campaign"
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
          </div>

          {/* Steps builder */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Steps ({customSteps.length})</label>

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
              if (!form.name.trim() || customSteps.length === 0) return;
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
            disabled={createFlow.isPending || !form.name.trim() || customSteps.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
          >
            {createFlow.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : `Create flow (${customSteps.length} steps)`}
          </button>
        </div>
      </Modal>
    </div>
  );
}