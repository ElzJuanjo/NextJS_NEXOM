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
  const { theme, toggle } = useTheme();
  const searchRef = useRef<HTMLDivElement>(null);

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-semibold text-foreground leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {search ? (
          <div
            ref={searchRef}
            style={{ width: searchFocused ? 260 : 180 }}
            className={cn(
              "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-sm",
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
              className="bg-transparent outline-none text-sm placeholder:text-muted-foreground w-full text-foreground"
            />
            {search.value && (
              <button onClick={() => search.onChange("")} className="shrink-0 text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="hidden sm:block w-[180px]" />
        )}

        <button
          onClick={toggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-accent transition-colors"
          title="Cambiar tema"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {action && (
          <button
            onClick={action.onClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            {action.label}
          </button>
        )}
      </div>
    </header>
  );
}