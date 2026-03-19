"use client";

import { useFadeIn } from "@/hooks/use-anime";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  icon: LucideIcon;
  iconColor?: string;
  delay?: number;
}

export function StatsCard({ title, value, change, positive, icon: Icon, iconColor, delay = 0 }: StatsCardProps) {
  const ref = useFadeIn<HTMLDivElement>(delay * 1000);

  return (
    <div
      ref={ref}
      className="bg-card border border-border rounded-xl p-4 space-y-2 opacity-0"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{title}</span>
        <div className="p-1.5 rounded-lg bg-muted">
          <Icon className={cn("w-3.5 h-3.5", iconColor ?? "text-muted-foreground")} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {change && (
        <p className={cn("text-xs", positive ? "text-emerald-400" : "text-muted-foreground")}>
          {positive && "↑ "}{change}
        </p>
      )}
    </div>
  );
}
