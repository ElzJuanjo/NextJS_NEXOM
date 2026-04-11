"use client";

import { useState } from "react";
import {
  Package, Plus, Edit3, Trash2, DollarSign, ImageOff, Check, ImageIcon,
  Trophy, TrendingUp, Star, ExternalLink, BarChart3, ShoppingCart,
  Eye, Download, Boxes, Truck,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useImportFromDropi } from "@/hooks/use-products";
import { useBrands } from "@/hooks/use-brands";
import { cn, formatCurrency } from "@/lib/utils";
import type { ProductResponse } from "@/types";
import { useCreatives } from "@/hooks/use-creatives";

// ── Types para extra_data de productos auto-persistidos ────────────────────

interface ProductScoreBreakdown {
  ventas: number;
  margen: number;
  tendencia: number;
  competencia_inv: number;
  rating: number;
}

interface AutoPersistedData {
  auto_persisted: true;
  source: string;
  score_total: number;
  score_breakdown: ProductScoreBreakdown;
  source_platform: string;
  source_url: string;
  rating: number;
  monthly_sales: number;
  seller: string;
  reviews_count: number;
  currency: string;
}

function isAutoPersisted(product: ProductResponse): product is ProductResponse & { extra_data: AutoPersistedData } {
  return product.extra_data?.auto_persisted === true;
}

// ── Filter type ────────────────────────────────────────────────────────────

type ProductFilter = "all" | "winners" | "manual";

// ── Score ring component ───────────────────────────────────────────────────

function ScoreRing({ score, size = 40 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? "text-emerald-400" :
      score >= 50 ? "text-amber-400" :
        "text-red-400";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={3}
          className="stroke-border"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-700", color.replace("text-", "stroke-"))}
        />
      </svg>
      <span className={cn(
        "absolute inset-0 flex items-center justify-center text-[10px] font-bold",
        color
      )}>
        {Math.round(score)}
      </span>
    </div>
  );
}

// ── Score breakdown mini-bar ────────────────────────────────────────────────

