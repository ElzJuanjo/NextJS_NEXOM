"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Bell, Plus, Command, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/Providers";
import anime from "animejs";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const { theme, toggle } = useTheme();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchRef.current) {
      anime({
        targets: searchRef.current,
        width: searchFocused ? 220 : 160,
        duration: 200,
        easing: "easeOutQuad",
      });
    }
  }, [searchFocused]);

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-semibold text-foreground leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div
          ref={searchRef}
          style={{ width: 160 }}
          className={cn(
            "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-sm",
            searchFocused ? "border-ring bg-card" : "border-border bg-card/50 text-muted-foreground"
          )}
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <input
            type="text"
            placeholder="Buscar..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-transparent outline-none text-sm placeholder:text-muted-foreground w-full text-foreground"
          />
          <div className="flex items-center gap-0.5 shrink-0">
            <Command className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">K</span>
          </div>
        </div>

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

        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-accent transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
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
