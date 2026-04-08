"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { creativeService } from "@/services/creative.service";
import { creativeBatchService } from "@/services/creative-batch.service";
import { showProgressToast, dismissProgressToast } from "@/components/ui/ProgressToast";
import toast from "react-hot-toast";
import { useState } from "react";

export const creativeKeys = {
  list: (productId: string) => ["creatives", productId] as const,
  unassigned: ["creatives", "unassigned"] as const,
  batchPresets: ["creative-batches", "presets"] as const,
};

export const batchKeys = {
  list: ["creative-batches"] as const,
};

export function useCreatives(productId?: string) {
  return useQuery({
    queryKey: ["creatives", productId ?? "all"],
    queryFn: () => creativeService.list(productId),
  });
}

export function useDeleteCreative() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => creativeService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creatives"] });
      qc.invalidateQueries({ queryKey: batchKeys.list });
      toast.success("Creativo eliminado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUnassignedCreatives() {
  return useQuery({
    queryKey: creativeKeys.unassigned,
    queryFn: () => creativeService.listUnassigned(),
  });
}

export function useAssignProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ creativeId, product_id }: { creativeId: string; product_id: string | null }) =>
      creativeService.assignProduct(creativeId, product_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creatives"] });
      toast.success("Producto actualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useBatchPresets() {
  return useQuery({
    queryKey: creativeKeys.batchPresets,
    queryFn: () => creativeBatchService.getPresets(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useBatches() {
  return useQuery({
    queryKey: batchKeys.list,
    queryFn: () => creativeBatchService.list(),
  });
}

export function useGenerateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: creativeBatchService.generate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.list });
      qc.invalidateQueries({ queryKey: ["creatives"] });
      toast.success("Batch de creativos generado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useGenerateBatchStream() {
  const qc = useQueryClient();
  const [progress, setProgress] = useState<{
    stage: string;
    pct: number;
    message?: string;
    detail?: string;
  } | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [promptPack, setPromptPack] = useState<Array<{ type: string; style: string; prompt: string }>>([]);

  const generate = async (
    body: {
      product_id?: string;
      product_name: string;
      product_description: string;
      brand_palette?: string;
      preset_id?: string;
      gallery_name?: string;
      product_image_url?: string;
    },
    onSuccess?: () => void,
  ) => {
    setIsPending(true);
    setPromptPack([]);
    setProgress({ stage: "connecting", pct: 2, message: "Starting batch..." });

    try {
      await creativeBatchService.generateStream(
        body,
        (event) => {
          setProgress(event);
          showProgressToast({
            id: "batch-progress",
            message: event.message || "Generating...",
            pct: event.pct,
            detail: event.detail,
          });
        },
        (data) => {
          setProgress(null);
          setIsPending(false);
          // Extract prompt pack from done payload
          const pack = data?.prompt_pack;
          if (Array.isArray(pack)) {
            setPromptPack(pack as Array<{ type: string; style: string; prompt: string }>);
          }
          qc.invalidateQueries({ queryKey: batchKeys.list });
          qc.invalidateQueries({ queryKey: creativeKeys.unassigned });
          qc.invalidateQueries({ queryKey: ["org", "usage"] });
          dismissProgressToast("batch-progress");
          toast.success("Batch completed!");
          onSuccess?.();
        },
        (error) => {
          setProgress(null);
          setIsPending(false);
          dismissProgressToast("batch-progress");
          toast.error(error);
        },
      );
    } catch {
      setProgress(null);
      setIsPending(false);
      toast.error("Connection error");
    }
  };

  return { generate, progress, isPending, promptPack };
}

export function useDeleteBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => creativeBatchService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.list });
      qc.invalidateQueries({ queryKey: ["creatives"] });
      toast.success("Batch eliminado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateGallery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, product_id }: { name: string; product_id?: string }) =>
      creativeBatchService.createGallery(name, product_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.list });
      toast.success("Galería creada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateGallery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; name?: string; product_id?: string | null }) =>
      creativeBatchService.updateGallery(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.list });
      toast.success("Galería actualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useMoveCreative() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ creativeId, batch_id }: { creativeId: string; batch_id: string | null }) =>
      creativeBatchService.moveCreative(creativeId, batch_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.list });
      qc.invalidateQueries({ queryKey: ["creatives"] });
      toast.success("Creativo movido");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}