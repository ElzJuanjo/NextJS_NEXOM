"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orgService } from "@/services/org.service";
import toast from "react-hot-toast";

export const orgKeys = {
  myOrg: ["org", "me"] as const,
  usage: ["org", "usage"] as const,
  list: ["org", "list"] as const,
};

export function useMyOrg() {
  return useQuery({
    queryKey: orgKeys.myOrg,
    queryFn: () => orgService.getMyOrg(),
    retry: (count, error) => {
      // 404 = user has no org yet → don't retry, treat as empty
      if (error instanceof Error && error.message.includes("404")) return false;
      return count < 2;
    },
  });
}

export function useOrgUsage() {
  return useQuery({
    queryKey: orgKeys.usage,
    queryFn: () => orgService.getUsage(),
  });
}

export function useOrgList() {
  return useQuery({
    queryKey: orgKeys.list,
    queryFn: () => orgService.list(),
  });
}

export function useCreateOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { name: string; slug: string; timezone?: string }) =>
      orgService.create(vars.name, vars.slug, vars.timezone),
    onSuccess: (data) => {
      qc.setQueryData(orgKeys.myOrg, data);
      qc.invalidateQueries({ queryKey: orgKeys.list });
      toast.success("Organización creada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; slug?: string; logo_url?: string; timezone?: string }) =>
      orgService.updateMyOrg(body),
    onSuccess: (data) => {
      qc.setQueryData(orgKeys.myOrg, data);
      toast.success("Organización actualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useChangePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan_type: string) => orgService.changePlan(plan_type),
    onSuccess: (data) => {
      qc.setQueryData(orgKeys.myOrg, data);
      qc.invalidateQueries({ queryKey: orgKeys.usage });
      qc.invalidateQueries({ queryKey: orgKeys.myOrg });
      qc.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plan actualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
