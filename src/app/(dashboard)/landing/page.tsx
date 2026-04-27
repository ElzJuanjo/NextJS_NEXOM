"use client";

import { useState } from "react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent, DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Layout, Eye, Trash2, ChevronDown, ChevronRight,
  ChevronUp, Edit3, EyeOff, Download, GripVertical, Code, Plus, Palette, X, Copy, Sparkles,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useBrands, useUpdateBrand } from "@/hooks/use-brands";
import { confirmDelete } from "@/lib/swal";
import { useCreatives } from "@/hooks/use-creatives";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLandingPages, useCreateLanding, useDeleteLanding, useUpdateLanding,
  useAddSection, useUpdateSection, useDeleteSection,
  useReorderSections, useDuplicateSection, useRegenerateSection, useRenderHTML,
  useDuplicateLanding, useSectionPreview,
} from "@/hooks/use-landing-pages";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { LandingPageResponse, LandingSectionResponse } from "@/types";
import { useRouter } from "next/navigation";

const SECTION_TYPES = [
  // Conversión core
  { id: "hero", label: "Hero", icon: "🎯", category: "core", desc: "Headline + CTA principal" },
  { id: "urgency_banner", label: "Banner Urgencia", icon: "🔥", category: "core", desc: "Oferta + countdown top" },
  { id: "stats_bar", label: "Stats Bar", icon: "📊", category: "core", desc: "Métricas de credibilidad" },
  { id: "offer", label: "Oferta", icon: "💰", category: "core", desc: "Precio + paquete + garantía" },
  { id: "cta", label: "CTA Final", icon: "🚀", category: "core", desc: "Cierre con urgencia" },
  // Prueba social
  { id: "testimonials", label: "Testimonios", icon: "💬", category: "proof", desc: "3 testimonials con métricas" },
  { id: "case_study", label: "Caso de Éxito", icon: "🏆", category: "proof", desc: "Métrica gigante + narrativa" },
  { id: "logo_wall", label: "Logo Wall", icon: "🏢", category: "proof", desc: "Logos de clientes/medios" },
  { id: "trust_badges", label: "Trust Badges", icon: "🛡️", category: "proof", desc: "Envío, garantía, seguridad" },
  { id: "social_proof", label: "Social Proof", icon: "⭐", category: "proof", desc: "Rating + contador usuarios" },
  // Producto
  { id: "features", label: "Features", icon: "⚡", category: "product", desc: "Grid de características" },
  { id: "benefits", label: "Beneficios", icon: "✨", category: "product", desc: "FAB: icon + título + desc" },
  { id: "specs", label: "Especificaciones", icon: "📋", category: "product", desc: "Tabla técnica" },
  { id: "gallery", label: "Carrusel", icon: "🎠", category: "product", desc: "Galería de imágenes" },
  { id: "product_gallery", label: "Galería Producto", icon: "📸", category: "product", desc: "Producto + variantes" },
  { id: "video_embed", label: "Video", icon: "🎬", category: "product", desc: "YouTube/Vimeo embed" },
  // Estructura
  { id: "problem", label: "Problema", icon: "😤", category: "structure", desc: "PAS: dolor del cliente" },
  { id: "solution", label: "Solución", icon: "💡", category: "structure", desc: "Puente problema→producto" },
  { id: "process_steps", label: "Cómo Funciona", icon: "🔢", category: "structure", desc: "Pasos numerados 1→5" },
  { id: "transformation", label: "Transformación", icon: "🔄", category: "structure", desc: "Antes / Después" },
  { id: "brand_story", label: "Historia", icon: "📖", category: "structure", desc: "Narrativa de marca" },
  // Soporte
  { id: "comparison", label: "Comparativa", icon: "⚖️", category: "support", desc: "Nosotros vs competencia" },
  { id: "faq", label: "FAQ", icon: "❓", category: "support", desc: "Preguntas de objeciones" },
  { id: "countdown", label: "Countdown", icon: "⏳", category: "support", desc: "Timer de urgencia" },
  { id: "lead_form", label: "Lead Form", icon: "📋", category: "support", desc: "Formulario de captura" },
  { id: "custom", label: "Custom", icon: "📝", category: "support", desc: "Sección libre" },
];

const SECTION_CATEGORIES = [
  { id: "core", label: "Conversión Core" },
  { id: "proof", label: "Prueba Social" },
  { id: "product", label: "Producto" },
  { id: "structure", label: "Estructura" },
  { id: "support", label: "Soporte" },
];

const TEMPLATES = [
  { id: "modern", name: "Modern", description: "Gradientes aurora, SaaS premium",
    colors: { hero: "#06040F", primary: "#6D28D9", content: "#0E0B1A", line: "rgba(255,255,255,.12)" } },
  { id: "minimal", name: "Minimal", description: "Swiss grid, editorial puro",
    colors: { hero: "#111827", primary: "#111827", content: "#FFFFFF", line: "rgba(0,0,0,.1)" } },
  { id: "bold", name: "Bold", description: "Neo-brutalist, alto contraste",
    colors: { hero: "#0A0A0A", primary: "#DC2626", content: "#0A0A0A", line: "rgba(255,255,255,.12)" } },
  { id: "ecommerce", name: "E-Commerce", description: "Estilo Shopify, conversión máxima",
    colors: { hero: "#FBF9F7", primary: "#2563EB", content: "#FFFFFF", line: "rgba(0,0,0,.08)" } },
  { id: "dark", name: "Dark", description: "Void + neón, cyberpunk editorial",
    colors: { hero: "#030712", primary: "#06B6D4", content: "#0A0F1E", line: "rgba(6,182,212,.18)" } },
  { id: "elegant", name: "Elegant", description: "Serif, crema y oro, lujo",
    colors: { hero: "#F9F6F0", primary: "#92763A", content: "#FFFFFF", line: "rgba(0,0,0,.07)" } },
];

function getSectionMeta(type: string) {
  return SECTION_TYPES.find((s) => s.id === type) || { id: type, label: type, icon: "📄" };
}

interface SortableSectionItemProps {
  section: import("@/types").LandingSectionResponse;
  idx: number;
  totalCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisibility: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  onDelete: () => void;
}

