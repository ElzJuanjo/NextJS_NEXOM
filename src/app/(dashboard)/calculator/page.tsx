"use client";

import { useState, useMemo, useCallback } from "react";
import {
    Calculator, DollarSign, TrendingUp, Package, Truck, BarChart3,
    Globe, ChevronDown, ChevronUp, Info, Copy, Check, RotateCcw,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";

// ── Country configurations ────────────────────────────────────────────────

interface CountryConfig {
    id: string;
    name: string;
    flag: string;
    currency: string;
    currencySymbol: string;
    usdRate: number | null; // null = no conversion needed
    defaults: {
        precioProveedor: number;
        fleteBase: number;
        entregaSobreDespacho: number;
        costosAdmin: number;
        fulfillment: number;
        cpaAds: number;
        utilidadPct: number;
        precioComparacionPct: number;
    };
}

const COUNTRIES: CountryConfig[] = [
    {
        id: "co", name: "Colombia", flag: "🇨🇴", currency: "COP", currencySymbol: "$",
        usdRate: null,
        defaults: { precioProveedor: 30000, fleteBase: 19000, entregaSobreDespacho: 75, costosAdmin: 0, fulfillment: 0, cpaAds: 15000, utilidadPct: 20, precioComparacionPct: 50 },
    },
    {
        id: "mx", name: "México", flag: "🇲🇽", currency: "MXN", currencySymbol: "$",
        usdRate: null,
        defaults: { precioProveedor: 120, fleteBase: 145, entregaSobreDespacho: 65, costosAdmin: 0, fulfillment: 0, cpaAds: 90, utilidadPct: 20, precioComparacionPct: 40 },
    },
    {
        id: "ec", name: "Ecuador", flag: "🇪🇨", currency: "USD", currencySymbol: "$",
        usdRate: null,
        defaults: { precioProveedor: 10, fleteBase: 7, entregaSobreDespacho: 70, costosAdmin: 0, fulfillment: 0, cpaAds: 4.5, utilidadPct: 20, precioComparacionPct: 40 },
    },
    {
        id: "es", name: "España", flag: "🇪🇸", currency: "EUR", currencySymbol: "€",
        usdRate: null,
        defaults: { precioProveedor: 3, fleteBase: 5, entregaSobreDespacho: 65, costosAdmin: 0, fulfillment: 0, cpaAds: 7, utilidadPct: 20, precioComparacionPct: 40 },
    },
    {
        id: "cl", name: "Chile", flag: "🇨🇱", currency: "CLP", currencySymbol: "$",
        usdRate: null,
        defaults: { precioProveedor: 3000, fleteBase: 8000, entregaSobreDespacho: 65, costosAdmin: 0, fulfillment: 0, cpaAds: 4000, utilidadPct: 10, precioComparacionPct: 40 },
    },
    {
        id: "pe", name: "Perú", flag: "🇵🇪", currency: "PEN", currencySymbol: "S/",
        usdRate: null,
        defaults: { precioProveedor: 42.9, fleteBase: 15, entregaSobreDespacho: 70, costosAdmin: 0, fulfillment: 0, cpaAds: 17, utilidadPct: 10, precioComparacionPct: 40 },
    },
    {
        id: "gt", name: "Guatemala", flag: "🇬🇹", currency: "GTQ", currencySymbol: "Q",
        usdRate: 0.13,
        defaults: { precioProveedor: 137, fleteBase: 32, entregaSobreDespacho: 65, costosAdmin: 0, fulfillment: 0, cpaAds: 30, utilidadPct: 20, precioComparacionPct: 50 },
    },
    {
        id: "ar", name: "Argentina", flag: "🇦🇷", currency: "ARS", currencySymbol: "$",
        usdRate: 0.00072,
        defaults: { precioProveedor: 5920, fleteBase: 7030, entregaSobreDespacho: 65, costosAdmin: 0, fulfillment: 0, cpaAds: 5550, utilidadPct: 20, precioComparacionPct: 50 },
    },
];

// ── Calculation engine ────────────────────────────────────────────────────

interface CalcInputs {
    precioProveedor: number;
    fleteBase: number;
    entregaSobreDespacho: number; // percentage 0-100
    costosAdmin: number;
    fulfillment: number;
    cpaAds: number;
    utilidadPct: number; // percentage 0-100
    precioComparacionPct: number; // percentage 0-100
}

interface CalcResults {
    fleteConDevoluciones: number;
    cpaCosteado: number;
    cpaCosteadoPct: number;
    costosTotales: number;
    utilidad: number;
    precioVenta: number;
    precioComparacion: number;
    bep: number;
    // USD conversions (only for countries with usdRate)
    costosTotalesUsd: number | null;
    utilidadUsd: number | null;
    precioVentaUsd: number | null;
    precioComparacionUsd: number | null;
}

function calculate(inputs: CalcInputs, usdRate: number | null): CalcResults {
    const entregaPct = inputs.entregaSobreDespacho / 100;
    const utilPct = inputs.utilidadPct / 100;
    const compPct = inputs.precioComparacionPct / 100;

    const fleteConDevoluciones = entregaPct > 0 ? inputs.fleteBase / entregaPct : 0;
    const cpaCosteadoPct = Math.max(entregaPct - 0.10, 0.01);
    const cpaCosteado = cpaCosteadoPct > 0 ? inputs.cpaAds / cpaCosteadoPct : 0;

    const costosTotales = inputs.precioProveedor + fleteConDevoluciones + inputs.costosAdmin + inputs.fulfillment + cpaCosteado;
    const utilidad = utilPct < 1 ? costosTotales / (1 - utilPct) - costosTotales : 0;
    const precioVenta = costosTotales + utilidad;
    const precioComparacion = compPct > 0 ? precioVenta / compPct : precioVenta * 2;
    const bep = utilidad + inputs.cpaAds;

    const toUsd = (v: number) => usdRate ? v * usdRate : null;

    return {
        fleteConDevoluciones,
        cpaCosteado,
        cpaCosteadoPct,
        costosTotales,
        utilidad,
        precioVenta,
        precioComparacion,
        bep,
        costosTotalesUsd: toUsd(costosTotales),
        utilidadUsd: toUsd(utilidad),
        precioVentaUsd: toUsd(precioVenta),
        precioComparacionUsd: toUsd(precioComparacion),
    };
}

// ── Format helpers ────────────────────────────────────────────────────────

function fmt(value: number, decimals: number = 0): string {
    return value.toLocaleString("es-CO", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCurrency(value: number, symbol: string, decimals?: number): string {
    const d = decimals ?? (value >= 1000 ? 0 : 2);
    return `${symbol}${fmt(value, d)}`;
}

// ── Input field component ─────────────────────────────────────────────────

function CalcField({
    label,
    value,
    onChange,
    suffix,
    icon: Icon,
    hint,
    disabled,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    suffix?: string;
    icon?: React.ElementType;
    hint?: string;
    disabled?: boolean;
}) {
    return (
        <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                {Icon && <Icon className="w-3 h-3" />}
                {label}
                {hint && (
                    <span className="group relative">
                        <Info className="w-3 h-3 text-muted-foreground/50 cursor-help" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover border border-border rounded text-[10px] text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                            {hint}
                        </span>
                    </span>
                )}
            </label>
            <div className="relative">
                <input
                    type="number"
                    value={value || ""}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                    className={cn(
                        "w-full px-3 py-2 rounded-lg border text-sm font-medium tabular-nums outline-none transition-all",
                        "bg-secondary/50 border-border text-foreground",
                        "focus:border-ring focus:ring-1 focus:ring-ring",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        suffix ? "pr-10" : "",
                    )}
                />
                {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                        {suffix}
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Result row component ──────────────────────────────────────────────────

function ResultRow({
    label,
    value,
    valueUsd,
    highlight,
    large,
    color,
}: {
    label: string;
    value: string;
    valueUsd?: string | null;
    highlight?: boolean;
    large?: boolean;
    color?: string;
}) {
    return (
        <div className={cn(
            "flex items-center justify-between py-2",
            highlight && "bg-primary/5 -mx-3 px-3 rounded-lg",
        )}>
            <span className={cn(
                "text-muted-foreground",
                large ? "text-sm font-medium" : "text-xs",
            )}>
                {label}
            </span>
            <div className="text-right">
                <span className={cn(
                    "font-semibold tabular-nums",
                    large ? "text-base" : "text-sm",
                    color || "text-foreground",
                )}>
                    {value}
                </span>
                {valueUsd && (
                    <span className="block text-[10px] text-muted-foreground tabular-nums">
                        ≈ US${valueUsd}
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Country calculator card ───────────────────────────────────────────────

function CountryCalculator({
    country,
    inputs,
    onInputChange,
    onReset,
    expanded,
    onToggleExpand,
}: {
    country: CountryConfig;
    inputs: CalcInputs;
    onInputChange: (field: keyof CalcInputs, value: number) => void;
    onReset: () => void;
    expanded: boolean;
    onToggleExpand: () => void;
}) {
    const results = useMemo(() => calculate(inputs, country.usdRate), [inputs, country.usdRate]);
    const [copied, setCopied] = useState(false);

    const copyResults = useCallback(() => {
        const text = [
            `${country.flag} ${country.name} — Calculadora de Precios`,
            `Precio Proveedor: ${fmtCurrency(inputs.precioProveedor, country.currencySymbol)}`,
            `Flete con dev: ${fmtCurrency(results.fleteConDevoluciones, country.currencySymbol)}`,
            `CPA costeado: ${fmtCurrency(results.cpaCosteado, country.currencySymbol)}`,
            `Costos totales: ${fmtCurrency(results.costosTotales, country.currencySymbol)}`,
            `Utilidad (${inputs.utilidadPct}%): ${fmtCurrency(results.utilidad, country.currencySymbol)}`,
            `PRECIO DE VENTA: ${fmtCurrency(results.precioVenta, country.currencySymbol)}`,
            `Precio comparación: ${fmtCurrency(results.precioComparacion, country.currencySymbol)}`,
            `BEP: ${fmtCurrency(results.bep, country.currencySymbol)}`,
        ].join("\n");
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [country, inputs, results]);

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden transition-all hover:border-ring/30">
            {/* Header — always visible */}
            <button
                onClick={onToggleExpand}
                className="w-full flex items-center justify-between p-4 text-left"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">{country.name}</h3>
                        <span className="text-[10px] text-muted-foreground">{country.currency}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Quick preview of sale price */}
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Precio venta</p>
                        <p className="text-sm font-bold text-emerald-400 tabular-nums">
                            {fmtCurrency(results.precioVenta, country.currencySymbol)}
                        </p>
                    </div>
                    {expanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                </div>
            </button>

            {/* Expandable body */}
            {expanded && (
                <div className="border-t border-border">
                    <div className="p-4 space-y-5">
                        {/* Inputs grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <CalcField
                                label="Precio proveedor"
                                value={inputs.precioProveedor}
                                onChange={(v) => onInputChange("precioProveedor", v)}
                                icon={Package}
                                suffix={country.currency}
                            />
                            <CalcField
                                label="Flete base"
                                value={inputs.fleteBase}
                                onChange={(v) => onInputChange("fleteBase", v)}
                                icon={Truck}
                                suffix={country.currency}
                            />
                            <CalcField
                                label="Entrega / Despacho"
                                value={inputs.entregaSobreDespacho}
                                onChange={(v) => onInputChange("entregaSobreDespacho", v)}
                                suffix="%"
                                hint="% de órdenes entregadas sobre despachadas"
                            />
                            <CalcField
                                label="CPA Ads"
                                value={inputs.cpaAds}
                                onChange={(v) => onInputChange("cpaAds", v)}
                                icon={BarChart3}
                                suffix={country.currency}
                            />
                            <CalcField
                                label="Costos admin"
                                value={inputs.costosAdmin}
                                onChange={(v) => onInputChange("costosAdmin", v)}
                                suffix={country.currency}
                            />
                            <CalcField
                                label="Fulfillment"
                                value={inputs.fulfillment}
                                onChange={(v) => onInputChange("fulfillment", v)}
                                suffix={country.currency}
                            />
                            <CalcField
                                label="Utilidad deseada"
                                value={inputs.utilidadPct}
                                onChange={(v) => onInputChange("utilidadPct", v)}
                                icon={TrendingUp}
                                suffix="%"
                            />
                            <CalcField
                                label="Precio comparación"
                                value={inputs.precioComparacionPct}
                                onChange={(v) => onInputChange("precioComparacionPct", v)}
                                suffix="%"
                                hint="Descuento para precio tachado (40% o 50%)"
                            />
                        </div>

                        {/* Divider */}
                        <div className="border-t border-border" />

                        {/* Results */}
                        <div className="space-y-1">
                            <ResultRow
                                label="Flete con devoluciones"
                                value={fmtCurrency(results.fleteConDevoluciones, country.currencySymbol)}
                            />
                            <ResultRow
                                label={`CPA costeado (${(results.cpaCosteadoPct * 100).toFixed(0)}% efectividad)`}
                                value={fmtCurrency(results.cpaCosteado, country.currencySymbol)}
                            />
                            <ResultRow
                                label="Costos totales"
                                value={fmtCurrency(results.costosTotales, country.currencySymbol)}
                                valueUsd={results.costosTotalesUsd ? fmt(results.costosTotalesUsd, 2) : null}
                            />

                            <div className="border-t border-border my-1" />

                            <ResultRow
                                label={`Utilidad (${inputs.utilidadPct}%)`}
                                value={fmtCurrency(results.utilidad, country.currencySymbol)}
                                valueUsd={results.utilidadUsd ? fmt(results.utilidadUsd, 2) : null}
                                color="text-emerald-400"
                            />
                            <ResultRow
                                label="Precio de venta"
                                value={fmtCurrency(results.precioVenta, country.currencySymbol)}
                                valueUsd={results.precioVentaUsd ? fmt(results.precioVentaUsd, 2) : null}
                                highlight
                                large
                                color="text-emerald-400"
                            />
                            <ResultRow
                                label={`Precio comparación (${inputs.precioComparacionPct}%)`}
                                value={fmtCurrency(results.precioComparacion, country.currencySymbol)}
                                valueUsd={results.precioComparacionUsd ? fmt(results.precioComparacionUsd, 2) : null}
                            />
                            <ResultRow
                                label="BEP (Break Even Point)"
                                value={fmtCurrency(results.bep, country.currencySymbol)}
                                color="text-amber-400"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                            <button
                                onClick={copyResults}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                            >
                                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                {copied ? "Copiado" : "Copiar"}
                            </button>
                            <button
                                onClick={onReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function CalculatorPage() {
    // State: inputs per country
    const [allInputs, setAllInputs] = useState<Record<string, CalcInputs>>(() => {
        const initial: Record<string, CalcInputs> = {};
        for (const c of COUNTRIES) {
            initial[c.id] = { ...c.defaults };
        }
        return initial;
    });

    // Expanded countries
    const [expanded, setExpanded] = useState<Set<string>>(new Set(["co"]));

    const toggleExpand = (id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const expandAll = () => setExpanded(new Set(COUNTRIES.map((c) => c.id)));
    const collapseAll = () => setExpanded(new Set());

    const updateInput = (countryId: string, field: keyof CalcInputs, value: number) => {
        setAllInputs((prev) => ({
            ...prev,
            [countryId]: { ...prev[countryId], [field]: value },
        }));
    };

    const resetCountry = (countryId: string) => {
        const country = COUNTRIES.find((c) => c.id === countryId);
        if (country) {
            setAllInputs((prev) => ({
                ...prev,
                [countryId]: { ...country.defaults },
            }));
        }
    };

    // Summary across all countries
    const summaryData = useMemo(() => {
        return COUNTRIES.map((c) => {
            const inputs = allInputs[c.id];
            const results = calculate(inputs, c.usdRate);
            return { country: c, inputs, results };
        });
    }, [allInputs]);

    return (
        <div className="flex flex-col h-full">
            <Header title="Calculadora" subtitle="Calculadora de precios y márgenes por mercado" />

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {/* Summary bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                    {summaryData.map(({ country, results }) => (
                        <button
                            key={country.id}
                            onClick={() => {
                                if (!expanded.has(country.id)) toggleExpand(country.id);
                                document.getElementById(`calc-${country.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                            }}
                            className={cn(
                                "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all",
                                expanded.has(country.id)
                                    ? "bg-primary/5 border-primary/30"
                                    : "bg-card border-border hover:border-ring/30",
                            )}
                        >
                            <span className="text-lg">{country.flag}</span>
                            <span className="text-[10px] text-muted-foreground font-medium">{country.name}</span>
                            <span className="text-xs font-bold text-emerald-400 tabular-nums">
                                {country.currencySymbol}{fmt(results.precioVenta, results.precioVenta >= 1000 ? 0 : 2)}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={expandAll}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Expandir todos
                    </button>
                    <span className="text-muted-foreground/30">|</span>
                    <button
                        onClick={collapseAll}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Colapsar todos
                    </button>
                </div>

                {/* Country calculators */}
                <div className="space-y-3">
                    {COUNTRIES.map((country) => (
                        <div key={country.id} id={`calc-${country.id}`}>
                            <CountryCalculator
                                country={country}
                                inputs={allInputs[country.id]}
                                onInputChange={(field, value) => updateInput(country.id, field, value)}
                                onReset={() => resetCountry(country.id)}
                                expanded={expanded.has(country.id)}
                                onToggleExpand={() => toggleExpand(country.id)}
                            />
                        </div>
                    ))}
                </div>

                {/* Notes */}
                <div className="bg-secondary/30 border border-border rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                        Notas importantes
                    </h4>
                    <ul className="text-[11px] text-muted-foreground space-y-1.5 leading-relaxed">
                        <li>
                            <span className="font-medium text-foreground">Entrega sobre despachado:</span> porcentaje de órdenes entregadas sobre las despachadas (ya descontando cancelados y rechazados que pueden sumar un 10% adicional).
                        </li>
                        <li>
                            <span className="font-medium text-foreground">CPA costeado:</span> se calcula con un 10% menos de efectividad que la entrega, para cubrir la ineficiencia del funnel.
                        </li>
                        <li>
                            <span className="font-medium text-foreground">BEP (Break Even Point):</span> punto de equilibrio = utilidad + CPA. Si tu CPA real supera este valor, estás perdiendo dinero.
                        </li>
                        <li>
                            <span className="font-medium text-foreground">Precio de comparación:</span> precio tachado en la tienda. Se calcula dividiendo el precio de venta entre el porcentaje configurado (50% = precio tachado es el doble).
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}