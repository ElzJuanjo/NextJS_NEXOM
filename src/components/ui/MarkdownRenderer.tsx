"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
    content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
                h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-4 first:mt-0 pb-1 border-b border-border">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold mb-2 mt-4 first:mt-0 text-foreground">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mb-1.5 mt-3 first:mt-0 text-foreground">{children}</h3>,
                h4: ({ children }) => <h4 className="text-sm font-semibold mb-1 mt-2 first:mt-0 text-muted-foreground">{children}</h4>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2.5 pl-1 marker:text-muted-foreground">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2.5 pl-1 marker:text-muted-foreground">{children}</ol>,
                li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-violet-400 pl-3 my-2 text-muted-foreground italic">{children}</blockquote>
                ),
                hr: () => <hr className="border-border my-4" />,
                a: ({ children, href }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:opacity-80">{children}</a>
                ),
                code: ({ children, className: codeClass }) =>
                    codeClass ? (
                        <pre className="bg-muted/80 rounded-lg p-4 text-xs font-mono overflow-x-auto my-3 border border-border leading-relaxed">
                            <code>{children}</code>
                        </pre>
                    ) : (
                        <code className="bg-muted border border-border px-1.5 py-0.5 rounded text-xs font-mono text-pink-600 dark:text-pink-400">{children}</code>
                    ),
                pre: ({ children }) => <>{children}</>,
                table: ({ children }) => (
                    <div className="my-3 overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-xs border-collapse">{children}</table>
                    </div>
                ),
                thead: ({ children }) => (
                    <thead className="bg-muted/60 border-b border-border">{children}</thead>
                ),
                tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
                tr: ({ children }) => <tr className="hover:bg-accent/30 transition-colors">{children}</tr>,
                th: ({ children }) => (
                    <th className="px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap">{children}</th>
                ),
                td: ({ children }) => (
                    <td className="px-3 py-2 text-xs text-foreground/80">{children}</td>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    );
}