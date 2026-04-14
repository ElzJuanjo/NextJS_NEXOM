"use client";

import { useState, useMemo, useCallback, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Copy Button for Code Blocks ────────────────────────────────────
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [text]);

    return (
        <button
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy code"}
            className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 
                transition-all duration-200 bg-background/80 backdrop-blur-sm border border-border 
                hover:bg-accent text-muted-foreground hover:text-foreground"
        >
            {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
            )}
        </button>
    );
}

// ─── Language Badge ─────────────────────────────────────────────────
function LanguageBadge({ language }: { language: string }) {
    if (!language) return null;

    return (
        <span className="absolute top-2 left-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 select-none">
            {language}
        </span>
    );
}

// ─── Helpers ────────────────────────────────────────────────────────
const ASCII_ART_REGEX = /[┌┐└┘├┤┬┴╔╗╚╝║╠╣╦╩━─│┼═▲►▼◄★✦●○▶△╱╲╳▓▒░]/;

// Heuristic: block is "semantic ASCII art" if >40% of lines are box-drawing borders
function isSemanticAsciiBlock(text: string): boolean {
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length < 3) return false;
    const borderLines = lines.filter((l) => {
        const stripped = l.replace(/\s/g, "");
        const boxChars = stripped.replace(/[^┌┐└┘├┤┬┴╔╗╚╝║╠╣╦╩━─│┼═╱╲╳▓▒░]/g, "");
        return boxChars.length / stripped.length > 0.6;
    });
    return borderLines.length / lines.length > 0.25;
}

// Parse structured items from ASCII box content (numbered items with descriptions)
interface ParsedItem {
    number?: string;
    title: string;
    description: string;
}

function parseAsciiBoxContent(text: string): { title: string | null; items: ParsedItem[]; rawLines: string[] } {
    // Strip box-drawing frame characters from each line
    const lines = text
        .split("\n")
        .map((l) => l.replace(/^[\s║│┃|]*/, "").replace(/[\s║│┃|]*$/, "").trim())
        .filter((l) => {
            if (!l) return false;
            // Remove lines that are purely border
            const noBorder = l.replace(/[╔╗╚╝╠╣╦╩══║━─┌┐└┘├┤┬┴│┼▓▒░]/g, "").trim();
            return noBorder.length > 0;
        });

    if (lines.length === 0) return { title: null, items: [], rawLines: [] };

    // Detect numbered items like "01. TITLE" or "1. TITLE"
    const numberedPattern = /^(\d{1,2})\.\s+(.+)/;
    const items: ParsedItem[] = [];
    let title: string | null = null;
    const rawLines: string[] = [];
    let currentItem: ParsedItem | null = null;

    for (const line of lines) {
        const match = line.match(numberedPattern);
        if (match) {
            if (currentItem) items.push(currentItem);
            currentItem = { number: match[1], title: match[2].trim(), description: "" };
        } else if (currentItem) {
            // Continuation line = description
            currentItem.description += (currentItem.description ? " " : "") + line;
        } else {
            // Lines before any numbered item — could be a title or context
            // Check if it looks like a title (short, possibly ALL CAPS or bold markers)
            if (!title && lines.indexOf(line) < 2 && line.length < 80) {
                title = line.replace(/[★✦●▶]/g, "").trim();
            } else {
                rawLines.push(line);
            }
        }
    }
    if (currentItem) items.push(currentItem);

    return { title, items, rawLines };
}

