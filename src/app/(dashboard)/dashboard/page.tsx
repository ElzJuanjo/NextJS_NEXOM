"use client";

import { Activity, CheckCircle2, Cpu, TrendingUp, Zap, Mail } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { CreditUsage } from "@/components/dashboard/CreditUsage";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { useAgentTasks, useAvailableAgents } from "@/hooks/use-agents";
import { useFlows } from "@/hooks/use-flows";
import { useFadeIn, useStagger } from "@/hooks/use-anime";
import { cn, formatRelativeTime, getStatusBadge } from "@/lib/utils";
import { AGENT_META } from "@/types";
import { ActivityListSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useVerificationStatus, useResendVerification, useMe } from "@/hooks/use-auth";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: user } = useMe();
  const { data: tasks, isLoading: tasksLoading } = useAgentTasks(undefined, 50);
  const { data: agents } = useAvailableAgents();
  const { data: flows } = useFlows();

  const totalFlows = flows?.length ?? 0;

  const bannerRef = useFadeIn<HTMLDivElement>();
  const gridRef = useStagger<HTMLDivElement>({
    opacity: [0, 1],
    translateY: [10, 0],
    duration: 350,
    easing: "easeOutCubic",
  });

  const { data: verificationStatus } = useVerificationStatus();
  const resendVerification = useResendVerification();
  const RESEND_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

  const getResendRemaining = () => {
    if (typeof window === "undefined") return 0;
    const lastSent = localStorage.getItem("nexom_resend_at");
    if (!lastSent) return 0;
    const elapsed = Date.now() - parseInt(lastSent, 10);
    const remaining = RESEND_COOLDOWN_MS - elapsed;
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  };

  const [resendCooldown, setResendCooldown] = useState(getResendRemaining);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const displayName = user?.full_name?.split(" ")[0] ?? "Usuario";
  const completedTasks = tasks?.filter((t) => t.status === "completed").length ?? 0;
  const totalTasks = tasks?.length ?? 0;
  const runningFlows = flows?.filter((f) => f.status === "running").length ?? 0;
  const partialTasks = tasks?.filter((t) => t.status === "partial") ?? [];
  const partialValue = partialTasks.reduce((acc, t) => {
    const pct = (t.output_payload as Record<string, unknown>)?.success_pct;
    return acc + (typeof pct === "number" ? pct / 100 : 0.5);
  }, 0);
  const successRate = totalTasks > 0
    ? Math.round(((completedTasks + partialValue) / totalTasks) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard"
        subtitle="Vista general del sistema de agentes"
        action={{ label: "Nuevo proceso", onClick: () => router.push("/orchestrator") }}
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Welcome banner */}
        <div
          ref={bannerRef}
          className="relative rounded-xl overflow-hidden bg-gradient-to-r from-violet-950/80 via-indigo-950/80 to-violet-950/80 border border-violet-800/30 p-6 opacity-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.15),_transparent_60%)]" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                Buenos días, <span className="gradient-text">{displayName}</span>
              </h2>
              <p className="text-sm text-violet-200/70 mt-0.5">
                Tienes {runningFlows} flujos activos y {totalTasks} tareas registradas.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-sm text-white/80">{agents?.length ?? 0} agentes disponibles</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification banner */}
        {verificationStatus && !verificationStatus.is_verified && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-3 rounded-xl bg-amber-400/10 border border-amber-400/20 animate-fade-in">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Mail className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Verifica tu correo</p>
                <p className="text-xs text-muted-foreground break-words">
                  Hemos enviado un enlace de verificación a <span className="text-foreground">{verificationStatus.email}</span>.
                  El link expira en {verificationStatus.verification_expires_hours}h.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                resendVerification.mutate(verificationStatus.email);
                localStorage.setItem("nexom_resend_at", Date.now().toString());
                setResendCooldown(RESEND_COOLDOWN_MS / 1000);
              }}
              disabled={resendVerification.isPending || resendCooldown > 0}
              className="px-3 py-1.5 rounded-lg bg-amber-400/20 text-amber-400 text-xs font-medium hover:bg-amber-400/30 transition-colors shrink-0 disabled:opacity-50"
            >
              {resendVerification.isPending ? "Sending..." : resendCooldown > 0 ? `Wait ${formatCooldown(resendCooldown)}` : "Reenviar"}
            </button>
          </div>
        )}

        {/* Stats grid */}
        <div ref={gridRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Tareas totales" value={totalTasks} icon={Activity} iconColor="text-violet-400" delay={0.05} />
          <StatsCard title="Completadas" value={completedTasks} change={`${successRate}% tasa de éxito`} positive icon={CheckCircle2} iconColor="text-emerald-400" delay={0.1} />
          <StatsCard title="Agentes" value={agents?.length ?? 0} icon={Cpu} iconColor="text-blue-400" delay={0.15} />
          <StatsCard title="Flujos" value={totalFlows} icon={TrendingUp} iconColor="text-pink-400" delay={0.2} />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent tasks */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                Actividad reciente
              </h2>
              <Link href="/activity" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Ver todo →
              </Link>
            </div>

            {tasksLoading ? (
              <ActivityListSkeleton rows={6} />
            ) : !tasks?.length ? (
              <EmptyState
                icon={Activity}
                title="Sin actividad aún"
                description="Ejecuta tu primer agente desde el Orquestador para ver la actividad aquí."
                action={{ label: "Ir al Orquestador", onClick: () => router.push("/orchestrator") }}
              />
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 8).map((task) => {
                  const meta = AGENT_META.find((a) => a.id === task.agent_type);
                  return (
                    <div key={task.id} className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold", meta?.activeBg ?? "bg-muted")}>
                        <span className={meta?.color ?? "text-muted-foreground"}>
                          {(meta?.label ?? task.agent_type).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {meta?.label ?? task.agent_type}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {task.input_payload && typeof (task.input_payload as Record<string, unknown>).user_input === "string"
                            ? `${String((task.input_payload as Record<string, unknown>).user_input).slice(0, 60)}${String((task.input_payload as Record<string, unknown>).user_input).length > 60 ? "..." : ""}`
                            : meta?.label ?? task.agent_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {task.credits_used != null && (
                          <span className="text-xs text-muted-foreground">{task.credits_used} cr.</span>
                        )}
                        {task.finished_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(task.finished_at)}
                          </span>
                        )}
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", getStatusBadge(task.status))}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <CreditUsage />

            {/* Available agents */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Cpu className="w-4 h-4 text-muted-foreground" />
                Agentes disponibles
              </h3>
              <div className="space-y-1.5">
                {AGENT_META.map((agent) => {
                  const info = agents?.find((a) => a.agent_type === agent.id);
                  return (
                    <div key={agent.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-accent/50 transition-colors">
                      <span className={cn("text-xs font-medium", agent.color)}>{agent.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {info?.credits_per_use ?? "—"} créditos
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}