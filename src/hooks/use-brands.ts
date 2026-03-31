"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { brandService } from "@/services/brand.service";
import toast from "react-hot-toast";

export const brandKeys = {
  list: ["brands"] as const,
  detail: (id: string) => ["brands", id] as const,
  templates: ["brand-templates"] as const,
};

export function useBrands() {
  return useQuery({
    queryKey: brandKeys.list,
    queryFn: () => brandService.list(),
  });
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: brandKeys.detail(id),
    queryFn: () => brandService.getById(id),
    enabled: !!id,
  });
}

export function useBrandTemplates() {
  return useQuery({
    queryKey: brandKeys.templates,
    queryFn: () => brandService.getTemplates(),
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

export function useCreateBrandFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => brandService.createFromTemplate(templateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: brandKeys.list });
      toast.success("Marca creada desde template");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Parameters<typeof brandService.update>[1]) =>
      brandService.update(id, body),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: brandKeys.list });
      qc.invalidateQueries({ queryKey: brandKeys.detail(variables.id) });
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

export function useExportBrandPdf() {
  return useMutation({
    mutationFn: async (params: { id: string; name: string }) => {
      const blob = await brandService.exportPdf(params.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `brand-guidelines-${params.name.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success("PDF descargado"),
    onError: (err: Error) => toast.error(err.message),
  });
}