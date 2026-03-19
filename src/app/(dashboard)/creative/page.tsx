"use client";

import { useState } from "react";
import { ImageIcon, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useProducts } from "@/hooks/use-products";
import { useCreatives, useGenerateBatch, useBatchPresets } from "@/hooks/use-creatives";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function CreativePage() {
  const { data: products, isLoading: prodLoading } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const { data: creatives, isLoading: crLoading } = useCreatives(selectedProductId);
  const { data: presets } = useBatchPresets();
  const generateBatch = useGenerateBatch();
  const [showBatch, setShowBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({ product_name: "", product_description: "", preset_id: "starter" });

  const firstProduct = products?.[0];
  const activeProduct = selectedProductId || firstProduct?.id || "";

  return (
    <div className="flex flex-col h-full">
      <Header title="Creativos" subtitle="Generación de imágenes y assets visuales con IA" action={{ label: "Batch creativo", onClick: () => setShowBatch(true) }} />

      <div className="flex-1 p-6 space-y-4">
        {/* Product selector */}
        {products && products.length > 0 && (
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

        {crLoading || prodLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : !creatives?.length ? (
          <EmptyState
            icon={ImageIcon}
            title="Sin creativos aún"
            description="Genera creativos de producto usando IA. Selecciona un producto y usa el agente de imágenes o ejecuta un batch."
            action={{ label: "Generar batch", onClick: () => setShowBatch(true) }}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {creatives.map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {c.file_url ? <img src={c.file_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-muted-foreground/30" />}
                </div>
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground capitalize">{c.style ?? c.format ?? "Creative"}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  {c.platform && <span className="text-xs text-muted-foreground">{c.platform}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showBatch} onClose={() => setShowBatch(false)} title="Batch de creativos">
        <form onSubmit={(e) => { e.preventDefault(); generateBatch.mutate(batchForm, { onSuccess: () => setShowBatch(false) }); }} className="space-y-4">
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
              <option value="starter">Starter</option>
              <option value="campaign">Campaign</option>
              <option value="full">Full</option>
            </select>
          </div>
          <button type="submit" disabled={generateBatch.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
            {generateBatch.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : <><Sparkles className="w-4 h-4" /> Generar batch</>}
          </button>
        </form>
      </Modal>
    </div>
  );
}
