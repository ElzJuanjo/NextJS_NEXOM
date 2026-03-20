"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { creativeService } from "@/services/creative.service";
import { creativeBatchService } from "@/services/creative-batch.service";
import toast from "react-hot-toast";

export const creativeKeys = {
  list: (productId: string) => ["creatives", productId] as const,
  batchPresets: ["creative-batches", "presets"] as const,
};

export function useCreatives(productId?: string) {
  return useQuery({
    queryKey: ["creatives", productId ?? "all"],
    queryFn: () => creativeService.list(productId),
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

export function useDeleteCreative() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => creativeService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creatives"] });
      qc.invalidateQueries({ queryKey: ["creative-batches"] });
      toast.success("Creativo eliminado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUnassignedCreatives() {
  return useQuery({
    queryKey: ["creatives", "unassigned"],
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
    queryKey: ["creative-batches"],
    queryFn: () => creativeBatchService.list(),
  });
}

export function useGenerateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: creativeBatchService.generate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creative-batches"] });
      qc.invalidateQueries({ queryKey: ["creatives"] });
      toast.success("Batch de creativos generado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => creativeBatchService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creative-batches"] });
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
      qc.invalidateQueries({ queryKey: ["creative-batches"] });
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
      qc.invalidateQueries({ queryKey: ["creative-batches"] });
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
      qc.invalidateQueries({ queryKey: ["creative-batches"] });
      qc.invalidateQueries({ queryKey: ["creatives"] });
      toast.success("Creativo movido");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}