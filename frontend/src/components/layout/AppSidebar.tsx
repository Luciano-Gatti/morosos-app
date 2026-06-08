import { PERMISSIONS } from "@/auth/permissions";
import { reportViewPermissions } from "@/auth/routePermissions";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  Building2,
  Building2 as BuildingIcon,
  CalendarRange,
  ChevronDown,
  CircleCheck,
  FileBarChart2,
  History,
  KeyRound,
  Layers,
  LayoutDashboard,
  ListChecks,
  ListTree,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Settings,
  ShieldCheck,
  Users2,
} from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ChildNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions?: string[];
  requireAllPermissions?: boolean;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions?: string[];
  children?: ChildNavItem[];
}

const items: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, permissions: [PERMISSIONS.DASHBOARD_VER_RESUMEN] },
  {
    to: "/administracion",
    label: "Administracion",
    icon: ShieldCheck,
    children: [
      { to: "/administracion/usuarios", label: "Usuarios", icon: Users2, permissions: [PERMISSIONS.USUARIOS_VER_LISTADO] },
      {
        to: "/administracion/roles-permisos",
        label: "Roles y permisos",
        icon: KeyRound,
        permissions: [PERMISSIONS.ROLES_VER_LISTADO, PERMISSIONS.PERMISOS_VER_LISTADO],
        requireAllPermissions: true,
      },
      {
        to: "/administracion/auth-audit",
        label: "Auditoria auth",
        icon: History,
        permissions: [PERMISSIONS.AUDITORIA_VER_MOVIMIENTOS],
      },
    ],
  },
  { to: "/inmuebles", label: "Inmuebles", icon: Building2, permissions: [PERMISSIONS.INMUEBLES_VER_LISTADO] },
  { to: "/deuda", label: "Gestion de deuda", icon: ReceiptText, permissions: [PERMISSIONS.DEUDA_VER_CARGAS] },
  { to: "/etapas", label: "Gestion de etapas", icon: ListTree, permissions: [PERMISSIONS.SEGUIMIENTO_VER_BANDEJA] },
  {
    to: "/reportes",
    label: "Reportes",
    icon: FileBarChart2,
    permissions: reportViewPermissions,
    children: [
      { to: "/reportes/morosos-grupo-distrito", label: "Morosos por grupo y distrito", icon: BuildingIcon, permissions: [PERMISSIONS.REPORTES_VER_MOROSOS_GRUPO_DISTRITO] },
      { to: "/reportes/estado-inmuebles", label: "Estado de inmuebles", icon: ListChecks, permissions: [PERMISSIONS.REPORTES_VER_ESTADO_INMUEBLES] },
      { to: "/reportes/acciones-fechas", label: "Acciones entre fechas", icon: CalendarRange, permissions: [PERMISSIONS.REPORTES_VER_ACCIONES_FECHAS] },
      { to: "/reportes/historial-movimientos", label: "Historial de movimientos", icon: History, permissions: [PERMISSIONS.REPORTES_VER_HISTORIAL_MOVIMIENTOS] },
    ],
  },
  {
    to: "/configuracion",
    label: "Configuracion",
    icon: Settings,
    permissions: [
      PERMISSIONS.CONFIG_VER_GRUPOS,
      PERMISSIONS.CONFIG_VER_DISTRITOS,
      PERMISSIONS.CONFIG_VER_ETAPAS,
      PERMISSIONS.CONFIG_VER_MOTIVOS_CIERRE,
      PERMISSIONS.CONFIG_VER_PARAMETROS_SEGUIMIENTO,
      PERMISSIONS.CONFIG_VER_GRUPO_DISTRITO,
    ],
    children: [
      { to: "/configuracion/grupos", label: "Grupos", icon: Users2, permissions: [PERMISSIONS.CONFIG_VER_GRUPOS, PERMISSIONS.CONFIG_VER_DISTRITOS] },
      { to: "/configuracion/seguimiento", label: "Seguimiento", icon: Activity, permissions: [PERMISSIONS.CONFIG_VER_PARAMETROS_SEGUIMIENTO] },
      { to: "/configuracion/etapas", label: "Etapas", icon: Layers, permissions: [PERMISSIONS.CONFIG_VER_ETAPAS] },
      { to: "/configuracion/motivos-cierre", label: "Motivos de cierre", icon: CircleCheck, permissions: [PERMISSIONS.CONFIG_VER_MOTIVOS_CIERRE] },
    ],
  },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
}

