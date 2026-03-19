"use client";

import { useState } from "react";
import { User, Building2, CreditCard, Check, Copy, Users, Gift, Shield, Key, Smartphone, Eye, EyeOff } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useMyOrg, useUpdateOrg, useOrgUsage, useChangePlan } from "@/hooks/use-org";
import { usePlans } from "@/hooks/use-plans";
import { Spinner } from "@/components/ui/Spinner";
import { cn, formatCredits, formatCurrency } from "@/lib/utils";
import { CreditUsage } from "@/components/dashboard/CreditUsage";
import { Skeleton } from "@/components/ui/Skeleton";

import { useMe, useChangePassword, useSetup2FA, useVerify2FA, useDisable2FA, useReferral } from "@/hooks/use-auth";
import toast from "react-hot-toast";

const tabs = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "organization", label: "Organización", icon: Building2 },
  { id: "billing", label: "Planes", icon: CreditCard },
  { id: "security", label: "Seguridad", icon: Shield },
];

function ReferralCard() {
  const { data: referral, isLoading } = useReferral();

  const copyLink = () => {
    if (referral?.referral_link) {
      navigator.clipboard.writeText(referral.referral_link);
      toast.success("Link copiado al portapapeles");
    }
  };

  if (isLoading) return <Skeleton className="h-36 w-full rounded-xl" />;
  if (!referral) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="w-4 h-4 text-violet-400" />
        <h3 className="text-base font-semibold text-foreground">Programa de referidos</h3>
      </div>

      <div className="flex items-center gap-3 bg-secondary rounded-lg p-3">
        <input
          readOnly
          value={referral.referral_link}
          className="flex-1 bg-transparent text-sm text-foreground outline-none truncate"
        />
        <button
          onClick={copyLink}
          className="shrink-0 p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="Copiar link"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs text-muted-foreground">Tu código</p>
          <p className="text-sm font-mono font-semibold text-foreground">{referral.referral_code}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Referidos</p>
          <p className="text-sm font-semibold text-foreground flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-violet-400" />
            {referral.total_referrals}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Comparte tu link y cuando alguien se registre, aparecerá en tus estadísticas.
      </p>
    </div>
  );
}

function ChangePasswordCard() {
  const [show, setShow] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const changePw = useChangePassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_password !== form.confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    changePw.mutate(
      { current_password: form.current_password, new_password: form.new_password },
      { onSuccess: () => { setForm({ current_password: "", new_password: "", confirm: "" }); setShow(false); } }
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400" />
          <h3 className="text-base font-semibold text-foreground">Contraseña</h3>
        </div>
        <button onClick={() => setShow(!show)}
          className="text-xs text-primary hover:underline font-medium">
          {show ? "Cancelar" : "Cambiar contraseña"}
        </button>
      </div>

      {!show ? (
        <p className="text-sm text-muted-foreground">Cambia tu contraseña periódicamente para mantener tu cuenta segura.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Contraseña actual</label>
            <div className="relative">
              <input type={showCurrent ? "text" : "password"} value={form.current_password}
                onChange={(e) => setForm({ ...form, current_password: e.target.value })} required
                className="w-full px-3 py-2.5 pr-10 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Nueva contraseña</label>
            <div className="relative">
              <input type={showNew ? "text" : "password"} value={form.new_password}
                onChange={(e) => setForm({ ...form, new_password: e.target.value })} required minLength={8}
                className="w-full px-3 py-2.5 pr-10 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Confirmar nueva contraseña</label>
            <input type="password" value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })} required minLength={8}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
          </div>
          <button type="submit" disabled={changePw.isPending}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60">
            {changePw.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : "Actualizar contraseña"}
          </button>
        </form>
      )}
    </div>
  );
}

