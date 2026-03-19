"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orchestratorService } from "@/services/orchestrator.service";
import { orgKeys } from "./use-org";

export function useOrchestrator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: orchestratorService.send,
    onSuccess: () => {
      // Refresh usage since credits were consumed
      qc.invalidateQueries({ queryKey: orgKeys.usage });
    },
  });
}