function ScoreBreakdownBar({ breakdown }: { breakdown: ProductScoreBreakdown }) {
  const items = [
    { label: "Ventas", value: breakdown.ventas, color: "bg-emerald-400" },
    { label: "Margen", value: breakdown.margen, color: "bg-blue-400" },
    { label: "Tendencia", value: breakdown.tendencia, color: "bg-violet-400" },
    { label: "Comp.", value: breakdown.competencia_inv, color: "bg-amber-400" },
    { label: "Rating", value: breakdown.rating, color: "bg-pink-400" },
  ];

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-14 shrink-0 text-right">{item.label}</span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", item.color)}
              style={{ width: `${item.value}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground w-6 shrink-0">{Math.round(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Platform badge ─────────────────────────────────────────────────────────

function PlatformBadge({ platform }: { platform: string }) {
  const platformLabels: Record<string, { label: string; color: string }> = {
    mercadolibre: { label: "MercadoLibre", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" },
    google_shopping: { label: "Google Shopping", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    aliexpress: { label: "AliExpress", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
    amazon: { label: "Amazon", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    temu: { label: "Temu", color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
    shopee: { label: "Shopee", color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
  };

  const info = platformLabels[platform] || { label: platform, color: "text-muted-foreground bg-muted border-border" };

  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", info.color)}>
      {info.label}
    </span>
  );
}

// ── Platform label helper ─────────────────────────────────────────────────

function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    mercadolibre: "MercadoLibre",
    google_shopping: "Google",
    aliexpress: "AliExpress",
    amazon: "Amazon",
    temu: "Temu",
    shopee: "Shopee",
  };
  return labels[platform] || "Tienda";
}

// ── Creative Picker ──────────────────────────────────────────────────

function CreativePickerField({
  productId,
  currentUrl,
  onSelect,
}: {
  productId: string;
  currentUrl: string;
  onSelect: (url: string) => void;
}) {
  const { data: creatives, isLoading } = useCreatives(productId);
  const [expanded, setExpanded] = useState(false);

  const withImages = creatives?.filter((c) => c.file_url) ?? [];

  if (isLoading) return null;
  if (!withImages.length) return null;

  return (
    <div className="col-span-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
      >
        <ImageIcon className="w-3 h-3" />
        {expanded ? "Ocultar creativos" : `Elegir de creativos (${withImages.length})`}
      </button>

      {expanded && (
        <div className="mt-2 grid grid-cols-4 gap-2 max-h-48 overflow-y-auto scrollbar-thin p-1">
          {withImages.map((c) => {
            const isSelected = currentUrl === c.file_url;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.file_url!)}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:opacity-90",
                  isSelected
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <img
                  src={c.file_url!}
                  alt={c.style ?? "Creative"}
                  className="w-full h-full object-cover"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  </div>
                )}
                {c.style && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                    <span className="text-[10px] text-white capitalize">{c.style}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Dropi Import Modal ────────────────────────────────────────────────────

function DropiImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [dropiId, setDropiId] = useState("");
  const importFromDropi = useImportFromDropi();

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropiId.trim()) return;
    importFromDropi.mutate(dropiId.trim(), {
      onSuccess: () => {
        setDropiId("");
        onClose();
      },
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Importar desde Dropi" className="max-w-md">
      <form onSubmit={handleImport} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Ingresa el ID del producto en Dropi para importar automáticamente su información (nombre, precio, imagen, variaciones).
        </p>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">ID del producto Dropi</label>
          <input
            value={dropiId}
            onChange={(e) => setDropiId(e.target.value)}
            placeholder="Ej: 12345"
            required
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={importFromDropi.isPending || !dropiId.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
        >
          {importFromDropi.isPending ? (
            <Spinner className="w-4 h-4 text-primary-foreground" />
          ) : (
            <>
              <Download className="w-4 h-4" />
              Importar producto
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}

// ── Product Detail Modal ───────────────────────────────────────────────────

function ProductDetailModal({
  product,
  brand,
  open,
  onClose,
  onToggleActive,
}: {
  product: ProductResponse | null;
  brand?: { name: string; color_palette?: Record<string, string> | null } | null;
  open: boolean;
  onClose: () => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
}) {
  if (!product) return null;

  const auto = isAutoPersisted(product) ? (product.extra_data as AutoPersistedData) : null;

  return (
    <Modal open={open} onClose={onClose} title={product.name} className="max-w-lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Image */}
        {product.image_url && (
          <div className="w-full h-48 rounded-xl overflow-hidden bg-muted">
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Basic info */}
        <div className="flex items-center justify-between">
          <div>
            {brand && <span className="text-xs text-pink-400 font-medium">{brand.name}</span>}
            {product.description && <p className="text-sm text-muted-foreground mt-1">{product.description}</p>}
          </div>
          {product.price_usd && (
            <span className="text-lg font-bold text-foreground">{formatCurrency(product.price_usd)}</span>
          )}
        </div>

        {/* Dropi import section */}
        {auto && auto.source === "dropi_import" && (
          <div className="bg-secondary/50 border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-foreground">Importado desde Dropi</span>
              </div>
              <PlatformBadge platform="dropi" />
            </div>

            {/* Pricing, Stock, Variations — extracted for clean typing */}
            {(() => {
              const extra = product.extra_data as Record<string, unknown> | null;
              if (!extra) return null;

              const priceProv = Number(extra.price_cop_proveedor) || 0;
              const priceSug = Number(extra.price_cop_sugerido) || 0;
              const margin = Number(extra.margin_pct) || 0;
              const stock = Number(extra.stock) || 0;
              const category = (extra.category as string) || "";
              const variations = (extra.variations as Array<{ name: string; stock: number }>) || [];

              return (
                <>
                  {/* Pricing */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <span className="text-sm font-semibold text-foreground">
                        ${priceProv.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                      </span>
                      <p className="text-[10px] text-muted-foreground">Precio proveedor</p>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-foreground">
                        ${priceSug.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                      </span>
                      <p className="text-[10px] text-muted-foreground">Precio sugerido</p>
                    </div>
                    <div className="text-center">
                      <span className={cn(
                        "text-sm font-semibold",
                        margin >= 30 ? "text-emerald-400" : "text-amber-400"
                      )}>
                        {margin.toFixed(1)}%
                      </span>
                      <p className="text-[10px] text-muted-foreground">Margen</p>
                    </div>
                  </div>

                  {/* Stock & Category */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Boxes className="w-3.5 h-3.5 text-blue-400" />
                      <div>
                        <span className="text-sm font-semibold text-foreground">{stock}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">unidades</span>
                      </div>
                    </div>
                    {category && (
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-xs text-muted-foreground">{category}</span>
                      </div>
                    )}
                  </div>

                  {/* Variations */}
                  {variations.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Variaciones</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {variations.map((v, i) => (
                          <div key={i} className="flex items-center justify-between px-2 py-1 rounded-md bg-muted/50 text-xs">
                            <span className="text-foreground">{v.name}</span>
                            <span className={cn(
                              "font-medium",
                              v.stock > 0 ? "text-emerald-400" : "text-red-400"
                            )}>
                              {v.stock} uds
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Supplier + Link */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                {auto.seller && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Truck className="w-3 h-3" />
                    {auto.seller}
                  </span>
                )}
              </div>
              {auto.source_url && (
                <a
                  href={auto.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Ver en Dropi</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Winner scoring section — only for scraped products, NOT dropi imports */}
        {auto && auto.source !== "dropi_import" && (
          <div className="bg-secondary/50 border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-foreground">Producto ganador</span>
              </div>
              <ScoreRing score={auto.score_total} size={48} />
            </div>

            <ScoreBreakdownBar breakdown={auto.score_breakdown} />

            <div className="grid grid-cols-3 gap-3">
              {auto.rating > 0 && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-3 h-3 text-amber-400" />
                    <span className="text-sm font-semibold text-foreground">{auto.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Rating</span>
                </div>
              )}
              {auto.monthly_sales > 0 && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-sm font-semibold text-foreground">{Math.round(auto.monthly_sales)}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Ventas/mes</span>
                </div>
              )}
              {auto.reviews_count > 0 && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <ShoppingCart className="w-3 h-3 text-blue-400" />
                    <span className="text-sm font-semibold text-foreground">{auto.reviews_count}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Reviews</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <PlatformBadge platform={auto.source_platform} />
              {auto.source_url && (
                <a
                  href={auto.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Ver en {getPlatformLabel(auto.source_platform)}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {product.sku && <span>SKU: {product.sku}</span>}
            {product.dropi_product_id && <span>Dropi: {product.dropi_product_id}</span>}
          </div>
          <button
            onClick={() => { onToggleActive?.(product.id, !product.is_active); }}
            className="flex items-center gap-2 group/toggle"
          >
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                product.is_active ? "text-emerald-400" : "text-muted-foreground"
              )}
            >
              {product.is_active ? "Activo" : "Inactivo"}
            </span>
            <div
              className={cn(
                "relative w-8 h-[18px] rounded-full transition-colors duration-200 cursor-pointer",
                product.is_active ? "bg-emerald-400" : "bg-muted-foreground/30"
              )}
            >
              <span
                className={cn(
                  "absolute top-[3px] left-[3px] w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-sm",
                  product.is_active && "translate-x-3.5"
                )}
              />
            </div>
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  const { data: brands } = useBrands();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [showForm, setShowForm] = useState(false);
  const [showDropiImport, setShowDropiImport] = useState(false);
  const [editing, setEditing] = useState<ProductResponse | null>(null);
  const [viewing, setViewing] = useState<ProductResponse | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProductFilter>("all");
  const [form, setForm] = useState({ name: "", brand_id: "", description: "", sku: "", price_usd: "", image_url: "" });

  const openEdit = (p: ProductResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditing(p);
    setForm({
      name: p.name,
      brand_id: p.brand_id ?? "",
      description: p.description ?? "",
      sku: p.sku ?? "",
      price_usd: p.price_usd?.toString() ?? "",
      image_url: p.image_url ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const payload = {
      name: form.name,
      brand_id: form.brand_id || undefined,
      description: form.description || undefined,
      sku: form.sku || undefined,
      price_usd: form.price_usd ? parseFloat(form.price_usd) : undefined,
      image_url: form.image_url || undefined,
    };
    updateProduct.mutate({ id: editing.id, ...payload }, { onSuccess: () => setShowForm(false) });
  };

  // Filtering
  const filtered = (products ?? []).filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "winners") return isAutoPersisted(p);
    if (filter === "manual") return !isAutoPersisted(p);
    return true;
  });

  // Stats
  const totalProducts = products?.length ?? 0;
  const winnerCount = products?.filter(isAutoPersisted).length ?? 0;
  const manualCount = totalProducts - winnerCount;

  return (
    <div className="flex flex-col h-full">
      {/* TAREA 7: sin "Nuevo producto" — TAREA 5: botón Dropi */}
      <Header
        title="Productos"
        subtitle="Gestiona tu catálogo de productos"
        action={{ label: "Importar desde Dropi", onClick: () => setShowDropiImport(true) }}
      />

      <div className="flex-1 p-6 space-y-4">
        {/* Search + Filter bar */}
        {totalProducts > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full max-w-sm px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
            />

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  filter === "all"
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "text-muted-foreground border-border hover:text-foreground hover:bg-accent"
                )}
              >
                <Package className="w-3 h-3" />
                Todos ({totalProducts})
              </button>
              {winnerCount > 0 && (
                <button
                  onClick={() => setFilter("winners")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    filter === "winners"
                      ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/30"
                      : "text-muted-foreground border-border hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Trophy className="w-3 h-3" />
                  Winners ({winnerCount})
                </button>
              )}
              {manualCount > 0 && winnerCount > 0 && (
                <button
                  onClick={() => setFilter("manual")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    filter === "manual"
                      ? "bg-violet-400/10 text-violet-400 border-violet-400/30"
                      : "text-muted-foreground border-border hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Plus className="w-3 h-3" />
                  Manuales ({manualCount})
                </button>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : !filtered.length ? (
          <EmptyState
            icon={Package}
            title={search || filter !== "all" ? "Sin resultados" : "Sin productos aún"}
            description={
              search || filter !== "all"
                ? "Intenta con otro término de búsqueda o cambia el filtro."
                : "Usa el agente de búsqueda para encontrar productos ganadores o importa desde Dropi."
            }
            action={!search && filter === "all" ? { label: "Importar desde Dropi", onClick: () => setShowDropiImport(true) } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product) => {
              const brand = brands?.find((b) => b.id === product.brand_id);
              const auto = isAutoPersisted(product) ? (product.extra_data as AutoPersistedData) : null;

              return (
                <div
                  key={product.id}
                  onClick={() => setViewing(product)}
                  className="bg-card border border-border rounded-xl overflow-hidden group animate-fade-in cursor-pointer hover:border-ring/50 transition-all"
                >
                  {/* Image */}
                  <div className="h-36 bg-muted flex items-center justify-center relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageOff className="w-8 h-8 text-muted-foreground/30" />
                    )}

                    {auto && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                        <Trophy className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400">{Math.round(auto.score_total)}</span>
                      </div>
                    )}

                    {auto?.source_platform && (
                      <div className="absolute top-2 right-2">
                        <PlatformBadge platform={auto.source_platform} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1">{product.name}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateProduct.mutate({ id: product.id, is_active: !product.is_active });
                        }}
                        className={cn(
                          "relative shrink-0 mt-0.5 w-7 h-4 rounded-full transition-colors duration-200",
                          product.is_active ? "bg-emerald-400" : "bg-muted-foreground/30"
                        )}
                        title={product.is_active ? "Activo — click para desactivar" : "Inactivo — click para activar"}
                      >
                        <span className={cn(
                          "absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-sm",
                          product.is_active && "translate-x-3"
                        )} />
                      </button>
                    </div>
                    {brand && <p className="text-xs text-pink-400">{brand.name}</p>}
                    {product.description && <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>}

                    {/* Winner metrics — Link como única referencia a fuente */}
                    {auto && (
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        {auto.rating > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 text-amber-400" />
                            {auto.rating.toFixed(1)}
                          </span>
                        )}
                        {auto.monthly_sales > 0 && (
                          <span className="flex items-center gap-0.5">
                            <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                            {Math.round(auto.monthly_sales)} ventas
                          </span>
                        )}
                        {auto.reviews_count > 0 && (
                          <span className="flex items-center gap-0.5">
                            <BarChart3 className="w-2.5 h-2.5 text-blue-400" />
                            {auto.reviews_count} reviews
                          </span>
                        )}
                        {auto.source_url && (
                          <a
                            href={auto.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-0.5 text-primary hover:underline ml-auto"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            {getPlatformLabel(auto.source_platform)}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      {product.price_usd ? (
                        <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-emerald-400" />{formatCurrency(product.price_usd)}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">Sin precio</span>}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewing(product); }}
                          className="p-1.5 rounded-md hover:bg-accent transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button onClick={(e) => openEdit(product, e)} className="p-1.5 rounded-md hover:bg-accent transition-colors">
                          <Edit3 className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm("¿Eliminar?")) deleteProduct.mutate(product.id); }}
                          className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <ProductDetailModal
        product={viewing}
        brand={viewing ? brands?.find((b) => b.id === viewing.brand_id) : null}
        open={!!viewing}
        onClose={() => setViewing(null)}
        onToggleActive={(id, isActive) => {
          updateProduct.mutate({ id, is_active: isActive });
          if (viewing && viewing.id === id) {
            setViewing({ ...viewing, is_active: isActive });
          }
        }}
      />

      {/* Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Editar producto" className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground block mb-1.5">Nombre</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">SKU</label>
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Precio USD</label>
              <input value={form.price_usd} onChange={(e) => setForm({ ...form, price_usd: e.target.value })} type="number" step="0.01"
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground block mb-1.5">Marca</label>
              <select value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all">
                <option value="">Sin marca</option>
                {brands?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground block mb-1.5">Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all resize-none" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground block mb-1.5">URL de imagen</label>
              <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
            </div>

            {editing && <CreativePickerField productId={editing.id} currentUrl={form.image_url} onSelect={(url) => setForm({ ...form, image_url: url })} />}
          </div>
          <button type="submit" disabled={updateProduct.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
            {updateProduct.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : "Guardar cambios"}
          </button>
        </form>
      </Modal>

      {/* Dropi Import Modal */}
      <DropiImportModal open={showDropiImport} onClose={() => setShowDropiImport(false)} />
    </div>
  );
}