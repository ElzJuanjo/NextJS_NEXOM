"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agentService } from "@/services/agent.service";
import toast from "react-hot-toast";

export const agentKeys = {
  available: ["agents", "available"] as const,
  tasks: (agentType?: string) => ["agents", "tasks", agentType ?? "all"] as const,
};

export function useAvailableAgents() {
  return useQuery({
    queryKey: agentKeys.available,
    queryFn: () => agentService.listAvailable(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useAgentTasks(agentType?: string, limit = 20) {
  return useQuery({
    queryKey: agentKeys.tasks(agentType),
    queryFn: () => agentService.listTasks({ agent_type: agentType, limit }),
  });
}

export function useExecuteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: agentService.execute,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["agents", "tasks"] });
      if (data.status === "completed") {
        toast.success("Agente completó la tarea");
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
