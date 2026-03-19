"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Zap, ArrowRight, Eye, EyeOff, Shield } from "lucide-react";
import { useLogin, useLoginVerify2FA } from "@/hooks/use-auth";
import { authService } from "@/services/auth.service";
import { useFadeIn } from "@/hooks/use-anime";
import { Spinner } from "@/components/ui/Spinner";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [code, setCode] = useState("");
  const login = useLogin();
  const verify2FA = useLoginVerify2FA();
  const containerRef = useFadeIn<HTMLDivElement>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    login.mutate(data, {
      onSuccess: (res) => {
        if (res.requires_2fa && res.temp_token) {
          setTempToken(res.temp_token);
          setTwoFAStep(true);
        }
      },
    });
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    verify2FA.mutate({ temp_token: tempToken, code });
  };

  const handleGoogle = () => {
    window.location.href = authService.getGoogleLoginUrl();
  };

  return (
    <div ref={containerRef} className="w-full max-w-sm relative z-10 opacity-0">
      <div className="flex flex-col items-center mb-8">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/25">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {twoFAStep ? "Verificación 2FA" : "Bienvenido de vuelta"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {twoFAStep ? "Ingresa el código de tu app de autenticación" : "Inicia sesión en tu workspace"}
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-xl shadow-black/20">
        {/* Error messages */}
        {login.isError && !twoFAStep && (
          <div className="mb-4 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {login.error?.message}
          </div>
        )}
        {verify2FA.isError && twoFAStep && (
          <div className="mb-4 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {verify2FA.error?.message}
          </div>
        )}

        {/* ── 2FA Step ── */}
        {twoFAStep ? (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <Shield className="w-7 h-7 text-violet-400" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Código de verificación</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoFocus
                className="w-full px-3 py-3 rounded-lg bg-secondary border border-border text-lg text-foreground text-center font-mono tracking-[0.5em] placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Abre Google Authenticator o Authy y escribe el código de 6 dígitos
              </p>
            </div>
            <button
              type="submit"
              disabled={verify2FA.isPending || code.length !== 6}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
            >
              {verify2FA.isPending ? (
                <Spinner className="w-4 h-4 text-primary-foreground" />
              ) : (
                <>
                  Verificar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setTwoFAStep(false); setTempToken(""); setCode(""); login.reset(); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              ← Volver al login
            </button>
          </form>
        ) : (
          /* ── Normal Login ── */
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="alex@empresa.com"
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 pr-10 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
              </div>

              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                type="submit"
                disabled={login.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
              >
                {login.isPending ? (
                  <Spinner className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <>
                    Iniciar sesión
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4">
              <div className="relative flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">o continúa con</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <button
                type="button"
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-secondary text-sm font-medium text-foreground hover:bg-secondary/80 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuar con Google
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Regístrate gratis
                </Link>
              </p>
            </div>
          </>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Al continuar aceptas los <span className="underline cursor-pointer">Términos de servicio</span>
      </p>
    </div>
  );
}