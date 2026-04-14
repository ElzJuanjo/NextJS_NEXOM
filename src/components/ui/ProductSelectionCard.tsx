"use client";

import { useState } from "react";
import {
  Trophy, ShoppingCart, Check, ExternalLink,
  Star, TrendingUp, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectableProduct } from "@/types";
import { usePersistSelectedProducts } from "@/hooks/use-products";

interface ProductSelectionCardProps {
  /** IDs de winners ya autopersistidos — se muestran como "Ya registrado" */
  persistedProductIds: string[];
  /** Productos potenciales (score 50-74) que el usuario puede elegir guardar */
  selectableProducts: SelectableProduct[];
  messageId: string;
}

export function ProductSelectionCard({
  persistedProductIds,
  selectableProducts,
  messageId,
}: ProductSelectionCardProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const persist = usePersistSelectedProducts();

  const hasWinners = persistedProductIds.length > 0;
  const hasPotentials = selectableProducts.length > 0;

  if (!hasWinners && !hasPotentials) return null;

  const toggle = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.size === 0 || persist.isPending) return;
    const toSave = [...selected].map((i) => selectableProducts[i]);
    await persist.mutateAsync(toSave);
    setSaved(true);
    setSelected(new Set());
  };

  return (
    <div className="mt-3 border border-border/50 rounded-xl overflow-hidden bg-background/30">
      {/* ── Header toggle ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <ShoppingCart className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium text-emerald-400">Productos detectados</span>
          {hasWinners && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 text-[10px] font-medium">
              {persistedProductIds.length} winner{persistedProductIds.length !== 1 ? "s" : ""} auto-guardados
            </span>
          )}
          {hasPotentials && !saved && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-medium">
              {selectableProducts.length} potencial{selectableProducts.length !== 1 ? "es" : ""} disponibles
            </span>
          )}
        </div>
        {isOpen
          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        }
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-3">

          {/* ── Winners (already saved) ── */}
          {hasWinners && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 pt-1">
                <Trophy className="w-3 h-3 text-emerald-400" />
                Auto-guardados · Score ≥ 75
              </p>
              {persistedProductIds.map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-emerald-400/5 border border-emerald-400/20"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs text-emerald-400 font-medium">
                    Ya registrado en tu catálogo
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── Potentials (user selects) ── */}
          {hasPotentials && !saved && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-amber-400" />
                Potenciales · Score 50-74 — selecciona cuáles guardar
              </p>

              {selectableProducts.map((p, idx) => {
                const isSelected = selected.has(idx);
                return (
                  <button
                    key={`${messageId}-${idx}`}
                    onClick={() => toggle(idx)}
                    className={cn(
                      "w-full flex items-start gap-3 px-2.5 py-2 rounded-lg border transition-all text-left",
                      isSelected
                        ? "bg-amber-400/10 border-amber-400/30"
                        : "bg-accent/10 border-border/50 hover:bg-accent/30 hover:border-border"
                    )}
                  >
                    {/* Thumbnail */}
                    {p.image_url && (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-10 h-10 rounded object-cover border border-border shrink-0 mt-0.5"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                            p.score_total >= 65
                              ? "bg-amber-400/10 text-amber-400"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {Math.round(p.score_total)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {p.rating != null && p.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Star className="w-2.5 h-2.5" />
                            {p.rating}
                          </span>
                        )}
                        {p.monthly_sales != null && p.monthly_sales > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            ~{p.monthly_sales} ventas/mes
                          </span>
                        )}
                        {p.source_platform && (
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {p.source_platform.replace("_", " ")}
                          </span>
                        )}
                        {p.source_url && (
                          <a
                            href={p.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] text-violet-400 hover:underline flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            Ver
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-1",
                        isSelected
                          ? "bg-amber-400 border-amber-400"
                          : "border-border"
                      )}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-black" />}
                    </div>
                  </button>
                );
              })}

              {/* Save CTA */}
              {selected.size > 0 && (
                <button
                  onClick={handleSave}
                  disabled={persist.isPending}
                  className="w-full mt-1 py-2 px-3 rounded-lg bg-amber-400 text-black text-xs font-semibold hover:bg-amber-300 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {persist.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Guardar {selected.size} producto{selected.size !== 1 ? "s" : ""} al catálogo
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* ── Saved confirmation ── */}
          {saved && (
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-xs text-emerald-400">
                Productos guardados correctamente en tu catálogo
              </span>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
