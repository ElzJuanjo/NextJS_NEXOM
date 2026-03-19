"use client";

import { useState } from "react";
import { ImageIcon, Sparkles, Link2, Trash2, Check, FolderOpen, ChevronDown, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useProducts } from "@/hooks/use-products";
import {
  useCreatives, useUnassignedCreatives, useDeleteCreative,
  useBatches, useGenerateBatch, useDeleteBatch,
  useAssignProduct,
} from "@/hooks/use-creatives";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { CreativeResponse } from "@/types";

type ViewMode = "batches" | "product" | "unassigned";

export default function CreativePage() {
  const { data: products, isLoading: prodLoading } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("batches");

  const { data: batches, isLoading: batchLoading } = useBatches();
  const firstProduct = products?.[0];
  const activeProduct = selectedProductId || firstProduct?.id || "";
  const { data: productCreatives, isLoading: crLoading } = useCreatives(viewMode === "product" ? activeProduct : undefined);
  const { data: unassigned } = useUnassignedCreatives();

  const generateBatch = useGenerateBatch();
  const deleteBatch = useDeleteBatch();
  const deleteCreative = useDeleteCreative();
  const assignProduct = useAssignProduct();

  const [showBatch, setShowBatch] = useState(false);
  const [showAssign, setShowAssign] = useState<CreativeResponse | null>(null);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [batchForm, setBatchForm] = useState({ product_name: "", product_description: "", preset_id: "starter", product_id: "" });

  const toggleBatch = (id: string) => {
    setExpandedBatches((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Creativos" subtitle="Generación de imágenes y assets visuales con IA"
        action={{ label: "Nuevo batch", onClick: () => setShowBatch(true) }} />

      <div className="flex-1 p-6 space-y-4">
        {/* View mode tabs */}
        <div className="flex items-center gap-2">
          {([
            { mode: "batches" as ViewMode, label: "Galerías", count: batches?.length },
            { mode: "product" as ViewMode, label: "Por producto", count: undefined },
            { mode: "unassigned" as ViewMode, label: "Sin asignar", count: unassigned?.length },
          ]).map((tab) => (
            <button key={tab.mode} onClick={() => setViewMode(tab.mode)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all",
                viewMode === tab.mode
                  ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}>
              {tab.label} {tab.count !== undefined && tab.count > 0 ? `(${tab.count})` : ""}
            </button>
          ))}
        </div>

        {/* Product selector for product view */}
        {viewMode === "product" && products && products.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-2">
            <span className="text-xs text-muted-foreground shrink-0">Producto:</span>
            {products.map((p) => (
              <button key={p.id} onClick={() => setSelectedProductId(p.id)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all",
                  activeProduct === p.id ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" : "border-border text-muted-foreground hover:bg-accent"
                )}>
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* ── Batches (Gallery) View ── */}
        {viewMode === "batches" && (
          batchLoading ? (
            <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
          ) : !batches?.length ? (
            <EmptyState icon={FolderOpen} title="Sin galerías aún"
              description="Genera tu primer batch de creativos para crear una galería de imágenes."
              action={{ label: "Generar batch", onClick: () => setShowBatch(true) }} />
          ) : (
            <div className="space-y-3">
              {batches.map((batch) => {
                const isExpanded = expandedBatches.has(batch.id);
                const productName = products?.find((p) => p.id === batch.product_id)?.name;
                return (
                  <div key={batch.id} className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
                    {/* Batch header */}
                    <button onClick={() => toggleBatch(batch.id)}
                      className="w-full flex items-center gap-3 px-5 py-4 hover:bg-accent/30 transition-colors text-left">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                      <FolderOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{batch.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {batch.total_generated} imágenes · {formatRelativeTime(batch.created_at)}
                          {productName && <> · <span className="text-pink-400">{productName}</span></>}
                        </p>
                      </div>
                      <StatusBadge status={batch.status} />
                      <span className="text-xs text-muted-foreground">{batch.credits_consumed} créditos</span>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm(`¿Eliminar "${batch.name}" y todas sus imágenes?`)) deleteBatch.mutate(batch.id); }}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </button>

                    {/* Batch creatives grid */}
                    {isExpanded && (
                      <div className="px-5 pb-4 pt-1 border-t border-border">
                        {!batch.creatives?.length ? (
                          <p className="text-xs text-muted-foreground py-4 text-center">Sin imágenes en este batch</p>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 mt-2">
                            {batch.creatives.map((c) => (
                              <CreativeCard key={c.id} creative={c} onDelete={() => deleteCreative.mutate(c.id)} onAssign={() => setShowAssign(c)} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── Product View ── */}
        {viewMode === "product" && (
          crLoading || prodLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : !productCreatives?.length ? (
            <EmptyState icon={ImageIcon} title="Sin creativos para este producto"
              description="Genera creativos vinculados a este producto usando un batch o el agente de imágenes."
              action={{ label: "Generar batch", onClick: () => setShowBatch(true) }} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {productCreatives.map((c) => (
                <CreativeCard key={c.id} creative={c} onDelete={() => deleteCreative.mutate(c.id)} onAssign={() => setShowAssign(c)} />
              ))}
            </div>
          )
        )}

        {/* ── Unassigned View ── */}
        {viewMode === "unassigned" && (
          !unassigned?.length ? (
            <EmptyState icon={ImageIcon} title="Sin creativos huérfanos" description="Todos los creativos están asignados a un producto o galería." />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {unassigned.map((c) => (
                <CreativeCard key={c.id} creative={c} onDelete={() => deleteCreative.mutate(c.id)} onAssign={() => setShowAssign(c)} />
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Generate Batch Modal ── */}
      <Modal open={showBatch} onClose={() => setShowBatch(false)} title="Nuevo batch de creativos" className="max-w-lg">
        <form onSubmit={(e) => {
          e.preventDefault();
          generateBatch.mutate(
            { ...batchForm, product_id: batchForm.product_id || undefined },
            { onSuccess: () => { setShowBatch(false); setBatchForm({ product_name: "", product_description: "", preset_id: "starter", product_id: "" }); } }
          );
        }} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Producto (opcional)</label>
            <select value={batchForm.product_id} onChange={(e) => setBatchForm({ ...batchForm, product_id: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all">
              <option value="">Sin vincular a producto</option>
              {products?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Nombre del producto</label>
            <input value={batchForm.product_name} onChange={(e) => setBatchForm({ ...batchForm, product_name: e.target.value })} required
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Descripción</label>
            <textarea value={batchForm.product_description} onChange={(e) => setBatchForm({ ...batchForm, product_description: e.target.value })} required rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Cantidad</label>
            <select value={batchForm.preset_id} onChange={(e) => setBatchForm({ ...batchForm, preset_id: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all">
              <option value="starter">Starter — 5 imágenes</option>
              <option value="campaign">Campaña — 10 imágenes</option>
              <option value="full">Full — 15 imágenes</option>
            </select>
          </div>
          <button type="submit" disabled={generateBatch.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
            {generateBatch.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : <><Sparkles className="w-4 h-4" /> Generar batch</>}
          </button>
        </form>
      </Modal>

      {/* ── Assign Product Modal ── */}
      <Modal open={!!showAssign} onClose={() => setShowAssign(null)} title={showAssign?.product_id ? "Cambiar producto" : "Asignar producto"}>
        {showAssign && (
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              {showAssign.file_url && <img src={showAssign.file_url} alt="" className="w-full h-full object-contain" />}
            </div>
            {showAssign.product_id && (
              <div className="flex items-center justify-between px-3 py-2 bg-secondary rounded-lg">
                <span className="text-xs text-muted-foreground">
                  Asignado a: <span className="text-foreground font-medium">{products?.find((p) => p.id === showAssign.product_id)?.name ?? "Producto"}</span>
                </span>
                <button onClick={() => assignProduct.mutate({ creativeId: showAssign.id, product_id: null }, { onSuccess: () => setShowAssign(null) })}
                  disabled={assignProduct.isPending} className="text-xs text-destructive hover:underline font-medium">Desasignar</button>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Selecciona un producto</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                {products?.map((p) => {
                  const isCurrent = showAssign.product_id === p.id;
                  return (
                    <button key={p.id} onClick={() => { if (!isCurrent) assignProduct.mutate({ creativeId: showAssign.id, product_id: p.id }, { onSuccess: () => setShowAssign(null) }); }}
                      disabled={assignProduct.isPending || isCurrent}
                      className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors",
                        isCurrent ? "border-primary/50 bg-primary/5 opacity-60" : "border-border hover:bg-accent")}>
                      <span className="text-sm font-medium text-foreground flex-1">{p.name}</span>
                      {isCurrent && <span className="text-xs text-primary">Actual</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ── Reusable Creative Card ── */

function CreativeCard({ creative: c, onDelete, onAssign }: { creative: CreativeResponse; onDelete: () => void; onAssign: () => void }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden group">
      <div className="aspect-square bg-muted flex items-center justify-center relative">
        {c.file_url ? <img src={c.file_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-muted-foreground/30" />}
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onAssign(); }}
            className="p-1.5 rounded-lg bg-card/90 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Asignar producto">
            <Link2 className="w-3 h-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm("¿Eliminar?")) onDelete(); }}
            className="p-1.5 rounded-lg bg-card/90 border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Eliminar">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="p-2.5 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-foreground capitalize truncate">{c.style ?? c.angle ?? "Creative"}</span>
          {c.format && <span className="text-[10px] text-muted-foreground">{c.format}</span>}
        </div>
        {c.platform && <p className="text-[10px] text-muted-foreground truncate">{c.platform}</p>}
      </div>
    </div>
  );
}