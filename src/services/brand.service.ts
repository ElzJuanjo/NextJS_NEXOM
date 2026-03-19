import apiClient from "@/lib/api-client";
import type { BrandResponse } from "@/types";

const BASE = "/api/v1/brands";

export const brandService = {
  async list() {
    const { data } = await apiClient.get<{ brands: BrandResponse[] }>(BASE);
    return data.brands;
  },

  async create(body: {
    name: string;
    tagline?: string;
    color_palette?: Record<string, string>;
    typography?: Record<string, string>;
    tones?: string[];
    key_messages?: string[];
  }) {
    const { data } = await apiClient.post<BrandResponse>(BASE, body);
    return data;
  },

  async update(brandId: string, body: Partial<{
    name: string;
    tagline: string;
    status: string;
    color_palette: Record<string, string>;
    typography: Record<string, string>;
    tones: string[];
    key_messages: string[];
  }>) {
    const { data } = await apiClient.patch<BrandResponse>(`${BASE}/${brandId}`, body);
    return data;
  },

  async remove(brandId: string) {
    await apiClient.delete(`${BASE}/${brandId}`);
  },
};
