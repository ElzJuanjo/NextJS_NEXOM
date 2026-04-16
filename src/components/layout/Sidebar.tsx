"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import anime from "animejs";
import {
  LayoutDashboard, GitBranch, Palette, Layout as LayoutIcon, ImageIcon,
  Settings, ChevronLeft, Menu, X, HelpCircle, LogOut, Package, Workflow, Activity, PenLine, Calculator,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMe, useLogout } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/Logo";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

type NavItem =
  | { type: "link"; label: string; href: string; icon: LucideIcon; color: string; activeBg: string }
  | { type: "sep" };

const navItems: NavItem[] = [
  { type: "link", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-foreground", activeBg: "bg-accent" },
  { type: "sep" },
  { type: "link", label: "Orquestador", href: "/orchestrator", icon: GitBranch, color: "text-violet-400", activeBg: "bg-violet-400/10" },
  { type: "link", label: "Marca", href: "/branding", icon: Palette, color: "text-pink-400", activeBg: "bg-pink-400/10" },
  { type: "link", label: "Landing Page", href: "/landing", icon: LayoutIcon, color: "text-amber-400", activeBg: "bg-amber-400/10" },
  { type: "link", label: "Creativo", href: "/creative", icon: ImageIcon, color: "text-cyan-400", activeBg: "bg-cyan-400/10" },
  { type: "link", label: "Copywriting", href: "/copywriting", icon: PenLine, color: "text-amber-400", activeBg: "bg-amber-400/10" },
  { type: "link", label: "Productos", href: "/products", icon: Package, color: "text-emerald-400", activeBg: "bg-emerald-400/10" },
  { type: "link", label: "Flows", href: "/flows", icon: Workflow, color: "text-blue-400", activeBg: "bg-blue-400/10" },
  { type: "link", label: "Calculadora", href: "/calculator", icon: Calculator, color: "text-teal-400", activeBg: "bg-teal-400/10" },
  { type: "link", label: "Actividad", href: "/activity", icon: Activity, color: "text-amber-400", activeBg: "bg-amber-400/10" },
  { type: "sep" },
  { type: "link", label: "Configuración", href: "/settings", icon: Settings, color: "text-muted-foreground", activeBg: "bg-accent" },
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
      <nav
        className={cn(
          "flex-1 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-thin",
          sidebarOpen ? "px-2" : "px-2"
        )}
      >
        {navItems.map((item, idx) => {
          if (item.type === "sep") {
            return <div key={`sep-${idx}`} className="my-2 border-t border-border/50" />;
          }
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              title={!sidebarOpen ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg transition-all duration-150 group relative",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card",
                sidebarOpen ? "gap-3 px-2 py-2" : "justify-center px-0 py-2 mx-auto w-10 h-10",
                isActive
                  ? cn("text-foreground", item.activeBg)
                  : "text-muted-foreground hover:text-foreground hover:bg-accent active:scale-[0.98]"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive ? item.color : "group-hover:text-foreground"
                )}
              />
              {sidebarOpen && (
                <span className="text-sm font-medium whitespace-nowrap animate-fade-in-left">
                  {item.label}
                </span>
              )}
              {/* Active indicator pill in collapsed mode */}
              {!sidebarOpen && isActive && (
                <span
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full",
                    item.color.replace("text-", "bg-")
                  )}
                />
              )}
              {/* Tooltip in collapsed mode */}
              {!sidebarOpen && (
                <div
                  role="tooltip"
                  className="absolute left-full ml-3 px-2.5 py-1.5 bg-popover border border-border rounded-md text-xs font-medium text-foreground whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 pointer-events-none transition-all duration-150 z-50 shadow-lg"
                >
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-border space-y-1 shrink-0">
        <LanguageSelector collapsed={!sidebarOpen} />

        <button
          title={!sidebarOpen ? "Ayuda" : undefined}
          className={cn(
            "flex items-center rounded-lg transition-all w-full text-muted-foreground hover:text-foreground hover:bg-accent group relative",
            sidebarOpen ? "gap-3 px-2 py-2" : "justify-center py-2 h-10"
          )}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">Ayuda</span>}
          {!sidebarOpen && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-popover border border-border rounded-md text-xs font-medium text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
              Ayuda
            </div>
          )}
        </button>

        <div
          className={cn(
            "flex items-center mt-1 group",
            sidebarOpen ? "gap-2 px-2 py-2" : "justify-center px-0 py-2"
          )}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden ring-2 ring-card">
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              : displayInitial
            }
          </div>
          {sidebarOpen && (
            <>
              <div className="min-w-0 flex-1 animate-fade-in-left">
                <p className="text-xs font-medium text-foreground truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
              </div>
              <button
                onClick={() => logoutMut.mutate()}
                title="Cerrar sesión"
                className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Logout button when collapsed */}
        {!sidebarOpen && (
          <button
            onClick={() => logoutMut.mutate()}
            title="Cerrar sesión"
            className="hidden md:flex items-center justify-center w-full h-10 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors group relative"
          >
            <LogOut className="w-4 h-4" />
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-popover border border-border rounded-md text-xs font-medium text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
              Cerrar sesión
            </div>
          </button>
        )}

        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent("toggle-sidebar"));
          }}
          title={!sidebarOpen ? "Expandir" : undefined}
          className={cn(
            "hidden md:flex items-center rounded-lg w-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all",
            sidebarOpen ? "gap-3 px-2 py-2" : "justify-center py-2 h-10"
          )}
        >
          <ChevronLeft
            className={cn("w-4 h-4 transition-transform duration-200 shrink-0", !sidebarOpen && "rotate-180")}
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
        width: sidebarOpen ? 240 : 72,
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
        style={{ width: sidebarOpen ? 240 : 72 }}
        className="hidden md:flex flex-col h-screen bg-card border-r border-border shrink-0 overflow-hidden"
      >
        <div
          className={cn(
            "flex items-center justify-center border-b border-border shrink-0 transition-all overflow-hidden",
            sidebarOpen ? "h-20 px-3 py-2" : "h-16 px-2 py-2"
          )}
        >
          <Logo fill fit="contain" bare />
        </div>
        <NavContent sidebarOpen={sidebarOpen} pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-4">
        <Logo size={96} fit="contain" bare />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="md:hidden fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-card border-r border-border z-50 flex flex-col animate-fade-in-left shadow-2xl">
            <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
              <Logo size={64} fit="contain" bare />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú"
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