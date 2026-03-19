"use client";

import { useOrgUsage } from "@/hooks/use-org";
import { cn, formatCredits } from "@/lib/utils";
import { Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

export function CreditUsage() {
  const { data, isLoading } = useOrgUsage();

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  if (!data) return null;

  const { used, total, remaining, percentage_used } = data.credits;
  const isLow = percentage_used > 80;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-foreground">Créditos</span>
        </div>
        <span className="text-xs text-muted-foreground">{data.plan}</span>
      </div>

      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{formatCredits(used)} usados</span>
          <span>{formatCredits(remaining)} restantes</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              isLow
                ? "bg-gradient-to-r from-orange-500 to-red-500"
                : "bg-gradient-to-r from-violet-500 to-indigo-500"
            )}
            style={{ width: `${Math.min(percentage_used, 100)}%` }}
          />
        </div>
      </div>

      <p className={cn("text-xs", isLow ? "text-orange-400" : "text-muted-foreground")}>
        {percentage_used.toFixed(1)}% del plan utilizado
      </p>
    </div>
  );
}