function TwoFactorCard() {
  const { data: user } = useMe();
  const setup2FA = useSetup2FA();
  const verify2FA = useVerify2FA();
  const disable2FA = useDisable2FA();
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [showDisable, setShowDisable] = useState(false);

  const is2FAEnabled = user?.is_2fa_enabled ?? false;

  const handleSetup = () => {
    setup2FA.mutate();
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    verify2FA.mutate(code, { onSuccess: () => { setCode(""); setup2FA.reset(); } });
  };

  const handleDisable = (e: React.FormEvent) => {
    e.preventDefault();
    if (disableCode.length !== 6) return;
    disable2FA.mutate(disableCode, { onSuccess: () => { setDisableCode(""); setShowDisable(false); } });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-violet-400" />
          <h3 className="text-base font-semibold text-foreground">Autenticación de dos factores</h3>
        </div>
        {is2FAEnabled ? (
          <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <Shield className="w-3 h-3" /> Activado
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Desactivado</span>
        )}
      </div>

      {is2FAEnabled ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tu cuenta está protegida con autenticación de dos factores via Google Authenticator.
          </p>
          {!showDisable ? (
            <button onClick={() => setShowDisable(true)}
              className="text-xs text-destructive hover:underline font-medium">
              Desactivar 2FA
            </button>
          ) : (
            <form onSubmit={handleDisable} className="space-y-3 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
              <p className="text-xs text-destructive font-medium">Ingresa un código de tu app para confirmar la desactivación:</p>
              <div className="flex gap-2">
                <input type="text" value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000" maxLength={6}
                  className="w-32 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground text-center font-mono tracking-widest outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
                <button type="submit" disabled={disable2FA.isPending || disableCode.length !== 6}
                  className="px-3 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90 disabled:opacity-40">
                  {disable2FA.isPending ? <Spinner className="w-3 h-3" /> : "Confirmar"}
                </button>
                <button type="button" onClick={() => { setShowDisable(false); setDisableCode(""); }}
                  className="px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Agrega una capa extra de seguridad usando Google Authenticator, Authy u otra app compatible con TOTP.
          </p>

          {!setup2FA.data ? (
            <button onClick={handleSetup} disabled={setup2FA.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2">
              {setup2FA.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : <><Smartphone className="w-4 h-4" /> Configurar 2FA</>}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="bg-white p-2 rounded-xl shrink-0">
                  <img src={setup2FA.data.qr_base64} alt="QR Code 2FA" className="w-48 h-48" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-foreground font-medium">Escanea el código QR con tu app:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Abre Google Authenticator o Authy</li>
                    <li>Toca el botón + para agregar cuenta</li>
                    <li>Escanea el código QR</li>
                    <li>Ingresa el código de 6 dígitos abajo</li>
                  </ol>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Clave manual (si no puedes escanear):</p>
                    <code className="text-xs bg-muted border border-border px-2 py-1 rounded font-mono text-pink-600 dark:text-pink-400 select-all">
                      {setup2FA.data.secret}
                    </code>
                  </div>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-3">
                <label className="text-sm font-medium text-foreground block">Código de verificación</label>
                <div className="flex gap-2">
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000" maxLength={6}
                    className="w-40 px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground text-center font-mono tracking-widest outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
                  <button type="submit" disabled={verify2FA.isPending || code.length !== 6}
                    className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40">
                    {verify2FA.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : "Activar 2FA"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { data: user } = useMe();
  const { data: org } = useMyOrg();
  const { data: usage } = useOrgUsage();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const updateOrg = useUpdateOrg();
  const changePlan = useChangePlan();

  const [orgForm, setOrgForm] = useState({ name: "", slug: "", timezone: "" });

  // Sync form when org loads
  const syncOrgForm = () => {
    if (org && !orgForm.name) {
      setOrgForm({ name: org.name, slug: org.slug, timezone: org.timezone });
    }
  };
  syncOrgForm();

  return (
    <div className="flex flex-col h-full">
      <Header title="Configuración" subtitle="Gestiona tu cuenta y preferencias" />

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tabs */}
          <div className="space-y-1">
            {tabs.map((tab, idx) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                  activeTab === tab.id ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )} style={{ animationDelay: `${idx * 60}ms` }}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === "profile" && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h3 className="text-base font-semibold text-foreground">Perfil de usuario</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                      {user?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{user?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {user?.is_verified ? (
                          <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Verificado</span>
                        ) : (
                          <span className="text-xs text-amber-400">Email no verificado</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <ReferralCard />
              </div>
            )}

            {activeTab === "organization" && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h3 className="text-base font-semibold text-foreground">Organización</h3>
                  <form onSubmit={(e) => { e.preventDefault(); updateOrg.mutate({ name: orgForm.name, slug: orgForm.slug, timezone: orgForm.timezone }); }} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Nombre</label>
                      <input value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Slug</label>
                      <input value={orgForm.slug} onChange={(e) => setOrgForm({ ...orgForm, slug: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Zona horaria</label>
                      <input value={orgForm.timezone} onChange={(e) => setOrgForm({ ...orgForm, timezone: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
                    </div>
                    <button type="submit" disabled={updateOrg.isPending}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60">
                      {updateOrg.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : "Guardar cambios"}
                    </button>
                  </form>
                </div>
                <CreditUsage />
              </div>
            )}

            {activeTab === "billing" && (
              <div className="space-y-6 animate-fade-in">
                <CreditUsage />
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-base font-semibold text-foreground mb-4">Planes disponibles</h3>
                  {plansLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="space-y-3"><Skeleton className="h-32 w-full" /></div>)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {plans?.map((plan) => {
                        const isCurrent = org?.plan?.plan_type === plan.plan_type;
                        return (
                          <div key={plan.id} className={cn("border rounded-xl p-5 space-y-3 transition-all",
                            isCurrent ? "border-violet-500/50 bg-violet-500/5 glow-purple" : "border-border hover:border-border/80")}>
                            <div>
                              <h4 className="text-sm font-bold text-foreground capitalize">{plan.name}</h4>
                              <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(plan.price_monthly_usd)}<span className="text-xs text-muted-foreground font-normal">/mes</span></p>
                            </div>
                            <div className="space-y-1.5 text-xs text-muted-foreground">
                              <p>{formatCredits(plan.max_credits_per_month)} créditos/mes</p>
                              <p>{plan.max_agents} agentes máx.</p>
                              {plan.has_api_access && <p className="text-emerald-400">Acceso API incluido</p>}
                            </div>
                            {isCurrent ? (
                              <div className="px-3 py-2 rounded-lg bg-violet-400/10 text-violet-400 text-xs font-medium text-center border border-violet-400/20">Plan actual</div>
                            ) : (
                              <button onClick={() => changePlan.mutate(plan.plan_type)} disabled={changePlan.isPending}
                                className="w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all disabled:opacity-60">
                                {changePlan.isPending ? <Spinner className="w-3 h-3 text-primary-foreground mx-auto" /> : "Cambiar plan"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6 animate-fade-in">
                <ChangePasswordCard />
                <TwoFactorCard />
                <div className="bg-card border border-border rounded-xl p-6 space-y-2">
                  <h3 className="text-base font-semibold text-foreground">Sesiones</h3>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-foreground">Sesión actual</span>
                    <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Activa</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Tu sesión se mantiene activa de forma segura gracias al uso de cookies.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
