import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins}m`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days}d`;
  return date.toLocaleDateString("es-CO", { month: "short", day: "numeric" });
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    completed: "text-emerald-400",
    running: "text-blue-400",
    error: "text-destructive",
    idle: "text-muted-foreground",
    paused: "text-amber-400",
    draft: "text-muted-foreground",
    active: "text-emerald-400",
    approved: "text-emerald-400",
    published: "text-violet-400",
    review: "text-amber-400",
    rejected: "text-destructive",
  };
  return map[status] ?? "text-muted-foreground";
}

export function getStatusBadge(status: string): string {
  const map: Record<string, string> = {
    completed: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    running: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    error: "text-red-400 bg-red-400/10 border-red-400/20",
    idle: "text-muted-foreground bg-muted border-border",
    draft: "text-muted-foreground bg-muted border-border",
    active: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    approved: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    published: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  };
  return map[status] ?? "text-muted-foreground bg-muted border-border";
}

/** Sanitize HTML to prevent XSS */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined") return dirty;
  // DOMPurify is used at component level — this is a fallback
  return dirty.replace(/<script[^>]*>.*?<\/script>/gi, "").replace(/on\w+="[^"]*"/gi, "");
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

export function formatCredits(n: number): string {
  return n.toLocaleString("es-CO");
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
