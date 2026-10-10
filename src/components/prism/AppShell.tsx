// src/components/prism/AppShell.tsx  (full file)
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  Droplets,
  ChartNoAxesColumnIncreasing,
  History,
  House,
  LayoutDashboard,
  Map,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RadioTower,
  Siren,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIncidents } from "@/lib/store";
import bfpLogo from "@/assets/bfp-logo.png";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/incidents", label: "Active Incidents", icon: Siren },
  { to: "/map", label: "Map", icon: Map },
  { to: "/history", label: "Incident History", icon: History },
  { to: "/devices", label: "Devices", icon: RadioTower },
  { to: "/analytics", label: "Response Analytics", icon: ChartNoAxesColumnIncreasing },
  { to: "/households", label: "Household Registry", icon: House },
  { to: "/hydrants", label: "Fire Hydrants", icon: Droplets },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const unack = useIncidents().filter((i) => i.responseStatus !== "Resolved" && i.alertStatus === "Not Acknowledged").length;
  const current = [...NAV].reverse().find((n) => (n.to === "/" ? path === "/" : path.startsWith(n.to)));
  const title = path.startsWith("/incidents/") ? "Incident Detail" : path.startsWith("/households/") ? "Household Profile" : current?.label ?? "BFP-PRISM";

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains("dark"));
    setCollapsed(window.localStorage.getItem("bfp-prism-sidebar") === "collapsed");
  }, []);

  function setSidebarCollapsed(enabled: boolean) {
    setCollapsed(enabled);
    window.localStorage.setItem("bfp-prism-sidebar", enabled ? "collapsed" : "expanded");
  }

  function setTheme(enabled: boolean) {
    setDarkMode(enabled);
    document.documentElement.classList.toggle("dark", enabled);
    document.documentElement.style.colorScheme = enabled ? "dark" : "light";
    window.localStorage.setItem("bfp-prism-theme", enabled ? "dark" : "light");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className={cn("fixed inset-y-0 left-0 z-30 flex w-56 flex-col bg-sidebar text-sidebar-foreground transition-[transform,width] duration-200 lg:translate-x-0", collapsed && "lg:w-14", open ? "translate-x-0" : "-translate-x-full")}>
        <div className={cn("border-b border-sidebar-border px-4 py-4", collapsed && "lg:px-1.5")}>
          <div className={cn("flex items-center gap-2.5", collapsed && "lg:justify-center")}>
            <img
              src={bfpLogo}
              alt="Bureau of Fire Protection seal"
              className="size-11 shrink-0 object-contain"
            />
            <span className={cn("text-xl pt-1 font-bold tracking-wide", collapsed && "lg:hidden")}>BFP-PRISM</span>
          </div>
          <p className={cn("pt-5 text-[11px] leading-tight text-sidebar-foreground/60", collapsed && "lg:hidden")}>Pre-Arrival Response Information</p>
        </div>
        <nav className="flex-1 py-2">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
              title={collapsed ? n.label : undefined}
              aria-label={collapsed ? n.label : undefined}
              className={cn("flex items-center gap-3 border-l-2 px-4 py-2 text-sm", collapsed && "lg:justify-center lg:px-0", current?.to === n.to ? "border-sidebar-primary bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "border-transparent text-sidebar-foreground/75 hover:bg-sidebar-accent/60")}>
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className={cn(collapsed && "lg:hidden")}>{n.label}</span>
            </Link>
          )})}
        </nav>
        <div className={cn("space-y-3 border-t border-sidebar-border px-4 py-3 text-xs", collapsed && "lg:px-2")}>
          <div className={cn("flex items-center justify-between gap-3", collapsed && "lg:justify-center")}>
            <label htmlFor="theme-switch" className="flex cursor-pointer items-center gap-2 text-sidebar-foreground/80">
              {darkMode ? <Moon className="size-4" aria-hidden="true" /> : <Sun className="size-4" aria-hidden="true" />}
              <span className={cn(collapsed && "lg:hidden")}>Dark mode</span>
            </label>
            <button
              id="theme-switch"
              type="button"
              role="switch"
              aria-checked={darkMode}
              aria-label="Toggle dark mode"
              onClick={() => setTheme(!darkMode)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                collapsed && "lg:hidden",
                darkMode ? "bg-sidebar-primary" : "bg-sidebar-border",
              )}
            >
              <span className={cn("ml-0.5 size-4 rounded-full bg-sidebar-foreground shadow-sm transition-transform", darkMode && "translate-x-4")} />
            </button>
          </div>
          <div className={cn("flex items-center gap-2", collapsed && "lg:justify-center")} title={collapsed ? "System Status: Online" : undefined}><span className="size-2 rounded-full bg-normal" /><span className={cn(collapsed && "lg:hidden")}>System Status: Online</span></div>
          <div className={cn("text-sidebar-foreground/60", collapsed && "lg:hidden")}>FO2 R. Lim<br />Authorized BFP Personnel</div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-foreground/30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className={cn("flex min-w-0 flex-1 flex-col transition-[padding] duration-200 lg:pl-56", collapsed && "lg:pl-14")}>
        <header className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b border-border bg-card px-4">
          <button className="lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu className="size-5" /></button>
          <button
            type="button"
            className="hidden size-8 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed(!collapsed)}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
          <h1 className="text-sm font-semibold text-foreground">{title}</h1>
          <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
            <span className="hidden items-center gap-1.5 sm:flex"><span className="size-2 rounded-full bg-normal" />Data link: Online (demo feed)</span>
            <Link to="/incidents" className="relative" aria-label={`${unack} unacknowledged alerts`}>
              <Bell className="size-4 text-foreground" />
              {unack > 0 && <span className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-critical px-1 text-center text-[10px] font-semibold leading-4 text-critical-foreground">{unack}</span>}
            </Link>
            <span className="flex items-center gap-2 border-l border-border pl-4 text-foreground">
              <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">RL</span>
              <span className="hidden md:inline">FO2 R. Lim</span>
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-5">{children}</main>
      </div>
    </div>
  );
}
