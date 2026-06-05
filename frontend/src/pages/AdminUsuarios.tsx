import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Filter, Loader2, MoreHorizontal, Pencil, Plus, Search, XCircle } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { authService, isAuthError } from "@/services/api/authService";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { AdminUser, PermissionOption, RoleOption, UserStatus } from "@/types/auth";

const emptyForm = {
  username: "",
  email: "",
  nombre: "",
  apellido: "",
  estado: "PENDIENTE_APROBACION" as UserStatus,
  roles: "",
  permissions: "",
};

const statusLabels: Record<UserStatus, string> = {
  PENDIENTE_APROBACION: "Pendiente",
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  RECHAZADO: "Rechazado",
};

const statusOptions: Array<{ value: UserStatus | "TODOS"; label: string }> = [
  { value: "TODOS", label: "Todos los estados" },
  { value: "PENDIENTE_APROBACION", label: "Pendientes" },
  { value: "ACTIVO", label: "Activos" },
  { value: "INACTIVO", label: "Inactivos" },
  { value: "RECHAZADO", label: "Rechazados" },
];

type StatusFilter = UserStatus | "TODOS";

export default function AdminUsuarios() {
  const { accessToken, hasAnyPermission } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [permissions, setPermissions] = useState<PermissionOption[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TODOS");
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCreate = hasAnyPermission(["USUARIOS_CREAR"]);
  const canUpdate = hasAnyPermission(["USUARIOS_EDITAR"]);
  const canApprove = hasAnyPermission(["USUARIOS_APROBAR"]);
  const canReject = hasAnyPermission(["USUARIOS_RECHAZAR"]);
  const canSaveForm = selected ? canUpdate : canCreate;

  const userCounts = useMemo(
    () => ({
      total: users.length,
      pending: users.filter((user) => user.estado === "PENDIENTE_APROBACION").length,
      active: users.filter((user) => user.estado === "ACTIVO").length,
      inactive: users.filter((user) => user.estado === "INACTIVO").length,
      rejected: users.filter((user) => user.estado === "RECHAZADO").length,
    }),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesStatus = statusFilter === "TODOS" || user.estado === statusFilter;
      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

      const searchable = [
        user.id,
        user.username,
        user.email,
        user.nombre,
        user.apellido,
        user.estado,
        ...user.roles,
        ...user.permissions,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [search, statusFilter, users]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [loadedUsers, loadedRoles, loadedPermissions] = await Promise.all([
        authService.adminUsers(accessToken),
        authService.adminRoles(accessToken).catch(() => []),
        authService.adminPermissions(accessToken).catch(() => []),
      ]);
      setUsers(loadedUsers);
      setRoles(loadedRoles);
      setPermissions(loadedPermissions);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "No se pudo cargar la gestión de usuarios.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setMessage(null);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setSelected(user);
    setForm({
      username: user.username,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      estado: user.estado,
      roles: user.roles.join(", "),
      permissions: user.permissions.join(", "),
    });
    setMessage(null);
    setError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setSelected(null);
    setForm(emptyForm);
  };

  const payload = () => ({
    username: form.username,
    email: form.email,
    nombre: form.nombre,
    apellido: form.apellido,
    estado: form.estado,
    roles: splitCodes(form.roles),
    permissions: splitCodes(form.permissions),
  });

  const save = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (selected) await authService.adminUpdateUser(accessToken, selected.id, payload());
      else await authService.adminCreateUser(accessToken, payload());
      setMessage(selected ? "Usuario actualizado." : "Usuario creado.");
      closeForm();
      await load();
    } catch (err) {
      setError(isAuthError(err) ? err.message : "No se pudo guardar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  const approve = async (user: AdminUser) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await authService.adminApproveUser(accessToken, user.id, {
        roles: user.roles,
        permissions: user.permissions,
      });
      setMessage("Usuario aprobado.");
      await load();
    } catch (err) {
      setError(isAuthError(err) ? err.message : "No se pudo aprobar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  const reject = async (user: AdminUser) => {
    if (!accessToken) return;
    const reason = window.prompt("Motivo de rechazo", "Rechazado por administración");
    if (reason === null) return;

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await authService.adminRejectUser(accessToken, user.id, reason.trim() || "Rechazado por administración");
      setMessage("Usuario rechazado.");
      await load();
    } catch (err) {
      setError(isAuthError(err) ? err.message : "No se pudo rechazar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppHeader
        title="Gestión de usuarios"
        description="Aprobación, creación manual y asignación administrativa de roles/permisos."
        breadcrumb={[{ label: "Usuarios" }]}
      />

      <main className="flex-1 px-6 py-6">
        {loading && <div className="mb-2 text-xs text-muted-foreground">Cargando usuarios...</div>}
        {message && (
          <div className="mb-2 rounded-md border border-status-closed/30 bg-status-closed-soft px-3 py-2 text-xs text-status-closed">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-md border border-border bg-surface shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 pr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                Filtros
              </div>
              <div className="relative min-w-[240px] flex-1 sm:max-w-sm">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-8 pl-8 text-[12.5px]"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="h-8 w-full text-[12.5px] sm:w-[190px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-[13px]">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="h-8 gap-2" onClick={openCreate} disabled={!canCreate}>
              <Plus className="h-4 w-4" />
              Nuevo usuario
            </Button>
          </div>

          <div className="flex flex-col gap-2 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="text-[12px] text-muted-foreground">
              Mostrando <span className="tabular font-medium text-foreground">{filteredUsers.length}</span> de{" "}
              <span className="tabular font-medium text-foreground">{userCounts.total}</span> cuentas
            </div>
            <div className="flex flex-wrap gap-1.5">
              <CountPill tone="paused">{userCounts.pending} pendientes</CountPill>
              <CountPill tone="active">{userCounts.active} activos</CountPill>
              <CountPill>{userCounts.inactive} inactivos</CountPill>
              <CountPill tone="debt">{userCounts.rejected} rechazados</CountPill>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow className="border-border bg-surface-muted/60 hover:bg-surface-muted/60">
                <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Cuenta
                </TableHead>
                <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </TableHead>
                <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Estado
                </TableHead>
                <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Roles
                </TableHead>
                <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Verificación
                </TableHead>
                <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Registro
                </TableHead>
                <TableHead className="h-9 w-[72px] text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Opciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-border hover:bg-surface-muted/40">
                  <TableCell className="py-2.5">
                    <div className="text-[13px] font-medium text-foreground">
                      {user.nombre} {user.apellido}
                    </div>
                    <div className="text-[12px] text-muted-foreground">{user.username}</div>
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate py-2.5 text-[13px] text-foreground">{user.email}</TableCell>
                  <TableCell className="py-2.5">
                    <StatusBadge status={user.estado} />
                  </TableCell>
                  <TableCell className="py-2.5">
                    <RoleList roles={user.roles} />
                  </TableCell>
                  <TableCell className="py-2.5">
                    <EmailVerificationPill verified={user.emailVerificado} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-2.5 text-[13px] text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <UserActions
                      user={user}
                      loading={loading}
                      canUpdate={canUpdate}
                      canApprove={canApprove}
                      canReject={canReject}
                      onEdit={openEdit}
                      onApprove={approve}
                      onReject={reject}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-[13px] text-muted-foreground">
                    No hay usuarios para los filtros seleccionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <Dialog open={formOpen} onOpenChange={(open) => (open ? setFormOpen(true) : closeForm())}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected ? "Editar usuario" : "Crear usuario"}</DialogTitle>
            <DialogDescription>
              Completá los datos administrativos de la cuenta y sus accesos.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Usuario"
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                disabled={!canSaveForm}
              />
              <Input
                placeholder="Email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                disabled={!canSaveForm}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Nombre"
                value={form.nombre}
                onChange={(event) => setForm({ ...form, nombre: event.target.value })}
                disabled={!canSaveForm}
              />
              <Input
                placeholder="Apellido"
                value={form.apellido}
                onChange={(event) => setForm({ ...form, apellido: event.target.value })}
                disabled={!canSaveForm}
              />
            </div>
            <Select
              value={form.estado}
              onValueChange={(value) => setForm({ ...form, estado: value as UserStatus })}
              disabled={!canSaveForm}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDIENTE_APROBACION">Pendiente</SelectItem>
                <SelectItem value="ACTIVO">Activo</SelectItem>
                <SelectItem value="INACTIVO">Inactivo</SelectItem>
                <SelectItem value="RECHAZADO">Rechazado</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Roles separados por coma (ej.: OPERADOR)"
              value={form.roles}
              onChange={(event) => setForm({ ...form, roles: event.target.value })}
              disabled={!canSaveForm}
            />
            <Textarea
              placeholder="Permisos directos separados por coma"
              value={form.permissions}
              onChange={(event) => setForm({ ...form, permissions: event.target.value })}
              disabled={!canSaveForm}
            />
            <div className="grid max-h-24 gap-1 overflow-y-auto rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p>Roles disponibles: {roles.map((role) => role.codigo).join(", ") || "sin datos"}</p>
              <p>Permisos disponibles: {permissions.map((permission) => permission.codigo).join(", ") || "sin datos"}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={loading || !canSaveForm}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CountPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "active" | "paused" | "debt" | "neutral" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "active" && "bg-status-active-soft text-status-active",
        tone === "paused" && "bg-status-paused-soft text-status-paused",
        tone === "debt" && "bg-status-debt-soft text-status-debt",
        tone === "neutral" && "bg-surface-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const className =
    status === "ACTIVO"
      ? "bg-status-active-soft text-status-active"
      : status === "RECHAZADO"
        ? "bg-status-debt-soft text-status-debt"
        : status === "INACTIVO"
          ? "bg-surface-muted text-muted-foreground"
          : "bg-status-paused-soft text-status-paused";

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", className)}>
      {statusLabels[status]}
    </span>
  );
}

function RoleList({ roles }: { roles: string[] }) {
  if (roles.length === 0) return <span className="text-[13px] text-muted-foreground">Sin roles</span>;

  const visibleRoles = roles.slice(0, 2);
  const hiddenCount = roles.length - visibleRoles.length;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleRoles.map((role) => (
        <span key={role} className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
          {role}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}

function EmailVerificationPill({ verified }: { verified: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        verified ? "bg-status-active-soft text-status-active" : "bg-surface-muted text-muted-foreground",
      )}
    >
      {verified ? "Email verificado" : "Sin verificar"}
    </span>
  );
}

interface UserActionsProps {
  user: AdminUser;
  loading: boolean;
  canUpdate: boolean;
  canApprove: boolean;
  canReject: boolean;
  onEdit: (user: AdminUser) => void;
  onApprove: (user: AdminUser) => void;
  onReject: (user: AdminUser) => void;
}

function UserActions({ user, loading, canUpdate, canApprove, canReject, onEdit, onApprove, onReject }: UserActionsProps) {
  const isPending = user.estado === "PENDIENTE_APROBACION";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Acciones
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onEdit(user)} disabled={!canUpdate} className="text-[13px]">
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Editar
        </DropdownMenuItem>
        {isPending && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onApprove(user)} disabled={loading || !canApprove} className="text-[13px]">
              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
              Aprobar
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onReject(user)}
              disabled={loading || !canReject}
              className="text-[13px] text-destructive focus:text-destructive"
            >
              <XCircle className="mr-2 h-3.5 w-3.5" />
              Rechazar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function splitCodes(value: string) {
  return value
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
}
