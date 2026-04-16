"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useResetPassword } from "@/hooks/use-auth";
import { useFadeIn } from "@/hooks/use-anime";
import { Spinner } from "@/components/ui/Spinner";
import { Logo } from "@/components/ui/Logo";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") ?? "";
    const resetPw = useResetPassword();
    const ref = useFadeIn<HTMLDivElement>();

    const [showPw, setShowPw] = useState(false);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [done, setDone] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) { toast.error("Mínimo 8 caracteres"); return; }
        if (password !== confirm) { toast.error("Las contraseñas no coinciden"); return; }
        if (!token) { toast.error("Token inválido. Solicita un nuevo enlace."); return; }
        resetPw.mutate({ token, new_password: password }, { onSuccess: () => setDone(true) });
    };

    return (
        <div ref={ref} className="w-full max-w-sm relative z-10 opacity-0">
            <div className="flex flex-col items-center mb-8">
                <Logo size={64} className="mb-4" fit="contain" />
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    {done ? "¡Listo!" : "Nueva contraseña"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {done ? "Tu contraseña ha sido restablecida" : "Escribe tu nueva contraseña"}
                </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl shadow-black/20">
                {resetPw.isError && (
                    <div className="mb-4 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                        {resetPw.error?.message}
                    </div>
                )}

                {done ? (
                    <div className="text-center space-y-4">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                        <p className="text-sm text-muted-foreground">Ya puedes iniciar sesión con tu nueva contraseña.</p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
                        >
                            Ir al login <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground block mb-1.5">Nueva contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPw ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mín. 8 caracteres"
                                    required
                                    minLength={8}
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
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground block mb-1.5">Confirmar contraseña</label>
                            <input
                                type="password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Repite tu contraseña"
                                required
                                minLength={8}
                                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={resetPw.isPending}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
                        >
                            {resetPw.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : "Restablecer contraseña"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}