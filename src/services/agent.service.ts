import apiClient from "@/lib/api-client";
import type { AvailableAgent, AgentTaskResponse, ExecuteAgentResponse } from "@/types";

export const agentService = {
  async listAvailable() {
    const { data } = await apiClient.get<{ agents: AvailableAgent[] }>("/api/v1/agents/available");
    return data.agents;
  },

  async listTasks(params?: { agent_type?: string; limit?: number }) {
    const { data } = await apiClient.get<{ tasks: AgentTaskResponse[] }>("/api/v1/agent-tasks", { params });
    return data.tasks;
  },

  async execute(body: {
    agent_type: string;
    user_input: string;
    context?: Record<string, unknown>;
  }) {
    const { data } = await apiClient.post<ExecuteAgentResponse>("/api/v1/agents/execute", body);
    return data;
  },
};
