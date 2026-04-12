import apiClient from "@/lib/api-client";
import type {
  ConversationResponse, ConversationDetailResponse,
  SendMessageResponse,
} from "@/types";
import { getAccessToken } from "@/lib/api-client";

const BASE = "/api/v1/conversations";

export const conversationService = {
  async list(archived = false, limit = 30) {
    const { data } = await apiClient.get<{ conversations: ConversationResponse[] }>(BASE, {
      params: { archived, limit },
    });
    return data.conversations;
  },

  async get(conversationId: string) {
    const { data } = await apiClient.get<ConversationDetailResponse>(`${BASE}/${conversationId}`);
    return data;
  },

  async update(conversationId: string, body: { title?: string; is_archived?: boolean }) {
    const { data } = await apiClient.patch<ConversationResponse>(`${BASE}/${conversationId}`, body);
    return data;
  },

  async remove(conversationId: string) {
    await apiClient.delete(`${BASE}/${conversationId}`);
  },

  async sendStream(
    body: { content: string; conversation_id?: string; force_agent?: string; image_urls?: string[] },
    onProgress: (event: { stage: string; pct: number; agent?: string; message?: string }) => void,
    onDone: (data: SendMessageResponse) => void,
    onError: (error: string) => void,
  ): Promise<void> {
    const token = getAccessToken();

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${BASE}/send/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      onError(`HTTP ${response.status}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const block of lines) {
        if (!block.trim()) continue;

        const eventMatch = block.match(/^event: (\w+)/m);
        const dataMatch = block.match(/^data: (.+)$/m);

        if (!eventMatch || !dataMatch) continue;

        const eventType = eventMatch[1];
        const data = JSON.parse(dataMatch[1]);

        if (eventType === "progress") {
          onProgress(data);
        } else if (eventType === "done") {
          onDone(data);
        } else if (eventType === "error") {
          onError(data.error);
        }
      }
    }
  },
};


export async function uploadChatImage(file: File): Promise<{ url: string; filename: string; content_type: string; size: number }> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post("/api/v1/uploads/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}