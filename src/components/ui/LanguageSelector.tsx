"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

/**
 * LanguageSelector — Multi-idioma via Google Translate Element.
 *
 * Cómo funciona:
 * 1. Carga el script de Google Translate Element (gratis, sin API key).
 * 2. Renderiza el widget invisible en un div oculto.
 * 3. Expone un selector custom con banderas ES/EN/PT.
 * 4. Al hacer click, guarda la preferencia, setea cookie googtrans y recarga.
 * 5. Al cargar la página, aplica el idioma guardado automáticamente.
 *
 * Zero backend changes — pure frontend component.
 */

type Lang = "es" | "en" | "pt";

const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
    { code: "es", label: "ES", flag: "🇪🇸" },
    { code: "en", label: "EN", flag: "🇺🇸" },
    { code: "pt", label: "PT", flag: "🇧🇷" },
];

const STORAGE_KEY = "nexos-lang";

// Google Translate language codes
const GT_CODES: Record<Lang, string> = {
    es: "es",
    en: "en",
    pt: "pt",
};

/**
 * Attempts to apply a language via the Google Translate widget select.
 * Returns true if the select was found and changed, false otherwise.
 */
function triggerGoogleTranslate(lang: Lang): boolean {
    const gtCode = GT_CODES[lang];
    const selectEl = document.querySelector<HTMLSelectElement>(
        "#google_translate_element select.goog-te-combo"
    );

    if (selectEl) {
        selectEl.value = gtCode;
        selectEl.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
    }
    return false;
}

/**
 * Sets the googtrans cookie for a given language (or clears it for "es").
 */
function setGoogleTranslateCookie(lang: Lang) {
    const gtCode = GT_CODES[lang];
    if (lang === "es") {
        document.cookie =
            "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
            "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." +
            window.location.hostname;
    } else {
        document.cookie = `googtrans=/es/${gtCode}; path=/`;
        document.cookie = `googtrans=/es/${gtCode}; path=/; domain=.${window.location.hostname}`;
    }
}

