import apiClient from "@/lib/api-client";
import { getAccessToken } from "@/lib/api-client";
import type { FlowResponse, FlowStepResponse, ExecuteFlowResponse, FlowTemplateInfo } from "@/types";

const BASE = "/api/v1/flows";

export const flowService = {
  async list() {
    const { data } = await apiClient.get<{ flows: FlowResponse[] }>(BASE);
    return data.flows;
  },

  async create(body: {
    name: string;
    context?: Record<string, unknown>;
    steps?: Array<{ agent_type: string; name: string; order: number; depends_on_step_id?: string }>;
  }) {
    const { data } = await apiClient.post<FlowResponse>(BASE, body);
    return data;
  },

  async update(flowId: string, body: Partial<{
    name: string;
    status: string;
    progress_pct: number;
    context: Record<string, unknown>;
  }>) {
    const { data } = await apiClient.patch<FlowResponse>(`${BASE}/${flowId}`, body);
    return data;
  },

  async remove(flowId: string) {
    await apiClient.delete(`${BASE}/${flowId}`);
  },

  async addStep(flowId: string, body: {
    agent_type: string;
    name: string;
    order: number;
    depends_on_step_id?: string;
  }) {
    const { data } = await apiClient.post<FlowStepResponse>(`${BASE}/${flowId}/steps`, body);
    return data;
  },

  async updateStep(stepId: string, body: Partial<{ status: string }>) {
    const { data } = await apiClient.patch<FlowStepResponse>(`${BASE}/steps/${stepId}`, body);
    return data;
  },

  async execute(body: { flow_id: string; context?: Record<string, unknown> }) {
    const { data } = await apiClient.post<ExecuteFlowResponse>(`${BASE}/execute`, body);
    return data;
  },

  async executeStream(
    body: { flow_id: string; context?: Record<string, unknown> },
    onProgress: (event: { stage: string; pct: number; agent?: string; message?: string; detail?: string }) => void,
    onDone: (data: Record<string, unknown>) => void,
    onError: (error: string) => void,
  ): Promise<void> {
    const token = getAccessToken();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${BASE}/execute/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => "Unknown error");
      onError(`HTTP ${response.status}: ${text}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || "";

      for (const block of blocks) {
        if (!block.trim()) continue;

        const eventMatch = block.match(/^event: (\w+)/m);
        const dataMatch = block.match(/^data: (.+)$/m);

        if (!eventMatch || !dataMatch) continue;

        try {
          const eventType = eventMatch[1];
          const data = JSON.parse(dataMatch[1]);

          if (eventType === "progress") {
            onProgress(data);
          } else if (eventType === "done") {
            onDone(data);
          } else if (eventType === "error") {
            onError(data.error || "Unknown error");
          }
        } catch {
          // Skip malformed events
        }
      }
    }
  },

  // Templates
  async listTemplates() {
    const { data } = await apiClient.get<{ templates: FlowTemplateInfo[] }>("/api/v1/flow-templates");
    return data.templates;
  },

  async createFromTemplate(body: {
    template_id: string;
    name?: string;
    context?: Record<string, unknown>;
    auto_execute?: boolean;
  }) {
    const { data } = await apiClient.post("/api/v1/flow-templates", body);
    return data;
  },
};