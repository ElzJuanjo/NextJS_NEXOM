"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { flowService } from "@/services/flow.service";
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
      toast.success("Flow creado");
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
      toast.success("Flow eliminado");
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
      toast.success(`Flow ${data.status}: ${data.completed_steps}/${data.total_steps} pasos`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: flowService.createFromTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: flowKeys.list });
      toast.success("Flow creado desde template");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
