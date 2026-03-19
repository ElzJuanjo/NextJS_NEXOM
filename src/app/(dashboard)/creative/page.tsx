"use client";

import { useState } from "react";
import { ImageIcon, Sparkles, Link2, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useProducts } from "@/hooks/use-products";
import { useCreatives, useUnassignedCreatives, useGenerateBatch, useAssignProduct, useDeleteCreative } from "@/hooks/use-creatives";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CreativeResponse } from "@/types";

export default function CreativePage() {
  const { data: products, isLoading: prodLoading } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [showUnassigned, setShowUnassigned] = useState(false);
  const { data: creatives, isLoading: crLoading } = useCreatives(selectedProductId);
  const { data: unassigned } = useUnassignedCreatives();
  const generateBatch = useGenerateBatch();
  const assignProduct = useAssignProduct();
  const [showBatch, setShowBatch] = useState(false);
  const [showAssign, setShowAssign] = useState<CreativeResponse | null>(null);
  const [batchForm, setBatchForm] = useState({ product_name: "", product_description: "", preset_id: "starter" });

  const firstProduct = products?.[0];
  const activeProduct = selectedProductId || firstProduct?.id || "";
  const displayCreatives = showUnassigned ? unassigned : creatives;
  const isLoading = showUnassigned ? false : crLoading;

  const deleteCreative = useDeleteCreative();

  return (
    <div className="flex flex-col h-full">
      <Header title="Creativos" subtitle="Generación de imágenes y assets visuales con IA" action={{ label: "Batch creativo", onClick: () => setShowBatch(true) }} />

      <div className="flex-1 p-6 space-y-4">
        {/* Tabs: por producto vs sin asignar */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-2">
          <button
            onClick={() => setShowUnassigned(false)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all",
              !showUnassigned ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" : "border-border text-muted-foreground hover:bg-accent"
            )}
          >
            Por producto
          </button>
          <button
            onClick={() => setShowUnassigned(true)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all",
              showUnassigned ? "text-amber-400 bg-amber-400/10 border-amber-400/20" : "border-border text-muted-foreground hover:bg-accent"
            )}
          >
            Sin asignar {unassigned?.length ? `(${unassigned.length})` : ""}
          </button>
        </div>

        {/* Product selector (only when not showing unassigned) */}
        {!showUnassigned && products && products.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-2">
            <span className="text-xs text-muted-foreground shrink-0">Producto:</span>
            {products.map((p) => (
              <button key={p.id} onClick={() => setSelectedProductId(p.id)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all",
                  (activeProduct === p.id) ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" : "border-border text-muted-foreground hover:bg-accent"
                )}>
                {p.name}
              </button>
            ))}
          </div>
        )}

        {isLoading || prodLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : !displayCreatives?.length ? (
          <EmptyState
            icon={ImageIcon}
            title={showUnassigned ? "Sin creativos huérfanos" : "Sin creativos aún"}
            description={showUnassigned
              ? "Todos los creativos están asignados a un producto."
              : "Genera creativos de producto usando IA. Selecciona un producto y usa el agente de imágenes o ejecuta un batch."}
            action={!showUnassigned ? { label: "Generar batch", onClick: () => setShowBatch(true) } : undefined}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayCreatives.map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in group">
                <div className="aspect-square bg-muted flex items-center justify-center relative">
                  {c.file_url ? <img src={c.file_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-muted-foreground/30" />}

                  {/* Action buttons overlay */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAssign(c);
                      }}
                      className="p-1.5 rounded-lg bg-card/90 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title={c.product_id ? "Cambiar producto" : "Asignar producto"}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("¿Eliminar este creativo? Se eliminará del almacenamiento.")) {
                          deleteCreative.mutate(c.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-card/90 border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground capitalize">
                      {c.style ?? c.angle ?? c.format ?? "Creative"}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>
                  {c.platform && <span className="text-xs text-muted-foreground">{c.platform}</span>}
                  {c.angle && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-violet-400/10 text-violet-400 border border-violet-400/20">
                      {c.angle}
                    </span>
                  )}
                  {c.format && (
                    <span className="text-xs text-muted-foreground ml-1">{c.format}</span>
                  )}
                  {c.generation_prompt && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.generation_prompt}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Batch modal */}
      <Modal open={showBatch} onClose={() => setShowBatch(false)} title="Batch de creativos">
        <form onSubmit={(e) => {
          e.preventDefault();
          generateBatch.mutate(
            { ...batchForm, product_id: activeProduct || undefined },
            { onSuccess: () => setShowBatch(false) }
          );
        }} className="space-y-4">
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
            <label className="text-sm font-medium text-foreground block mb-1.5">Preset</label>
            <select value={batchForm.preset_id} onChange={(e) => setBatchForm({ ...batchForm, preset_id: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all">
              <option value="starter">Starter (5 imágenes)</option>
              <option value="campaign">Campaign (15 imágenes)</option>
              <option value="full">Full (30 imágenes)</option>
            </select>
          </div>
          <button type="submit" disabled={generateBatch.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
            {generateBatch.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : <><Sparkles className="w-4 h-4" /> Generar batch</>}
          </button>
        </form>
      </Modal>

      {/* Assign product modal */}
      <Modal open={!!showAssign} onClose={() => setShowAssign(null)} title={showAssign?.product_id ? "Cambiar producto" : "Asignar producto"}>
        {showAssign && (
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              {showAssign.file_url && <img src={showAssign.file_url} alt="" className="w-full h-full object-contain" />}
            </div>

            {/* Current assignment */}
            {showAssign.product_id && (
              <div className="flex items-center justify-between px-3 py-2 bg-secondary rounded-lg">
                <span className="text-xs text-muted-foreground">
                  Asignado a: <span className="text-foreground font-medium">
                    {products?.find((p) => p.id === showAssign.product_id)?.name ?? "Producto"}
                  </span>
                </span>
                <button
                  onClick={() => {
                    assignProduct.mutate(
                      { creativeId: showAssign.id, product_id: null as unknown as string },
                      { onSuccess: () => setShowAssign(null) }
                    );
                  }}
                  disabled={assignProduct.isPending}
                  className="text-xs text-destructive hover:underline font-medium"
                >
                  Desasignar
                </button>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Selecciona un producto</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                {products?.map((p) => {
                  const isCurrent = showAssign.product_id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (isCurrent) return;
                        assignProduct.mutate(
                          { creativeId: showAssign.id, product_id: p.id },
                          { onSuccess: () => setShowAssign(null) }
                        );
                      }}
                      disabled={assignProduct.isPending || isCurrent}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors",
                        isCurrent
                          ? "border-primary/50 bg-primary/5 opacity-60"
                          : "border-border hover:bg-accent"
                      )}
                    >
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