"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Pixel size of the square logo mark (ignored when `fill` is true) */
  size?: number;
  /** Show the "NEXOM" wordmark next to the icon */
  showWordmark?: boolean;
  /** Wordmark text size (Tailwind class). Defaults to text-sm */
  wordmarkClassName?: string;
  /** When true, the logo expands to fill its parent container instead of using `size` */
  fill?: boolean;
  /** object-fit strategy. `contain` keeps the full logo visible. */
  fit?: "cover" | "contain";
  /** Hide the rounded mask + ring (useful when the logo already has its own background) */
  bare?: boolean;
  className?: string;
}

/**
 * Brand logo. Detects dark/light from the `<html>` class so it works
 * anywhere — even outside ThemeProvider. Falls back to "N" monogram
 * when images fail to load.
 */
export function Logo({
  size = 32,
  showWordmark = false,
  wordmarkClassName = "text-sm",
  fill = false,
  fit = "cover",
  bare = false,
  className,
}: LogoProps) {
  const [errored, setErrored] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Detect theme from <html> class — works with or without ThemeProvider
  useEffect(() => {
    const html = document.documentElement;
    const check = () => setIsDark(html.classList.contains("dark"));
    check();

    const observer = new MutationObserver(check);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const src = isDark ? "/logo-dark.png" : "/logo-light.png";
  const markStyle = fill ? undefined : { width: size, height: size };

  return (
    <div className={cn("flex items-center gap-2.5 min-w-0", fill && "w-full h-full", className)}>
      <div
        className={cn(
          "overflow-hidden shrink-0",
          !bare && "rounded-lg ring-1 ring-border/40",
          fill && "w-full h-full"
        )}
        style={markStyle}
      >
        {errored ? (
          <div
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold rounded-lg"
            style={fill ? undefined : { fontSize: size * 0.5 }}
          >
            N
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt="NEXOM"
            className={cn(
              "w-full h-full select-none",
              fit === "cover" ? "object-cover" : "object-contain"
            )}
            draggable={false}
            onError={() => setErrored(true)}
          />
        )}
      </div>
      {showWordmark && (
        <span
          className={cn(
            "font-semibold tracking-tight text-foreground whitespace-nowrap",
            wordmarkClassName
          )}
        >
          NEXOM
        </span>
      )}
    </div>
  );
}