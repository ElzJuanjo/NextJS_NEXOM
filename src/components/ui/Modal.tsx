"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import anime from "animejs";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  closable?: boolean;
}

export function Modal({ open, onClose, title, children, className, closable = true }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && overlayRef.current && panelRef.current) {
      anime({ targets: overlayRef.current, opacity: [0, 1], duration: 200, easing: "easeOutCubic" });
      anime({
        targets: panelRef.current,
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 250,
        easing: "easeOutCubic",
      });
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closable ? onClose : undefined}
      />
      <div
        ref={panelRef}
        className={cn(
          "relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl shadow-black/30 p-6",
          className
        )}
      >
        {(title || closable) && (
          <div className="flex items-center justify-between mb-4">
            {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
            {closable && onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
