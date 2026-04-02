"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Palette, Plus, Edit3, Trash2, Type, Eye, LayoutTemplate } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import {
  useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand,
  useBrandTemplates, useCreateBrandFromTemplate,
} from "@/hooks/use-brands";
import type { BrandResponse } from "@/types";
import type { BrandTemplate } from "@/services/brand.service";

const DEFAULT_COLORS = { primary: "#6D28D9", secondary: "#1E1B4B", accent: "#A78BFA", background: "#ffffff", text: "#111827" };
const DEFAULT_TYPO = { heading_font: "Plus Jakarta Sans", body_font: "Inter" };

export default function BrandingPage() {
  const router = useRouter();
  const { data: brands, isLoading } = useBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();
  const { data: templates } = useBrandTemplates();
  const createFromTemplate = useCreateBrandFromTemplate();

  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editing, setEditing] = useState<BrandResponse | null>(null);
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    tones: "",
    key_messages: "",
    primary: DEFAULT_COLORS.primary,
    secondary: DEFAULT_COLORS.secondary,
    accent: DEFAULT_COLORS.accent,
    background: DEFAULT_COLORS.background,
    text: DEFAULT_COLORS.text,
    heading_font: DEFAULT_TYPO.heading_font,
    body_font: DEFAULT_TYPO.body_font,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "", tagline: "", tones: "", key_messages: "",
      ...DEFAULT_COLORS, heading_font: DEFAULT_TYPO.heading_font, body_font: DEFAULT_TYPO.body_font,
    });
    setShowForm(true);
  };

  const openEdit = (b: BrandResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    const cp = (b.color_palette || {}) as Record<string, string>;
    const tp = (b.typography || {}) as Record<string, string>;
    setEditing(b);
    setForm({
      name: b.name,
      tagline: b.tagline ?? "",
      tones: b.tones?.join(", ") ?? "",
      key_messages: b.key_messages?.join(", ") ?? "",
      primary: cp.primary || DEFAULT_COLORS.primary,
      secondary: cp.secondary || DEFAULT_COLORS.secondary,
      accent: cp.accent || DEFAULT_COLORS.accent,
      background: cp.background || DEFAULT_COLORS.background,
      text: cp.text || DEFAULT_COLORS.text,
      heading_font: tp.heading_font || DEFAULT_TYPO.heading_font,
      body_font: tp.body_font || DEFAULT_TYPO.body_font,
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
      color_palette: { primary: form.primary, secondary: form.secondary, accent: form.accent, background: form.background, text: form.text },
      typography: { heading_font: form.heading_font, body_font: form.body_font },
    };
    if (editing) {
      updateBrand.mutate({ id: editing.id, ...payload }, { onSuccess: () => setShowForm(false) });
    } else {
      createBrand.mutate(payload, { onSuccess: () => setShowForm(false) });
    }
  };

  const handleTemplateSelect = (t: BrandTemplate) => {
    createFromTemplate.mutate(t.id, { onSuccess: () => setShowTemplates(false) });
  };

  const colorField = (label: string, key: "primary" | "secondary" | "accent" | "background" | "text") => (
    <div className="flex items-center gap-2">
      <input type="color" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-8 h-8 rounded-md border border-border cursor-pointer bg-transparent p-0" />
      <div className="flex-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full px-2 py-1 rounded bg-secondary border border-border text-xs text-foreground outline-none focus:border-ring" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <Header title="Gestión de Marca" subtitle="Identidad de marca e IA de branding" action={{ label: "Nueva marca", onClick: openCreate }} />

      <div className="flex-1 p-6">
        {/* Action buttons */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
            <LayoutTemplate className="w-3.5 h-3.5" /> Desde template
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : !brands?.length ? (
          <EmptyState icon={Palette} title="Sin marcas aún"
            description="Crea tu primera marca para comenzar a generar identidad visual, copywriting y campañas con IA."
            action={{ label: "Crear marca", onClick: openCreate }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <div key={brand.id}
                onClick={() => router.push(`/branding/${brand.id}`)}
                className="bg-card border border-border rounded-xl p-5 space-y-3 group animate-fade-in cursor-pointer hover:border-ring/50 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Logo placeholder */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        backgroundColor: brand.color_palette?.primary || "#6D28D9",
                        color: "#fff",
                      }}>
                      {brand.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{brand.name}</h3>
                      {brand.tagline && <p className="text-xs text-muted-foreground mt-0.5">{brand.tagline}</p>}
                    </div>
                  </div>
                  <StatusBadge status={brand.status} />
                </div>

                {brand.color_palette && (
                  <div className="flex gap-1.5">
                    {Object.entries(brand.color_palette).slice(0, 5).map(([key, color]) => (
                      <div key={key} className="group/color relative">
                        <div className="w-7 h-7 rounded-lg border border-border shadow-sm" style={{ backgroundColor: color }} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] bg-popover text-popover-foreground px-1.5 py-0.5 rounded border border-border opacity-0 group-hover/color:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {key}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {brand.typography && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Type className="w-3 h-3" />
                    <span>{(brand.typography as Record<string, string>).heading_font || "Inter"}</span>
                    <span className="opacity-40">/</span>
                    <span>{(brand.typography as Record<string, string>).body_font || "Inter"}</span>
                  </div>
                )}

                {brand.tones && brand.tones.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {brand.tones.slice(0, 4).map((tone) => (
                      <span key={tone} className="text-xs px-2 py-0.5 rounded-full bg-pink-400/10 text-pink-400 border border-pink-400/20">
                        {tone}
                      </span>
                    ))}
                    {brand.tones.length > 4 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        +{brand.tones.length - 4}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">Estado:</span>
                    <select
                      value={brand.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateBrand.mutate({ id: brand.id, status: e.target.value });
                      }}
                      className="px-2 py-1 rounded-md bg-secondary border border-border text-[11px] text-foreground outline-none focus:border-ring transition-all cursor-pointer"
                    >
                      <option value="draft">Draft</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/branding/${brand.id}`); }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Eye className="w-3 h-3" /> Ver
                    </button>
                    <button onClick={(e) => openEdit(brand, e)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Edit3 className="w-3 h-3" /> Editar
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); if (confirm("¿Eliminar marca?")) deleteBrand.mutate(brand.id); }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3 h-3" /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Brand Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Editar marca" : "Nueva marca"}>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
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
            <label className="text-sm font-medium text-foreground block mb-2">Paleta de colores</label>
            <div className="grid grid-cols-2 gap-3">
              {colorField("Primario", "primary")}
              {colorField("Secundario", "secondary")}
              {colorField("Acento", "accent")}
              {colorField("Fondo", "background")}
              {colorField("Texto", "text")}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Tipografía</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Títulos</span>
                <select value={form.heading_font} onChange={(e) => setForm({ ...form, heading_font: e.target.value })}
                  className="w-full px-2 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground outline-none focus:border-ring">
                  {["Plus Jakarta Sans", "Inter", "Montserrat", "Poppins", "Raleway", "Playfair Display", "Roboto", "Lato", "Open Sans", "DM Sans"].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Cuerpo</span>
                <select value={form.body_font} onChange={(e) => setForm({ ...form, body_font: e.target.value })}
                  className="w-full px-2 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground outline-none focus:border-ring">
                  {["Inter", "Plus Jakarta Sans", "Roboto", "Open Sans", "Lato", "Nunito", "Source Sans Pro", "DM Sans", "Work Sans", "Manrope"].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
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

      {/* Templates Modal */}
      <Modal open={showTemplates} onClose={() => setShowTemplates(false)} title="Templates de Marca" className="max-w-lg">
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          {templates?.map((t) => (
            <button key={t.id} onClick={() => handleTemplateSelect(t)}
              disabled={createFromTemplate.isPending}
              className="w-full text-left bg-secondary border border-border rounded-xl p-4 hover:border-ring/50 transition-all disabled:opacity-60 group">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{t.name}</h4>
                  <p className="text-xs text-muted-foreground">{t.industry}</p>
                </div>
                <div className="flex gap-1">
                  {Object.values(t.color_palette).slice(0, 4).map((color, i) => (
                    <div key={i} className="w-5 h-5 rounded-md border border-border" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {t.tones.slice(0, 3).map((tone) => (
                  <span key={tone} className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-400/10 text-pink-400 border border-pink-400/20">
                    {tone}
                  </span>
                ))}
              </div>
            </button>
          ))}
          {!templates?.length && (
            <p className="text-sm text-muted-foreground text-center py-8">No hay templates disponibles.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}