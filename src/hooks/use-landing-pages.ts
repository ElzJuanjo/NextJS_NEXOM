"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { landingService } from "@/services/landing.service";
import toast from "react-hot-toast";

export const landingKeys = {
  list: (brandId: string) => ["landing-pages", brandId] as const,
};

export function useLandingPages(brandId: string) {
  return useQuery({
    queryKey: landingKeys.list(brandId),
    queryFn: () => landingService.list(brandId),
    enabled: !!brandId,
  });
}

export function useCreateLanding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: landingService.create,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: landingKeys.list(vars.brand_id) });
      toast.success("Landing page creada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteLanding(brandId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => landingService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: landingKeys.list(brandId) });
      toast.success("Landing eliminada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