export function LanguageSelector({ collapsed = false }: { collapsed?: boolean }) {
    const [current, setCurrent] = useState<Lang>("es");
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const appliedRef = useRef(false);

    // ── Init: load saved preference ──
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
        if (saved && GT_CODES[saved]) {
            setCurrent(saved);
        }
    }, []);

    // ── Load Google Translate script & auto-apply saved language ──
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
        const targetLang = saved && GT_CODES[saved] ? saved : null;

        // If language is "es" (default) or no saved pref, no need to translate
        if (!targetLang || targetLang === "es") {
            // Still ensure cookie is cleared for "es"
            if (!targetLang || targetLang === "es") {
                setGoogleTranslateCookie("es");
            }
            initGoogleTranslateScript(() => { });
            return;
        }

        // Set the cookie immediately so Google Translate picks it up on init
        setGoogleTranslateCookie(targetLang);

        initGoogleTranslateScript(() => {
            // Widget is initialized — now force-apply the language with retries
            applyWithRetries(targetLang, 10, 300);
        });
    }, []);

    /**
     * Loads the Google Translate script (if not already loaded)
     * and calls `onReady` once the widget has initialized.
     */
    function initGoogleTranslateScript(onReady: () => void) {
        // If already loaded and widget exists, just fire onReady
        if (document.getElementById("google-translate-script")) {
            const selectEl = document.querySelector<HTMLSelectElement>(
                "#google_translate_element select.goog-te-combo"
            );
            if (selectEl) {
                onReady();
            } else {
                // Script loaded but widget not yet rendered — poll for it
                pollForWidget(onReady, 20, 250);
            }
            return;
        }

        (window as any).googleTranslateElementInit = () => {
            new (window as any).google.translate.TranslateElement(
                {
                    pageLanguage: "es",
                    includedLanguages: "es,en,pt",
                    autoDisplay: false,
                    layout: (window as any).google.translate.TranslateElement
                        .InlineLayout.SIMPLE,
                },
                "google_translate_element"
            );
            // Poll until the <select> is actually in the DOM
            pollForWidget(onReady, 20, 250);
        };

        const script = document.createElement("script");
        script.id = "google-translate-script";
        script.src =
            "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        document.body.appendChild(script);
    }

    /**
     * Polls for the Google Translate <select> to appear in the DOM.
     */
    function pollForWidget(onReady: () => void, maxAttempts: number, intervalMs: number) {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            const selectEl = document.querySelector<HTMLSelectElement>(
                "#google_translate_element select.goog-te-combo"
            );
            if (selectEl) {
                clearInterval(interval);
                onReady();
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                // Give up — widget didn't render. Cookie fallback should still work on next reload.
            }
        }, intervalMs);
    }

    /**
     * Tries to apply the translation via the widget select, retrying if needed.
     * This handles the race condition where the widget is in the DOM but not
     * fully ready to process change events.
     */
    function applyWithRetries(lang: Lang, maxAttempts: number, intervalMs: number) {
        if (appliedRef.current) return;

        let attempts = 0;
        const tryApply = () => {
            attempts++;
            const success = triggerGoogleTranslate(lang);

            if (success) {
                appliedRef.current = true;
                return;
            }

            if (attempts < maxAttempts) {
                setTimeout(tryApply, intervalMs);
            }
        };

        tryApply();
    }

    // ── Close popover on outside click ──
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // ── Handle language change ──
    const handleSelect = useCallback((lang: Lang) => {
        if (lang === current) {
            setOpen(false);
            return;
        }

        // Save preference
        setCurrent(lang);
        localStorage.setItem(STORAGE_KEY, lang);

        // Set cookie before reload
        setGoogleTranslateCookie(lang);

        setOpen(false);

        // Reload to apply
        window.location.reload();
    }, [current]);

    const currentLang = LANGUAGES.find((l) => l.code === current) || LANGUAGES[0];

    return (
        <div ref={containerRef} className="relative notranslate">
            {/* Hidden Google Translate widget — must exist in DOM */}
            <div
                id="google_translate_element"
                style={{
                    position: "absolute",
                    top: -9999,
                    left: -9999,
                    width: 0,
                    height: 0,
                    overflow: "hidden",
                    opacity: 0,
                    pointerEvents: "none",
                }}
            />

            {/* Custom trigger button */}
            <button
                onClick={() => setOpen((p) => !p)}
                title={collapsed ? `Idioma: ${currentLang.label}` : undefined}
                className={cn(
                    "flex items-center rounded-lg transition-all w-full text-muted-foreground hover:text-foreground hover:bg-accent group relative",
                    collapsed ? "justify-center py-2 h-10" : "gap-3 px-2 py-2"
                )}
            >
                <span className="text-sm leading-none shrink-0">{currentLang.flag}</span>
                {!collapsed && (
                    <span className="text-sm font-medium whitespace-nowrap">
                        {currentLang.label}
                    </span>
                )}
                {collapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-popover border border-border rounded-md text-xs font-medium text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                        Idioma: {currentLang.label}
                    </div>
                )}
            </button>

            {/* Popover */}
            {open && (
                <div
                    ref={popoverRef}
                    className={cn(
                        "absolute z-50 py-1 bg-popover border border-border rounded-lg shadow-xl min-w-[100px]",
                        collapsed
                            ? "left-full ml-2 bottom-0"
                            : "bottom-full mb-1 left-0"
                    )}
                >
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleSelect(lang.code)}
                            className={cn(
                                "flex items-center gap-2.5 w-full px-3 py-1.5 text-sm transition-colors",
                                lang.code === current
                                    ? "text-violet-400 bg-violet-400/10"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                        >
                            <span className="text-sm leading-none">{lang.flag}</span>
                            <span className="font-medium">{lang.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}