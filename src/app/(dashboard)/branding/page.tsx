"use client";

import { useState } from "react";
import { Palette, Plus, Edit3, Trash2, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from "@/hooks/use-brands";
import { cn } from "@/lib/utils";
import type { BrandResponse } from "@/types";

export default function BrandingPage() {
  const { data: brands, isLoading } = useBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BrandResponse | null>(null);
  const [form, setForm] = useState({ name: "", tagline: "", tones: "", key_messages: "" });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", tagline: "", tones: "", key_messages: "" });
    setShowForm(true);
  };

  const openEdit = (b: BrandResponse) => {
    setEditing(b);
    setForm({
      name: b.name,
      tagline: b.tagline ?? "",
      tones: b.tones?.join(", ") ?? "",
      key_messages: b.key_messages?.join(", ") ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      tagline: form.tagline || undefined,
      tones: form.tones ? form.tones.split(",").map((s) => s.trim()) : undefined,
      key_messages: form.key_messages ? form.key_messages.split(",").map((s) => s.trim()) : undefined,
    };
    if (editing) {
      updateBrand.mutate({ id: editing.id, ...payload }, { onSuccess: () => setShowForm(false) });
    } else {
      createBrand.mutate(payload, { onSuccess: () => setShowForm(false) });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Gestión de Marca" subtitle="Identidad de marca e IA de branding" action={{ label: "Nueva marca", onClick: openCreate }} />

      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : !brands?.length ? (
          <EmptyState
            icon={Palette}
            title="Sin marcas aún"
            description="Crea tu primera marca para comenzar a generar identidad visual, copywriting y campañas con IA."
            action={{ label: "Crear marca", onClick: openCreate }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <div key={brand.id} className="bg-card border border-border rounded-xl p-5 space-y-3 group animate-fade-in">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{brand.name}</h3>
                    {brand.tagline && <p className="text-xs text-muted-foreground mt-0.5">{brand.tagline}</p>}
                  </div>
                  <StatusBadge status={brand.status} />
                </div>

                {brand.color_palette && (
                  <div className="flex gap-1.5">
                    {Object.values(brand.color_palette).slice(0, 5).map((color, i) => (
                      <div key={i} className="w-6 h-6 rounded-md border border-border" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                )}

                {brand.tones && (
                  <div className="flex flex-wrap gap-1">
                    {brand.tones.map((tone) => (
                      <span key={tone} className="text-xs px-2 py-0.5 rounded-full bg-pink-400/10 text-pink-400 border border-pink-400/20">
                        {tone}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(brand)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Edit3 className="w-3 h-3" /> Editar
                  </button>
                  <button
                    onClick={() => { if (confirm("¿Eliminar marca?")) deleteBrand.mutate(brand.id); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Editar marca" : "Nueva marca"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Nombre</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Tagline</label>
            <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Tonos (separados por coma)</label>
            <input value={form.tones} onChange={(e) => setForm({ ...form, tones: e.target.value })} placeholder="profesional, amigable"
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Mensajes clave (separados por coma)</label>
            <input value={form.key_messages} onChange={(e) => setForm({ ...form, key_messages: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
          </div>
          <button type="submit" disabled={createBrand.isPending || updateBrand.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
            {(createBrand.isPending || updateBrand.isPending) ? <Spinner className="w-4 h-4 text-primary-foreground" /> : editing ? "Guardar cambios" : "Crear marca"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
