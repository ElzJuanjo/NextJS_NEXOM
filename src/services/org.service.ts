import apiClient from "@/lib/api-client";
import type { OrganizationResponse, OrgUsage } from "@/types";

const BASE = "/api/v1/organizations";

export const orgService = {
  async create(name: string, slug: string, timezone = "America/Bogota") {
    const { data } = await apiClient.post<OrganizationResponse>(BASE, { name, slug, timezone });
    return data;
  },

  async getMyOrg() {
    const { data } = await apiClient.get<OrganizationResponse>(`${BASE}/me`);
    return data;
  },

  async updateMyOrg(body: { name?: string; slug?: string; logo_url?: string; timezone?: string }) {
    const { data } = await apiClient.patch<OrganizationResponse>(`${BASE}/me`, body);
    return data;
  },

  async changePlan(plan_type: string) {
    const { data } = await apiClient.patch<OrganizationResponse>(`${BASE}/me/plan`, { plan_type });
    return data;
  },

  async getUsage() {
    const { data } = await apiClient.get<OrgUsage>(`${BASE}/me/usage`);
    return data;
  },

  async list() {
    const { data } = await apiClient.get<{ organizations: OrganizationResponse[] }>(BASE);
    return data.organizations;
  },
};
