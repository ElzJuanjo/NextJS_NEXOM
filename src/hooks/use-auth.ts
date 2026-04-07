"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { setAccessToken } from "@/lib/api-client";
import { storeAccessToken, clearAccessToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export const authKeys = {
  me: ["auth", "me"] as const,
  referral: ["auth", "referral"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => authService.me(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: (data) => {
      if (data.requires_2fa) {
        // Don't set tokens yet — 2FA step needed
        return;
      }
      if (data.tokens) {
        setAccessToken(data.tokens.access_token);
        storeAccessToken(data.tokens.access_token);
      }
      if (data.user) {
        qc.setQueryData(authKeys.me, data.user);
      }
      toast.success("Sesión iniciada");
      router.push("/dashboard");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useLoginVerify2FA() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ temp_token, code }: { temp_token: string; code: string }) =>
      authService.loginVerify2FA(temp_token, code),
    onSuccess: (data) => {
      if (data.tokens) {
        setAccessToken(data.tokens.access_token);
        storeAccessToken(data.tokens.access_token);
      }
      if (data.user) {
        qc.setQueryData(authKeys.me, data.user);
      }
      toast.success("Sesión iniciada");
      router.push("/dashboard");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
    onSuccess: (data) => toast.success(data.message),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, new_password }: { token: string; new_password: string }) =>
      authService.resetPassword(token, new_password),
    onSuccess: (data) => toast.success(data.message),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (vars: { full_name: string; email: string; password: string; referral_code?: string }) =>
      authService.register(vars.email, vars.full_name, vars.password, vars.referral_code),
    onSuccess: (data) => {
      setAccessToken(data.tokens.access_token);
      storeAccessToken(data.tokens.access_token);
      qc.setQueryData(authKeys.me, data.user);
      toast.success("Cuenta creada exitosamente");
      router.push("/dashboard");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      setAccessToken(null);
      clearAccessToken();
      qc.clear();
      router.push("/login");
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
    onSuccess: (data) => toast.success(data.message),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ current_password, new_password }: { current_password: string; new_password: string }) =>
      authService.changePassword(current_password, new_password),
    onSuccess: (data) => toast.success(data.message),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSetup2FA() {
  return useMutation({
    mutationFn: () => authService.setup2FA(),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useVerify2FA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => authService.verify2FA(code),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: authKeys.me });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDisable2FA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => authService.disable2FA(code),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: authKeys.me });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useVerificationStatus() {
  return useQuery({
    queryKey: ["auth", "verification-status"],
    queryFn: () => authService.getVerificationStatus(),
  });
}

export function useReferralInfo() {
  return useQuery({
    queryKey: ["auth", "referral"],
    queryFn: () => authService.getReferralInfo(),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) => authService.resendVerification(email),
    onSuccess: () => toast.success("Verification email sent!"),
    onError: (err: Error) => toast.error(err.message),
  });
}