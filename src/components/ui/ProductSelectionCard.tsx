"use client";

import { useState } from "react";
import {
  Trophy, ShoppingCart, Check, ExternalLink,
  Star, TrendingUp, ChevronDown, ChevronUp, Loader2, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CandidateProduct, ProductBucket } from "@/types";
import { usePersistSelectedProducts } from "@/hooks/use-products";

interface ProductSelectionCardProps {
  /** Productos candidatos que el usuario puede elegir guardar */
  candidateProducts: CandidateProduct[];
  messageId: string;
  /** Si true, el componente se usa dentro de un flow pausado: muestra
   *  el callout "Debes elegir al menos 1 para continuar" y al guardar
   *  invoca onSelectionConfirmed en vez del endpoint estándar. */
  flowMode?: boolean;
  /** Callback cuando el usuario confirma la selección en flowMode */
  onSelectionConfirmed?: (products: CandidateProduct[]) => void | Promise<void>;
  /** Callback cuando el usuario cancela en flowMode */
  onCancel?: () => void;
  /** Loading externo (para flowMode mientras el resume está corriendo) */
  isConfirming?: boolean;
}

function bucketStyle(bucket: ProductBucket | null | undefined) {
  switch (bucket) {
    case "winner":
      return {
        label: "Winner",
        icon: Trophy,
        text: "text-emerald-400",
        bg: "bg-emerald-400/10",
        border: "border-emerald-400/30",
      };
    case "potential":
      return {
        label: "Potencial",
        icon: TrendingUp,
        text: "text-amber-400",
        bg: "bg-amber-400/10",
        border: "border-amber-400/30",
      };
    case "rejected":
    default:
      return {
        label: "Descartado",
        icon: AlertTriangle,
        text: "text-rose-400",
        bg: "bg-rose-400/10",
        border: "border-rose-400/30",
      };
  }
}

function bucketFromScore(score: number): ProductBucket {
  if (score >= 75) return "winner";
  if (score >= 50) return "potential";
  return "rejected";
}

