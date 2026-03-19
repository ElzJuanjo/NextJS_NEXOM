import apiClient from "@/lib/api-client";
import type { ProductResponse } from "@/types";

const BASE = "/api/v1/products";

export const productService = {
  async list() {
    const { data } = await apiClient.get<{ products: ProductResponse[] }>(BASE);
    return data.products;
  },

  async create(body: {
    name: string;
    brand_id?: string;
    description?: string;
    sku?: string;
    price_usd?: number;
    image_url?: string;
    dropi_product_id?: string;
    extra_data?: Record<string, unknown>;
  }) {
    const { data } = await apiClient.post<ProductResponse>(BASE, body);
    return data;
  },

  async update(productId: string, body: Partial<{
    name: string;
    brand_id: string;
    description: string;
    sku: string;
    price_usd: number;
    image_url: string;
    is_active: boolean;
    dropi_product_id: string;
    extra_data: Record<string, unknown>;
  }>) {
    const { data } = await apiClient.patch<ProductResponse>(`${BASE}/${productId}`, body);
    return data;
  },

  async remove(productId: string) {
    await apiClient.delete(`${BASE}/${productId}`);
  },
};
