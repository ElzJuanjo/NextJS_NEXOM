import apiClient from "@/lib/api-client";
import type {
  ConversationResponse, ConversationDetailResponse,
  SendMessageResponse,
} from "@/types";

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

  async send(body: { content: string; conversation_id?: string }) {
    const { data } = await apiClient.post<SendMessageResponse>(`${BASE}/send`, body);
    return data;
  },

  async update(conversationId: string, body: { title?: string; is_archived?: boolean }) {
    const { data } = await apiClient.patch<ConversationResponse>(`${BASE}/${conversationId}`, body);
    return data;
  },

  async remove(conversationId: string) {
    await apiClient.delete(`${BASE}/${conversationId}`);
  },
};