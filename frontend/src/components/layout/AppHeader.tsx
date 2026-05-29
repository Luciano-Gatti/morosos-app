import { useMemo, useState } from "react";
import { ChevronRight, Bell, LogOut, Settings, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

function getDisplayName(user: ReturnType<typeof useAuth>["user"]) {
  if (!user) return "Usuario";
  const fullName = [user.nombre, user.apellido].filter(Boolean).join(" ").trim();
  return fullName || user.username || user.email;
}

function getInitials(user: ReturnType<typeof useAuth>["user"]) {
  const displayName = getDisplayName(user);
  const parts = displayName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return displayName.slice(0, 2).toUpperCase();
}

export function AppHeader({ title, description, breadcrumb, actions }: Props) {
  const { user, logout } = useAuth();
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const displayName = useMemo(() => getDisplayName(user), [user]);
  const initials = useMemo(() => getInitials(user), [user]);
  const rolesLabel = user?.roles?.length ? user.roles.join(", ") : "Sin rol informado";

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      {/* Top utility bar */}
      <div className="flex h-12 items-center justify-between gap-4 border-b border-border/60 px-6">
        <nav aria-label="Migas de pan" className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Inicio</Link>
          {breadcrumb?.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 opacity-60" />
              {c.to ? (
                <Link to={c.to} className="hover:text-foreground">{c.label}</Link>
              ) : (
                <span className={cn(i === breadcrumb.length - 1 && "text-foreground font-medium")}>{c.label}</span>
              )}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Notificaciones">
            <Bell className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-1 flex items-center gap-2 border-l border-border pl-3 text-left outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Abrir menú de sesión"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  {initials}
                </div>
                <div className="hidden text-right md:block">
                  <div className="max-w-[180px] truncate text-[12px] font-medium leading-tight text-foreground">{displayName}</div>
                  <div className="max-w-[180px] truncate text-[10px] leading-tight text-muted-foreground">{user?.email}</div>
                  <div className="max-w-[180px] truncate text-[10px] leading-tight text-muted-foreground">{rolesLabel}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span>{displayName}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
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
              <DropdownMenuItem onSelect={() => void logout()} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Title row */}
      <div className="flex flex-col gap-3 px-6 py-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-[26px] font-semibold leading-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mi sesión</DialogTitle>
            <DialogDescription>Datos reales recibidos desde el servicio de autenticación.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 text-sm">
            <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nombre</div>
                <div className="mt-1 text-foreground">{displayName}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Usuario</div>
                <div className="mt-1 text-foreground">{user?.username}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</div>
                <div className="mt-1 text-foreground">{user?.email}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">ID</div>
                <div className="mt-1 break-all text-foreground">{user?.id}</div>
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Roles informativos</div>
              <div className="flex flex-wrap gap-2">
                {user?.roles?.length ? user.roles.map((role) => <Badge key={role} variant="secondary">{role}</Badge>) : <span className="text-muted-foreground">Sin roles informados.</span>}
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Permisos de lectura</div>
              <div className="max-h-48 overflow-y-auto rounded-lg border p-3">
                {user?.permissions?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {user.permissions.map((permission) => <Badge key={permission} variant="outline">{permission}</Badge>)}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Sin permisos informados.</span>
                )}
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
              Funcionalidad preparada para una próxima etapa. Actualmente no hay un endpoint disponible para guardar cambios de sesión desde el frontend.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </header>
  );
}
