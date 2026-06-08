import { useState } from "react";
import { Bell, ChevronRight, LogOut, Menu, Settings, ShieldCheck, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useAppLayout } from "./AppLayoutContext";

export interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  title: string;
  description?: string;
  breadcrumb?: Crumb[];
  actions?: React.ReactNode;
}

function buildDisplayName(nombre?: string, apellido?: string | null, username?: string) {
  const fullName = [nombre, apellido].filter(Boolean).join(" ").trim();
  return fullName || username || "Usuario";
}

function buildInitials(nombre?: string, apellido?: string | null, username?: string) {
  const source = [nombre, apellido].filter(Boolean);
  if (source.length > 0) {
    return source.map((part) => part.charAt(0)).join("").slice(0, 2).toUpperCase();
  }
  return (username ?? "U").slice(0, 2).toUpperCase();
}

export function AppHeader({ title, description, breadcrumb, actions }: Props) {
  const { user, logout } = useAuth();
  const layout = useAppLayout();
  const navigate = useNavigate();
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  const displayName = buildDisplayName(user?.nombre, user?.apellido, user?.username);
  const initials = buildInitials(user?.nombre, user?.apellido, user?.username);
  const primaryRole = user?.roles?.[0] ?? "Sin rol informado";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      {/* Top utility bar */}
      <div className="flex h-12 items-center justify-between gap-2 border-b border-border/60 px-4 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {layout?.isMobileViewport && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 lg:hidden"
              aria-label="Abrir menu"
              onClick={layout.openMobileMenu}
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <nav aria-label="Migas de pan" className="flex min-w-0 items-center gap-1.5 overflow-x-auto whitespace-nowrap pr-2 text-[12px] text-muted-foreground">
            <Link to="/" className="shrink-0 hover:text-foreground">Inicio</Link>
            {breadcrumb?.map((c, i) => (
              <span key={i} className="flex shrink-0 items-center gap-1.5">
                <ChevronRight className="h-3 w-3 opacity-60" />
                {c.to ? (
                  <Link to={c.to} className="hover:text-foreground">{c.label}</Link>
                ) : (
                  <span className={cn(i === breadcrumb.length - 1 && "text-foreground font-medium")}>{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Notificaciones">
            <Bell className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="ml-1 h-auto gap-2 border-l border-border px-0 pl-3 hover:bg-transparent">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  {initials}
                </div>
                <div className="hidden text-right md:block">
                  <div className="max-w-40 truncate text-[12px] font-medium leading-tight text-foreground">{displayName}</div>
                  <div className="max-w-40 truncate text-[10px] leading-tight text-muted-foreground">{primaryRole}</div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span className="truncate text-sm font-semibold">{displayName}</span>
                  <span className="truncate text-xs font-normal text-muted-foreground">{user?.email ?? "Sin email informado"}</span>
                  {user?.roles?.length ? (
                    <span className="truncate text-[11px] font-normal text-muted-foreground">{user.roles.join(", ")}</span>
                  ) : null}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setSessionDialogOpen(true)}>
                <UserRound className="mr-2 h-4 w-4" />
                Mi sesión
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSettingsDialogOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Configurar datos de sesión
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={(event) => { event.preventDefault(); void handleLogout(); }}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Title row */}
      <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-[26px] font-semibold leading-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">{actions}</div>}
      </div>

      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mi sesión</DialogTitle>
            <DialogDescription>Datos reales devueltos por el servicio de autenticación.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Nombre</p>
                <p className="font-medium">{displayName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Usuario</p>
                <p className="font-medium">{user?.username ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ID</p>
                <p className="font-medium">{user?.id ?? "—"}</p>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4" />
                Roles
              </div>
              <p className="text-muted-foreground">{user?.roles?.length ? user.roles.join(", ") : "Sin roles informados."}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="mb-2 font-medium">Permisos en modo lectura</p>
              <div className="max-h-44 overflow-auto rounded bg-muted/40 p-3 text-xs text-muted-foreground">
                {user?.permissions?.length ? user.permissions.join(", ") : "Sin permisos informados."}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar datos de sesión</DialogTitle>
            <DialogDescription>
              Funcionalidad pendiente de integración. No se guardan cambios reales desde esta pantalla.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            La edición de datos de sesión quedará disponible cuando el auth-service exponga el endpoint correspondiente.
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
