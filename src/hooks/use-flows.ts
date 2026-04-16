"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { flowService } from "@/services/flow.service";
import { showProgressToast, dismissProgressToast } from "@/components/ui/ProgressToast";
import toast from "react-hot-toast";
import type { CandidateProduct } from "@/types";

export const flowKeys = {
  list: ["flows"] as const,
  templates: ["flows", "templates"] as const,
};

export function useFlows() {
  return useQuery({
    queryKey: flowKeys.list,
    queryFn: () => flowService.list(),
  });
}

export function useFlowTemplates() {
  return useQuery({
    queryKey: flowKeys.templates,
    queryFn: () => flowService.listTemplates(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: flowService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: flowKeys.list });
      toast.success("Flow created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => flowService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: flowKeys.list });
      toast.success("Flow deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useExecuteFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: flowService.execute,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: flowKeys.list });
      toast.success(`Flow ${data.status}: ${data.completed_steps}/${data.total_steps} steps`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export interface FlowStepProgress {
  step_id?: string;
  agent: string;
  status: "pending" | "running" | "completed" | "error";
  message: string;
  detail?: string;
}

export function useExecuteFlowStream() {
  const qc = useQueryClient();
  const [progress, setProgress] = useState<{
    stage: string;
    pct: number;
    agent?: string;
    message?: string;
    detail?: string;
  } | null>(null);
  const [stepStatuses, setStepStatuses] = useState<Record<string, FlowStepProgress>>({});
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const execute = async (
    body: { flow_id: string; context?: Record<string, unknown>; reference_image_url?: string },
    onSuccess?: (data: Record<string, unknown>) => void,
  ) => {
    setIsPending(true);
    setResult(null);
    setStepStatuses({});
    setProgress({ stage: "connecting", pct: 2, message: "Starting flow..." });

    try {
      await flowService.executeStream(
        body,
        (event) => {
          setProgress(event);

          // Track individual step statuses
          if (event.agent) {
            setStepStatuses((prev) => ({
              ...prev,
              [event.agent!]: {
                agent: event.agent!,
                status: event.stage === "step_started" ? "running"
                  : event.stage === "step_completed" ? "completed"
                  : event.stage === "step_error" ? "error"
                  : event.stage === "awaiting_selection" ? "completed"
                  : "running",
                message: event.message || "",
                detail: event.detail,
              },
            }));
          }

          showProgressToast({
            id: "flow-progress",
            message: event.message || "Processing...",
            pct: event.pct,
            detail: event.detail,
          });
        },
        (data) => {
          dismissProgressToast("flow-progress");
          setProgress(null);
          setIsPending(false);
          setResult(data);
          qc.invalidateQueries({ queryKey: flowKeys.list });
          qc.invalidateQueries({ queryKey: ["org", "usage"] });

          // ── Diferenciar pausa vs completado ──
          if (data?.paused === true || data?.status === "paused") {
            toast(
              "Flow pausado: selecciona los productos para continuar",
              { icon: "⏸️" },
            );
          } else if (data?.status === "error") {
            toast.error(typeof data.error === "string" ? data.error : "Flow error");
          } else {
            toast.success("Flow completed!");
          }
          onSuccess?.(data);
        },
        (error) => {
          dismissProgressToast("flow-progress");
          setProgress(null);
          setIsPending(false);
          toast.error(error);
        },
      );
    } catch {
      dismissProgressToast("flow-progress");
      setProgress(null);
      setIsPending(false);
      toast.error("Connection error");
    }
  };

  const reset = () => {
    setProgress(null);
    setStepStatuses({});
    setIsPending(false);
    setResult(null);
  };

  /** Reanuda el flow pausado con la selección del usuario via SSE.
   *  Mantiene viva la barra de progreso desde el porcentaje en el que
   *  se pausó (no resetea a 0). */
  const resumeWithSelection = async (
    flowId: string,
    selected: CandidateProduct[],
    onSuccess?: (data: Record<string, unknown>) => void,
  ) => {
    setIsPending(true);
    // No reseteamos progress ni stepStatuses — mantenemos los del run anterior
    // para que la barra continúe desde donde estaba al pausarse.
    if (!progress) {
      setProgress({ stage: "resuming", pct: 50, message: "Resuming flow..." });
    }

    try {
      await flowService.resumeWithSelectionStream(
        flowId,
        selected,
        (event) => {
          setProgress(event);
          if (event.agent) {
            setStepStatuses((prev) => ({
              ...prev,
              [event.agent!]: {
                agent: event.agent!,
                status: event.stage === "step_started" ? "running"
                  : event.stage === "step_completed" ? "completed"
                  : event.stage === "step_error" ? "error"
                  : prev[event.agent!]?.status === "completed" ? "completed"
                  : "running",
                message: event.message || "",
                detail: event.detail,
              },
            }));
          }
          showProgressToast({
            id: "flow-progress",
            message: event.message || "Processing...",
            pct: event.pct,
            detail: event.detail,
          });
        },
        (data) => {
          dismissProgressToast("flow-progress");
          setProgress(null);
          setIsPending(false);
          setResult(data);
          qc.invalidateQueries({ queryKey: flowKeys.list });
          qc.invalidateQueries({ queryKey: ["org", "usage"] });
          qc.invalidateQueries({ queryKey: ["products"] });
          if (data?.status === "error") {
            toast.error(typeof data.error === "string" ? data.error : "Flow resume error");
          } else {
            toast.success(`Flow completado: ${data.completed_steps ?? "?"}/${data.total_steps ?? "?"} pasos`);
          }
          onSuccess?.(data);
        },
        (error) => {
          dismissProgressToast("flow-progress");
          setProgress(null);
          setIsPending(false);
          toast.error(error);
        },
      );
    } catch {
      dismissProgressToast("flow-progress");
      setProgress(null);
      setIsPending(false);
      toast.error("Connection error during resume");
    }
  };

  return { execute, resumeWithSelection, progress, stepStatuses, isPending, result, reset };
}

export function useCreateFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: flowService.createFromTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: flowKeys.list });
      toast.success("Flow created from template");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}