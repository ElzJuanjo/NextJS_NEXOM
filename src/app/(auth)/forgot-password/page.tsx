"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { useForgotPassword } from "@/hooks/use-auth";
import { useFadeIn } from "@/hooks/use-anime";
import { Spinner } from "@/components/ui/Spinner";
import { Logo } from "@/components/ui/Logo";

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
        <Logo size={64} className="mb-4" fit="contain" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Reset password</h1>
        <p className="text-sm text-muted-foreground mt-1">We&apos;ll send you a link to restore your access</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-xl shadow-black/20">
        {sent ? (
          <div className="text-center space-y-3">
            <Send className="w-10 h-10 text-violet-400 mx-auto" />
            <p className="text-sm text-foreground font-medium">Check your inbox</p>
            <p className="text-xs text-muted-foreground">If the email is registered, you&apos;ll receive instructions to recover your account. The link expires in 15 minutes.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={forgot.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
            >
              {forgot.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : "Send link"}
            </button>
          </form>
        )}

        <div className="mt-4 pt-4 border-t border-border text-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
