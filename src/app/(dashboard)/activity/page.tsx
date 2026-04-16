"use client";

import { useState } from "react";
import { Activity, Clock, Zap, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ActivityListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { useAgentTasks } from "@/hooks/use-agents";
import { cn, formatRelativeTime } from "@/lib/utils";
import { AGENT_META } from "@/types";

const FILTER_OPTIONS = [
    { id: undefined, label: "Todos" },
    { id: "general_assistant", label: "General" },
    { id: "branding", label: "Branding" },
    { id: "copywriting", label: "Copywriting" },
    { id: "image_gen", label: "Imágenes" },
    { id: "ads", label: "Anuncios" },
    { id: "landing_page", label: "Landing" },
    { id: "store_dev", label: "Tienda" },
    { id: "product_search", label: "Productos" },
    { id: "dropi_connector", label: "Dropi" },
    { id: "conversion_opt", label: "Conversión" },
];

export default function ActivityPage() {
    const [agentFilter, setAgentFilter] = useState<string | undefined>(undefined);
    const [search, setSearch] = useState("");
    const [expandedTask, setExpandedTask] = useState<string | null>(null);
    const { data: tasks, isLoading } = useAgentTasks(agentFilter, 100);

    const filtered = tasks?.filter((t) => {
        if (!search) return true;
        const input = (t.input_payload as Record<string, unknown>)?.user_input;
        const content = (t.output_payload as Record<string, unknown>)?.content;
        const searchLower = search.toLowerCase();
        return (
            (typeof input === "string" && input.toLowerCase().includes(searchLower)) ||
            (typeof content === "string" && content.toLowerCase().includes(searchLower)) ||
            t.agent_type.toLowerCase().includes(searchLower)
        );
    }) ?? [];

    return (
        <div className="flex flex-col h-full">
            <Header
                title="Actividad"
                subtitle="Historial de ejecuciones de agentes"
                search={{ placeholder: "Buscar en actividad...", value: search, onChange: setSearch }}
            />

            <div className="flex-1 p-3 sm:p-6 space-y-4 overflow-y-auto">
                {/* Filters — scrollable horizontal con edge padding en mobile */}
                <div className="-mx-3 sm:mx-0 px-3 sm:px-0">
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1">
                        {FILTER_OPTIONS.map((opt) => (
                            <button
                                key={opt.id ?? "all"}
                                onClick={() => setAgentFilter(opt.id)}
                                className={cn(
                                    "px-2.5 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all shrink-0",
                                    agentFilter === opt.id
                                        ? "text-violet-400 bg-violet-400/10 border-violet-400/20"
                                        : "border-border text-muted-foreground hover:bg-accent"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tasks list */}
                {isLoading ? (
                    <ActivityListSkeleton rows={8} />
                ) : !filtered.length ? (
                    <EmptyState
                        icon={Activity}
                        title={search ? "Sin resultados" : "Aún no hay actividad"}
                        description={search ? "Prueba con otro término de búsqueda." : "Ejecuta un agente desde el Orchestrator para ver actividad aquí."}
                    />
                ) : (
                    <div className="space-y-2">
                        {filtered.map((task) => {
                            const meta = AGENT_META.find((a) => a.id === task.agent_type);
                            const isExpanded = expandedTask === task.id;
                            const input = (task.input_payload as Record<string, unknown>)?.user_input as string | undefined;
                            const content = (task.output_payload as Record<string, unknown>)?.content as string | undefined;
                            const images = (task.output_payload as Record<string, unknown>)?.images as string[] | undefined;
                            const batchName = (task.input_payload as Record<string, unknown>)?.batch_name as string | undefined;

                            const StatusIcon =
                                task.status === "completed" ? CheckCircle2 :
                                    task.status === "partial" || task.status === "error" ? AlertCircle :
                                        Loader2;

                            const statusColor =
                                task.status === "completed" ? "text-emerald-400" :
                                    task.status === "partial" ? "text-amber-400" :
                                        task.status === "error" ? "text-destructive" :
                                            "text-violet-400";

                            return (
                                <div key={task.id} className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
                                    {/* Task header — grid responsive */}
                                    <button
                                        onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                                        className="w-full flex items-start sm:items-center gap-3 px-3 sm:px-4 py-3 hover:bg-accent/30 transition-colors text-left"
                                    >
                                        {/* Status + Agent badge */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <StatusIcon className={cn("w-4 h-4 shrink-0", statusColor, task.status === "running" && "animate-spin")} />
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                                                meta?.activeBg ?? "bg-muted"
                                            )}>
                                                <span className={meta?.color ?? "text-muted-foreground"}>
                                                    {(meta?.label ?? task.agent_type).charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Info — flex-1 con min-w-0 para que truncate funcione */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={cn("text-sm font-medium", meta?.color)}>
                                                    {meta?.label ?? task.agent_type}
                                                </span>
                                                {batchName && (
                                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded max-w-[120px] sm:max-w-none truncate">
                                                        batch: {batchName}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                {input ?? meta?.label ?? task.agent_type}
                                            </p>

                                            {/* Meta inline en mobile (debajo del input) */}
                                            <div className="flex items-center gap-3 mt-1.5 sm:hidden text-[10px] text-muted-foreground">
                                                {task.credits_used != null && task.credits_used > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Zap className="w-3 h-3" />{task.credits_used}
                                                    </span>
                                                )}
                                                {task.duration_ms != null && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />{(task.duration_ms / 1000).toFixed(1)}s
                                                    </span>
                                                )}
                                                {task.finished_at && <span>{formatRelativeTime(task.finished_at)}</span>}
                                            </div>
                                        </div>

                                        {/* Meta a la derecha — solo desktop */}
                                        <div className="hidden sm:flex items-center gap-3 shrink-0">
                                            {task.credits_used != null && task.credits_used > 0 && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Zap className="w-3 h-3" />{task.credits_used} cr
                                                </span>
                                            )}
                                            {task.duration_ms != null && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />{(task.duration_ms / 1000).toFixed(1)}s
                                                </span>
                                            )}
                                            {task.finished_at && (
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatRelativeTime(task.finished_at)}
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    {/* Expanded content */}
                                    {isExpanded && (
                                        <div className="px-3 sm:px-4 pb-4 border-t border-border space-y-3">
                                            {input && (
                                                <div className="mt-3">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Input</p>
                                                    <div className="px-3 py-2 bg-muted/50 rounded-lg text-xs text-foreground break-words">
                                                        {input}
                                                    </div>
                                                </div>
                                            )}

                                            {content && (
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Output</p>
                                                    <div className="px-3 py-2 bg-muted/50 rounded-lg text-xs text-foreground max-h-[50vh] sm:max-h-[80vh] overflow-y-auto scrollbar-thin break-words">
                                                        <MarkdownRenderer content={content} />
                                                    </div>
                                                </div>
                                            )}

                                            {images && images.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                                                        Imágenes ({images.length})
                                                    </p>
                                                    <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
                                                        {images.map((src, i) => (
                                                            <img
                                                                key={i}
                                                                src={src}
                                                                alt={`Image ${i + 1}`}
                                                                className="aspect-square sm:h-24 sm:w-24 w-full object-cover rounded-lg border border-border"
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {task.error_message && (
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Error</p>
                                                    <div className="px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive break-words">
                                                        {task.error_message}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground pt-1">
                                                <span>ID: {task.id.slice(0, 8)}</span>
                                                <span>Status: {task.status}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}