export function AppSidebar({ collapsed, onToggle, mobile = false, onNavigate }: Props) {
  const location = useLocation();
  const { hasAllPermissions, hasAnyPermission } = useAuth();

  const canAccessChild = (item: ChildNavItem) =>
    !item.permissions ||
    (item.requireAllPermissions ? hasAllPermissions(item.permissions) : hasAnyPermission(item.permissions));

  const visibleItems = items
    .map((item) => ({ ...item, children: item.children?.filter(canAccessChild) }))
    .filter(
      (item) =>
        (!item.permissions || hasAnyPermission(item.permissions)) &&
        (!item.children || item.children.length > 0),
    );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    visibleItems.forEach((item) => {
      if (item.children) initial[item.to] = location.pathname.startsWith(item.to);
    });
    return initial;
  });

  const toggleGroup = (key: string) => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground",
        mobile
          ? "w-full"
          : cn(
              "fixed inset-y-0 left-0 z-30 border-r border-sidebar-border transition-[width] duration-200 ease-out",
              collapsed ? "w-[72px]" : "w-[260px]",
            ),
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-4",
          collapsed && !mobile && "justify-center px-2",
        )}
      >
        {collapsed && !mobile ? (
          <BrandMark variant="light" showSubtitle={false} className="[&>div:last-child]:hidden" />
        ) : (
          <BrandMark variant="light" />
        )}
      </div>

      {!collapsed && (
        <div className="px-5 pb-2 pt-5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">
            Gestion
          </span>
        </div>
      )}

      <nav className={cn("flex-1 overflow-y-auto", collapsed && !mobile ? "px-2 pt-4" : "px-3")}>
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            if (item.children) {
              const groupActive = location.pathname.startsWith(item.to);
              const isOpen = !!openGroups[item.to];

              return (
                <li key={item.to}>
                  <button
                    type="button"
                    onClick={() => (collapsed && !mobile ? onToggle() : toggleGroup(item.to))}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      groupActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                      collapsed && !mobile && "justify-center px-0",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {(!collapsed || mobile) && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "rotate-0")}
                        />
                      </>
                    )}
                  </button>

                  {(!collapsed || mobile) && isOpen && (
                    <ul className="mt-0.5 space-y-0.5 pl-3">
                      {item.children.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <li key={sub.to}>
                            <NavLink
                              to={sub.to}
                              onClick={onNavigate}
                              className={({ isActive }) =>
                                cn(
                                  "flex items-center gap-3 rounded-md border-l border-sidebar-border/60 py-1.5 pl-4 pr-3 text-[13px] text-sidebar-foreground/85 transition-colors",
                                  "hover:border-sidebar-ring hover:text-sidebar-accent-foreground",
                                  isActive && "border-sidebar-ring font-medium text-sidebar-accent-foreground",
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
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                      collapsed && !mobile && "justify-center px-0",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r bg-accent"
                        />
                      )}
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {(!collapsed || mobile) && <span>{item.label}</span>}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        className={cn(
          "border-t border-sidebar-border p-3",
          collapsed && !mobile ? "flex justify-center" : "flex items-center justify-between gap-2",
        )}
      >
        {(!collapsed || mobile) && (
          <div className="min-w-0 text-[11px] leading-tight text-sidebar-muted">
            <div className="font-medium text-sidebar-foreground">Sistema de Morosidad</div>
            <div>v1.0 · Interno</div>
          </div>
        )}
        {!mobile && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label={collapsed ? "Expandir menu" : "Colapsar menu"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </aside>
  );
}
