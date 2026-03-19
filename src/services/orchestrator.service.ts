import apiClient from "@/lib/api-client";
import type { OrchestratorResponse } from "@/types";

export const orchestratorService = {
  async send(body: {
    user_input: string;
    context?: Record<string, unknown>;
    force_agent?: string;
  }) {
    const { data } = await apiClient.post<OrchestratorResponse>("/api/v1/orchestrator", body);
    return data;
  },
};
