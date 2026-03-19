import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin",
        className
      )}
    />
  );
}
