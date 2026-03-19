import apiClient from "@/lib/api-client";
import type { PlanResponse } from "@/types";

export const planService = {
  async list() {
    const { data } = await apiClient.get<PlanResponse[]>("/api/v1/plans");
    return data;
  },
};
