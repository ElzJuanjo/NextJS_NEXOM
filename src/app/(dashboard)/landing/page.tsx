"use client";

import { useState } from "react";
import { Layout, Plus, Eye, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useBrands } from "@/hooks/use-brands";
import { useLandingPages, useCreateLanding, useDeleteLanding } from "@/hooks/use-landing-pages";
import { formatRelativeTime } from "@/lib/utils";

export default function LandingPage() {
  const { data: brands } = useBrands();
  const firstBrand = brands?.[0];
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const activeBrandId = selectedBrandId || firstBrand?.id || "";

  const { data: pages, isLoading } = useLandingPages(activeBrandId);
  const createLanding = useCreateLanding();
  const deleteLanding = useDeleteLanding(activeBrandId);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", campaign: "" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBrandId) return;
    createLanding.mutate({ brand_id: activeBrandId, name: form.name, campaign: form.campaign || undefined }, { onSuccess: () => { setShowCreate(false); setForm({ name: "", campaign: "" }); } });
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Landing Pages" subtitle="Diseña y gestiona landing pages de venta" action={{ label: "Nueva landing", onClick: () => setShowCreate(true) }} />

      <div className="flex-1 p-6 space-y-4">
        {brands && brands.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-2">
            <span className="text-xs text-muted-foreground shrink-0">Marca:</span>
            {brands.map((b) => (
              <button key={b.id} onClick={() => setSelectedBrandId(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all ${activeBrandId === b.id ? "text-amber-400 bg-amber-400/10 border-amber-400/20" : "border-border text-muted-foreground hover:bg-accent"}`}>
                {b.name}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : !pages?.length ? (
          <EmptyState icon={Layout} title="Sin landing pages" description="Crea tu primera landing page para comenzar a convertir tráfico en ventas." action={{ label: "Crear landing", onClick: () => setShowCreate(true) }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((lp) => (
              <div key={lp.id} className="bg-card border border-border rounded-xl p-5 space-y-3 animate-fade-in group">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{lp.name}</h3>
                    {lp.campaign && <p className="text-xs text-muted-foreground mt-0.5">{lp.campaign}</p>}
                  </div>
                  <StatusBadge status={lp.status} />
                </div>
                <p className="text-xs text-muted-foreground">{lp.sections.length} secciones · {formatRelativeTime(lp.created_at)}</p>
                {lp.published_url && (
                  <a href={lp.published_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Ver publicada
                  </a>
                )}
                <div className="flex gap-2 pt-2 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { if (confirm("¿Eliminar?")) deleteLanding.mutate(lp.id); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3 h-3" /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva landing page">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Nombre</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Campaña (opcional)</label>
            <input value={form.campaign} onChange={(e) => setForm({ ...form, campaign: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
          </div>
          <button type="submit" disabled={createLanding.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
            {createLanding.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : "Crear landing"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
