"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { creativeService } from "@/services/creative.service";
import { creativeBatchService } from "@/services/creative-batch.service";
import toast from "react-hot-toast";

export const creativeKeys = {
  list: (productId: string) => ["creatives", productId] as const,
  batchPresets: ["creative-batches", "presets"] as const,
};

export function useCreatives(productId: string) {
  return useQuery({
    queryKey: creativeKeys.list(productId),
    queryFn: () => creativeService.list(productId),
    enabled: !!productId,
  });
}

export function useCreateCreative() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: creativeService.create,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: creativeKeys.list(vars.product_id) });
      toast.success("Creativo generado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCreative(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => creativeService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: creativeKeys.list(productId) });
      toast.success("Creativo eliminado");
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

export function useGenerateBatch() {
  return useMutation({
    mutationFn: creativeBatchService.generate,
    onSuccess: () => toast.success("Batch de creativos generado"),
    onError: (err: Error) => toast.error(err.message),
  });
}
