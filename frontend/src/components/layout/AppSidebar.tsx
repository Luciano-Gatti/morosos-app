import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ReceiptText,
  Building2,
  ListTree,
  FileBarChart2,
  Settings,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Users2,
  Activity,
  Layers,
  CircleCheck,
  Building2 as BuildingIcon,
  Bell,
  HandCoins,
  ListChecks,
  CalendarRange,
  PieChart as PieChartIcon,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { to: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}

const items: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inmuebles", label: "Inmuebles", icon: Building2 },
  { to: "/deuda", label: "Gestión de deuda", icon: ReceiptText },
  { to: "/etapas", label: "Gestión de etapas", icon: ListTree },
  {
    to: "/reportes",
    label: "Reportes",
    icon: FileBarChart2,
    children: [
      { to: "/reportes/morosos-grupo-distrito", label: "Morosos por grupo y distrito", icon: BuildingIcon },
      { to: "/reportes/acciones-notificacion", label: "Avisos, intimaciones y cortes", icon: Bell },
      { to: "/reportes/acciones-regularizacion", label: "Regularizaciones y planes", icon: HandCoins },
      { to: "/reportes/estado-inmuebles", label: "Estado de inmuebles", icon: ListChecks },
      { to: "/reportes/acciones-fechas", label: "Acciones entre fechas", icon: CalendarRange },
      { to: "/reportes/porcentajes-morosidad", label: "Porcentajes de morosidad", icon: PieChartIcon },
      { to: "/reportes/historial-movimientos", label: "Historial de movimientos", icon: History },
    ],
  },
  {
    to: "/configuracion",
    label: "Configuración",
    icon: Settings,
    children: [
      { to: "/configuracion/grupos", label: "Grupos", icon: Users2 },
      { to: "/configuracion/seguimiento", label: "Seguimiento", icon: Activity },
      { to: "/configuracion/etapas", label: "Etapas", icon: Layers },
      { to: "/configuracion/motivos-cierre", label: "Motivos de cierre", icon: CircleCheck },
    ],
  },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: Props) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    items.forEach((it) => {
      if (it.children) initial[it.to] = location.pathname.startsWith(it.to);
    });
    return initial;
  });
  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-4",
          collapsed && "justify-center px-2",
        )}
      >
        {collapsed ? (
          <BrandMark variant="light" showSubtitle={false} className="[&>div:last-child]:hidden" />
        ) : (
          <BrandMark variant="light" />
        )}
      </div>

      {/* Section label */}
      {!collapsed && (
        <div className="px-5 pt-5 pb-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">
            Gestión
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className={cn("flex-1 overflow-y-auto", collapsed ? "px-2 pt-4" : "px-3")}>
        <ul className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            if (item.children) {
              const groupActive = location.pathname.startsWith(item.to);
              const isOpen = !!openGroups[item.to];
              return (
                <li key={item.to}>
                  <button
                    type="button"
                    onClick={() => (collapsed ? onToggle() : toggleGroup(item.to))}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      groupActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isOpen ? "rotate-180" : "rotate-0",
                          )}
                        />
                      </>
                    )}
                  </button>
                  {!collapsed && isOpen && (
                    <ul className="mt-0.5 space-y-0.5 pl-3">
                      {item.children.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <li key={sub.to}>
                            <NavLink
                              to={sub.to}
                              className={({ isActive }) =>
                                cn(
                                  "flex items-center gap-3 rounded-md border-l border-sidebar-border/60 py-1.5 pl-4 pr-3 text-[13px] text-sidebar-foreground/85 transition-colors",
                                  "hover:border-sidebar-ring hover:text-sidebar-accent-foreground",
                                  isActive &&
                                    "border-sidebar-ring text-sidebar-accent-foreground font-medium",
                                )
                              }
                            >
                              <SubIcon className="h-[14px] w-[14px] opacity-80" />
                              <span>{sub.label}</span>
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                      collapsed && "justify-center px-0",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-accent"
                        />
                      )}
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / collapse */}
      <div
        className={cn(
          "border-t border-sidebar-border p-3",
          collapsed ? "flex justify-center" : "flex items-center justify-between gap-2",
        )}
      >
        {!collapsed && (
          <div className="min-w-0 text-[11px] leading-tight text-sidebar-muted">
            <div className="font-medium text-sidebar-foreground">Sistema de Morosidad</div>
            <div>v1.0 · Interno</div>
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
