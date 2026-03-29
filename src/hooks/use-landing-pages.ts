"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { landingService } from "@/services/landing.service";
import toast from "react-hot-toast";

export const landingKeys = {
  all: ["landing-pages"] as const,
  list: (brandId?: string) => ["landing-pages", brandId ?? "all"] as const,
};

export function useLandingPages(brandId?: string) {
  return useQuery({
    queryKey: landingKeys.list(brandId),
    queryFn: () => landingService.list(brandId || undefined),
  });
}

export function useCreateLanding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: landingService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: landingKeys.all });
      toast.success("Landing page creada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteLanding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => landingService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: landingKeys.all });
      toast.success("Landing eliminada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateLanding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lpId, body }: { lpId: string; body: Parameters<typeof landingService.update>[1] }) =>
      landingService.update(lpId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: landingKeys.all });
      toast.success("Landing actualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useAddSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lpId, body }: { lpId: string; body: Parameters<typeof landingService.addSection>[1] }) =>
      landingService.addSection(lpId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: landingKeys.all });
      toast.success("Sección agregada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, body }: { sectionId: string; body: Parameters<typeof landingService.updateSection>[1] }) =>
      landingService.updateSection(sectionId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: landingKeys.all });
      toast.success("Sección actualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sectionId: string) => landingService.deleteSection(sectionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: landingKeys.all });
      toast.success("Sección eliminada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useReorderSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lpId, sectionIds }: { lpId: string; sectionIds: string[] }) =>
      landingService.reorderSections(lpId, sectionIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: landingKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRenderHTML() {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const render = async (lpId: string) => {
    setLoading(true);
    try {
      const result = await landingService.renderHTML(lpId);
      setHtml(result);
    } catch {
      toast.error("Error rendering landing page");
      setHtml(null);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => setHtml(null);

  return { html, loading, render, clear };
}