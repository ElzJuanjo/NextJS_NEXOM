"use client";

import { PenLine, Send } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { useAgentTasks, useExecuteAgent } from "@/hooks/use-agents";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useState } from "react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

export default function CopywritingPage() {
  const { data: tasks, isLoading } = useAgentTasks("copywriting", 30);
  const execute = useExecuteAgent();
  const [prompt, setPrompt] = useState("");

  const handleSend = () => {
    if (!prompt.trim()) return;
    execute.mutate({ agent_type: "copywriting", user_input: prompt.trim() }, { onSuccess: () => setPrompt("") });
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Copywriting" subtitle="Genera textos de venta, headlines y contenido persuasivo" />

      <div className="flex-1 p-6 space-y-6">
        {/* Input */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-end gap-3">
            <textarea
              value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe lo que necesitas: ej. 'Escribe un copy de Instagram para un serum de vitamina C, tono fresco y profesional'"
              rows={3}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all resize-none"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button onClick={handleSend} disabled={!prompt.trim() || execute.isPending}
              className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-40">
              {execute.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : <><Send className="w-4 h-4" /> Generar</>}
            </button>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : !tasks?.length ? (
          <EmptyState icon={PenLine} title="Sin copywriting aún" description="Genera tu primer copy usando el agente de copywriting. Escribe un prompt arriba para comenzar." />
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="bg-card border border-border rounded-xl p-5 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 font-medium">Copywriting</span>
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
                {task.error_message && <p className="text-sm text-destructive mt-2">{task.error_message}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
