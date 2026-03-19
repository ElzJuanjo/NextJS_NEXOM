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
