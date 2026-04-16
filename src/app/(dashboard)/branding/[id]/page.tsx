"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Download, Edit3, Save, X, Type, Palette, MessageSquare,
    Sparkles, Target, Eye, BookOpen, Check, Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrand, useUpdateBrand, useExportBrandPdf } from "@/hooks/use-brands";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Spinner } from "@/components/ui/Spinner";
import { CardSkeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";

type EditSection = "overview" | "colors" | "typography" | "tones" | "messages" | "identity" | null;

const FONT_OPTIONS = [
    "Plus Jakarta Sans", "Inter", "Montserrat", "Poppins", "Raleway",
    "Playfair Display", "Roboto", "Lato", "Open Sans", "DM Sans",
    "Work Sans", "Manrope", "Nunito", "Source Sans Pro", "Libre Baskerville",
    "Oswald", "Space Grotesk", "Merriweather", "Rubik", "PT Sans",
];

const NAV_ITEMS = [
    { id: "overview", label: "Overview", icon: BookOpen },
    { id: "colors", label: "Colores", icon: Palette },
    { id: "typography", label: "Tipografía", icon: Type },
    { id: "tones", label: "Tono de voz", icon: MessageSquare },
    { id: "messages", label: "Mensajes clave", icon: Target },
    { id: "identity", label: "Identidad", icon: Sparkles },
];

export default function BrandDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { data: brand, isLoading } = useBrand(id);
    const updateBrand = useUpdateBrand();
    const exportPdf = useExportBrandPdf();

    const [activeSection, setActiveSection] = useState("overview");
    const [editing, setEditing] = useState<EditSection>(null);

    // Edit states
    const [editName, setEditName] = useState("");
    const [editTagline, setEditTagline] = useState("");
    const [editColors, setEditColors] = useState<Record<string, string>>({});
    const [editTypo, setEditTypo] = useState<Record<string, string>>({});
    const [editTones, setEditTones] = useState("");
    const [editMessages, setEditMessages] = useState("");
    const [editIdentity, setEditIdentity] = useState<Record<string, any>>({});

    if (isLoading) {
        return (
            <div className="flex flex-col h-full">
                <div className="h-16 flex items-center px-6 border-b border-border">
                    <div className="w-32 h-4 skeleton rounded" />
                </div>
                <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    if (!brand) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Marca no encontrada</p>
            </div>
        );
    }

    const palette = brand.color_palette || {};
    const typo = brand.typography || {};
    const tones = brand.tones || [];
    const messages = brand.key_messages || [];
    const identity = brand.brand_identity || {};
    const primaryHex = palette.primary || "#6D28D9";
    const initials = brand.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    // ── Start editing ──
    const startEdit = (section: EditSection) => {
        if (section === "overview") {
            setEditName(brand.name);
            setEditTagline(brand.tagline || "");
        } else if (section === "colors") {
            setEditColors({ ...palette });
        } else if (section === "typography") {
            setEditTypo({ ...typo });
        } else if (section === "tones") {
            setEditTones(tones.join(", "));
        } else if (section === "messages") {
            setEditMessages(messages.join("\n"));
        } else if (section === "identity") {
            setEditIdentity({ ...identity });
        }
        setEditing(section);
    };

    // ── Save edit ──
    const saveEdit = () => {
        if (!editing) return;
        const payload: Record<string, any> = {};

        if (editing === "overview") {
            payload.name = editName;
            payload.tagline = editTagline || undefined;
        } else if (editing === "colors") {
            payload.color_palette = editColors;
        } else if (editing === "typography") {
            payload.typography = editTypo;
        } else if (editing === "tones") {
            payload.tones = editTones.split(",").map(s => s.trim()).filter(Boolean);
        } else if (editing === "messages") {
            payload.key_messages = editMessages.split("\n").map(s => s.trim()).filter(Boolean);
        } else if (editing === "identity") {
            payload.brand_identity = editIdentity;
        }

        updateBrand.mutate({ id: brand.id, ...payload }, { onSuccess: () => setEditing(null) });
    };

    const cancelEdit = () => setEditing(null);

    const copyHex = (hex: string) => {
        navigator.clipboard.writeText(hex);
        toast.success(`${hex} copiado`);
    };

    // ── Section Renderers ──

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Hero card */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold mb-4 shadow-lg"
                    style={{ backgroundColor: primaryHex, color: "#fff" }}>
                    {initials}
                </div>
                {editing === "overview" ? (
                    <div className="space-y-3 w-full max-w-sm">
                        <input value={editName} onChange={e => setEditName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-center text-lg font-semibold text-foreground outline-none focus:border-ring" />
                        <input value={editTagline} onChange={e => setEditTagline(e.target.value)} placeholder="Tagline"
                            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-center text-sm text-muted-foreground outline-none focus:border-ring" />
                        <div className="flex justify-center gap-2 pt-2">
                            <button onClick={saveEdit} disabled={updateBrand.isPending}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                                {updateBrand.isPending ? <Spinner className="w-3 h-3" /> : <Save className="w-3 h-3" />} Guardar
                            </button>
                            <button onClick={cancelEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground">
                                <X className="w-3 h-3" /> Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-foreground">{brand.name}</h2>
                        {brand.tagline && <p className="text-sm text-muted-foreground mt-1">{brand.tagline}</p>}
                        <div className="flex items-center gap-3 mt-3">
                            <StatusBadge status={brand.status} />
                            <button onClick={() => startEdit("overview")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                                <Edit3 className="w-3 h-3" /> Editar
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Identity fields */}
            {(identity.archetype || identity.purpose || identity.mission || identity.vision) && (
                <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Identidad de Marca</h3>
                    </div>
                    {identity.archetype && (
                        <div>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Arquetipo</span>
                            <p className="text-sm text-foreground mt-0.5">{identity.archetype}</p>
                        </div>
                    )}
                    {identity.purpose && (
                        <div>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Propósito</span>
                            <p className="text-sm text-foreground mt-0.5">{identity.purpose}</p>
                        </div>
                    )}
                    {identity.mission && (
                        <div>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Misión</span>
                            <p className="text-sm text-foreground mt-0.5">{identity.mission}</p>
                        </div>
                    )}
                    {identity.vision && (
                        <div>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Visión</span>
                            <p className="text-sm text-foreground mt-0.5">{identity.vision}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderColors = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Paleta de Colores</h3>
                {editing === "colors" ? (
                    <div className="flex gap-2">
                        <button onClick={saveEdit} disabled={updateBrand.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                            {updateBrand.isPending ? <Spinner className="w-3 h-3" /> : <Check className="w-3 h-3" />} Guardar
                        </button>
                        <button onClick={cancelEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground">
                            <X className="w-3 h-3" /> Cancelar
                        </button>
                    </div>
                ) : (
                    <button onClick={() => startEdit("colors")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> Editar
                    </button>
                )}
            </div>

            {/* Large swatches */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {(["primary", "secondary", "accent", "background", "text"] as const).map(role => {
                    const hex = editing === "colors" ? (editColors[role] || "#888888") : (palette[role] || "#888888");
                    const labels: Record<string, string> = { primary: "Primario", secondary: "Secundario", accent: "Acento", background: "Fondo", text: "Texto" };
                    return (
                        <div key={role} className="bg-card border border-border rounded-xl overflow-hidden group">
                            <div className="h-24 relative" style={{ backgroundColor: hex }}>
                                {editing !== "colors" && (
                                    <button onClick={() => copyHex(hex)}
                                        className="absolute top-2 right-2 p-1 rounded-md bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Copy className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <div className="p-3">
                                <p className="text-xs font-medium text-foreground">{labels[role]}</p>
                                {editing === "colors" ? (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <input type="color" value={hex}
                                            onChange={e => setEditColors({ ...editColors, [role]: e.target.value })}
                                            className="w-5 h-5 rounded border border-border cursor-pointer bg-transparent p-0" />
                                        <input value={hex}
                                            onChange={e => setEditColors({ ...editColors, [role]: e.target.value })}
                                            className="flex-1 px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] text-foreground outline-none font-mono" />
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{hex.toUpperCase()}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderTypography = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Tipografía</h3>
                {editing === "typography" ? (
                    <div className="flex gap-2">
                        <button onClick={saveEdit} disabled={updateBrand.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                            {updateBrand.isPending ? <Spinner className="w-3 h-3" /> : <Check className="w-3 h-3" />} Guardar
                        </button>
                        <button onClick={cancelEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground">
                            <X className="w-3 h-3" /> Cancelar
                        </button>
                    </div>
                ) : (
                    <button onClick={() => startEdit("typography")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> Editar
                    </button>
                )}
            </div>

            {[
                { key: "heading_font", label: "Títulos / Display", desc: "Usado en headers, títulos de secciones y headlines" },
                { key: "body_font", label: "Cuerpo / Párrafos", desc: "Usado en textos, descripciones y UI" },
                { key: "ui_font", label: "UI / Interfaz", desc: "Botones, labels, navegación" },
            ].map(({ key, label, desc }) => {
                const fontName = editing === "typography" ? (editTypo[key] || "") : (typo[key] || "");
                if (!fontName && editing !== "typography") return null;
                return (
                    <div key={key} className="bg-card border border-border rounded-xl p-5">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                        {editing === "typography" ? (
                            <select value={editTypo[key] || ""}
                                onChange={e => setEditTypo({ ...editTypo, [key]: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring mb-2">
                                <option value="">— Sin asignar —</option>
                                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        ) : (
                            <>
                                <p className="text-xl font-bold text-foreground">{fontName}</p>
                                <p className="text-sm text-muted-foreground mt-1">Aa Bb Cc Dd Ee Ff Gg 0123456789</p>
                                <p className="text-xs text-muted-foreground mt-2">{desc}</p>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderTones = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Tono de Voz</h3>
                {editing === "tones" ? (
                    <div className="flex gap-2">
                        <button onClick={saveEdit} disabled={updateBrand.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                            {updateBrand.isPending ? <Spinner className="w-3 h-3" /> : <Check className="w-3 h-3" />} Guardar
                        </button>
                        <button onClick={cancelEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground">
                            <X className="w-3 h-3" /> Cancelar
                        </button>
                    </div>
                ) : (
                    <button onClick={() => startEdit("tones")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> Editar
                    </button>
                )}
            </div>

            {editing === "tones" ? (
                <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Tonos separados por coma</label>
                    <input value={editTones} onChange={e => setEditTones(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring" />
                </div>
            ) : tones.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {tones.map(tone => (
                        <span key={tone} className="px-4 py-2 rounded-xl bg-pink-400/10 text-pink-400 border border-pink-400/20 text-sm font-medium">
                            {tone}
                        </span>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">No hay tonos definidos.</p>
            )}

            {/* YES / NO words */}
            {(identity.yes_words || identity.no_words) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    {identity.yes_words && (
                        <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-4">
                            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Palabras SI</p>
                            <div className="flex flex-wrap gap-1.5">
                                {identity.yes_words.map((w: string) => (
                                    <span key={w} className="px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 text-xs">{w}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {identity.no_words && (
                        <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4">
                            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Palabras NO</p>
                            <div className="flex flex-wrap gap-1.5">
                                {identity.no_words.map((w: string) => (
                                    <span key={w} className="px-2 py-0.5 rounded-full bg-red-400/10 text-red-400 text-xs">{w}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderMessages = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Mensajes Clave</h3>
                {editing === "messages" ? (
                    <div className="flex gap-2">
                        <button onClick={saveEdit} disabled={updateBrand.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                            {updateBrand.isPending ? <Spinner className="w-3 h-3" /> : <Check className="w-3 h-3" />} Guardar
                        </button>
                        <button onClick={cancelEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground">
                            <X className="w-3 h-3" /> Cancelar
                        </button>
                    </div>
                ) : (
                    <button onClick={() => startEdit("messages")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> Editar
                    </button>
                )}
            </div>

            {editing === "messages" ? (
                <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Un mensaje por línea</label>
                    <textarea value={editMessages} onChange={e => setEditMessages(e.target.value)} rows={6}
                        className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring resize-none" />
                </div>
            ) : messages.length > 0 ? (
                <div className="space-y-3">
                    {messages.map((msg, i) => (
                        <div key={i} className="flex gap-4 bg-card border border-border rounded-xl p-4 items-start">
                            <span className="text-lg font-bold shrink-0 w-8 text-center" style={{ color: primaryHex }}>
                                {String(i + 1).padStart(2, "0")}
                            </span>
                            <p className="text-sm text-foreground">{msg}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">No hay mensajes clave definidos.</p>
            )}
        </div>
    );

    const renderIdentity = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Brand Identity Extendida</h3>
                {editing === "identity" ? (
                    <div className="flex gap-2">
                        <button onClick={saveEdit} disabled={updateBrand.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                            {updateBrand.isPending ? <Spinner className="w-3 h-3" /> : <Check className="w-3 h-3" />} Guardar
                        </button>
                        <button onClick={cancelEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground">
                            <X className="w-3 h-3" /> Cancelar
                        </button>
                    </div>
                ) : (
                    <button onClick={() => startEdit("identity")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> Editar
                    </button>
                )}
            </div>

            {editing === "identity" ? (
                <div className="space-y-4">
                    {[
                        { key: "archetype", label: "Arquetipo" },
                        { key: "purpose", label: "Propósito" },
                        { key: "mission", label: "Misión" },
                        { key: "vision", label: "Visión" },
                        { key: "logo_concept", label: "Concepto de Logo" },
                    ].map(({ key, label }) => (
                        <div key={key}>
                            <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                            <input value={editIdentity[key] || ""} onChange={e => setEditIdentity({ ...editIdentity, [key]: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring" />
                        </div>
                    ))}
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Valores (separados por coma)</label>
                        <input value={(editIdentity.values || []).join(", ")}
                            onChange={e => setEditIdentity({ ...editIdentity, values: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })}
                            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground outline-none focus:border-ring" />
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {identity.values && identity.values.length > 0 && (
                        <div className="bg-card border border-border rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Valores de Marca</p>
                            <div className="flex flex-wrap gap-2">
                                {identity.values.map((v: string) => (
                                    <span key={v} className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border" style={{ color: primaryHex, borderColor: `${primaryHex}33`, backgroundColor: `${primaryHex}0D` }}>
                                        {v}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {identity.logo_concept && (
                        <div className="bg-card border border-border rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Concepto de Logo</p>
                            <p className="text-sm text-foreground">{identity.logo_concept}</p>
                        </div>
                    )}
                    {!identity.values?.length && !identity.logo_concept && !identity.archetype && (
                        <p className="text-sm text-muted-foreground">No hay datos de identidad extendida. Usa el agente de branding para generar un Brand Book completo.</p>
                    )}
                </div>
            )}
        </div>
    );

    const sectionRenderers: Record<string, () => React.ReactNode> = {
        overview: renderOverview,
        colors: renderColors,
        typography: renderTypography,
        tones: renderTones,
        messages: renderMessages,
        identity: renderIdentity,
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <header className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 min-h-16 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <button onClick={() => router.push("/branding")}
                        aria-label="Volver"
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: primaryHex, color: "#fff" }}>
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-semibold text-foreground leading-tight truncate">{brand.name}</h1>
                            <p className="text-[10px] text-muted-foreground hidden sm:block">Brand Guidelines</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => exportPdf.mutate({ id: brand.id, name: brand.name })}
                        disabled={exportPdf.isPending}
                        aria-label="Exportar PDF"
                        className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 h-9 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent active:scale-[0.98] transition-all disabled:opacity-50">
                        {exportPdf.isPending ? <Spinner className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline whitespace-nowrap">Exportar PDF</span>
                    </button>
                </div>
            </header>

            {/* Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left nav (desktop) */}
                <nav className="hidden md:flex flex-col w-52 border-r border-border p-3 gap-0.5 shrink-0 overflow-y-auto scrollbar-thin">
                    {NAV_ITEMS.map(item => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                            <button key={item.id} onClick={() => { setActiveSection(item.id); setEditing(null); }}
                                className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left",
                                    isActive ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                )}>
                                <Icon className="w-4 h-4 shrink-0" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Mobile nav tabs */}
                <div className="md:hidden flex overflow-x-auto border-b border-border px-2 gap-1 shrink-0 scrollbar-thin">
                    {NAV_ITEMS.map(item => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                            <button key={item.id} onClick={() => { setActiveSection(item.id); setEditing(null); }}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap border-b-2 transition-all shrink-0",
                                    isActive ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
                                )}>
                                <Icon className="w-3.5 h-3.5" />
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
                    <div className="max-w-3xl mx-auto">
                        {sectionRenderers[activeSection]?.()}
                    </div>
                </div>
            </div>
        </div>
    );
}