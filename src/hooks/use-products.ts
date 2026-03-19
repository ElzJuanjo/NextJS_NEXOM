"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import toast from "react-hot-toast";

export const productKeys = {
  list: ["products"] as const,
};

export function useProducts() {
  return useQuery({
    queryKey: productKeys.list,
    queryFn: () => productService.list(),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.list });
      toast.success("Producto creado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Parameters<typeof productService.update>[1]) =>
      productService.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.list });
      toast.success("Producto actualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.list });
      toast.success("Producto eliminado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
