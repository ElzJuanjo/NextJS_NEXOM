import apiClient from "@/lib/api-client";
import type { AuthResponse, AuthLoginResponse, UserResponse, VerifyEmailResponse, ReferralInfo } from "@/types";

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

  async resendVerification(email: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>(`${BASE}/resend-verification`, { email });
    return data;
  },

  getGoogleLoginUrl(): string {
    return `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${BASE}/google/login`;
  },

  async getReferralInfo(): Promise<ReferralInfo> {
    const { data } = await apiClient.get<ReferralInfo>(`${BASE}/me/referral`);
    return data;
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
};
