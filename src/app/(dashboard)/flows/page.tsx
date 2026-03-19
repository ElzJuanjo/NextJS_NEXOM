"use client";

import { useState } from "react";
import { Workflow, Play, Trash2, Plus, Zap } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useFlows, useFlowTemplates, useCreateFlow, useDeleteFlow, useExecuteFlow, useCreateFromTemplate } from "@/hooks/use-flows";
import { cn, formatRelativeTime, getStatusColor } from "@/lib/utils";
import { AGENT_META } from "@/types";

export default function FlowsPage() {
  const { data: flows, isLoading } = useFlows();
  const { data: templates } = useFlowTemplates();
  const createFlow = useCreateFlow();
  const deleteFlow = useDeleteFlow();
  const executeFlow = useExecuteFlow();
  const createFromTemplate = useCreateFromTemplate();

  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [form, setForm] = useState({ name: "" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createFlow.mutate({ name: form.name }, { onSuccess: () => { setShowCreate(false); setForm({ name: "" }); } });
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Flujos de Automatización" subtitle="Orquesta agentes en secuencias automáticas"
        action={{ label: "Nuevo flow", onClick: () => setShowCreate(true) }} />

      <div className="flex-1 p-6 space-y-6">
        {/* Templates quick access */}
        {templates && templates.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-400" /> Templates predefinidos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {templates.map((tpl) => (
                <button key={tpl.template_id} onClick={() => createFromTemplate.mutate({ template_id: tpl.template_id, auto_execute: false })}
                  className="bg-card border border-border rounded-xl p-4 text-left hover:bg-accent/50 transition-colors group">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tpl.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">{tpl.total_steps} pasos</span>
                    <div className="flex -space-x-1">
                      {tpl.agents.slice(0, 4).map((a) => {
                        const meta = AGENT_META.find((m) => m.id === a);
                        return <span key={a} className={cn("w-4 h-4 rounded-full border-2 border-card text-[6px] flex items-center justify-center font-bold", meta?.activeBg, meta?.color)}>
                          {(meta?.label ?? a).charAt(0)}
                        </span>;
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
          <EmptyState icon={Workflow} title="Sin flujos aún" description="Crea un flujo de automatización o usa un template predefinido para orquestar múltiples agentes." action={{ label: "Crear flow", onClick: () => setShowCreate(true) }} />
        ) : (
          <div className="space-y-3">
            {flows.map((flow) => (
              <div key={flow.id} className="bg-card border border-border rounded-xl p-5 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{flow.name}</h3>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(flow.created_at)} · {flow.steps.length} pasos</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={flow.status} />
                    {flow.status !== "running" && (
                      <button onClick={() => executeFlow.mutate({ flow_id: flow.id })}
                        className="p-1.5 rounded-md hover:bg-emerald-400/10 transition-colors" title="Ejecutar">
                        <Play className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                    )}
                    <button onClick={() => { if (confirm("¿Eliminar?")) deleteFlow.mutate(flow.id); }}
                      className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors" title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>

                {flow.status === "running" && (
                  <div className="mb-3">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700" style={{ width: `${flow.progress_pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{flow.progress_pct}% completado</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {flow.steps.map((step) => {
                    const meta = AGENT_META.find((m) => m.id === step.agent_type);
                    return (
                      <div key={step.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted border border-border text-xs">
                        <span className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(step.status).replace("text-", "bg-"))} />
                        <span className={meta?.color}>{step.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo flujo">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Nombre del flujo</label>
            <input value={form.name} onChange={(e) => setForm({ name: e.target.value })} required minLength={2}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
          </div>
          <button type="submit" disabled={createFlow.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
            {createFlow.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : "Crear flujo"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
