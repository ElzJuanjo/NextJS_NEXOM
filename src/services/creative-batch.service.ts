import apiClient from "@/lib/api-client";
import { getAccessToken } from "@/lib/api-client";
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
    gallery_name?: string;
  }): Promise<CreativeBatchResponse> {
    const { data } = await apiClient.post<CreativeBatchResponse>(BASE, body);
    return data;
  },

  async list(): Promise<CreativeBatchResponse[]> {
    const { data } = await apiClient.get<{ batches: CreativeBatchResponse[] }>(BASE);
    return data.batches;
  },

  async createGallery(name: string, product_id?: string): Promise<CreativeBatchResponse> {
    const { data } = await apiClient.post<CreativeBatchResponse>(`${BASE}/gallery`, { name, product_id });
    return data;
  },

  async updateGallery(batchId: string, body: { name?: string; product_id?: string | null }): Promise<CreativeBatchResponse> {
    const { data } = await apiClient.patch<CreativeBatchResponse>(`${BASE}/${batchId}`, body);
    return data;
  },

  async moveCreative(creativeId: string, batch_id: string | null) {
    const { data } = await apiClient.patch(`${BASE}/move-creative/${creativeId}`, { batch_id });
    return data;
  },

  async remove(batchId: string) {
    await apiClient.delete(`${BASE}/${batchId}`);
  },

  async generateStream(
    body: {
      product_id?: string;
      product_name: string;
      product_description: string;
      brand_palette?: string;
      preset_id?: string;
      gallery_name?: string;
      product_image_url?: string;
    },
    onProgress: (event: { stage: string; pct: number; message?: string; detail?: string }) => void,
    onDone: (data: Record<string, unknown>) => void,
    onError: (error: string) => void,
  ): Promise<void> {
    const token = getAccessToken();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${BASE}/stream`,
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
};