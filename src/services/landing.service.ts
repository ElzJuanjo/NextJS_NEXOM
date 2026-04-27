import apiClient from "@/lib/api-client";
import { getAccessToken } from "@/lib/api-client";
import type { LandingPageResponse, LandingSectionResponse } from "@/types";

const BASE = "/api/v1/landing-pages";

export const landingService = {
  async list(brand_id?: string) {
    const params: Record<string, string> = {};
    if (brand_id) params.brand_id = brand_id;
    const { data } = await apiClient.get<{ landing_pages: LandingPageResponse[] }>(BASE, { params });
    return data.landing_pages;
  },

  async create(body: {
    brand_id?: string;
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
    brand_id: string | null;
    published_url: string;
    template: string;
    seo_title: string;
    seo_description: string;
    og_image: string;
    analytics_config: Record<string, string | undefined>;
    custom_css?: string | null;
    use_custom_css?: boolean;
  }>) {
    const { data } = await apiClient.patch<LandingPageResponse>(`${BASE}/${lpId}`, body);
    return data;
  },

  async remove(lpId: string) {
    await apiClient.delete(`${BASE}/${lpId}`);
  },

  async addSection(lpId: string, body: {
    section_type: string;
    title?: string;
    body?: string;
    cta_text?: string;
    cta_url?: string;
    order: number;
    is_visible?: boolean;
    content?: Record<string, unknown>;
  }) {
    const { data } = await apiClient.post<LandingSectionResponse>(`${BASE}/${lpId}/sections`, body);
    return data;
  },

  async updateSection(sectionId: string, body: Partial<{
    title: string;
    body: string;
    cta_text: string;
    cta_url: string;
    is_visible: boolean;
    content: Record<string, unknown>;
    image_url: string;
    images: string[];
    ab_group: string;
  }>) {
    const { data } = await apiClient.patch<LandingSectionResponse>(`${BASE}/sections/${sectionId}`, body);
    return data;
  },

  async livePreviewSection(lpId: string, sectionId: string, body: {
    section_type: string;
    title?: string;
    body?: string;
    cta_text?: string;
    cta_url?: string;
    content?: Record<string, unknown>;
    image_url?: string;
  }): Promise<string> {
    const token = getAccessToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${BASE}/${lpId}/sections/${sectionId}/preview`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) throw new Error(`Preview failed: ${res.status}`);
    return res.text();
  },

  async deleteSection(sectionId: string) {
    await apiClient.delete(`${BASE}/sections/${sectionId}`);
  },

  async duplicateSection(sectionId: string) {
    const { data } = await apiClient.post<LandingSectionResponse>(`${BASE}/sections/${sectionId}/duplicate`);
    return data;
  },

  async reorderSections(lpId: string, sectionIds: string[]) {
    const { data } = await apiClient.post<LandingPageResponse>(`${BASE}/${lpId}/reorder`, { section_ids: sectionIds });
    return data;
  },

  async renderHTML(lpId: string): Promise<string> {
    const token = getAccessToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${BASE}/${lpId}/render`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );
    if (!res.ok) throw new Error(`Render failed: ${res.status}`);
    return res.text();
  },

  async renderSection(lpId: string, sectionId: string): Promise<string> {
    const token = getAccessToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${BASE}/${lpId}/sections/${sectionId}/render`,
      { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } },
    );
    if (!res.ok) throw new Error(`Render failed: ${res.status}`);
    return res.text();
  },

  async duplicate(lpId: string): Promise<LandingPageResponse> {
    const { data } = await apiClient.post<LandingPageResponse>(`${BASE}/${lpId}/duplicate`);
    return data;
  },

  async regenerateSection(sectionId: string): Promise<LandingSectionResponse> {
    const { data } = await apiClient.post<LandingSectionResponse>(`${BASE}/sections/${sectionId}/regenerate`);
    return data;
  },

  async exportHTML(lpId: string): Promise<Blob> {
    const token = getAccessToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${BASE}/${lpId}/export/html`,
      { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } },
    );
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    return res.blob();
  },

  async exportShopify(lpId: string): Promise<string> {
    const token = getAccessToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${BASE}/${lpId}/export/shopify`,
      { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } },
    );
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    return res.text();
  },

  async exportWordPress(lpId: string): Promise<string> {
    const token = getAccessToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${BASE}/${lpId}/export/wordpress`,
      { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } },
    );
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    return res.text();
  },
};