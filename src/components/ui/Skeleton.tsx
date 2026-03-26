import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
        </div>
      ))}
    </div>
  );
}

/* ── Dashboard Skeletons ──────────────────────────────────────────────────── */

export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function ActivityListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl">
          <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-3 w-12 shrink-0" />
          <Skeleton className="h-5 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function CreditUsageSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function AgentListSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <Skeleton className="h-4 w-36" />
      <div className="space-y-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-2 py-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Product Skeletons ────────────────────────────────────────────────────── */

export function ProductCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-full" />
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-14 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/* ── Creative / Gallery Skeletons ─────────────────────────────────────────── */

export function GallerySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4">
            <Skeleton className="w-4 h-4 rounded shrink-0" />
            <Skeleton className="w-4 h-4 rounded shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CreativeGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="p-2.5 space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Conversation Skeletons ───────────────────────────────────────────────── */

export function ConversationListSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-lg">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Settings Skeletons ───────────────────────────────────────────────────── */

export function PlanGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border border-border rounded-xl p-5 space-y-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}