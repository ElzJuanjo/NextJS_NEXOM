import apiClient from "@/lib/api-client";
import type { CopyAssetResponse } from "@/types";

const BASE = "/api/v1/copy-assets";

export const copyAssetService = {
    async list(params?: { brand_id?: string; copy_type?: string; platform?: string; status?: string }) {
        const { data } = await apiClient.get<{ assets: CopyAssetResponse[] }>(BASE, { params });
        return data.assets;
    },

    async getById(id: string) {
        const { data } = await apiClient.get<CopyAssetResponse>(`${BASE}/${id}`);
        return data;
    },

    async create(body: {
        brand_id?: string;
        product_id?: string;
        name: string;
        copy_type: string;
        content: string;
        platform?: string;
        tone?: string;
        status?: string;
        variations?: Array<{ content: string; order: number }>;
    }) {
        const { data } = await apiClient.post<CopyAssetResponse>(BASE, body);
        return data;
    },

    async update(id: string, body: Partial<{
        brand_id: string | null;
        product_id: string | null;
        name: string;
        copy_type: string;
        content: string;
        platform: string;
        tone: string;
        status: string;
        variations: Array<{ content: string; order: number }>;
    }>) {
        const { data } = await apiClient.patch<CopyAssetResponse>(`${BASE}/${id}`, body);
        return data;
    },

    async remove(id: string) {
        await apiClient.delete(`${BASE}/${id}`);
    },
};