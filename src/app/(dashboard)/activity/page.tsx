"use client";

import { useState } from "react";
import { Activity, Filter, Search, Clock, Zap, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
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
            <Header title="Actividad" subtitle="Historial de ejecuciones de agentes"
                search={{ placeholder: "Buscar en actividad...", value: search, onChange: setSearch }}
            />

            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                {/* Filters + Search */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1">
                        {FILTER_OPTIONS.map((opt) => (
                            <button key={opt.id ?? "all"} onClick={() => setAgentFilter(opt.id)}
                                className={cn("px-2.5 py-1 rounded-lg text-xs font-medium border whitespace-nowrap transition-all",
                                    agentFilter === opt.id
                                        ? "text-violet-400 bg-violet-400/10 border-violet-400/20"
                                        : "border-border text-muted-foreground hover:bg-accent"
                                )}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tasks list */}
                {isLoading ? (
                    <ActivityListSkeleton rows={8} />
                ) : !filtered.length ? (
                    <EmptyState icon={Activity} title={search ? "No results" : "No activity yet"}
                        description={search ? "Try a different search term." : "Execute an agent from the Orchestrator to see activity here."} />
                ) : (
                    <div className="space-y-2">
                        {filtered.map((task) => {
                            const meta = AGENT_META.find((a) => a.id === task.agent_type);
                            const isExpanded = expandedTask === task.id;
                            const input = (task.input_payload as Record<string, unknown>)?.user_input as string | undefined;
                            const content = (task.output_payload as Record<string, unknown>)?.content as string | undefined;
                            const images = (task.output_payload as Record<string, unknown>)?.images as string[] | undefined;
                            const batchId = (task.input_payload as Record<string, unknown>)?.batch_id as string | undefined;
                            const batchName = (task.input_payload as Record<string, unknown>)?.batch_name as string | undefined;

                            return (
                                <div key={task.id} className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
                                    {/* Task header */}
                                    <div
                                        onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors cursor-pointer"
                                    >
                                        {/* Status icon */}
                                        {task.status === "completed" ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                        ) : task.status === "partial" ? (
                                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                                        ) : task.status === "error" ? (
                                            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                                        ) : (
                                            <Loader2 className="w-4 h-4 text-violet-400 animate-spin shrink-0" />
                                        )}

                                        {/* Agent badge */}
                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0", meta?.activeBg ?? "bg-muted")}>
                                            <span className={meta?.color ?? "text-muted-foreground"}>
                                                {(meta?.label ?? task.agent_type).charAt(0).toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={cn("text-sm font-medium", meta?.color)}>{meta?.label ?? task.agent_type}</span>
                                                {batchName && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">batch: {batchName}</span>}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {input ? (input.length > 80 ? input.slice(0, 80) + "..." : input) : meta?.label ?? task.agent_type}
                                            </p>
                                        </div>

                                        {/* Right info */}
                                        <div className="flex items-center gap-3 shrink-0">
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
                                                <span className="text-xs text-muted-foreground">
                                                    {formatRelativeTime(task.finished_at)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded content */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 border-t border-border space-y-3">
                                            {/* Input */}
                                            {input && (
                                                <div className="mt-3">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Input</p>
                                                    <div className="px-3 py-2 bg-muted/50 rounded-lg text-xs text-foreground">
                                                        {input}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Output */}
                                            {content && (
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Output</p>
                                                    <div className="px-3 py-2 bg-muted/50 rounded-lg text-xs text-foreground max-h-[80vh] overflow-y-auto scrollbar-thin">
                                                        <MarkdownRenderer content={content} />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Images */}
                                            {images && images.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Images ({images.length})</p>
                                                    <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
                                                        {images.map((src, i) => (
                                                            <img key={i} src={src} alt={`Image ${i + 1}`}
                                                                className="h-24 w-24 object-cover rounded-lg border border-border shrink-0" />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Error */}
                                            {task.error_message && (
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Error</p>
                                                    <div className="px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
                                                        {task.error_message}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Meta */}
                                            <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground pt-1">
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