"use client";

import { cn } from "@/lib/utils";
import { useFadeIn } from "@/hooks/use-anime";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  const ref = useFadeIn<HTMLDivElement>();

  return (
    <div ref={ref} className={cn("flex flex-col items-center justify-center py-16 px-6 opacity-0", className)}>
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
