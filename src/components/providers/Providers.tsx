"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import { makeQueryClient } from "@/lib/query-client";
import { getStoredAccessToken } from "@/lib/auth";
import { setAccessToken } from "@/lib/api-client";

// ── Theme Context ───────────────────────────────────────────────────────────

type Theme = "light" | "dark";

const ThemeCtx = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "dark", toggle: () => {} });

export const useTheme = () => useContext(ThemeCtx);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("nexos-theme") as Theme | null;
    const preferred = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(preferred);
    document.documentElement.classList.toggle("dark", preferred === "dark");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("nexos-theme", next);
  };

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

// ── Root Providers ──────────────────────────────────────────────────────────

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  // Hydrate access token from cookie into memory on mount
  useEffect(() => {
    const token = getStoredAccessToken();
    if (token) setAccessToken(token);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "hsl(var(--card))",
              color: "hsl(var(--card-foreground))",
              border: "1px solid hsl(var(--border))",
              fontSize: "0.875rem",
            },
            success: { iconTheme: { primary: "#34d399", secondary: "white" } },
            error: { iconTheme: { primary: "#f87171", secondary: "white" } },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
