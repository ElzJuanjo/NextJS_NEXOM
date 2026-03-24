"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationService } from "@/services/conversation.service";
import { orgKeys } from "./use-org";
import toast from "react-hot-toast";

export const convoKeys = {
    list: (archived?: boolean) => ["conversations", archived ?? false] as const,
    detail: (id: string) => ["conversations", "detail", id] as const,
};

export function useConversations(archived = false) {
    return useQuery({
        queryKey: convoKeys.list(archived),
        queryFn: () => conversationService.list(archived),
    });
}

export function useConversation(id: string | null) {
    return useQuery({
        queryKey: convoKeys.detail(id ?? ""),
        queryFn: () => conversationService.get(id!),
        enabled: !!id,
    });
}

export function useSendMessage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: conversationService.send,
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["conversations"] });
            qc.invalidateQueries({ queryKey: orgKeys.usage });
        },
        onError: (err: Error) => toast.error(err.message),
    });
}

export function useUpdateConversation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...body }: { id: string; title?: string; is_archived?: boolean }) =>
            conversationService.update(id, body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["conversations"] });
        },
        onError: (err: Error) => toast.error(err.message),
    });
}

export function useDeleteConversation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => conversationService.remove(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["conversations"] });
            toast.success("Conversación eliminada");
        },
        onError: (err: Error) => toast.error(err.message),
    });
}