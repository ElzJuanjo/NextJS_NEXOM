import apiClient from "@/lib/api-client";
import type { LandingPageResponse, LandingSectionResponse } from "@/types";

const BASE = "/api/v1/landing-pages";

export const landingService = {
  async list(brand_id: string) {
    const { data } = await apiClient.get<{ landing_pages: LandingPageResponse[] }>(BASE, {
      params: { brand_id },
    });
    return data.landing_pages;
  },

  async create(body: {
    brand_id: string;
    name: string;
    campaign?: string;
    sections?: Array<{
      section_type: string;
      title?: string;
      body?: string;
      cta_text?: string;
      cta_url?: string;
      order: number;
      is_visible?: boolean;
      content?: Record<string, unknown>;
    }>;
  }) {
    const { data } = await apiClient.post<LandingPageResponse>(BASE, body);
    return data;
  },

  async update(lpId: string, body: Partial<{
    name: string;
    campaign: string;
    status: string;
    published_url: string;
  }>) {
    const { data } = await apiClient.patch<LandingPageResponse>(`${BASE}/${lpId}`, body);
    return data;
  },

  async remove(lpId: string) {
    await apiClient.delete(`${BASE}/${lpId}`);
  },

  async updateSection(sectionId: string, body: Partial<{
    title: string;
    body: string;
    cta_text: string;
    cta_url: string;
    is_visible: boolean;
    content: Record<string, unknown>;
  }>) {
    const { data } = await apiClient.patch<LandingSectionResponse>(`${BASE}/sections/${sectionId}`, body);
    return data;
  },
};
