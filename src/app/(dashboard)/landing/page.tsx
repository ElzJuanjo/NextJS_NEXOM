"use client";

import { useState } from "react";
import {
  Layout, Eye, Trash2, ChevronDown, ChevronRight,
  ChevronUp, Edit3, EyeOff, Download, GripVertical, Code, Plus, Palette, X,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useBrands, useUpdateBrand } from "@/hooks/use-brands";
import { useCreatives } from "@/hooks/use-creatives";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLandingPages, useCreateLanding, useDeleteLanding, useUpdateLanding,
  useAddSection, useUpdateSection, useDeleteSection,
  useReorderSections, useRenderHTML,
} from "@/hooks/use-landing-pages";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { LandingPageResponse, LandingSectionResponse } from "@/types";
import { useRouter } from "next/navigation";

const SECTION_TYPES = [
  { id: "hero", label: "Hero", icon: "🎯" },
  { id: "social_proof", label: "Social Proof", icon: "⭐" },
  { id: "problem", label: "Problema", icon: "🔥" },
  { id: "solution", label: "Solución", icon: "💡" },
  { id: "benefits", label: "Beneficios", icon: "✨" },
  { id: "features", label: "Features", icon: "⚡" },
  { id: "transformation", label: "Transformación", icon: "🔄" },
  { id: "offer", label: "Oferta", icon: "💰" },
  { id: "testimonials", label: "Testimonios", icon: "💬" },
  { id: "faq", label: "FAQ", icon: "❓" },
  { id: "cta", label: "CTA Final", icon: "🚀" },
  { id: "gallery", label: "Galería", icon: "🖼" },
  { id: "product_gallery", label: "Galería Producto", icon: "📸" },
  { id: "specs", label: "Especificaciones", icon: "📋" },
  { id: "video_embed", label: "Video", icon: "🎬" },
  { id: "comparison", label: "Comparativa", icon: "⚖️" },
  { id: "countdown", label: "Countdown", icon: "⏳" },
  { id: "trust_badges", label: "Trust Badges", icon: "🛡️" },
  { id: "brand_story", label: "Historia", icon: "📖" },
  { id: "custom", label: "Custom", icon: "📝" },
];

const TEMPLATES = [
  { id: "modern", name: "Modern", emoji: "🟣", description: "Gradientes, cards interactivas, SaaS" },
  { id: "minimal", name: "Minimal", emoji: "⬜", description: "Espacios amplios, editorial" },
  { id: "bold", name: "Bold", emoji: "🟥", description: "Tipografía grande, alto contraste" },
  { id: "ecommerce", name: "E-Commerce", emoji: "🛒", description: "Estilo Shopify, producto" },
  { id: "dark", name: "Dark", emoji: "🌑", description: "Fondo oscuro, acentos neón" },
  { id: "elegant", name: "Elegant", emoji: "✨", description: "Serif, lujo, sofisticado" },
];

