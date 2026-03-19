import apiClient from "@/lib/api-client";
import type { CreativeBatchResponse } from "@/types";

const BASE = "/api/v1/creative-batches";

export const creativeBatchService = {
  async getPresets() {
    const { data } = await apiClient.get<{ presets: Array<Record<string, unknown>> }>(`${BASE}/presets`);
    return data.presets;
  },

  async generate(body: {
    product_id?: string;
    product_name: string;
    product_description: string;
    brand_palette?: string;
    preset_id?: string;
  }): Promise<CreativeBatchResponse> {
    const { data } = await apiClient.post<CreativeBatchResponse>(BASE, body);
    return data;
  },

  async list(): Promise<CreativeBatchResponse[]> {
    const { data } = await apiClient.get<{ batches: CreativeBatchResponse[] }>(BASE);
    return data.batches;
  },

  async remove(batchId: string) {
    await apiClient.delete(`${BASE}/${batchId}`);
  },
};