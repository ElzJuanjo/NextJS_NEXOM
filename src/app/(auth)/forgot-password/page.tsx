"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, ArrowLeft, Send } from "lucide-react";
import { useForgotPassword } from "@/hooks/use-auth";
import { useFadeIn } from "@/hooks/use-anime";
import { Spinner } from "@/components/ui/Spinner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const forgot = useForgotPassword();
  const ref = useFadeIn<HTMLDivElement>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    forgot.mutate(email.trim(), { onSuccess: () => setSent(true) });
  };

  return (
    <div ref={ref} className="w-full max-w-sm relative z-10 opacity-0">
      <div className="flex flex-col items-center mb-8">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/25">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Recuperar contraseña</h1>
        <p className="text-sm text-muted-foreground mt-1">Te enviaremos un enlace para restablecer tu acceso</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-xl shadow-black/20">
        {sent ? (
          <div className="text-center space-y-3">
            <Send className="w-10 h-10 text-violet-400 mx-auto" />
            <p className="text-sm text-foreground font-medium">Revisa tu bandeja de entrada</p>
            <p className="text-xs text-muted-foreground">Si el email está registrado, recibirás instrucciones para recuperar tu cuenta. El enlace expira en 15 minutos.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@empresa.com"
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={forgot.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
            >
              {forgot.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : "Enviar enlace"}
            </button>
          </form>
        )}

        <div className="mt-4 pt-4 border-t border-border text-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}