import apiClient from "@/lib/api-client";

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
    custom_angles?: string[];
    custom_formats?: string[];
    custom_styles?: string[];
  }) {
    const { data } = await apiClient.post(BASE, body);
    return data;
  },
};