// ─── ASCII Art Card Component ───────────────────────────────────────
function AsciiArtCard({ text, spacing }: { text: string; spacing: string }) {
    const { title, items, rawLines } = parseAsciiBoxContent(text);

    // If we successfully parsed numbered items, render as styled cards
    if (items.length > 0) {
        return (
            <div className={`${spacing} space-y-2`}>
                {title && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">
                        {title}
                    </p>
                )}
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="flex gap-3.5 p-3.5 rounded-lg border border-border/60 bg-muted/20 
                            hover:bg-muted/40 transition-colors duration-150"
                    >
                        {item.number && (
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-violet-500/10 border border-violet-500/20 
                                flex items-center justify-center text-[11px] font-bold text-violet-500 tabular-nums">
                                {item.number.replace(/^0+/, "") || "0"}
                            </span>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-snug">
                                {item.title}
                            </p>
                            {item.description && (
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    {item.description}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // No numbered items found → this is likely a spatial diagram (axes, maps, flowcharts).
    // Return null so the caller renders it as a styled <pre> preserving spatial layout.
    return null;
    return null;
}

function extractTextContent(node: ReactNode): string {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (!node) return "";
    if (Array.isArray(node)) return node.map(extractTextContent).join("");
    if (typeof node === "object" && "props" in node) {
        return extractTextContent((node as { props: { children?: ReactNode } }).props.children);
    }
    return "";
}

function parseLangFromClassName(className?: string): string {
    if (!className) return "";
    const match = className.match(/language-(\w+)/);
    return match ? match[1] : "";
}

// ─── Main Component ─────────────────────────────────────────────────
// ─── Internal JSON block stripper ───────────────────────────────────
// Los agentes emiten bloques <!--XXX_JSON ...--> al final de sus respuestas
// para auto-persistencia interna. El backend ya los sanitiza, pero este
// renderer aplica una segunda capa defensiva por dos razones:
//   1. Mensajes viejos en BD que se guardaron antes del fix del sanitizer.
//   2. remark-gfm convierte "-->" en "⟶" y rompe el comentario para el
//      navegador, dejando el JSON visible como texto plano.
// Cubre tanto bloques bien cerrados como bloques abiertos sin cierre.
const INTERNAL_JSON_BLOCK = /\s*<!--\s*(?:BRAND_JSON|COPY_JSON|LANDING_JSON|PRODUCT_JSON|SELECTABLE_PRODUCTS_JSON)\s*[\[{][\s\S]*?[\]}]\s*-->\s*/g;
const INTERNAL_JSON_OPEN_NO_CLOSE = /\s*<!--\s*(?:BRAND_JSON|COPY_JSON|LANDING_JSON|PRODUCT_JSON|SELECTABLE_PRODUCTS_JSON)\b[\s\S]*$/;

function stripInternalJson(content: string): string {
    if (!content || !content.includes("<!--")) return content;
    return content
        .replace(INTERNAL_JSON_BLOCK, "")
        .replace(INTERNAL_JSON_OPEN_NO_CLOSE, "")
        .trimEnd();
}

interface MarkdownRendererProps {
    content: string;
    /** Optional: compact mode reduces spacing for chat-like UIs */
    compact?: boolean;
}

export function MarkdownRenderer({ content, compact = false }: MarkdownRendererProps) {
    const cleanedContent = useMemo(() => stripInternalJson(content), [content]);

    const spacing = compact
        ? { p: "mb-2", h1mt: "mt-3", h2mt: "mt-3", h3mt: "mt-2", listMb: "mb-2", blockquoteMy: "my-2", codeMy: "my-2" }
        : { p: "mb-3", h1mt: "mt-6", h2mt: "mt-5", h3mt: "mt-4", listMb: "mb-3", blockquoteMy: "my-3", codeMy: "my-3" };

    return (
        <div className="markdown-body text-sm leading-relaxed">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // ── Paragraphs ──────────────────────────────────
                    p: ({ children }) => (
                        <p className={`${spacing.p} last:mb-0 leading-[1.75]`}>{children}</p>
                    ),

                    // ── Headings (improved hierarchy) ───────────────
                    h1: ({ children }) => (
                        <h1 className={`text-lg font-bold ${spacing.h1mt} first:mt-0 mb-3 pb-2 border-b border-border text-foreground tracking-tight`}>
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className={`text-base font-bold ${spacing.h2mt} first:mt-0 mb-2.5 text-foreground tracking-tight`}>
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className={`text-sm font-semibold ${spacing.h3mt} first:mt-0 mb-2 text-foreground`}>
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="text-sm font-medium mt-3 first:mt-0 mb-1.5 text-muted-foreground">
                            {children}
                        </h4>
                    ),
                    h5: ({ children }) => (
                        <h5 className="text-xs font-semibold uppercase tracking-wide mt-3 first:mt-0 mb-1 text-muted-foreground">
                            {children}
                        </h5>
                    ),
                    h6: ({ children }) => (
                        <h6 className="text-xs font-medium mt-2 first:mt-0 mb-1 text-muted-foreground/80">
                            {children}
                        </h6>
                    ),

                    // ── Lists ───────────────────────────────────────
                    ul: ({ children, className }) => {
                        // GFM task list support
                        const isTaskList = className?.includes("contains-task-list");
                        return (
                            <ul className={`${isTaskList ? "list-none pl-0" : "list-disc list-inside pl-1 marker:text-muted-foreground/50"} space-y-1.5 ${spacing.listMb}`}>
                                {children}
                            </ul>
                        );
                    },
                    ol: ({ children, start }) => (
                        <ol start={start} className={`list-decimal list-inside space-y-1.5 ${spacing.listMb} pl-1 marker:text-muted-foreground/50`}>
                            {children}
                        </ol>
                    ),
                    li: ({ children, className }) => {
                        const isTask = className?.includes("task-list-item");
                        if (isTask) {
                            return (
                                <li className="flex items-start gap-2 text-sm leading-relaxed list-none">
                                    {children}
                                </li>
                            );
                        }
                        return <li className="text-sm leading-[1.75]">{children}</li>;
                    },
                    // Task list checkbox
                    input: ({ type, checked, disabled }) => {
                        if (type === "checkbox") {
                            return (
                                <span
                                    role="checkbox"
                                    aria-checked={checked}
                                    aria-disabled={disabled}
                                    className={`inline-flex items-center justify-center w-4 h-4 rounded border flex-shrink-0 mt-0.5
                                        ${checked
                                            ? "bg-violet-500 border-violet-500 text-white"
                                            : "border-border bg-background"
                                        }`}
                                >
                                    {checked && (
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </span>
                            );
                        }
                        return null;
                    },

                    // ── Inline formatting ───────────────────────────
                    strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                    em: ({ children }) => (
                        <em className="italic text-foreground/70">{children}</em>
                    ),
                    del: ({ children }) => (
                        <del className="line-through text-muted-foreground/60">{children}</del>
                    ),

                    // ── Blockquote ──────────────────────────────────
                    blockquote: ({ children }) => (
                        <blockquote className={`border-l-2 border-violet-400/70 pl-4 ${spacing.blockquoteMy} text-foreground/80 italic bg-violet-500/5 py-2.5 pr-4 rounded-r-lg`}>
                            {children}
                        </blockquote>
                    ),

                    // ── Horizontal rule ─────────────────────────────
                    hr: () => (
                        <hr className="border-none h-px bg-gradient-to-r from-transparent via-border to-transparent my-6" />
                    ),

                    // ── Links ───────────────────────────────────────
                    a: ({ children, href }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-500 dark:text-violet-400 underline underline-offset-2 
                                decoration-violet-500/30 hover:decoration-violet-500/60 transition-colors"
                        >
                            {children}
                        </a>
                    ),

                    // ── Images ──────────────────────────────────────
                    img: ({ src, alt, title }) => (
                        <figure className={`${spacing.blockquoteMy} rounded-lg overflow-hidden border border-border`}>
                            <img
                                src={src}
                                alt={alt || ""}
                                title={title}
                                loading="lazy"
                                className="w-full h-auto object-cover"
                            />
                            {alt && (
                                <figcaption className="px-3 py-2 text-xs text-muted-foreground text-center bg-muted/30">
                                    {alt}
                                </figcaption>
                            )}
                        </figure>
                    ),

                    // ── Code blocks & inline code ───────────────────
                    pre: ({ children }) => {
                        // Extract raw text and language from the nested <code>
                        const codeChild = Array.isArray(children) ? children[0] : children;
                        let rawText = "";
                        let language = "";

                        if (codeChild && typeof codeChild === "object" && "props" in codeChild) {
                            const codeProps = (codeChild as { props: { children?: ReactNode; className?: string } }).props;
                            rawText = extractTextContent(codeProps.children).replace(/\n$/, "");
                            language = parseLangFromClassName(codeProps.className);
                        }

                        const isAsciiArt = ASCII_ART_REGEX.test(rawText);
                        const hasLanguage = language.length > 0;

                        // ✦ ASCII art with semantic content → render as styled cards/callout
                        if (isAsciiArt && !hasLanguage && isSemanticAsciiBlock(rawText)) {
                            const card = AsciiArtCard({ text: rawText, spacing: spacing.codeMy });
                            if (card) return card;
                            // If AsciiArtCard returns null, fall through to default pre rendering
                        }

                        // ✦ Diagram-style ASCII art (maps, flowcharts) → styled pre, no copy
                        if (isAsciiArt && !hasLanguage) {
                            return (
                                <div className={`relative ${spacing.codeMy}`}>
                                    <pre
                                        className="rounded-lg pt-4 pb-4 px-4 text-xs font-mono overflow-x-auto 
                                            border border-border leading-relaxed whitespace-pre
                                            bg-gradient-to-br from-muted/70 to-muted/40 text-foreground/90"
                                    >
                                        <code>{rawText}</code>
                                    </pre>
                                </div>
                            );
                        }

                        // ✦ Regular code block
                        return (
                            <div className={`relative group ${spacing.codeMy}`}>
                                <pre
                                    className={`rounded-lg ${hasLanguage ? "pt-8" : "pt-4"} pb-4 px-4 text-xs font-mono overflow-x-auto 
                                        border border-border leading-relaxed whitespace-pre
                                        bg-muted/60 text-foreground/80`}
                                >
                                    <code>{rawText}</code>
                                </pre>
                                {hasLanguage && <LanguageBadge language={language} />}
                                {rawText.length > 30 && <CopyButton text={rawText} />}
                            </div>
                        );
                    },

                    code: ({ children, className: codeClass }) => {
                        // If inside a <pre>, the pre handler takes over — this handles inline only
                        const content = String(children).replace(/\n$/, "");
                        const isBlock = codeClass || content.includes("\n");

                        if (isBlock) {
                            // Fallback: if somehow rendered outside <pre>, still handle it
                            return <code className={codeClass}>{children}</code>;
                        }

                        return (
                            <code className="bg-muted/80 border border-border/60 px-1.5 py-0.5 rounded text-[0.8em] font-mono text-pink-600 dark:text-pink-400">
                                {children}
                            </code>
                        );
                    },

                    // ── Tables ──────────────────────────────────────
                    table: ({ children }) => (
                        <div className={`${spacing.blockquoteMy} overflow-x-auto rounded-lg border border-border`}>
                            <table className="w-full text-xs border-collapse">{children}</table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-muted/50 border-b border-border">{children}</thead>
                    ),
                    tbody: ({ children }) => (
                        <tbody className="divide-y divide-border/60">{children}</tbody>
                    ),
                    tr: ({ children }) => (
                        <tr className="hover:bg-accent/20 transition-colors duration-150">{children}</tr>
                    ),
                    th: ({ children, style }) => (
                        <th style={style} className="px-3 py-2.5 text-left text-[11px] font-semibold text-foreground uppercase tracking-wider whitespace-nowrap">
                            {children}
                        </th>
                    ),
                    td: ({ children, style }) => (
                        <td style={style} className="px-3 py-2 text-xs text-foreground/80 leading-relaxed">
                            {children}
                        </td>
                    ),

                    // ── Footnotes (GFM) ─────────────────────────────
                    sup: ({ children }) => (
                        <sup className="text-[0.7em] text-violet-500">{children}</sup>
                    ),
                    section: ({ children, className }) => {
                        if (className?.includes("footnotes")) {
                            return (
                                <section className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
                                    {children}
                                </section>
                            );
                        }
                        return <section>{children}</section>;
                    },
                }}
            >
                {cleanedContent}
            </ReactMarkdown>
        </div>
    );
}