function getSectionMeta(type: string) {
  return SECTION_TYPES.find((s) => s.id === type) || { id: type, label: type, icon: "📄" };
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
  const { html: previewHTML, loading: previewLoading, render: renderPreview, clear: clearPreview } = useRenderHTML();
  const updateBrand = useUpdateBrand();

  const [expandedLanding, setExpandedLanding] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<LandingSectionResponse | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [addingSectionTo, setAddingSectionTo] = useState<string | null>(null);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [styleTargetLpId, setStyleTargetLpId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", campaign: "" });
  const [sectionForm, setSectionForm] = useState({ title: "", body: "", cta_text: "", cta_url: "", image_url: "" });
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
    });
  };

  const handleSaveSection = () => {
    if (!editingSection) return;
    updateSection.mutate(
      { sectionId: editingSection.id, body: sectionForm },
      { onSuccess: () => setEditingSection(null) },
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
    renderPreview(lpId);
    setShowPreview(true);
  };

  const handleExport = async (lpId: string, format: "html" | "shopify" | "wordpress") => {
    try {
      const { landingService } = await import("@/services/landing.service");
      const lp = pages?.find((p) => p.id === lpId);
      const baseName = (lp?.name || "landing").replace(/\s+/g, "-").toLowerCase();

      let content: string;
      let ext: string;
      let mimeType: string;

      if (format === "shopify") {
        content = await landingService.exportShopify(lpId);
        ext = "liquid";
        mimeType = "text/plain";
      } else if (format === "wordpress") {
        content = await landingService.exportWordPress(lpId);
        ext = "html";
        mimeType = "text/html";
      } else {
        content = await landingService.renderHTML(lpId);
        ext = "html";
        mimeType = "text/html";
      }

      const blob = new Blob([content], { type: mimeType });
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
                      <button onClick={() => { if (confirm("¿Eliminar esta landing page?")) deleteLanding.mutate(lp.id); }}
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

                        {/* Status selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground shrink-0">Estado:</span>
                          <select
                            value={lp.status}
                            onChange={(e) => updateLanding.mutate({ lpId: lp.id, body: { status: e.target.value } })}
                            className="px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground outline-none focus:border-ring transition-all"
                          >
                            <option value="draft">Draft</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>

                      {/* Template selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">Template:</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {TEMPLATES.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => updateLanding.mutate({ lpId: lp.id, body: { template: t.id } })}
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all",
                                (lp.template || "modern") === t.id
                                  ? "border-blue-400/40 bg-blue-400/10 text-blue-400 font-medium"
                                  : "border-border text-muted-foreground hover:bg-accent"
                              )}
                              title={t.description}
                            >
                              <span>{t.emoji}</span>
                              <span>{t.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {sortedSections.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Sin secciones aún. Agrega secciones manualmente o usa el agente de landing.
                        </p>
                      ) : (
                        sortedSections.map((section, idx) => {
                          const meta = getSectionMeta(section.section_type);
                          return (
                            <div key={section.id}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors",
                                section.is_visible ? "bg-muted/50 border-border" : "bg-muted/20 border-border/50 opacity-50",
                              )}>
                              <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="text-sm shrink-0">{meta.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-400">{meta.label}</span>
                                  {section.title && (
                                    <span className="text-xs text-muted-foreground truncate">— {section.title}</span>
                                  )}
                                </div>
                                {section.body && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                    {section.body.slice(0, 80)}{section.body.length > 80 ? "..." : ""}
                                  </p>
                                )}
                                {section.image_url && (
                                  <div className="mt-1">
                                    <img
                                      src={section.image_url}
                                      alt=""
                                      className="w-12 h-12 rounded-lg object-cover inline-block border border-border"
                                    />
                                  </div>
                                )}
                                {section.images && (section.images as string[]).length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {(section.images as string[]).slice(0, 4).map((img, i) => (
                                      <img
                                        key={i}
                                        src={img}
                                        alt=""
                                        className="w-10 h-10 rounded-lg object-cover border border-border"
                                      />
                                    ))}
                                    {(section.images as string[]).length > 4 && (
                                      <span className="text-[10px] text-muted-foreground self-center">+{(section.images as string[]).length - 4}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button onClick={() => handleMoveSection(lp, section.id, "up")} disabled={idx === 0}
                                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleMoveSection(lp, section.id, "down")}
                                  disabled={idx === sortedSections.length - 1}
                                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleToggleVisibility(section)}
                                  className="p-1 text-muted-foreground hover:text-foreground"
                                  title={section.is_visible ? "Ocultar" : "Mostrar"}>
                                  {section.is_visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                </button>
                                <button onClick={() => handleEditSection(section)}
                                  className="p-1 text-muted-foreground hover:text-blue-400">
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button onClick={() => { if (confirm("¿Eliminar sección?")) deleteSection.mutate(section.id); }}
                                  className="p-1 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 flex-wrap">
                        <button onClick={() => { setAddingSectionTo(lp.id); setNewSectionTitle(""); setNewSectionType("custom"); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-violet-400 bg-violet-400/10 border border-violet-400/20 hover:bg-violet-400/20 transition-colors">
                          <Plus className="w-3 h-3" /> Agregar sección
                        </button>
                        <button onClick={() => openStyleEditor(lp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-pink-400 bg-pink-400/10 border border-pink-400/20 hover:bg-pink-400/20 transition-colors">
                          <Palette className="w-3 h-3" /> Personalizar estilo
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
      <Modal open={!!addingSectionTo} onClose={() => setAddingSectionTo(null)} title="Agregar sección" className="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Tipo de sección</label>
            <div className="grid grid-cols-3 gap-1.5">
              {SECTION_TYPES.map((st) => (
                <button key={st.id} type="button" onClick={() => setNewSectionType(st.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs text-left transition-all",
                    newSectionType === st.id
                      ? "border-blue-400/40 bg-blue-400/10 text-blue-400"
                      : "border-border hover:bg-accent text-muted-foreground",
                  )}>
                  <span>{st.icon}</span>
                  <span className="font-medium truncate">{st.label}</span>
                </button>
              ))}
            </div>
          </div>
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
      </Modal>

      {/* ══════ Edit Section Modal ══════ */}
      <Modal open={!!editingSection} onClose={() => setEditingSection(null)}
        title={`Editar: ${editingSection ? getSectionMeta(editingSection.section_type).label : ""}`}
        className="max-w-lg">
        {editingSection && (
          <div className="space-y-4">
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
            <button onClick={handleSaveSection} disabled={updateSection.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
              {updateSection.isPending ? <Spinner className="w-4 h-4 text-primary-foreground" /> : "Guardar cambios"}
            </button>
          </div>
        )}
      </Modal>

      {/* ══════ HTML Preview Modal ══════ */}
      <Modal open={showPreview} onClose={() => { setShowPreview(false); clearPreview(); }}
        title="Preview — Landing Page" className="max-w-5xl">
        <div className="space-y-3">
          {previewLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner className="w-6 h-6 text-blue-400" />
            </div>
          ) : previewHTML ? (
            <div className="rounded-lg overflow-hidden border border-border bg-white">
              <iframe srcDoc={previewHTML} className="w-full border-0"
                style={{ height: "70vh" }} title="Landing page preview" sandbox="allow-same-origin" />
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