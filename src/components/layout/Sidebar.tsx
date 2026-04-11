"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import anime from "animejs";
import {
  LayoutDashboard, GitBranch, Palette, Layout as LayoutIcon, ImageIcon,
  Settings, ChevronLeft, Menu, X, Zap, HelpCircle, LogOut, Package, Workflow, Activity, PenLine, Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMe, useLogout } from "@/hooks/use-auth";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-foreground", activeBg: "bg-accent" },
  { label: "sep", href: "", icon: null },
  { label: "Orquestador", href: "/orchestrator", icon: GitBranch, color: "text-violet-400", activeBg: "bg-violet-400/10" },
  { label: "Marca", href: "/branding", icon: Palette, color: "text-pink-400", activeBg: "bg-pink-400/10" },
  { label: "Landing Page", href: "/landing", icon: LayoutIcon, color: "text-amber-400", activeBg: "bg-amber-400/10" },
  { label: "Creativo", href: "/creative", icon: ImageIcon, color: "text-cyan-400", activeBg: "bg-cyan-400/10" },
  { label: "Copywriting", href: "/copywriting", icon: PenLine, color: "text-amber-400", activeBg: "bg-amber-400/10" },
  { label: "Productos", href: "/products", icon: Package, color: "text-emerald-400", activeBg: "bg-emerald-400/10" },
  { label: "Flows", href: "/flows", icon: Workflow, color: "text-blue-400", activeBg: "bg-blue-400/10" },
  { label: "Calculadora", href: "/calculator", icon: Calculator, color: "text-teal-400", activeBg: "bg-teal-400/10" },
  { label: "Actividad", href: "/activity", icon: Activity, color: "text-amber-400", activeBg: "bg-amber-400/10" },
  { label: "sep", href: "", icon: null },
  { label: "Configuración", href: "/settings", icon: Settings, color: "text-muted-foreground", activeBg: "bg-accent" },
];

function NavContent({
  sidebarOpen,
  pathname,
  onLinkClick,
}: {
  sidebarOpen: boolean;
  pathname: string;
  onLinkClick?: () => void;
}) {
  const { data: user } = useMe();
  const logoutMut = useLogout();
  const router = useRouter();

  const displayName = user?.full_name ?? "Usuario";
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item, idx) => {
          if (item.label === "sep") {
            return <div key={idx} className="my-2 border-t border-border/50" />;
          }
          const Icon = item.icon!;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-150 group relative",
                isActive
                  ? cn("text-foreground", item.activeBg)
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon
                className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? item.color : "")}
              />
              {sidebarOpen && (
                <span className="text-sm font-medium whitespace-nowrap animate-fade-in-left">
                  {item.label}
                </span>
              )}
              {!sidebarOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border rounded-md text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-border space-y-1 shrink-0">
        <button className="flex items-center gap-3 px-2 py-2 rounded-lg transition-all w-full text-muted-foreground hover:text-foreground hover:bg-accent">
          <HelpCircle className="w-4 h-4 shrink-0" />
          {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">Ayuda</span>}
        </button>

        <div className="flex items-center gap-2 px-2 py-2 mt-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {displayInitial}
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1 animate-fade-in-left">
              <p className="text-xs font-medium text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
            </div>
          )}
          <button
            onClick={() => logoutMut.mutate()}
            title="Cerrar sesión"
            className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => {
            // Dispatch custom event to toggle sidebar in parent layout
            window.dispatchEvent(new CustomEvent("toggle-sidebar"));
          }}
          className="hidden md:flex items-center gap-3 px-2 py-2 rounded-lg w-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <ChevronLeft
            className={cn("w-4 h-4 transition-transform duration-200", !sidebarOpen && "rotate-180")}
          />
          {sidebarOpen && <span className="text-sm whitespace-nowrap">Colapsar</span>}
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = () => setSidebarOpen((p) => !p);
    window.addEventListener("toggle-sidebar", handler);
    return () => window.removeEventListener("toggle-sidebar", handler);
  }, []);

  useEffect(() => {
    if (sidebarRef.current) {
      anime({
        targets: sidebarRef.current,
        width: sidebarOpen ? 240 : 64,
        duration: 250,
        easing: "easeInOutQuad",
      });
    }
  }, [sidebarOpen]);

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        ref={sidebarRef}
        style={{ width: sidebarOpen ? 240 : 64 }}
        className="hidden md:flex flex-col h-screen bg-card border-r border-border shrink-0 overflow-hidden"
      >
        <div className="flex items-center h-16 px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {sidebarOpen && (
              <span className="font-semibold text-sm tracking-tight text-foreground whitespace-nowrap animate-fade-in-left">
                NEXOM
              </span>
            )}
          </div>
        </div>
        <NavContent sidebarOpen={sidebarOpen} pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm text-foreground">NEXOM</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="md:hidden fixed top-0 left-0 bottom-0 w-64 bg-card border-r border-border z-50 flex flex-col animate-fade-in-left">
            <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold text-sm text-foreground">NEXOM</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <NavContent sidebarOpen={true} pathname={pathname} onLinkClick={() => setMobileOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
