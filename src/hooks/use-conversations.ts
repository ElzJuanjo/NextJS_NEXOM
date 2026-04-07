"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationService } from "@/services/conversation.service";
import { orgKeys } from "./use-org";
import { useState, useRef } from "react";
import type { SendMessageResponse } from "@/types";
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

export function useSendMessageStream() {
    const qc = useQueryClient();
    const [progress, setProgress] = useState<{ stage: string; pct: number; agent?: string; message?: string } | null>(null);
    const [isPending, setIsPending] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearSimulation = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const send = async (
        body: { content: string; conversation_id?: string; force_agent?: string },
        onSuccess: (data: SendMessageResponse) => void,
    ) => {
        setIsPending(true);
        setProgress({ stage: "connecting", pct: 5, message: "Connecting..." });

        try {
            await conversationService.sendStream(
                body,
                (event) => {
                    clearSimulation();
                    setProgress(event);

                    // Simulate gradual progress during "generating" stage
                    if (event.stage === "generating") {
                        let simPct = event.pct;
                        intervalRef.current = setInterval(() => {
                            simPct += 2;
                            if (simPct >= 78) {
                                clearSimulation();
                                return;
                            }
                            setProgress((prev) => prev?.stage === "generating" ? { ...prev, pct: simPct } : prev);
                        }, 1500);
                    }
                },
                (data) => {
                    clearSimulation();
                    setProgress(null);
                    setIsPending(false);
                    qc.invalidateQueries({ queryKey: ["conversations"] });
                    qc.invalidateQueries({ queryKey: orgKeys.usage });
                    onSuccess(data);
                },
                (error) => {
                    clearSimulation();
                    setProgress(null);
                    setIsPending(false);
                    toast.error(error);
                },
            );
        } catch (err) {
            clearSimulation();
            setProgress(null);
            setIsPending(false);
            toast.error("Connection error");
        }
    };

    return { send, progress, isPending };
}