export function ProductSelectionCard({
  candidateProducts,
  messageId,
  flowMode = false,
  onSelectionConfirmed,
  onCancel,
  isConfirming = false,
}: ProductSelectionCardProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const persist = usePersistSelectedProducts();

  if (!candidateProducts || candidateProducts.length === 0) return null;

  const toggle = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(candidateProducts.map((_, i) => i)));
  };
  const clearAll = () => setSelected(new Set());

  const handleSave = async () => {
    if (selected.size === 0) return;
    const toSave = [...selected].map((i) => candidateProducts[i]);

    if (flowMode && onSelectionConfirmed) {
      await onSelectionConfirmed(toSave);
      // No marcamos saved; el padre desmonta el componente al reanudar.
      return;
    }

    if (persist.isPending) return;
    await persist.mutateAsync(toSave);
    setSaved(true);
    setSelected(new Set());
  };

  const isLoading = isConfirming || persist.isPending;
  const winnerCount = candidateProducts.filter((p) => (p.bucket ?? bucketFromScore(p.score_total)) === "winner").length;
  const potentialCount = candidateProducts.filter((p) => (p.bucket ?? bucketFromScore(p.score_total)) === "potential").length;
  const rejectedCount = candidateProducts.length - winnerCount - potentialCount;

  return (
    <div className="mt-3 border border-border/50 rounded-xl overflow-hidden bg-background/30">
      {/* ── Header ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <ShoppingCart className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium text-emerald-400">
            {flowMode ? "Selecciona productos para continuar" : "Productos detectados"}
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-foreground/10 text-foreground text-[10px] font-medium">
            {candidateProducts.length} candidato{candidateProducts.length !== 1 ? "s" : ""}
          </span>
          {winnerCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 text-[10px] font-medium">
              {winnerCount} winner{winnerCount !== 1 ? "s" : ""}
            </span>
          )}
          {potentialCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-medium">
              {potentialCount} potencial{potentialCount !== 1 ? "es" : ""}
            </span>
          )}
          {rejectedCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-400/10 text-rose-400 text-[10px] font-medium">
              {rejectedCount} descartado{rejectedCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {isOpen && !saved && (
        <div className="px-3 pb-3 space-y-2">
          {/* Aviso flowMode */}
          {flowMode && (
            <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-amber-400/5 border border-amber-400/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-200/90 leading-snug">
                El flow está pausado. Debes elegir al menos 1 producto para
                continuar con los siguientes pasos. Solo los productos elegidos
                se guardarán y se usarán en el resto del flow.
              </p>
            </div>
          )}

          {/* Toolbar (sticky para que el contador + Todos/Ninguno sigan
              visibles mientras se scrollea la lista larga) */}
          <div className="flex items-center justify-between gap-2 sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-1.5 -mx-3 px-3 border-b border-border/30">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Elige cuáles guardar ({selected.size}/{candidateProducts.length})
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={selectAll}
                className="text-[10px] text-violet-400 hover:underline"
                disabled={isLoading}
              >
                Todos
              </button>
              <span className="text-[10px] text-muted-foreground">·</span>
              <button
                onClick={clearAll}
                className="text-[10px] text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                Ninguno
              </button>
            </div>
          </div>

          {/* Lista de candidatos — con scroll interno para que la card no
              crezca indefinidamente cuando hay 20+ candidatos. En móvil
              usamos una altura más pequeña (~40vh) porque el sticky no
              funciona bien dentro del scroll del chat: si la card ocupa
              más que la viewport, el usuario no puede alcanzar las
              acciones. En desktop subimos a ~55vh. */}
          <div className="relative">
            <div
              className={cn(
                "space-y-1.5 overflow-y-auto pr-1",
                "max-h-[40vh] sm:max-h-[min(55vh,32rem)]",
                // Scrollbar sutil que no compita con el contenido
                "[scrollbar-width:thin]",
                "[scrollbar-color:rgb(from_var(--border)_r_g_b/0.6)_transparent]",
                "[&::-webkit-scrollbar]:w-1.5",
                "[&::-webkit-scrollbar-track]:bg-transparent",
                "[&::-webkit-scrollbar-thumb]:bg-border/60",
                "[&::-webkit-scrollbar-thumb]:rounded-full",
                "[&::-webkit-scrollbar-thumb:hover]:bg-border",
                // Touch scrolling suave en iOS
                "overscroll-contain",
              )}
            >
              {candidateProducts.map((p, idx) => {
                const isSelected = selected.has(idx);
                const bucket = p.bucket ?? bucketFromScore(p.score_total);
                const style = bucketStyle(bucket);
                const Icon = style.icon;

                return (
                  <button
                    key={`${messageId}-${idx}`}
                    onClick={() => toggle(idx)}
                    disabled={isLoading}
                    className={cn(
                      "w-full flex items-start gap-2 sm:gap-3 px-2 sm:px-2.5 py-2 rounded-lg border transition-all text-left",
                      isSelected
                        ? `${style.bg} ${style.border}`
                        : "bg-accent/10 border-border/50 hover:bg-accent/30 hover:border-border",
                      isLoading && "opacity-60 cursor-not-allowed",
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

                    {/* Info — en móvil, badges van DEBAJO del título
                        para que el nombre del producto tenga espacio real
                        y no quede truncado a 'Cons...'. En sm+ vuelven a
                        la derecha para aprovechar el ancho. */}
                    <div className="flex-1 min-w-0">
                      {/* Fila 1: título + badges (se apilan en móvil) */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                        <p className="text-xs font-medium text-foreground line-clamp-2 sm:truncate sm:min-w-0 sm:flex-1 leading-snug">
                          {p.name}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={cn("flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full", style.bg, style.text)}>
                            <Icon className="w-2.5 h-2.5" />
                            {style.label}
                          </span>
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", style.bg, style.text)}>
                            {Math.round(p.score_total)}
                          </span>
                        </div>
                      </div>
                      {/* Fila 2: metadata */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                        isSelected ? `${style.text.replace("text-", "bg-")} border-transparent` : "border-border",
                      )}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-black" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Gradiente inferior para sugerir que hay más contenido.
                Solo aparece cuando la lista excede la altura máxima. */}
            {candidateProducts.length > 6 && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-1 h-6 bg-gradient-to-t from-background/80 to-transparent rounded-b-lg" />
            )}
          </div>

          {/* Acciones — sticky bottom para que siempre estén accesibles
              sin tener que llegar al final del scroll */}
          <div className="flex items-center gap-2 pt-2 sticky bottom-0 bg-background/95 backdrop-blur-sm -mx-3 px-3 pb-1 -mb-1 border-t border-border/30 mt-2">
            {flowMode && onCancel && (
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="py-2 px-3 rounded-lg border border-border text-muted-foreground text-xs font-medium hover:bg-accent/30 hover:text-foreground transition-colors disabled:opacity-60 shrink-0 sm:flex-1"
              >
                <span className="sm:hidden">Cancelar</span>
                <span className="hidden sm:inline">Cancelar flow</span>
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={selected.size === 0 || isLoading}
              className={cn(
                "py-2 px-3 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5 min-w-0",
                flowMode ? "flex-1" : "w-full",
                "bg-emerald-400 text-black hover:bg-emerald-300",
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span className="truncate">
                    {flowMode ? "Continuando..." : "Guardando..."}
                  </span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {flowMode ? (
                      <>
                        <span className="sm:hidden">Continuar ({selected.size})</span>
                        <span className="hidden sm:inline">Elegir {selected.size} y continuar</span>
                      </>
                    ) : (
                      <>
                        <span className="sm:hidden">Guardar ({selected.size})</span>
                        <span className="hidden sm:inline">
                          Guardar {selected.size} producto{selected.size !== 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Confirmación post-guardado (solo modo chat) */}
      {saved && !flowMode && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs text-emerald-400">
              Productos guardados correctamente en tu catálogo
            </span>
          </div>
        </div>
      )}
    </div>
  );
}