import apiClient from "@/lib/api-client";
import type { BrandResponse } from "@/types";

const BASE = "/api/v1/brands";

export interface BrandTemplate {
  id: string;
  name: string;
  industry: string;
  color_palette: Record<string, string>;
  typography: Record<string, string>;
  tones: string[];
  key_messages: string[];
}

export const brandService = {
  async list() {
    const { data } = await apiClient.get<{ brands: BrandResponse[] }>(BASE);
    return data.brands;
  },

  async getById(brandId: string) {
    const { data } = await apiClient.get<BrandResponse>(`${BASE}/${brandId}`);
    return data;
  },

  async create(body: {
    name: string;
    tagline?: string;
    color_palette?: Record<string, string>;
    typography?: Record<string, string>;
    tones?: string[];
    key_messages?: string[];
    brand_identity?: Record<string, any>;
  }) {
    const { data } = await apiClient.post<BrandResponse>(BASE, body);
    return data;
  },

  async update(
    brandId: string,
    body: Partial<{
      name: string;
      tagline: string;
      status: string;
      color_palette: Record<string, string>;
      typography: Record<string, string>;
      tones: string[];
      key_messages: string[];
      brand_identity: Record<string, any>;
    }>
  ) {
    const { data } = await apiClient.patch<BrandResponse>(`${BASE}/${brandId}`, body);
    return data;
  },

  async remove(brandId: string) {
    await apiClient.delete(`${BASE}/${brandId}`);
  },

  async getTemplates() {
    const { data } = await apiClient.get<BrandTemplate[]>(`${BASE}/templates`);
    return data;
  },

  async createFromTemplate(templateId: string) {
    const { data } = await apiClient.post<BrandResponse>(`${BASE}/from-template/${templateId}`);
    return data;
  },

  async exportPdf(brandId: string) {
    const response = await apiClient.get(`${BASE}/${brandId}/export-pdf`, { responseType: "blob" });
    return response.data as Blob;
  },
};