function SortableSectionItem({ section, idx, totalCount, onMoveUp, onMoveDown, onToggleVisibility, onEdit, onDuplicate, onRegenerate, isRegenerating, onDelete }: SortableSectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const meta = getSectionMeta(section.section_type);
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, position: "relative", zIndex: isDragging ? 10 : "auto" as never }}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors",
        section.is_visible ? "bg-muted/50 border-border" : "bg-muted/20 border-border/50 opacity-50",
        isRegenerating && "ring-1 ring-violet-500/40 bg-violet-500/5",
      )}>
      <button {...attributes} {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground hover:text-foreground shrink-0">
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <span className="text-sm shrink-0">{meta.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-blue-400">{meta.label}</span>
          {section.ab_group && <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none", section.ab_group === "b" ? "bg-orange-500/20 text-orange-400" : "bg-emerald-500/20 text-emerald-400")}>V{section.ab_group.toUpperCase()}</span>}
          {isRegenerating && <span className="text-[10px] text-violet-400 animate-pulse">Generando con IA…</span>}
          {!isRegenerating && section.title && <span className="text-xs text-muted-foreground truncate">— {section.title}</span>}
        </div>
        {!isRegenerating && section.body && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {section.body.slice(0, 80)}{section.body.length > 80 ? "..." : ""}
          </p>
        )}
        {section.image_url && (
          <img src={section.image_url} alt="" className="mt-1 w-12 h-12 rounded-lg object-cover inline-block border border-border" />
        )}
        {section.images && (section.images as string[]).length > 0 && (
          <div className="flex gap-1 mt-1">
            {(section.images as string[]).slice(0, 4).map((img, i) => (
              <img key={i} src={img} alt="" className="w-10 h-10 rounded-lg object-cover border border-border" />
            ))}
            {(section.images as string[]).length > 4 && (
              <span className="text-[10px] text-muted-foreground self-center">+{(section.images as string[]).length - 4}</span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <button onClick={onMoveUp} disabled={idx === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
          <ChevronUp className="w-3 h-3" />
        </button>
        <button onClick={onMoveDown} disabled={idx === totalCount - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
          <ChevronDown className="w-3 h-3" />
        </button>
        <button onClick={onToggleVisibility} className="p-1 text-muted-foreground hover:text-foreground" title={section.is_visible ? "Ocultar" : "Mostrar"}>
          {section.is_visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>
        <button onClick={onEdit} className="p-1 text-muted-foreground hover:text-blue-400" title="Editar">
          <Edit3 className="w-3 h-3" />
        </button>
        <button onClick={onRegenerate} disabled={isRegenerating} className="p-1 text-muted-foreground hover:text-violet-400 disabled:opacity-40" title="Regenerar con IA">
          <Sparkles className={cn("w-3 h-3", isRegenerating && "animate-spin text-violet-400")} />
        </button>
        <button onClick={onDuplicate} className="p-1 text-muted-foreground hover:text-emerald-400" title="Duplicar">
          <Copy className="w-3 h-3" />
        </button>
        <button onClick={onDelete} className="p-1 text-muted-foreground hover:text-destructive" title="Eliminar">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { data: brands } = useBrands();
  const queryClient = useQueryClient();
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("all");

  const brandFilterParam = selectedBrandFilter === "all" ? undefined : selectedBrandFilter;

  const { data: pages, isLoading } = useLandingPages(brandFilterParam);
  const createLanding = useCreateLanding();
  const deleteLanding = useDeleteLanding();
  const updateLanding = useUpdateLanding();
  const addSection = useAddSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const reorderSections = useReorderSections();
  const duplicateSection = useDuplicateSection();
  const regenerateSection = useRegenerateSection();
  const duplicateLanding = useDuplicateLanding();
  const { html: previewHTML, loading: previewLoading, render: renderPreview, clear: clearPreview } = useRenderHTML();
  const { html: sectionPreviewHTML, loading: sectionPreviewLoading, render: renderSectionPreview, clear: clearSectionPreview } = useSectionPreview();
  const [sectionEditTab, setSectionEditTab] = useState<"edit" | "preview">("edit");
  const [regeneratingSectionId, setRegeneratingSectionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [draggingSection, setDraggingSection] = useState<import("@/types").LandingSectionResponse | null>(null);

  const handleDragStart = (sections: import("@/types").LandingSectionResponse[], event: { active: { id: string } }) => {
    setDraggingSection(sections.find(s => s.id === event.active.id) ?? null);
  };

  const handleDragEnd = (lpId: string, sections: import("@/types").LandingSectionResponse[], event: DragEndEvent) => {
    setDraggingSection(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex(s => s.id === active.id);
    const newIdx = sections.findIndex(s => s.id === over.id);
    reorderSections.mutate({ lpId, sectionIds: arrayMove(sections, oldIdx, newIdx).map(s => s.id) });
  };
  const updateBrand = useUpdateBrand();

  const [expandedLanding, setExpandedLanding] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<LandingSectionResponse | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewLpId, setPreviewLpId] = useState<string | null>(null);
  const [addingSectionTo, setAddingSectionTo] = useState<string | null>(null);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [styleTargetLpId, setStyleTargetLpId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", campaign: "" });
  const [sectionForm, setSectionForm] = useState({ title: "", body: "", cta_text: "", cta_url: "", image_url: "", images: [] as string[], content: {} as Record<string, unknown>, ab_group: "" as string });
  const [showSeoPanel, setShowSeoPanel] = useState<string | null>(null);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState<string | null>(null);
  const [newSectionType, setNewSectionType] = useState("custom");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [editingName, setEditingName] = useState<{ lpId: string; name: string } | null>(null);

  const [styleForm, setStyleForm] = useState({
    primary: "#7C3AED",
    secondary: "#3E1B48",
    accent: "#F0ABFC",
    background: "#ffffff",
    text: "#1a1a2e",
    heading_font: "Inter",
    body_font: "Inter",
  });

  const openStyleEditor = (lp: LandingPageResponse) => {
    const brand = lp.brand_id ? brands?.find((b) => b.id === lp.brand_id) : null;
    const palette = (brand?.color_palette || {}) as Record<string, string>;
    const typo = (brand?.typography || {}) as Record<string, string>;
    setStyleForm({
      primary: palette.primary || "#7C3AED",
      secondary: palette.secondary || "#3E1B48",
      accent: palette.accent || "#F0ABFC",
      background: palette.background || "#ffffff",
      text: palette.text || "#1a1a2e",
      heading_font: typo.heading_font || "Inter",
      body_font: typo.body_font || "Inter",
    });
    setStyleTargetLpId(lp.id);
    setShowStyleEditor(true);
  };

  const handleSaveStyle = async () => {
    if (!styleTargetLpId) return;
    const lp = pages?.find((p) => p.id === styleTargetLpId);
    if (!lp) return;

    const colorPalette = {
      primary: styleForm.primary,
      secondary: styleForm.secondary,
      accent: styleForm.accent,
      background: styleForm.background,
      text: styleForm.text,
    };
    const typography = {
      heading_font: styleForm.heading_font,
      body_font: styleForm.body_font,
    };

    if (lp.brand_id) {
      updateBrand.mutate(
        { id: lp.brand_id, color_palette: colorPalette, typography },
        { onSuccess: () => setShowStyleEditor(false) },
      );
    } else {
      try {
        const { brandService } = await import("@/services/brand.service");
        const newBrand = await brandService.create({
          name: `${lp.name} — Brand`,
          color_palette: colorPalette,
          typography,
        });
        queryClient.invalidateQueries({ queryKey: ["brands"] });
        updateLanding.mutate(
          { lpId: lp.id, body: { brand_id: newBrand.id } },
          { onSuccess: () => setShowStyleEditor(false) },
        );
      } catch {
        // handled by service
      }
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleEditSection = (section: LandingSectionResponse) => {
    setEditingSection(section);
    setSectionForm({
      title: section.title || "",
      body: section.body || "",
      cta_text: section.cta_text || "",
      cta_url: section.cta_url || "",
      image_url: section.image_url || "",
      images: (section.images as string[]) || [],
      content: (section.content as Record<string, unknown>) || {},
      ab_group: (section as { ab_group?: string }).ab_group || "",
    });
  };

  const handleSaveSection = () => {
    if (!editingSection) return;
    updateSection.mutate(
      { sectionId: editingSection.id, body: sectionForm },
      {
        onSuccess: () => {
          if (showPreview && previewLpId) renderPreview(previewLpId);
          // Switch to preview tab so user sees the saved result
          setSectionEditTab("preview");
          renderSectionPreview(editingSection.landing_page_id, editingSection.id);
        },
      },
    );
  };

  const handleAddSection = () => {
    if (!addingSectionTo || !newSectionTitle.trim()) return;
    const lp = pages?.find((p) => p.id === addingSectionTo);
    const maxOrder = lp?.sections.reduce((max, s) => Math.max(max, s.order), 0) ?? 0;

    addSection.mutate(
      {
        lpId: addingSectionTo,
        body: {
          section_type: newSectionType,
          title: newSectionTitle.trim(),
          order: maxOrder + 1,
        },
      },
      {
        onSuccess: () => {
          setAddingSectionTo(null);
          setNewSectionTitle("");
          setNewSectionType("custom");
        },
      },
    );
  };

  const handleMoveSection = (lp: LandingPageResponse, sectionId: string, direction: "up" | "down") => {
    const sorted = [...lp.sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === sectionId);
    if (idx < 0) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sorted.length - 1) return;

    const newSorted = [...sorted];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newSorted[idx], newSorted[swapIdx]] = [newSorted[swapIdx], newSorted[idx]];

    reorderSections.mutate({ lpId: lp.id, sectionIds: newSorted.map((s) => s.id) });
  };

  const handlePreview = (lpId: string) => {
    setPreviewLpId(lpId);
    renderPreview(lpId);
    setShowPreview(true);
  };

  const handleExport = async (lpId: string, format: "html" | "shopify" | "wordpress") => {
    try {
      const { landingService } = await import("@/services/landing.service");
      const lp = pages?.find((p) => p.id === lpId);
      const baseName = (lp?.name || "landing").replace(/\s+/g, "-").toLowerCase();

      let blob: Blob;
      let ext: string;

      if (format === "shopify") {
        const content = await landingService.exportShopify(lpId);
        blob = new Blob([content], { type: "text/plain" });
        ext = "liquid";
      } else if (format === "wordpress") {
        const content = await landingService.exportWordPress(lpId);
        blob = new Blob([content], { type: "text/html" });
        ext = "html";
      } else {
        blob = await landingService.exportHTML(lpId);
        ext = "html";
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // handled in service
    }
  };

  const handleToggleVisibility = (section: LandingSectionResponse) => {
    updateSection.mutate({ sectionId: section.id, body: { is_visible: !section.is_visible } });
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Landing Pages"
        subtitle="Diseña y gestiona landing pages de alta conversión"
      />

      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {/* Brand filter */}
        {brands && brands.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-2">
            <span className="text-xs text-muted-foreground shrink-0">Filtrar:</span>
            <button onClick={() => setSelectedBrandFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all",
                selectedBrandFilter === "all"
                  ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}>
              Todas
            </button>
            {brands.map((b) => (
              <button key={b.id} onClick={() => setSelectedBrandFilter(b.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all",
                  selectedBrandFilter === b.id
                    ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}>
                {b.name}
              </button>
            ))}
          </div>
        )}

        {/* Landing pages list */}
        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : !pages?.length ? (
          <EmptyState icon={Layout} title="Sin landing pages"
            description="Usa el agente de landing desde el orquestador para generar tu primera página de venta."
            action={{ label: "Ir al Orquestador", onClick: () => router.push("/orchestrator") }} />
        ) : (
          <div className="space-y-3">
            {pages.map((lp) => {
              const isExpanded = expandedLanding === lp.id;
              const sortedSections = [...lp.sections].sort((a, b) => a.order - b.order);

              return (
                <div key={lp.id} className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
                  {/* Landing header */}
                  <div onClick={() => setExpandedLanding(isExpanded ? null : lp.id)}
                    className="flex items-center gap-3 px-5 py-4 hover:bg-accent/30 transition-colors cursor-pointer">
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <Layout className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                      {editingName?.lpId === lp.id ? (
                        <input
                          autoFocus
                          value={editingName.name}
                          onChange={(e) => setEditingName({ ...editingName, name: e.target.value })}
                          onBlur={() => {
                            if (editingName.name.trim() && editingName.name !== lp.name) {
                              updateLanding.mutate({ lpId: lp.id, body: { name: editingName.name.trim() } });
                            }
                            setEditingName(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              (e.target as HTMLInputElement).blur();
                            } else if (e.key === "Escape") {
                              setEditingName(null);
                            }
                          }}
                          className="text-sm font-semibold text-foreground bg-secondary border border-ring rounded px-2 py-0.5 w-full outline-none"
                        />
                      ) : (
                        <p
                          className="text-sm font-semibold text-foreground truncate cursor-pointer hover:text-blue-400 transition-colors"
                          onClick={() => setEditingName({ lpId: lp.id, name: lp.name })}
                          title="Click to edit name"
                        >
                          {lp.name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground cursor-pointer" onClick={() => setExpandedLanding(isExpanded ? null : lp.id)}>
                        {lp.sections.length} secciones · {formatRelativeTime(lp.created_at)}
                        {lp.campaign && ` · ${lp.campaign}`}
                      </p>
                    </div>
                    <StatusBadge status={lp.status} />
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handlePreview(lp.id)}
                        className="p-1.5 rounded-md hover:bg-blue-400/10 transition-colors" title="Preview">
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                      <div className="relative group/export">
                        <button className="p-1.5 rounded-md hover:bg-emerald-400/10 transition-colors" title="Export">
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-xl py-1 opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-50 min-w-[160px]">
                          <button onClick={() => handleExport(lp.id, "html")}
                            className="w-full px-3 py-2 text-left text-xs hover:bg-accent transition-colors flex items-center gap-2">
                            <Code className="w-3 h-3 text-blue-400" /> HTML estático
                          </button>
                          <button onClick={() => handleExport(lp.id, "shopify")}
                            className="w-full px-3 py-2 text-left text-xs hover:bg-accent transition-colors flex items-center gap-2">
                            <span className="w-3 h-3 text-[10px] leading-none">🛒</span> Shopify Liquid
                          </button>
                          <button onClick={() => handleExport(lp.id, "wordpress")}
                            className="w-full px-3 py-2 text-left text-xs hover:bg-accent transition-colors flex items-center gap-2">
                            <span className="w-3 h-3 text-[10px] leading-none">📝</span> WordPress
                          </button>
                        </div>
                      </div>
                      <button onClick={() => duplicateLanding.mutate(lp.id)}
                        disabled={duplicateLanding.isPending}
                        className="p-1.5 rounded-md hover:bg-violet-400/10 transition-colors disabled:opacity-40" title="Duplicar landing">
                        <Copy className="w-3.5 h-3.5 text-violet-400" />
                      </button>
                      <button onClick={async () => { if (await confirmDelete("¿Eliminar esta landing page?")) deleteLanding.mutate(lp.id); }}
                        className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>

                  {/* Sections detail */}
                  {isExpanded && (
                    <div className="px-5 pb-4 pt-1 border-t border-border space-y-2">
                      {/* Brand assignment + Status */}
                      <div className="flex items-center gap-4 py-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground shrink-0">Marca:</span>
                          <select
                            value={lp.brand_id || ""}
                            onChange={(e) => {
                              const val = e.target.value || null;
                              updateLanding.mutate({ lpId: lp.id, body: { brand_id: val } });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground outline-none focus:border-ring transition-all"
                          >
                            <option value="">Sin marca</option>
                            {brands?.map((b) => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                          {lp.brand_id && brands?.find((b) => b.id === lp.brand_id)?.color_palette && (
                            <div className="flex items-center gap-1">
                              {Object.values(brands.find((b) => b.id === lp.brand_id)?.color_palette || {}).filter(Boolean).slice(0, 3).map((color, i) => (
                                <div key={i} className="w-3.5 h-3.5 rounded-full border border-border" style={{ background: color as string }} />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Publish flow */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground shrink-0">Estado:</span>
                            <button
                              onClick={() => updateLanding.mutate({ lpId: lp.id, body: { status: lp.status === "published" ? "draft" : "published" } })}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                                lp.status === "published"
                                  ? "bg-emerald-400/15 text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/25"
                                  : "bg-amber-400/10 text-amber-400 border-amber-400/25 hover:bg-amber-400/20"
                              )}
                            >
                              <span className={cn("w-1.5 h-1.5 rounded-full", lp.status === "published" ? "bg-emerald-400" : "bg-amber-400")} />
                              {lp.status === "published" ? "Publicado" : "Borrador"}
                            </button>
                            {lp.published_at && lp.status === "published" && (
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(lp.published_at).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              defaultValue={lp.published_url || ""}
                              onBlur={(e) => {
                                const url = e.target.value.trim();
                                if (url !== (lp.published_url || "")) {
                                  updateLanding.mutate({ lpId: lp.id, body: { published_url: url || undefined } });
                                }
                              }}
                              placeholder="https://tutienda.com/landing"
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground outline-none focus:border-ring transition-all placeholder:text-muted-foreground/60 min-w-0"
                            />
                            {lp.published_url && (
                              <button
                                onClick={() => { navigator.clipboard.writeText(lp.published_url!); }}
                                className="shrink-0 p-1.5 rounded-lg border border-border bg-secondary hover:bg-accent transition-colors"
                                title="Copiar URL"
                              >
                                <Copy className="w-3 h-3 text-muted-foreground" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Diseño IA toggle */}
                      {lp.custom_css && (
                        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                          <div className="flex items-center gap-1.5">
                            <span className={lp.use_custom_css ? "text-violet-400" : "text-muted-foreground"}>✦</span>
                            <span className={cn("text-[11px] font-medium", lp.use_custom_css ? "text-violet-300" : "text-muted-foreground")}>
                              Diseño IA {lp.use_custom_css ? "activo" : "pausado"}
                            </span>
                          </div>
                          <button
                            className={cn(
                              "relative w-8 h-4 rounded-full transition-colors shrink-0",
                              lp.use_custom_css ? "bg-violet-500" : "bg-muted"
                            )}
                            onClick={() => updateLanding.mutate({ lpId: lp.id, body: { use_custom_css: !lp.use_custom_css } })}
                            title={lp.use_custom_css ? "Pausar diseño IA (usa template)" : "Activar diseño IA"}
                          >
                            <span className={cn(
                              "absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all",
                              lp.use_custom_css ? "left-[18px]" : "left-0.5"
                            )} />
                          </button>
                        </div>
                      )}

                      {/* Template selector */}
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs shrink-0", lp.custom_css ? "text-muted-foreground/50" : "text-muted-foreground")}>Template:</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {TEMPLATES.map((t) => {
                            const isActive = (lp.template || "modern") === t.id;
                            return (
                              <button
                                key={t.id}
                                onClick={() => updateLanding.mutate({ lpId: lp.id, body: { template: t.id } })}
                                className={cn(
                                  "flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all",
                                  isActive
                                    ? "border-blue-400/50 bg-blue-400/10 ring-1 ring-blue-400/20"
                                    : "border-border hover:border-border/80 hover:bg-accent/50"
                                )}
                                title={t.description}
                              >
                                {/* Mini landing page wireframe */}
                                <div style={{ width: 48, height: 36, borderRadius: 3, overflow: "hidden", border: "1px solid rgba(128,128,128,.15)" }}>
                                  <div style={{ height: "38%", background: t.colors.hero }} />
                                  <div style={{ height: "62%", background: t.colors.content, padding: "3px 4px" }}>
                                    <div style={{ height: 2, borderRadius: 1, background: t.colors.line, marginBottom: 2, width: "75%" }} />
                                    <div style={{ height: 2, borderRadius: 1, background: t.colors.line, marginBottom: 4, width: "55%" }} />
                                    <div style={{ height: 4, borderRadius: 1, background: t.colors.primary, width: "45%", margin: "0 auto", opacity: .85 }} />
                                  </div>
                                </div>
                                <span className={cn("text-[10px] font-medium leading-none", isActive ? "text-blue-400" : "text-muted-foreground")}>{t.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {sortedSections.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Sin secciones aún. Agrega secciones manualmente o usa el agente de landing.
                        </p>
                      ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter}
                          onDragStart={(e) => handleDragStart(sortedSections, e as { active: { id: string } })}
                          onDragEnd={(e) => handleDragEnd(lp.id, sortedSections, e)}
                          onDragCancel={() => setDraggingSection(null)}>
                          <DragOverlay>
                            {draggingSection && (
                              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-primary bg-card shadow-xl shadow-black/30 opacity-95">
                                <GripVertical className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span className="text-sm">{getSectionMeta(draggingSection.section_type).icon}</span>
                                <span className="text-xs font-medium text-primary">{getSectionMeta(draggingSection.section_type).label}</span>
                                {draggingSection.title && <span className="text-xs text-muted-foreground truncate">— {draggingSection.title}</span>}
                              </div>
                            )}
                          </DragOverlay>
                          <SortableContext items={sortedSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            {sortedSections.map((section, idx) => (
                              <SortableSectionItem
                                key={section.id}
                                section={section}
                                idx={idx}
                                totalCount={sortedSections.length}
                                onMoveUp={() => handleMoveSection(lp, section.id, "up")}
                                onMoveDown={() => handleMoveSection(lp, section.id, "down")}
                                onToggleVisibility={() => handleToggleVisibility(section)}
                                onEdit={() => handleEditSection(section)}
                                onDuplicate={() => duplicateSection.mutate(section.id)}
                                onRegenerate={() => {
                                  setRegeneratingSectionId(section.id);
                                  regenerateSection.mutate(section.id, {
                                    onSettled: () => setRegeneratingSectionId(null),
                                    onSuccess: () => {
                                      if (showPreview && previewLpId) renderPreview(previewLpId);
                                    },
                                  });
                                }}
                                isRegenerating={regeneratingSectionId === section.id}
                                onDelete={async () => { if (await confirmDelete("¿Eliminar sección?")) deleteSection.mutate(section.id); }}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      )}
                      {/* Action buttons */}
                      {/* SEO Panel */}
                      {showSeoPanel === lp.id && (
                        <div className="p-3 rounded-lg border border-border bg-secondary/50 space-y-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-foreground">SEO &amp; Metadata</span>
                            <button onClick={() => setShowSeoPanel(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                          </div>
                          <input defaultValue={lp.seo_title || ""} onBlur={(e) => { const v = e.target.value.trim(); if (v !== (lp.seo_title || "")) updateLanding.mutate({ lpId: lp.id, body: { seo_title: v || undefined } }); }}
                            placeholder="SEO title (max 60 caracteres)" className="w-full px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring" />
                          <textarea defaultValue={lp.seo_description || ""} onBlur={(e) => { const v = e.target.value.trim(); if (v !== (lp.seo_description || "")) updateLanding.mutate({ lpId: lp.id, body: { seo_description: v || undefined } }); }}
                            placeholder="Meta description (max 160 caracteres)" rows={2}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring resize-none" />
                          <input defaultValue={lp.og_image || ""} onBlur={(e) => { const v = e.target.value.trim(); if (v !== (lp.og_image || "")) updateLanding.mutate({ lpId: lp.id, body: { og_image: v || undefined } }); }}
                            placeholder="og:image URL (1200×630px recomendado)" className="w-full px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring" />
                        </div>
                      )}

                      {/* Analytics Panel */}
                      {showAnalyticsPanel === lp.id && (
                        <div className="p-3 rounded-lg border border-border bg-secondary/50 space-y-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-foreground">Analytics &amp; Tracking</span>
                            <button onClick={() => setShowAnalyticsPanel(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                          </div>
                          {(["ga4_id", "meta_pixel_id", "gtm_id"] as const).map((key) => {
                            const labels: Record<string, string> = { ga4_id: "Google Analytics 4 (G-XXXXXXXX)", meta_pixel_id: "Meta Pixel ID", gtm_id: "Google Tag Manager (GTM-XXXXX)" };
                            const current = ((lp.analytics_config || {}) as Record<string, string>)[key] || "";
                            return (
                              <input key={key} defaultValue={current}
                                onBlur={(e) => { const v = e.target.value.trim(); const cur = ((lp.analytics_config || {}) as Record<string, string>)[key] || ""; if (v !== cur) updateLanding.mutate({ lpId: lp.id, body: { analytics_config: { ...(lp.analytics_config || {}), [key]: v || undefined } } }); }}
                                placeholder={labels[key]} className="w-full px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring" />
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 flex-wrap">
                        <button onClick={() => { setAddingSectionTo(lp.id); setNewSectionTitle(""); setNewSectionType("custom"); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-violet-400 bg-violet-400/10 border border-violet-400/20 hover:bg-violet-400/20 transition-colors">
                          <Plus className="w-3 h-3" /> Agregar sección
                        </button>
                        <button onClick={() => openStyleEditor(lp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-pink-400 bg-pink-400/10 border border-pink-400/20 hover:bg-pink-400/20 transition-colors">
                          <Palette className="w-3 h-3" /> Personalizar estilo
                        </button>
                        <button onClick={() => setShowSeoPanel(showSeoPanel === lp.id ? null : lp.id)}
                          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors", showSeoPanel === lp.id ? "text-emerald-400 bg-emerald-400/15 border-emerald-400/30" : "text-muted-foreground bg-muted/50 border-border hover:bg-accent")}>
                          <span className="text-[10px]">🔍</span> SEO
                        </button>
                        <button onClick={() => setShowAnalyticsPanel(showAnalyticsPanel === lp.id ? null : lp.id)}
                          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors", showAnalyticsPanel === lp.id ? "text-cyan-400 bg-cyan-400/15 border-cyan-400/30" : "text-muted-foreground bg-muted/50 border-border hover:bg-accent")}>
                          <span className="text-[10px]">📊</span> Analytics
                        </button>
                        <button onClick={() => handlePreview(lp.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-400 bg-blue-400/10 border border-blue-400/20 hover:bg-blue-400/20 transition-colors">
                          <Eye className="w-3 h-3" /> Preview
                        </button>
                        <div className="relative group/exp2">
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 hover:bg-emerald-400/20 transition-colors">
                            <Download className="w-3 h-3" /> Exportar
                          </button>
                          <div className="absolute left-0 bottom-full mb-1 bg-popover border border-border rounded-lg shadow-xl py-1 opacity-0 invisible group-hover/exp2:opacity-100 group-hover/exp2:visible transition-all z-50 min-w-[160px]">
                            <button onClick={() => handleExport(lp.id, "html")}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-accent transition-colors flex items-center gap-2">
                              <Code className="w-3 h-3 text-blue-400" /> HTML estático
                            </button>
                            <button onClick={() => handleExport(lp.id, "shopify")}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-accent transition-colors flex items-center gap-2">
                              <span className="text-[10px]">🛒</span> Shopify Liquid
                            </button>
                            <button onClick={() => handleExport(lp.id, "wordpress")}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-accent transition-colors flex items-center gap-2">
                              <span className="text-[10px]">📝</span> WordPress
                            </button>
                          </div>
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

      {/* ══════ Add Section Modal ══════ */}
      <Modal open={!!addingSectionTo} onClose={() => setAddingSectionTo(null)} title="Agregar sección" className="max-w-xl">
        <div className="flex flex-col gap-4">
          {/* Scrollable section picker */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Tipo de sección</label>
            <div className="max-h-[46vh] overflow-y-auto overscroll-contain space-y-3 pr-1
                            [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:rounded-full
                            [&::-webkit-scrollbar-track]:bg-muted/40
                            [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
              {SECTION_CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 sticky top-0 bg-card py-0.5">
                    {cat.label}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {SECTION_TYPES.filter((st) => st.category === cat.id).map((st) => (
                      <button key={st.id} type="button" onClick={() => setNewSectionType(st.id)}
                        className={cn(
                          "flex items-start gap-2 px-3 py-2 rounded-lg border text-left transition-all",
                          newSectionType === st.id
                            ? "border-blue-400/40 bg-blue-400/10 text-blue-400"
                            : "border-border hover:bg-accent text-muted-foreground",
                        )}>
                        <span className="text-base leading-none mt-0.5 shrink-0">{st.icon}</span>
                        <span className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-xs font-semibold leading-tight truncate">{st.label}</span>
                          <span className="text-[10px] opacity-55 leading-tight">{st.desc}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Title input + submit — always visible */}
          <div className="space-y-3 pt-1 border-t border-border">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Título</label>
              <input value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="e.g. Descubre el poder de..."
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
            </div>
            <button onClick={handleAddSection} disabled={addSection.isPending || !newSectionTitle.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
              {addSection.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : "Agregar sección"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════ Edit Section Modal ══════ */}
      <Modal open={!!editingSection} onClose={() => { setEditingSection(null); setSectionEditTab("edit"); clearSectionPreview(); }}
        title={`Editar: ${editingSection ? getSectionMeta(editingSection.section_type).label : ""}`}
        className="max-w-xl">
        {editingSection && (
          <div className="space-y-4">
            {/* Tab strip */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary w-fit">
              <button
                type="button"
                onClick={() => setSectionEditTab("edit")}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  sectionEditTab === "edit" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                <Edit3 className="w-3 h-3" /> Editar
              </button>
              <button
                type="button"
                onClick={() => { setSectionEditTab("preview"); renderSectionPreview(editingSection.landing_page_id, editingSection.id); }}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  sectionEditTab === "preview" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                <Eye className="w-3 h-3" /> Vista previa
              </button>
            </div>

            {/* Preview panel */}
            {sectionEditTab === "preview" && (
              <div className="rounded-lg overflow-hidden border border-border bg-secondary">
                {sectionPreviewLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Spinner className="w-5 h-5 text-blue-400" />
                  </div>
                ) : sectionPreviewHTML ? (
                  <iframe srcDoc={sectionPreviewHTML}
                    className="w-full border-0 bg-white"
                    style={{ height: "50vh" }}
                    title="Section preview"
                    sandbox="allow-same-origin allow-scripts" />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-10">Sin contenido para previsualizar.</p>
                )}
              </div>
            )}

            {/* Edit form */}
            {sectionEditTab === "edit" && (
            <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-0.5">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Título</label>
              <input value={sectionForm.title}
                onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Contenido</label>
              <textarea value={sectionForm.body}
                onChange={(e) => setSectionForm({ ...sectionForm, body: e.target.value })} rows={5}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">CTA texto</label>
                <input value={sectionForm.cta_text}
                  onChange={(e) => setSectionForm({ ...sectionForm, cta_text: e.target.value })}
                  placeholder="e.g. Comprar ahora"
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">CTA URL</label>
                <input value={sectionForm.cta_url}
                  onChange={(e) => setSectionForm({ ...sectionForm, cta_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Imagen principal (URL)</label>
              <input value={sectionForm.image_url}
                onChange={(e) => setSectionForm({ ...sectionForm, image_url: e.target.value })}
                placeholder="https://... o seleccionar de creativos"
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all" />
              <CreativeSelector onSelect={(url) => setSectionForm({ ...sectionForm, image_url: url })} />
            </div>

            {/* ── Gallery Carousel: Multi-image selector ── */}
            {editingSection.section_type === "gallery" && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Creativos del carrusel ({sectionForm.images.length})
                </label>
                {sectionForm.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {sectionForm.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img} alt={`Slide ${idx + 1}`}
                          className="w-full aspect-square object-cover rounded-lg border border-border" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                          {idx > 0 && (
                            <button onClick={() => {
                              const imgs = [...sectionForm.images];
                              [imgs[idx - 1], imgs[idx]] = [imgs[idx], imgs[idx - 1]];
                              setSectionForm({ ...sectionForm, images: imgs });
                            }} className="p-1 rounded bg-white/20 hover:bg-white/40 text-white text-xs" title="Mover izquierda">
                              ←
                            </button>
                          )}
                          <button onClick={() => {
                            setSectionForm({ ...sectionForm, images: sectionForm.images.filter((_, i) => i !== idx) });
                          }} className="p-1 rounded bg-red-500/80 hover:bg-red-500 text-white text-xs" title="Eliminar">
                            <Trash2 className="w-3 h-3" />
                          </button>
                          {idx < sectionForm.images.length - 1 && (
                            <button onClick={() => {
                              const imgs = [...sectionForm.images];
                              [imgs[idx], imgs[idx + 1]] = [imgs[idx + 1], imgs[idx]];
                              setSectionForm({ ...sectionForm, images: imgs });
                            }} className="p-1 rounded bg-white/20 hover:bg-white/40 text-white text-xs" title="Mover derecha">
                              →
                            </button>
                          )}
                        </div>
                        <span className="absolute top-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded font-mono">{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
                <CreativeSelector onSelect={(url) => {
                  if (!sectionForm.images.includes(url)) {
                    setSectionForm({ ...sectionForm, images: [...sectionForm.images, url] });
                  }
                }} />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Selecciona varios creativos para el carrusel. Arrastra para reordenar.
                </p>
              </div>
            )}

            {/* ── Structured Content Editor ── */}
            {(() => {
              const st = editingSection.section_type;
              const ct = (sectionForm.content || {}) as Record<string, unknown>;
              const setContent = (patch: Record<string, unknown>) =>
                setSectionForm(f => ({ ...f, content: { ...(f.content as Record<string, unknown>), ...patch } }));
              const ic = "w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground";
              const updateListItem = (key: string, idx: number, field: string, val: unknown) => {
                const arr = [...((ct[key] as Record<string, unknown>[]) || [])];
                arr[idx] = { ...arr[idx], [field]: val };
                setContent({ [key]: arr });
              };
              const removeListItem = (key: string, idx: number) => {
                const arr = [...((ct[key] as Record<string, unknown>[]) || [])];
                arr.splice(idx, 1);
                setContent({ [key]: arr });
              };
              const addListItem = (key: string, tpl: Record<string, unknown>) =>
                setContent({ [key]: [...((ct[key] as Record<string, unknown>[]) || []), tpl] });

              if (st === "faq") {
                const items = (ct.items as { question: string; answer: string }[]) || [];
                return (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Preguntas y respuestas</label>
                      <button type="button" onClick={() => addListItem("items", { question: "", answer: "" })}
                        className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">+ Agregar</button>
                    </div>
                    {items.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border bg-secondary/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                          <button type="button" onClick={() => removeListItem("items", idx)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <input value={item.question} onChange={e => updateListItem("items", idx, "question", e.target.value)} placeholder="¿Pregunta?" className={ic} />
                        <textarea value={item.answer} onChange={e => updateListItem("items", idx, "answer", e.target.value)} placeholder="Respuesta..." rows={2} className={`${ic} resize-none`} />
                      </div>
                    ))}
                  </div>
                );
              }

              if (st === "stats_bar") {
                const stats = (ct.stats as { value: string; label: string; icon: string }[]) || [];
                return (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Estadísticas</label>
                      <button type="button" onClick={() => addListItem("stats", { value: "", label: "", icon: "⭐" })}
                        className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">+ Agregar</button>
                    </div>
                    {stats.map((s, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border bg-secondary/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                          <button type="button" onClick={() => removeListItem("stats", idx)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input value={s.icon} onChange={e => updateListItem("stats", idx, "icon", e.target.value)} placeholder="🚀" className={ic} />
                          <input value={s.value} onChange={e => updateListItem("stats", idx, "value", e.target.value)} placeholder="15,400+" className={ic} />
                          <input value={s.label} onChange={e => updateListItem("stats", idx, "label", e.target.value)} placeholder="Clientes" className={ic} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              if (st === "logo_wall") {
                const logos = (ct.logos as { name: string; image_url: string }[]) || [];
                return (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <label className="text-sm font-medium text-foreground block">Logo Wall</label>
                    <input value={(ct.title as string) || ""} onChange={e => setContent({ title: e.target.value })}
                      placeholder="Confiado por marcas líderes" className={ic} />
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground">Logos</label>
                      <button type="button" onClick={() => addListItem("logos", { name: "", image_url: "" })}
                        className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">+ Agregar</button>
                    </div>
                    {logos.map((lg, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border bg-secondary/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                          <button type="button" onClick={() => removeListItem("logos", idx)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input value={lg.name} onChange={e => updateListItem("logos", idx, "name", e.target.value)} placeholder="Nike" className={ic} />
                          <input value={lg.image_url} onChange={e => updateListItem("logos", idx, "image_url", e.target.value)} placeholder="https://..." className={ic} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              if (st === "testimonials") {
                const items = (ct.testimonials as { name: string; location: string; company: string; text: string; metric: string; rating: number; avatar_url: string }[]) || [];
                return (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Testimonios</label>
                      <button type="button" onClick={() => addListItem("testimonials", { name: "", location: "", company: "", text: "", metric: "", rating: 5, avatar_url: "" })}
                        className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">+ Agregar</button>
                    </div>
                    {items.map((t, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border bg-secondary/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-mono">#{idx + 1} {t.name || "Sin nombre"}</span>
                          <button type="button" onClick={() => removeListItem("testimonials", idx)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input value={t.name} onChange={e => updateListItem("testimonials", idx, "name", e.target.value)} placeholder="Nombre" className={ic} />
                          <input value={t.location} onChange={e => updateListItem("testimonials", idx, "location", e.target.value)} placeholder="Ciudad, País" className={ic} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input value={t.company} onChange={e => updateListItem("testimonials", idx, "company", e.target.value)} placeholder="Empresa" className={ic} />
                          <input value={t.metric} onChange={e => updateListItem("testimonials", idx, "metric", e.target.value)} placeholder="315% más ventas" className={ic} />
                        </div>
                        <input value={t.avatar_url || ""} onChange={e => updateListItem("testimonials", idx, "avatar_url", e.target.value)} placeholder="URL foto del cliente (opcional)" className={ic} />
                        <textarea value={t.text} onChange={e => updateListItem("testimonials", idx, "text", e.target.value)} placeholder="Cita del cliente..." rows={2} className={`${ic} resize-none`} />
                      </div>
                    ))}
                  </div>
                );
              }

              if (st === "case_study") {
                return (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <label className="text-sm font-medium text-foreground block">Caso de éxito</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={(ct.brand as string) || ""} onChange={e => setContent({ brand: e.target.value })} placeholder="Empresa" className={ic} />
                      <input value={(ct.founder_name as string) || ""} onChange={e => setContent({ founder_name: e.target.value })} placeholder="Nombre del fundador" className={ic} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input value={(ct.metric_value as string) || ""} onChange={e => setContent({ metric_value: e.target.value })} placeholder="315%" className={ic} />
                      <input value={(ct.metric_label as string) || ""} onChange={e => setContent({ metric_label: e.target.value })} placeholder="más conversiones" className={ic} />
                      <input value={(ct.metric_period as string) || ""} onChange={e => setContent({ metric_period: e.target.value })} placeholder="en 60 días" className={ic} />
                    </div>
                    <textarea value={(ct.narrative as string) || ""} onChange={e => setContent({ narrative: e.target.value })} placeholder="Narrativa del caso..." rows={3} className={`${ic} resize-none`} />
                    <input value={(ct.founder_image_url as string) || ""} onChange={e => setContent({ founder_image_url: e.target.value })} placeholder="URL imagen del fundador (opcional)" className={ic} />
                  </div>
                );
              }

              if (st === "process_steps") {
                const items = (ct.items as { step: number; title: string; description: string; icon: string }[]) || [];
                return (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Pasos</label>
                      <button type="button" onClick={() => addListItem("items", { step: items.length + 1, title: "", description: "", icon: "🎯" })}
                        className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">+ Agregar</button>
                    </div>
                    {items.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border bg-secondary/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-mono">Paso {item.step || idx + 1}</span>
                          <button type="button" onClick={() => removeListItem("items", idx)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <input value={item.icon} onChange={e => updateListItem("items", idx, "icon", e.target.value)} placeholder="🎯" className={ic} />
                          <input value={item.title} onChange={e => updateListItem("items", idx, "title", e.target.value)} placeholder="Título" className={`${ic} col-span-3`} />
                        </div>
                        <textarea value={item.description} onChange={e => updateListItem("items", idx, "description", e.target.value)} placeholder="Descripción..." rows={2} className={`${ic} resize-none`} />
                      </div>
                    ))}
                  </div>
                );
              }

              if (st === "urgency_banner") {
                return (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <label className="text-sm font-medium text-foreground block">Banner de urgencia</label>
                    <textarea value={(ct.message as string) || ""} onChange={e => setContent({ message: e.target.value })}
                      placeholder="🔥 Oferta por tiempo limitado — 40% de descuento" rows={2} className={`${ic} resize-none`} />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={(ct.cta_text as string) || ""} onChange={e => setContent({ cta_text: e.target.value })} placeholder="Aprovechar ahora" className={ic} />
                      <input value={(ct.cta_url as string) || ""} onChange={e => setContent({ cta_url: e.target.value })} placeholder="#oferta" className={ic} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Fecha fin (opcional)</label>
                      <input type="datetime-local" value={(ct.end_date as string) || ""} onChange={e => setContent({ end_date: e.target.value })} className={ic} />
                    </div>
                  </div>
                );
              }

              if (st === "countdown") {
                return (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <label className="text-sm font-medium text-foreground block">Fecha límite del contador</label>
                    <input type="datetime-local" value={(ct.end_date as string) || ""} onChange={e => setContent({ end_date: e.target.value })} className={ic} />
                  </div>
                );
              }

              if (st === "hero") {
                return (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <label className="text-sm font-medium text-foreground block">CTA secundario + trust line</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={(ct.secondary_cta_text as string) || ""} onChange={e => setContent({ secondary_cta_text: e.target.value })} placeholder="Ver casos de éxito" className={ic} />
                      <input value={(ct.secondary_cta_url as string) || ""} onChange={e => setContent({ secondary_cta_url: e.target.value })} placeholder="#testimonials" className={ic} />
                    </div>
                    <input value={(ct.trust_line as string) || ""} onChange={e => setContent({ trust_line: e.target.value })} placeholder="Más de 15,000 pedidos · Garantía 30 días" className={ic} />
                  </div>
                );
              }

              if (st === "trust_badges") {
                const badges = (ct.badges as { icon: string; title: string; subtitle: string }[]) || [];
                return (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Badges de confianza</label>
                      <button type="button" onClick={() => addListItem("badges", { icon: "🛡️", title: "", subtitle: "" })}
                        className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">+ Agregar</button>
                    </div>
                    {badges.map((b, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border bg-secondary/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                          <button type="button" onClick={() => removeListItem("badges", idx)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input value={b.icon} onChange={e => updateListItem("badges", idx, "icon", e.target.value)} placeholder="🚚" className={ic} />
                          <input value={b.title} onChange={e => updateListItem("badges", idx, "title", e.target.value)} placeholder="Envío gratis" className={ic} />
                          <input value={b.subtitle} onChange={e => updateListItem("badges", idx, "subtitle", e.target.value)} placeholder="En pedidos +$99" className={ic} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              if (st === "transformation") {
                return (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <label className="text-sm font-medium text-foreground block">Antes / Después</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={(ct.before_label as string) || "Antes"} onChange={e => setContent({ before_label: e.target.value })} placeholder="Antes" className={ic} />
                      <input value={(ct.after_label as string) || "Después"} onChange={e => setContent({ after_label: e.target.value })} placeholder="Después" className={ic} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <textarea value={(ct.before_text as string) || ""} onChange={e => setContent({ before_text: e.target.value })} placeholder="Situación antes..." rows={3} className={`${ic} resize-none`} />
                      <textarea value={(ct.after_text as string) || ""} onChange={e => setContent({ after_text: e.target.value })} placeholder="Situación después..." rows={3} className={`${ic} resize-none`} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={(ct.image_before_url as string) || ""} onChange={e => setContent({ image_before_url: e.target.value })} placeholder="URL imagen Antes (opcional)" className={ic} />
                      <input value={(ct.image_after_url as string) || ""} onChange={e => setContent({ image_after_url: e.target.value })} placeholder="URL imagen Después (opcional)" className={ic} />
                    </div>
                    <textarea value={(ct.emotional as string) || ""} onChange={e => setContent({ emotional: e.target.value })} placeholder="Copy emocional de cierre..." rows={2} className={`${ic} resize-none`} />
                  </div>
                );
              }

              if (st === "features" || st === "benefits") {
                const items = (ct.items as { icon: string; title: string; description: string }[]) || [];
                const label = st === "features" ? "Características" : "Beneficios";
                return (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">{label}</label>
                      <button type="button" onClick={() => addListItem("items", { icon: "⚡", title: "", description: "" })}
                        className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">+ Agregar</button>
                    </div>
                    {items.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border bg-secondary/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                          <button type="button" onClick={() => removeListItem("items", idx)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <input value={item.icon} onChange={e => updateListItem("items", idx, "icon", e.target.value)} placeholder="⚡" className={ic} />
                          <input value={item.title} onChange={e => updateListItem("items", idx, "title", e.target.value)} placeholder="Título" className={`${ic} col-span-3`} />
                        </div>
                        <textarea value={item.description} onChange={e => updateListItem("items", idx, "description", e.target.value)} placeholder="Descripción..." rows={2} className={`${ic} resize-none`} />
                      </div>
                    ))}
                  </div>
                );
              }

              if (st === "comparison") {
                const rows = (ct.rows as { feature: string; us: string; them: string }[]) || [];
                return (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <label className="text-sm font-medium text-foreground block">Tabla comparativa</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={(ct.us_label as string) || ""} onChange={e => setContent({ us_label: e.target.value })} placeholder="Nosotros" className={ic} />
                      <input value={(ct.them_label as string) || ""} onChange={e => setContent({ them_label: e.target.value })} placeholder="Competencia" className={ic} />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground">Filas</label>
                      <button type="button" onClick={() => addListItem("rows", { feature: "", us: "✓", them: "✗" })}
                        className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">+ Fila</button>
                    </div>
                    {rows.map((row, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input value={row.feature} onChange={e => updateListItem("rows", idx, "feature", e.target.value)} placeholder="Característica" className={`${ic} flex-1`} />
                        <input value={String(row.us)} onChange={e => updateListItem("rows", idx, "us", e.target.value)} placeholder="✓" className={`${ic} w-20 text-center`} />
                        <input value={String(row.them)} onChange={e => updateListItem("rows", idx, "them", e.target.value)} placeholder="✗" className={`${ic} w-20 text-center`} />
                        <button type="button" onClick={() => removeListItem("rows", idx)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                );
              }

              if (st === "offer") {
                const checklist = (ct.checklist as string[]) || [];
                const bonuses = (ct.bonuses as string[]) || [];
                return (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <label className="text-sm font-medium text-foreground block">Oferta / Precio</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input value={(ct.price_old as string) || ""} onChange={e => setContent({ price_old: e.target.value })} placeholder="$599" className={ic} />
                      <input value={(ct.price_new as string) || ""} onChange={e => setContent({ price_new: e.target.value })} placeholder="$299" className={ic} />
                      <input value={(ct.savings as string) || ""} onChange={e => setContent({ savings: e.target.value })} placeholder="Ahorras $300" className={ic} />
                    </div>
                    <input value={(ct.installments as string) || ""} onChange={e => setContent({ installments: e.target.value })} placeholder="o 12 cuotas de $25" className={ic} />
                    <input value={(ct.guarantee as string) || ""} onChange={e => setContent({ guarantee: e.target.value })} placeholder="Garantía 30 días sin preguntas" className={ic} />
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-muted-foreground">Incluye (checklist)</label>
                        <button type="button" onClick={() => setContent({ checklist: [...checklist, ""] })}
                          className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20">+ Item</button>
                      </div>
                      {checklist.map((item, idx) => (
                        <div key={idx} className="flex gap-2 mb-1.5">
                          <input value={item} onChange={e => { const a = [...checklist]; a[idx] = e.target.value; setContent({ checklist: a }); }} placeholder="Item incluido..." className={`${ic} flex-1`} />
                          <button type="button" onClick={() => setContent({ checklist: checklist.filter((_, i) => i !== idx) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-muted-foreground">Bonos</label>
                        <button type="button" onClick={() => setContent({ bonuses: [...bonuses, ""] })}
                          className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20">+ Bono</button>
                      </div>
                      {bonuses.map((b, idx) => (
                        <div key={idx} className="flex gap-2 mb-1.5">
                          <input value={b} onChange={e => { const a = [...bonuses]; a[idx] = e.target.value; setContent({ bonuses: a }); }} placeholder="Nombre del bono..." className={`${ic} flex-1`} />
                          <button type="button" onClick={() => setContent({ bonuses: bonuses.filter((_, i) => i !== idx) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (st === "social_proof") {
                const stats = (ct.stats as { value: string; label: string; has_stars?: boolean }[]) || [];
                const logos = (ct.logos as { name: string }[]) || [];
                return (
                  <div className="space-y-4 pt-2 border-t border-border">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-foreground">Estadísticas</label>
                        <button type="button" onClick={() => setContent({ stats: [...stats, { value: "", label: "" }] })}
                          className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">+ Stat</button>
                      </div>
                      {stats.map((s, idx) => (
                        <div key={idx} className="flex gap-2 mb-1.5">
                          <input value={s.value} onChange={e => { const a = [...stats]; a[idx] = { ...a[idx], value: e.target.value }; setContent({ stats: a }); }} placeholder="10,000+" className={`${ic} w-28`} />
                          <input value={s.label} onChange={e => { const a = [...stats]; a[idx] = { ...a[idx], label: e.target.value }; setContent({ stats: a }); }} placeholder="Clientes satisfechos" className={`${ic} flex-1`} />
                          <button type="button" onClick={() => setContent({ stats: stats.filter((_, i) => i !== idx) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-foreground">Logos / Medios</label>
                        <button type="button" onClick={() => setContent({ logos: [...logos, { name: "" }] })}
                          className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">+ Logo</button>
                      </div>
                      {logos.map((lg, idx) => (
                        <div key={idx} className="flex gap-2 mb-1.5">
                          <input value={lg.name} onChange={e => { const a = [...logos]; a[idx] = { name: e.target.value }; setContent({ logos: a }); }} placeholder="Forbes, TechCrunch..." className={`${ic} flex-1`} />
                          <button type="button" onClick={() => setContent({ logos: logos.filter((_, i) => i !== idx) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (st === "lead_form") {
                const fields = (ct.fields as { name: string; label: string; type: string; required: boolean }[]) || [];
                return (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Campos del formulario</label>
                      <button type="button" onClick={() => addListItem("fields", { name: "", label: "", type: "text", required: true })}
                        className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">+ Campo</button>
                    </div>
                    {fields.map((f, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border bg-secondary/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-mono">Campo {idx + 1}</span>
                          <button type="button" onClick={() => removeListItem("fields", idx)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input value={f.name} onChange={e => updateListItem("fields", idx, "name", e.target.value)} placeholder="name (sin espacios)" className={ic} />
                          <input value={f.label} onChange={e => updateListItem("fields", idx, "label", e.target.value)} placeholder="Etiqueta visible" className={ic} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <select value={f.type} onChange={e => updateListItem("fields", idx, "type", e.target.value)} className={ic}>
                            <option value="text">Texto</option>
                            <option value="email">Email</option>
                            <option value="tel">Teléfono</option>
                            <option value="textarea">Área de texto</option>
                          </select>
                          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                            <input type="checkbox" checked={f.required} onChange={e => updateListItem("fields", idx, "required", e.target.checked)} className="rounded" />
                            Requerido
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              if (st === "brand_story") {
                const values = (ct.values as string[]) || [];
                return (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <label className="text-sm font-medium text-foreground block">Historia de marca</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={(ct.founder_name as string) || ""} onChange={e => setContent({ founder_name: e.target.value })} placeholder="Nombre del fundador" className={ic} />
                      <input value={(ct.founder_title as string) || ""} onChange={e => setContent({ founder_title: e.target.value })} placeholder="CEO & Fundador" className={ic} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={(ct.founded_year as string) || ""} onChange={e => setContent({ founded_year: e.target.value })} placeholder="Año fundación (2018)" className={ic} />
                      <input value={(ct.image_url as string) || ""} onChange={e => setContent({ image_url: e.target.value })} placeholder="URL foto del fundador" className={ic} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-muted-foreground">Valores</label>
                        <button type="button" onClick={() => setContent({ values: [...values, ""] })}
                          className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20">+ Valor</button>
                      </div>
                      {values.map((v, idx) => (
                        <div key={idx} className="flex gap-2 mb-1.5">
                          <input value={v} onChange={e => { const a = [...values]; a[idx] = e.target.value; setContent({ values: a }); }} placeholder="Innovación, calidad..." className={`${ic} flex-1`} />
                          <button type="button" onClick={() => setContent({ values: values.filter((_, i) => i !== idx) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return null;
            })()}

            {/* A/B variant selector */}
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground shrink-0">Variante A/B:</span>
              <div className="flex items-center gap-1.5">
                {(["", "a", "b"] as const).map((v) => (
                  <button key={v} type="button"
                    onClick={() => setSectionForm(f => ({ ...f, ab_group: v }))}
                    className={cn("px-2.5 py-1 rounded-md text-xs font-semibold border transition-all",
                      sectionForm.ab_group === v
                        ? v === "b" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : v === "a" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-primary/10 text-primary border-primary/20"
                        : "border-border text-muted-foreground hover:bg-accent")}>
                    {v === "" ? "Ninguna" : `Variante ${v.toUpperCase()}`}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSaveSection} disabled={updateSection.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
              {updateSection.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : "Guardar cambios"}
            </button>
            </div>
            )}
          </div>
        )}
      </Modal>

      {/* ══════ HTML Preview Modal ══════ */}
      <Modal open={showPreview} onClose={() => { setShowPreview(false); clearPreview(); }}
        title="Preview — Landing Page" className="max-w-5xl">
        <div className="space-y-3">
          {/* Device toggle — hidden on small screens (pointless on mobile viewport) */}
          <div className="hidden sm:flex items-center justify-center gap-1 p-1 rounded-lg bg-secondary w-fit mx-auto">
            <button onClick={() => setPreviewMode("desktop")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                previewMode === "desktop" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              Desktop
            </button>
            <button onClick={() => setPreviewMode("mobile")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                previewMode === "mobile" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/></svg>
              Mobile
            </button>
          </div>
          {previewLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner className="w-6 h-6 text-blue-400" />
            </div>
          ) : previewHTML ? (
            <div className={cn("rounded-lg overflow-hidden border border-border bg-secondary flex justify-center",
              previewMode === "mobile" && "py-4 px-4")}>
              <iframe srcDoc={previewHTML} className="border-0 transition-all duration-300 bg-white"
                style={previewMode === "mobile"
                  ? { width: 390, height: "72vh", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,.35)" }
                  : { width: "100%", height: "70vh" }}
                title="Landing page preview" sandbox="allow-same-origin allow-scripts" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">
              No hay secciones para previsualizar. Agrega contenido primero.
            </p>
          )}
        </div>
      </Modal>

      {/* ══════ Style Editor Modal ══════ */}
      <Modal open={showStyleEditor} onClose={() => setShowStyleEditor(false)}
        title="Personalizar estilo" className="max-w-lg">
        <div className="space-y-5">
          {/* Colors */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Colores</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: "primary", label: "Primario" },
                { key: "secondary", label: "Secundario" },
                { key: "accent", label: "Acento" },
                { key: "background", label: "Fondo" },
                { key: "text", label: "Texto" },
              ] as const).map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={styleForm[key]}
                      onChange={(e) => setStyleForm({ ...styleForm, [key]: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-foreground block">{label}</label>
                    <input
                      type="text"
                      value={styleForm[key]}
                      onChange={(e) => setStyleForm({ ...styleForm, [key]: e.target.value })}
                      className="w-full text-[11px] text-muted-foreground bg-transparent outline-none font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Color Preview */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Preview:</span>
            <div className="flex-1 h-8 rounded-lg overflow-hidden flex">
              <div style={{ background: styleForm.primary, flex: 1 }} />
              <div style={{ background: styleForm.secondary, flex: 1 }} />
              <div style={{ background: styleForm.accent, flex: 1 }} />
              <div style={{ background: styleForm.background, flex: 0.5, border: "1px solid #333" }} />
              <div style={{ background: styleForm.text, flex: 0.5 }} />
            </div>
          </div>

          {/* Typography */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Tipografía</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Fuente de títulos</label>
                <select
                  value={styleForm.heading_font}
                  onChange={(e) => setStyleForm({ ...styleForm, heading_font: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all"
                >
                  {["Inter", "Plus Jakarta Sans", "Manrope", "Sora", "Poppins", "Montserrat", "Raleway", "Outfit", "DM Sans", "Space Grotesk", "Playfair Display", "Merriweather", "Lora"].map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Fuente de cuerpo</label>
                <select
                  value={styleForm.body_font}
                  onChange={(e) => setStyleForm({ ...styleForm, body_font: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring transition-all"
                >
                  {["Inter", "Plus Jakarta Sans", "Manrope", "Sora", "Poppins", "DM Sans", "Nunito", "Source Sans 3", "Open Sans", "Lato", "Rubik"].map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Estos estilos se aplican al preview HTML y al export. Se guardan en el brand book de la marca.
          </p>

          <button onClick={handleSaveStyle} disabled={updateBrand.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
            {updateBrand.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : "Guardar estilo"}
          </button>
        </div>
      </Modal>

    </div>
  );
}


// ── Creative Selector Component ──────────────────────────────────────────────

function CreativeSelector({ onSelect }: { onSelect: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const { data: creatives } = useCreatives();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
      >
        📸 Seleccionar de creativos
      </button>
    );
  }

  return (
    <div className="mt-1.5 border border-border rounded-lg p-3 space-y-2 bg-secondary/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Creativos disponibles</span>
        <button onClick={() => setOpen(false)} className="p-0.5 text-muted-foreground hover:text-foreground">
          <X className="w-3 h-3" />
        </button>
      </div>
      {!creatives?.length ? (
        <p className="text-xs text-muted-foreground">No hay creativos. Genera algunos desde el orquestador.</p>
      ) : (
        <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto scrollbar-thin">
          {creatives.filter((c) => c.file_url).map((c) => (
            <img
              key={c.id}
              src={c.file_url!}
              alt=""
              className="w-full aspect-square object-cover rounded-lg border border-border cursor-pointer hover:border-violet-400 transition-colors"
              onClick={() => { onSelect(c.file_url!); setOpen(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}