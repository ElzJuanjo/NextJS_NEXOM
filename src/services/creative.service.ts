import apiClient from "@/lib/api-client";
import type { CreativeResponse } from "@/types";

const BASE = "/api/v1/creatives";

export const creativeService = {
  async list(product_id: string) {
    const { data } = await apiClient.get<{ creatives: CreativeResponse[] }>(BASE, {
      params: { product_id },
    });
    return data.creatives;
  },

  async create(body: {
    product_id: string;
    agent_type: string;
    platform?: string;
    format?: string;
    style?: string;
    generation_prompt?: string;
    generation_params?: Record<string, unknown>;
  }) {
    const { data } = await apiClient.post<CreativeResponse>(BASE, body);
    return data;
  },

  async update(creativeId: string, body: Partial<{
    status: string;
    file_url: string;
    thumbnail_url: string;
  }>) {
    const { data } = await apiClient.patch<CreativeResponse>(`${BASE}/${creativeId}`, body);
    return data;
  },

  async remove(creativeId: string) {
    await apiClient.delete(`${BASE}/${creativeId}`);
  },
};
