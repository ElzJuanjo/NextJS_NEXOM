import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { copyAssetService } from "@/services/copy-asset.service";
import type { CopyAssetResponse } from "@/types";
import toast from "react-hot-toast";

interface CopyAssetFilters {
    brand_id?: string;
    copy_type?: string;
    platform?: string;
    status?: string;
}

export const copyAssetKeys = {
    all: ["copy-assets"] as const,
    list: (filters?: CopyAssetFilters) => ["copy-assets", filters] as const,
};

export function useCopyAssets(filters?: CopyAssetFilters) {
    return useQuery({
        queryKey: copyAssetKeys.list(filters),
        queryFn: () => copyAssetService.list(filters),
    });
}

export function useCreateCopyAsset() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: copyAssetService.create,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: copyAssetKeys.all });
            toast.success("Copy asset creado");
        },
        onError: (err: Error) => toast.error(err.message),
    });
}

export function useUpdateCopyAsset() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: string; body: Parameters<typeof copyAssetService.update>[1] }) =>
            copyAssetService.update(id, body),
        onMutate: async ({ id, body }) => {
            await qc.cancelQueries({ queryKey: copyAssetKeys.all });

            const previousQueries = qc.getQueriesData<CopyAssetResponse[]>({ queryKey: copyAssetKeys.all });

            qc.setQueriesData<CopyAssetResponse[]>(
                { queryKey: copyAssetKeys.all },
                (old) => {
                    if (!old) return old;
                    return old.map((asset) =>
                        asset.id === id
                            ? { ...asset, ...Object.fromEntries(Object.entries(body).filter(([_, v]) => v !== undefined)) }
                            : asset,
                    );
                },
            );

            return { previousQueries };
        },
        onError: (err, _vars, context) => {
            if (context?.previousQueries) {
                for (const [queryKey, data] of context.previousQueries) {
                    qc.setQueryData(queryKey, data);
                }
            }
            toast.error(err instanceof Error ? err.message : "Error al actualizar");
        },
        onSettled: () => {
            // Refetch to ensure server state
            qc.invalidateQueries({ queryKey: copyAssetKeys.all });
        },
        onSuccess: () => {
            toast.success("Actualizado");
        },
    });
}

export function useDeleteCopyAsset() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => copyAssetService.remove(id),
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey: copyAssetKeys.all });

            const previousQueries = qc.getQueriesData<CopyAssetResponse[]>({ queryKey: copyAssetKeys.all });

            qc.setQueriesData<CopyAssetResponse[]>(
                { queryKey: copyAssetKeys.all },
                (old) => old?.filter((a) => a.id !== id),
            );

            return { previousQueries };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousQueries) {
                for (const [queryKey, data] of context.previousQueries) {
                    qc.setQueryData(queryKey, data);
                }
            }
            toast.error("Error al eliminar");
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: copyAssetKeys.all });
        },
        onSuccess: () => {
            toast.success("Copy asset eliminado");
        },
    });
}