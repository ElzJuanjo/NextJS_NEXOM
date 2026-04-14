"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import type { SelectableProduct } from "@/types";
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

export function useImportFromDropi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dropiProductId: string) => productService.importFromDropi(dropiProductId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: productKeys.list });
      toast.success(
        `Producto "${data.dropi_name}" importado — Stock: ${data.dropi_stock}, Variaciones: ${data.variations_count}`
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
export function usePersistSelectedProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (products: SelectableProduct[]) => productService.persistSelected(products),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: productKeys.list });
      const saved = data.created_ids.length;
      const skipped = data.skipped_names.length;
      if (saved > 0) {
        toast.success(
          skipped > 0
            ? `${saved} producto${saved !== 1 ? "s" : ""} guardado${saved !== 1 ? "s" : ""} (${skipped} ya existían)`
            : `${saved} producto${saved !== 1 ? "s" : ""} guardado${saved !== 1 ? "s" : ""} en tu catálogo`
        );
      } else if (skipped > 0) {
        toast("Todos los productos ya estaban en tu catálogo", { icon: "ℹ️" });
      }
    },
    onError: (err: Error) => toast.error(err.message || "Error al guardar productos"),
  });
}
