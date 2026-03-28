import apiClient from "@/lib/api-client";
import type { AuthResponse, AuthLoginResponse, UserResponse, VerifyEmailResponse, ReferralDetailInfo } from "@/types";

const BASE = "/api/v1/auth";

export const authService = {
  async register(email: string, full_name: string, password: string, referral_code?: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(`${BASE}/register`, {
      email, full_name, password, referral_code,
    });
    return data;
  },

  async login(email: string, password: string): Promise<AuthLoginResponse> {
    const { data } = await apiClient.post<AuthLoginResponse>(`${BASE}/login`, { email, password });
    return data;
  },

  async loginVerify2FA(temp_token: string, code: string): Promise<AuthLoginResponse> {
    const { data } = await apiClient.post<AuthLoginResponse>(`${BASE}/login/2fa`, { temp_token, code });
    return data;
  },

  async forgotPassword(email: string) {
    const { data } = await apiClient.post<{ message: string }>(`${BASE}/forgot-password`, { email });
    return data;
  },

  async resetPassword(token: string, new_password: string) {
    const { data } = await apiClient.post<{ message: string }>(`${BASE}/reset-password`, { token, new_password });
    return data;
  },

  async refresh(): Promise<{ access_token: string }> {
    const { data } = await apiClient.post<{ access_token: string }>(`${BASE}/refresh`);
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post(`${BASE}/logout`);
  },

  async me(): Promise<UserResponse> {
    const { data } = await apiClient.get<UserResponse>(`${BASE}/me`);
    return data;
  },

  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    const { data } = await apiClient.post<VerifyEmailResponse>(`${BASE}/verify-email`, { token });
    return data;
  },

  getGoogleLoginUrl(): string {
    return `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${BASE}/google/login`;
  },

  async changePassword(current_password: string, new_password: string) {
    const { data } = await apiClient.post<{ message: string }>(`${BASE}/change-password`, {
      current_password,
      new_password,
    });
    return data;
  },

  async setup2FA() {
    const { data } = await apiClient.post<{ secret: string; otpauth_url: string; qr_base64: string }>(`${BASE}/2fa/setup`);
    return data;
  },

  async verify2FA(code: string) {
    const { data } = await apiClient.post<{ message: string; is_2fa_enabled: boolean }>(`${BASE}/2fa/verify`, { code });
    return data;
  },

  async disable2FA(code: string) {
    const { data } = await apiClient.post<{ message: string; is_2fa_enabled: boolean }>(`${BASE}/2fa/disable`, { code });
    return data;
  },

  async getReferralInfo() {
    const { data } = await apiClient.get<ReferralDetailInfo>("/api/v1/auth/me/referral");
    return data;
  },

  async getVerificationStatus() {
    const { data } = await apiClient.get<{ is_verified: boolean; email: string; verification_expires_hours: number }>(
      "/api/v1/auth/me/verification-status"
    );
    return data;
  },

  async resendVerification(email: string) {
    const { data } = await apiClient.post("/api/v1/auth/resend-verification", { email });
    return data;
  },
};
