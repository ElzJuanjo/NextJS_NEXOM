"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { brandService } from "@/services/brand.service";
import toast from "react-hot-toast";

export const brandKeys = {
  list: ["brands"] as const,
};

export function useBrands() {
  return useQuery({
    queryKey: brandKeys.list,
    queryFn: () => brandService.list(),
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: brandService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: brandKeys.list });
      toast.success("Marca creada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Parameters<typeof brandService.update>[1]) =>
      brandService.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: brandKeys.list });
      toast.success("Marca actualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => brandService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: brandKeys.list });
      toast.success("Marca eliminada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
