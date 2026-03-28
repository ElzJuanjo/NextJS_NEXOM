"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { flowService } from "@/services/flow.service";
import { showProgressToast, dismissProgressToast } from "@/components/ui/ProgressToast";
import toast from "react-hot-toast";

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
    body: { flow_id: string; context?: Record<string, unknown> },
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
                  : "running",
                message: event.message || "",
                detail: event.detail,
              },
            }));
          }

          // Global toast
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
          toast.success("Flow completed!");
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

  return { execute, progress, stepStatuses, isPending, result, reset };
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