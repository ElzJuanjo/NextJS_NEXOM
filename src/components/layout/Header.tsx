"use client";

import { useState, useRef } from "react";
import { Search, Plus, Sun, Moon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/Providers";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
  search?: {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
  };
}

export function Header({ title, subtitle, action, search }: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const searchRef = useRef<HTMLDivElement>(null);

  return (
    <header className="min-h-16 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      {/* Title block — flex-1 min-w-0 lets it truncate cleanly */}
      <div className="min-w-0 flex-1">
        <h1 className="text-base sm:text-lg font-semibold text-foreground leading-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions — never overflow */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Desktop search input */}
        {search && (
          <div
            ref={searchRef}
            style={{ width: searchFocused ? 260 : 200 }}
            className={cn(
              "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-sm",
              searchFocused ? "border-ring bg-card" : "border-border bg-card/50 text-muted-foreground"
            )}
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <input
              type="text"
              placeholder={search.placeholder}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="bg-transparent outline-none text-sm placeholder:text-muted-foreground w-full text-foreground min-w-0"
            />
            {search.value && (
              <button
                onClick={() => search.onChange("")}
                aria-label="Limpiar búsqueda"
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Mobile/tablet search trigger */}
        {search && (
          <button
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label="Buscar"
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-accent transition-colors text-muted-foreground"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label="Cambiar tema"
          className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-accent transition-colors"
          title="Cambiar tema"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Primary action — icon-only on mobile, full on sm+ */}
        {action && (
          <button
            onClick={action.onClick}
            aria-label={action.label}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 h-9 sm:h-auto rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">{action.label}</span>
          </button>
        )}
      </div>

      {/* Mobile expanded search row */}
      {search && mobileSearchOpen && (
        <div className="md:hidden absolute left-0 right-0 top-full px-4 py-2 bg-background border-b border-border animate-slide-down">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border bg-card",
              "border-ring"
            )}
          >
            <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              placeholder={search.placeholder}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              className="bg-transparent outline-none text-sm placeholder:text-muted-foreground w-full text-foreground min-w-0"
            />
            <button
              onClick={() => {
                search.onChange("");
                setMobileSearchOpen(false);
              }}
              aria-label="Cerrar búsqueda"
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
