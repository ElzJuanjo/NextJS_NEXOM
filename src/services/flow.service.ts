import apiClient from "@/lib/api-client";
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
