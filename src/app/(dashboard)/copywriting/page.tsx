"use client";

import { useState } from "react";
import {
  PenLine, Trash2, Edit3, Copy, Filter, Search, X,
  Megaphone, Mail, MessageSquare, Type, MousePointerClick, FileText,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useBrands } from "@/hooks/use-brands";
import { useProducts } from "@/hooks/use-products";
import {
  useCopyAssets, useCreateCopyAsset, useUpdateCopyAsset, useDeleteCopyAsset,
} from "@/hooks/use-copy-assets";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { CopyAssetResponse } from "@/types";

// ── Constants ───────────────────────────────────────────────────────────────

const COPY_TYPES = [
  { id: "headline", label: "Headline", icon: Type, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  { id: "ad", label: "Ad Copy", icon: Megaphone, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
  { id: "email", label: "Email", icon: Mail, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  { id: "social", label: "Social", icon: MessageSquare, color: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/20" },
  { id: "cta", label: "CTA", icon: MousePointerClick, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  { id: "body", label: "Body Copy", icon: FileText, color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/20" },
];

const PLATFORMS = [
  { id: "meta_ads", label: "Meta Ads" },
  { id: "google_ads", label: "Google Ads" },
  { id: "tiktok_ads", label: "TikTok Ads" },
  { id: "instagram", label: "Instagram" },
  { id: "landing_page", label: "Landing Page" },
  { id: "email_marketing", label: "Email Marketing" },
];

const STATUSES = [
  { id: "draft", label: "Draft" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

function getCopyTypeMeta(type: string) {
  return COPY_TYPES.find((t) => t.id === type) || COPY_TYPES[5]; // default to body
}

function getPlatformLabel(platform: string | null) {
  if (!platform) return null;
  return PLATFORMS.find((p) => p.id === platform)?.label || platform;
}

// ── Page Component ──────────────────────────────────────────────────────────

export default function CopywritingPage() {
  const { data: brands } = useBrands();
  const { data: products } = useProducts();

  // Filters
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterPlatform, setFilterPlatform] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterBrand, setFilterBrand] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filters = {
    copy_type: filterType,
    platform: filterPlatform,
    status: filterStatus,
    brand_id: filterBrand,
  };

  const { data: assets, isLoading } = useCopyAssets(filters);
  const createAsset = useCreateCopyAsset();
  const updateAsset = useUpdateCopyAsset();
  const deleteAsset = useDeleteCopyAsset();

  // Create / Edit state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CopyAssetResponse | null>(null);
  const [form, setForm] = useState({
    name: "",
    copy_type: "body",
    platform: "",
    tone: "",
    content: "",
    status: "draft",
    brand_id: "",
    product_id: "",
  });

  // Expanded card for viewing full content
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Active filter count (for badge)
  const activeFilterCount = [filterType, filterPlatform, filterStatus, filterBrand].filter(Boolean).length;

  // Search filter (client-side on top of server filters)
  const filteredAssets = assets?.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      (a.tone && a.tone.toLowerCase().includes(q))
    );
  });

  // ── Handlers ────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "", copy_type: "body", platform: "", tone: "", content: "", status: "draft", brand_id: "", product_id: "",
    });
    setShowForm(true);
  };

  const openEdit = (asset: CopyAssetResponse) => {
    setEditing(asset);
    setForm({
      name: asset.name,
      copy_type: asset.copy_type,
      platform: asset.platform || "",
      tone: asset.tone || "",
      content: asset.content,
      status: asset.status,
      brand_id: asset.brand_id || "",
      product_id: asset.product_id || "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      name: form.name,
      copy_type: form.copy_type,
      content: form.content,
      status: form.status,
      platform: form.platform || null,
      tone: form.tone || null,
      brand_id: form.brand_id || null,
      product_id: form.product_id || null,
    };

    if (editing) {
      updateAsset.mutate(
        { id: editing.id, body: payload },
        { onSuccess: () => setShowForm(false) },
      );
    } else {
      // Para create, eliminar campos null opcionales que el backend no espera
      const createPayload = { ...payload };
      if (!createPayload.platform) delete createPayload.platform;
      if (!createPayload.tone) delete createPayload.tone;
      if (!createPayload.brand_id) delete createPayload.brand_id;
      if (!createPayload.product_id) delete createPayload.product_id;
      createAsset.mutate(createPayload as any, { onSuccess: () => setShowForm(false) });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar este copy asset permanentemente?")) {
      deleteAsset.mutate(id);
      if (expandedId === id) setExpandedId(null);
    }
  };

  const handleBrandAssign = (assetId: string, brandId: string | null) => {
    updateAsset.mutate({ id: assetId, body: { brand_id: brandId } });
  };

  const handleStatusChange = (assetId: string, status: string) => {
    updateAsset.mutate({ id: assetId, body: { status } });
  };

  const clearAllFilters = () => {
    setFilterType(undefined);
    setFilterPlatform(undefined);
    setFilterStatus(undefined);
    setFilterBrand(undefined);
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Copywriting"
        subtitle="Biblioteca de copy assets — textos, headlines, ads y contenido"
        action={{ label: "Nuevo copy", onClick: openCreate }}
      />

      <div className="flex-1 p-6 space-y-4 overflow-y-auto">

        {/* ── Search + Filter bar ──────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 max-w-md px-3 py-2 rounded-lg border border-border bg-card text-sm">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nombre, contenido o tono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-sm placeholder:text-muted-foreground w-full text-foreground"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
              showFilters || activeFilterCount > 0
                ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-400 text-[10px] text-black font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* ── Expanded Filters ────────────────────────────────────────── */}
        {showFilters && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 animate-fade-in">
            {/* Copy type pills */}
            <div>
              <span className="text-xs text-muted-foreground block mb-2">Tipo de copy</span>
              <div className="flex flex-wrap gap-2">
                {COPY_TYPES.map((ct) => {
                  const Icon = ct.icon;
                  const active = filterType === ct.id;
                  return (
                    <button
                      key={ct.id}
                      onClick={() => setFilterType(active ? undefined : ct.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        active
                          ? `${ct.color} ${ct.bg} ${ct.border}`
                          : "border-border text-muted-foreground hover:bg-accent",
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {ct.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Platform pills */}
            <div>
              <span className="text-xs text-muted-foreground block mb-2">Plataforma</span>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const active = filterPlatform === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setFilterPlatform(active ? undefined : p.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        active
                          ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20"
                          : "border-border text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4">
              {/* Status filter */}
              <div>
                <span className="text-xs text-muted-foreground block mb-2">Estado</span>
                <div className="flex gap-2">
                  {STATUSES.map((s) => {
                    const active = filterStatus === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setFilterStatus(active ? undefined : s.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                          active
                            ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                            : "border-border text-muted-foreground hover:bg-accent",
                        )}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brand filter */}
              {brands && brands.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-2">Marca</span>
                  <div className="flex flex-wrap gap-2">
                    {brands.map((b) => {
                      const active = filterBrand === b.id;
                      return (
                        <button
                          key={b.id}
                          onClick={() => setFilterBrand(active ? undefined : b.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                            active
                              ? "text-pink-400 bg-pink-400/10 border-pink-400/20"
                              : "border-border text-muted-foreground hover:bg-accent",
                          )}
                        >
                          {b.color_palette?.primary && (
                            <div
                              className="w-2.5 h-2.5 rounded-full border border-border"
                              style={{ backgroundColor: (b.color_palette as Record<string, string>).primary }}
                            />
                          )}
                          {b.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Results count ───────────────────────────────────────────── */}
        {!isLoading && filteredAssets && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {filteredAssets.length} asset{filteredAssets.length !== 1 ? "s" : ""}
              {activeFilterCount > 0 && " (filtrados)"}
            </p>
          </div>
        )}

        {/* ── Assets List ─────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : !filteredAssets?.length ? (
          <EmptyState
            icon={PenLine}
            title={activeFilterCount > 0 || searchQuery ? "Sin resultados" : "Sin copy assets aún"}
            description={
              activeFilterCount > 0 || searchQuery
                ? "Prueba ajustando los filtros o el término de búsqueda."
                : "Los copy assets se crean automáticamente al usar los agentes de Copywriting y Ads, o puedes crear uno manualmente."
            }
            action={
              activeFilterCount > 0
                ? { label: "Limpiar filtros", onClick: clearAllFilters }
                : { label: "Crear copy", onClick: openCreate }
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredAssets.map((asset) => {
              const typeMeta = getCopyTypeMeta(asset.copy_type);
              const TypeIcon = typeMeta.icon;
              const isExpanded = expandedId === asset.id;
              const brandName = asset.brand_id
                ? brands?.find((b) => b.id === asset.brand_id)?.name
                : null;

              return (
                <div
                  key={asset.id}
                  className="bg-card border border-border rounded-xl animate-fade-in transition-all hover:border-border/80"
                >
                  {/* ── Card header ─────────────────────────────────── */}
                  <div
                    className="flex items-start gap-3 p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : asset.id)}
                  >
                    {/* Type icon */}
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", typeMeta.bg)}>
                      <TypeIcon className={cn("w-4 h-4", typeMeta.color)} />
                    </div>

                    {/* Content preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-foreground truncate">{asset.name}</h3>
                        <StatusBadge status={asset.status} />
                      </div>

                      <p className={cn(
                        "text-sm text-muted-foreground",
                        isExpanded ? "" : "line-clamp-2",
                      )}>
                        {asset.content}
                      </p>

                      {/* Tags row */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-medium border",
                          typeMeta.color, typeMeta.bg, typeMeta.border,
                        )}>
                          {typeMeta.label}
                        </span>

                        {asset.platform && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 font-medium">
                            {getPlatformLabel(asset.platform)}
                          </span>
                        )}

                        {asset.tone && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full text-muted-foreground bg-muted border border-border">
                            {asset.tone}
                          </span>
                        )}

                        {brandName && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full text-pink-400 bg-pink-400/10 border border-pink-400/20 font-medium">
                            {brandName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                      {formatRelativeTime(asset.created_at)}
                    </span>
                  </div>

                  {/* ── Expanded section ────────────────────────────── */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">

                      {/* Variations */}
                      {asset.variations && asset.variations.length > 0 && (
                        <div>
                          <span className="text-xs text-muted-foreground block mb-2">Variaciones</span>
                          <div className="space-y-2">
                            {asset.variations.map((v, i) => (
                              <div
                                key={i}
                                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                              >
                                <span className="text-[10px] text-muted-foreground font-medium mr-2">v{v.order}</span>
                                {v.content}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Brand assign + Product assign + Status + Actions */}
                      <div className="flex items-center justify-between gap-4 pt-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Brand selector */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground shrink-0">Marca:</span>
                            <select
                              value={asset.brand_id || ""}
                              onChange={(e) => handleBrandAssign(asset.id, e.target.value || null)}
                              className="px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground outline-none focus:border-ring transition-all"
                            >
                              <option value="">Sin marca</option>
                              {brands?.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Product selector */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground shrink-0">Producto:</span>
                            <select
                              value={asset.product_id || ""}
                              onChange={(e) => updateAsset.mutate({ id: asset.id, body: { product_id: e.target.value || null } })}
                              className="px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground outline-none focus:border-ring transition-all"
                            >
                              <option value="">Sin producto</option>
                              {products?.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Status selector */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground shrink-0">Estado:</span>
                            <select
                              value={asset.status}
                              onChange={(e) => handleStatusChange(asset.id, e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground outline-none focus:border-ring transition-all"
                            >
                              <option value="draft">Draft</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(asset.content);
                            }}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
                          >
                            <Copy className="w-3 h-3" /> Copiar
                          </button>
                          <button
                            onClick={() => openEdit(asset)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
                          >
                            <Edit3 className="w-3 h-3" /> Editar
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-md hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3 h-3" /> Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ────────────────────────────────────────── */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? "Editar copy asset" : "Nuevo copy asset"}
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength={1}
              placeholder='Ej: "Headline principal — Serum Vitamina C"'
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
            />
          </div>

          {/* Type + Platform row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Tipo</label>
              <select
                value={form.copy_type}
                onChange={(e) => setForm({ ...form, copy_type: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all"
              >
                {COPY_TYPES.map((ct) => (
                  <option key={ct.id} value={ct.id}>{ct.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Plataforma</label>
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all"
              >
                <option value="">Sin especificar</option>
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tone + Brand + Product row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Tono</label>
              <input
                value={form.tone}
                onChange={(e) => setForm({ ...form, tone: e.target.value })}
                placeholder="profesional, urgente..."
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Marca</label>
              <select
                value={form.brand_id}
                onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all"
              >
                <option value="">Sin marca</option>
                {brands?.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Producto</label>
              <select
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all"
              >
                <option value="">Sin producto</option>
                {products?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Contenido</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              rows={6}
              placeholder="Escribe el copy aquí..."
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all resize-none"
            />
          </div>

          {/* Status (only on edit) */}
          {editing && (
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Estado</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all"
              >
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={createAsset.isPending || updateAsset.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
          >
            {(createAsset.isPending || updateAsset.isPending) ? (
              <Spinner className="w-4 h-4 text-primary-foreground" />
            ) : editing ? (
              "Guardar cambios"
            ) : (
              "Crear copy asset"
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
}