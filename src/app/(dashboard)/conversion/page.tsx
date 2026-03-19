"use client";

import { TrendingUp, Send } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { useAgentTasks, useExecuteAgent } from "@/hooks/use-agents";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useState } from "react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

export default function ConversionPage() {
  const { data: tasks, isLoading } = useAgentTasks("conversion_opt", 20);
  const execute = useExecuteAgent();
  const [prompt, setPrompt] = useState("");

  const handleSend = () => {
    if (!prompt.trim()) return;
    execute.mutate({ agent_type: "conversion_opt", user_input: prompt.trim() }, { onSuccess: () => setPrompt("") });
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Optimización de Conversión" subtitle="Analiza métricas y mejora tu funnel de ventas" />

      <div className="flex-1 p-6 space-y-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-end gap-3">
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe tu situación: ej. 'Mi tienda tiene un 2% de tasa de conversión y un AOV de $35. ¿Cómo puedo mejorar?'"
              rows={3}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all resize-none"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button onClick={handleSend} disabled={!prompt.trim() || execute.isPending}
              className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-40">
              {execute.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : <><Send className="w-4 h-4" /> Analizar</>}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : !tasks?.length ? (
          <EmptyState icon={TrendingUp} title="Sin análisis aún" description="Usa el agente de optimización para recibir recomendaciones personalizadas basadas en tus métricas." />
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="bg-card border border-border rounded-xl p-5 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-400/10 text-orange-400 border border-orange-400/20 font-medium">Conversión</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium",
                      task.status === "completed" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-muted-foreground bg-muted border-border"
                    )}>{task.status}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(task.created_at)}</span>
                </div>
                {task.output_payload?.content && (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                    <MarkdownRenderer content={String(task.output_payload.content ?? "")} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
