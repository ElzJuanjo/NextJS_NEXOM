"use client";

import { useState } from "react";
import {
  ImageIcon, Sparkles, Link2, Trash2, FolderOpen, ChevronDown,
  ChevronRight, Edit3, FolderPlus, ArrowRightLeft, X, Monitor,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useProducts } from "@/hooks/use-products";
import {
  useCreatives, useUnassignedCreatives, useDeleteCreative,
  useBatches, useGenerateBatch, useGenerateBatchStream, useDeleteBatch,
  useAssignProduct, useCreateGallery, useUpdateGallery, useMoveCreative,
} from "@/hooks/use-creatives";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { CreativeResponse, CreativeBatchResponse } from "@/types";
import { PlatformPreview } from "@/components/ui/PlatformPreview";
import { useMyOrg } from "@/hooks/use-org";

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
  const { generate: generateBatchStream, progress: batchProgress, isPending: batchStreaming } = useGenerateBatchStream();
  const deleteBatch = useDeleteBatch();
  const deleteCreative = useDeleteCreative();
  const assignProduct = useAssignProduct();
  const createGallery = useCreateGallery();
  const updateGallery = useUpdateGallery();
  const moveCreative = useMoveCreative();

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // UI state
  const [showBatch, setShowBatch] = useState(false);
  const [showAssign, setShowAssign] = useState<CreativeResponse | null>(null);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [batchForm, setBatchForm] = useState({ gallery_name: "", product_description: "", preset_id: "starter", product_id: "" });
  const [showNewGallery, setShowNewGallery] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState("");
  const [editingBatch, setEditingBatch] = useState<CreativeBatchResponse | null>(null);
  const [editBatchName, setEditBatchName] = useState("");
  const [movingCreative, setMovingCreative] = useState<CreativeResponse | null>(null);

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const { data: org } = useMyOrg();

  const toggleBatch = (id: string) => {
    setExpandedBatches((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Creativos" subtitle="Generación de imágenes y assets visuales con IA" />

      <div className="flex-1 p-6 space-y-4">
        {/* View mode tabs + actions */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
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
          <div className="flex items-center gap-2">
            <button onClick={() => setShowBatch(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all">
              <Sparkles className="w-3.5 h-3.5" /> Generar batch
            </button>
            <button onClick={() => setShowNewGallery(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
              <FolderPlus className="w-3.5 h-3.5" /> Nueva galería
            </button>
          </div>
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
              description="Genera tu primer batch de creativos o crea una galería vacía."
              action={{ label: "Generar batch", onClick: () => setShowBatch(true) }} />
          ) : (
            <div className="space-y-3">
              {batches.map((batch) => {
                const isExpanded = expandedBatches.has(batch.id);
                const productName = products?.find((p) => p.id === batch.product_id)?.name;
                return (
                  <div key={batch.id} className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
                    {/* Batch header */}
                    <div onClick={() => toggleBatch(batch.id)}
                      className="w-full flex items-center gap-3 px-5 py-4 hover:bg-accent/30 transition-colors text-left cursor-pointer">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                      <FolderOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{batch.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {batch.creatives?.length ?? 0} imágenes · {formatRelativeTime(batch.created_at)}
                          {productName && <> · <span className="text-pink-400">{productName}</span></>}
                        </p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setEditingBatch(batch); setEditBatchName(batch.name); }}
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm(`¿Eliminar "${batch.name}" y todas sus imágenes?`)) deleteBatch.mutate(batch.id); }}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Batch creatives grid */}
                    {isExpanded && (
                      <div className="px-5 pb-4 pt-1 border-t border-border">
                        {!batch.creatives?.length ? (
                          <p className="text-xs text-muted-foreground py-4 text-center">Galería vacía — genera un batch o mueve creativos aquí</p>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 mt-2">
                            {batch.creatives.map((c) => (
                              <CreativeCard key={c.id} creative={c}
                                onDelete={() => deleteCreative.mutate(c.id)}
                                onAssign={() => setShowAssign(c)}
                                onMove={() => setMovingCreative(c)}
                                onExpand={() => setLightboxSrc(c.file_url)}
                                onPreview={() => c.file_url && setPreviewSrc(c.file_url)}
                              />
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
                <CreativeCard key={c.id} creative={c}
                  onDelete={() => deleteCreative.mutate(c.id)}
                  onAssign={() => setShowAssign(c)}
                  onMove={() => setMovingCreative(c)}
                  onExpand={() => setLightboxSrc(c.file_url)}
                  onPreview={() => c.file_url && setPreviewSrc(c.file_url)}
                />
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
                <CreativeCard key={c.id} creative={c}
                  onDelete={() => deleteCreative.mutate(c.id)}
                  onAssign={() => setShowAssign(c)}
                  onMove={() => setMovingCreative(c)}
                  onExpand={() => setLightboxSrc(c.file_url)}
                  onPreview={() => c.file_url && setPreviewSrc(c.file_url)}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* ── Generate Batch Modal ── */}
      <Modal open={showBatch} onClose={() => !batchStreaming && setShowBatch(false)} title="Nuevo batch de creativos" className="max-w-lg">
        <form onSubmit={(e) => {
          e.preventDefault();
          generateBatchStream(
            {
              product_name: batchForm.product_description,
              product_description: batchForm.product_description,
              product_id: batchForm.product_id || undefined,
              gallery_name: batchForm.gallery_name || undefined,
              preset_id: batchForm.preset_id,
            },
            () => {
              setShowBatch(false);
              setBatchForm({ gallery_name: "", product_description: "", preset_id: "starter", product_id: "" });
            },
          );
        }} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Nombre de galería</label>
            <input value={batchForm.gallery_name} onChange={(e) => setBatchForm({ ...batchForm, gallery_name: e.target.value })}
              placeholder="Ej: Zapatos deportivos, iPhone Pro, etc." disabled={batchStreaming}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all disabled:opacity-50" />
            <p className="text-xs text-muted-foreground mt-1">Si ya existe una galería con este nombre, las imágenes se acumulan ahí.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">¿Qué quieres generar?</label>
            <textarea value={batchForm.product_description} onChange={(e) => setBatchForm({ ...batchForm, product_description: e.target.value })} required rows={3}
              placeholder="Describe lo que quieres ver: ej. 'iPhone 15 Pro en diferentes estilos de fotografía profesional'" disabled={batchStreaming}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all resize-none disabled:opacity-50" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Vincular a producto (opcional)</label>
            <select value={batchForm.product_id} onChange={(e) => setBatchForm({ ...batchForm, product_id: e.target.value })} disabled={batchStreaming}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all disabled:opacity-50">
              <option value="">Sin vincular</option>
              {products?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Cantidad</label>
            <select value={batchForm.preset_id} onChange={(e) => setBatchForm({ ...batchForm, preset_id: e.target.value })} disabled={batchStreaming}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all disabled:opacity-50">
              <option value="starter">3 imágenes</option>
              <option value="campaign">5 imágenes</option>
              <option value="full">10 imágenes</option>
            </select>
          </div>

          {/* ── Progress bar ── */}
          {batchStreaming && batchProgress && (
            <div className="space-y-2 py-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{batchProgress.message || "Processing..."}</span>
                <span className="text-xs text-cyan-400 font-semibold">{batchProgress.pct}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${batchProgress.pct}%` }}
                />
              </div>
              {batchProgress.detail && (
                <p className="text-[10px] text-muted-foreground">{batchProgress.detail}</p>
              )}
            </div>
          )}

          <button type="submit" disabled={batchStreaming || !batchForm.product_description.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
            {batchStreaming ? (
              <>
                <Spinner className="w-4 h-4 text-primary-foreground" />
                Generating {batchProgress?.stage === "image_ready" ? `(${batchProgress.detail})` : "..."}
              </>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generar</>
            )}
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

      {/* ── Create Gallery Modal ── */}
      <Modal open={showNewGallery} onClose={() => setShowNewGallery(false)} title="Nueva galería">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!newGalleryName.trim()) return;
          createGallery.mutate({ name: newGalleryName.trim() }, {
            onSuccess: () => { setShowNewGallery(false); setNewGalleryName(""); }
          });
        }} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Nombre</label>
            <input value={newGalleryName} onChange={(e) => setNewGalleryName(e.target.value)} required
              placeholder="Ej: Zapatos deportivos"
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
          </div>
          <button type="submit" disabled={createGallery.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
            {createGallery.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : <><FolderPlus className="w-4 h-4" /> Crear galería</>}
          </button>
        </form>
      </Modal>

      {/* ── Edit Gallery Modal ── */}
      <Modal open={!!editingBatch} onClose={() => setEditingBatch(null)} title="Editar galería">
        {editingBatch && (
          <form onSubmit={(e) => {
            e.preventDefault();
            updateGallery.mutate({ id: editingBatch.id, name: editBatchName.trim() }, {
              onSuccess: () => setEditingBatch(null)
            });
          }} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Nombre</label>
              <input value={editBatchName} onChange={(e) => setEditBatchName(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
            </div>
            <button type="submit" disabled={updateGallery.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
              {updateGallery.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : "Guardar"}
            </button>
          </form>
        )}
      </Modal>

      {/* ── Move Creative to Gallery Modal ── */}
      <Modal open={!!movingCreative} onClose={() => setMovingCreative(null)} title="Mover a galería">
        {movingCreative && (
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden max-h-32">
              {movingCreative.file_url && <img src={movingCreative.file_url} alt="" className="w-full h-full object-contain" />}
            </div>
            {movingCreative.batch_id && (
              <button onClick={() => moveCreative.mutate({ creativeId: movingCreative.id, batch_id: null }, { onSuccess: () => setMovingCreative(null) })}
                className="w-full text-xs text-destructive hover:underline font-medium text-left px-3 py-2 bg-destructive/5 rounded-lg border border-destructive/20">
                Quitar de galería actual
              </button>
            )}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Selecciona galería destino</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                {batches?.map((b) => {
                  const isCurrent = movingCreative.batch_id === b.id;
                  return (
                    <button key={b.id}
                      onClick={() => { if (!isCurrent) moveCreative.mutate({ creativeId: movingCreative.id, batch_id: b.id }, { onSuccess: () => setMovingCreative(null) }); }}
                      disabled={isCurrent || moveCreative.isPending}
                      className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors",
                        isCurrent ? "border-primary/50 bg-primary/5 opacity-60" : "border-border hover:bg-accent")}>
                      <FolderOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground block truncate">{b.name}</span>
                        <span className="text-xs text-muted-foreground">{b.creatives?.length ?? 0} imágenes</span>
                      </div>
                      {isCurrent && <span className="text-xs text-primary shrink-0">Actual</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Platform Preview ── */}
      {previewSrc && (
        <PlatformPreview
          src={previewSrc}
          onClose={() => setPreviewSrc(null)}
          brandName={org?.name ?? "your_brand"}
        />
      )}

      {/* ── Lightbox ── */}
      {lightboxSrc && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
          onClick={() => setLightboxSrc(null)}>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button onClick={async (e) => {
              e.stopPropagation();
              try {
                const res = await fetch(lightboxSrc);
                const blob = await res.blob();
                const ext = blob.type.includes("jpeg") ? "jpg" : blob.type.includes("webp") ? "webp" : "png";
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `nexos_${new Date().toISOString().slice(0, 10)}.${ext}`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch { /* ignore */ }
            }} className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors" title="Descargar">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
            <button onClick={() => setLightboxSrc(null)}
              className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors" title="Cerrar">
              <X className="w-5 h-5" />
            </button>
          </div>
          <img src={lightboxSrc} alt="Creative expandido"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* Reusable Creative Card                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CreativeCard({
  creative: c,
  onDelete,
  onAssign,
  onMove,
  onExpand,
  onPreview,
}: {
  creative: CreativeResponse;
  onDelete: () => void;
  onAssign: () => void;
  onMove: () => void;
  onExpand: () => void;
  onPreview: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden group">
      <div className="aspect-square bg-muted flex items-center justify-center relative">
        {c.file_url ? (
          <img src={c.file_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
        )}
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onExpand(); }}
            className="p-1.5 rounded-lg bg-card/90 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Expandir">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onPreview(); }}
            className="p-1.5 rounded-lg bg-card/90 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Preview en plataforma">
            <Monitor className="w-3 h-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMove(); }}
            className="p-1.5 rounded-lg bg-card/90 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Mover a galería">
            <ArrowRightLeft className="w-3 h-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onAssign(); }}
            className="p-1.5 rounded-lg bg-card/90 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Asignar producto">
            <Link2 className="w-3 h-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm("¿Eliminar?")) onDelete(); }}
            className="p-1.5 rounded-lg bg-card/90 border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Eliminar">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="p-2.5 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-foreground capitalize truncate">
            {c.style ?? c.angle ?? "Creative"}
          </span>
          {c.format && <span className="text-[10px] text-muted-foreground">{c.format}</span>}
        </div>
        {c.platform && <p className="text-[10px] text-muted-foreground truncate">{c.platform}</p>}
      </div>
    </div>
  );
}