import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Filter, Loader2, MoreHorizontal, Pencil, Plus, Search } from "lucide-react";

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
import { Label } from "@/components/ui/label";
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
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { authService, isAuthError } from "@/services/api/authService";
import type { AdminUser, RoleOption, UserStatus } from "@/types/auth";

interface UserFormState {
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  estado: UserStatus;
  roleCode: string;
}

const emptyForm: UserFormState = {
  username: "",
  email: "",
  nombre: "",
  apellido: "",
  estado: "PENDIENTE_APROBACION",
  roleCode: "",
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
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
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
  const canOpenPendingEditor = canApprove || canReject || canUpdate;
  const isPendingSelection = selected?.estado === "PENDIENTE_APROBACION";
  const canSaveForm = selected ? canUpdate : canCreate;
  const canEditIdentityFields = canSaveForm && !isPendingSelection;
  const canEditRoleInModal = canUpdate || Boolean(isPendingSelection && canApprove);

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
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [search, statusFilter, users]);

  const formRoleOptions = useMemo(() => {
    if (!selected?.roles?.[0]) return roles;
    const currentRole = selected.roles[0];
    if (roles.some((role) => role.codigo === currentRole)) return roles;
    return [
      {
        id: `inactive-${currentRole}`,
        codigo: currentRole,
        nombre: `${currentRole} (inactivo)`,
        descripcion: "",
        activo: false,
        systemRole: false,
        permissions: [],
      },
      ...roles,
    ];
  }, [roles, selected]);

  const load = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const [loadedUsers, loadedRoles] = await Promise.all([
        authService.adminUsers(accessToken),
        authService.adminRoles(accessToken).catch(() => []),
      ]);
      setUsers(loadedUsers);
      setRoles(loadedRoles);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "No se pudo cargar la gestion de usuarios.");
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
    const roleCode = user.roles[0] ?? "";
    setSelected(user);
    setForm({
      username: user.username,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      estado: user.estado,
      roleCode,
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

  const buildPayload = () => ({
    username: form.username,
    email: form.email,
    nombre: form.nombre,
    apellido: form.apellido,
    estado: form.estado,
    roles: form.roleCode ? [form.roleCode] : [],
    permissions: [] as string[],
  });

  const save = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (selected) {
        await authService.adminUpdateUser(accessToken, selected.id, buildPayload());
      } else {
        await authService.adminCreateUser(accessToken, buildPayload());
      }
      setMessage(selected ? "Usuario actualizado." : "Usuario creado.");
      closeForm();
      await load();
    } catch (err) {
      setError(isAuthError(err) ? err.message : "No se pudo guardar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  const approveSelected = async () => {
    if (!accessToken || !selected) return;
    if (!form.roleCode) {
      setError("Debes asignar un rol antes de aprobar al usuario.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await authService.adminApproveUser(accessToken, selected.id, {
        roles: [form.roleCode],
        permissions: [],
      });
      setMessage("Usuario aprobado.");
      closeForm();
      await load();
    } catch (err) {
      setError(isAuthError(err) ? err.message : "No se pudo aprobar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  const rejectSelected = async () => {
    if (!accessToken || !selected) return;

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await authService.adminRejectUser(accessToken, selected.id, "Rechazado por administracion");
      setMessage("Usuario rechazado.");
      closeForm();
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
        title="Gestion de usuarios"
        description="Alta administrativa, aprobacion pendiente y asignacion de un rol por usuario."
        breadcrumb={[{ label: "Administracion" }, { label: "Usuarios" }]}
      />

      <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">
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
          <div className="flex flex-col gap-2 border-b border-border px-3 py-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex items-center gap-1.5 pr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                Filtros
              </div>
              <div className="relative min-w-0 flex-1 sm:min-w-[240px] sm:max-w-sm">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-8 pl-8 text-[12.5px]"
                  placeholder="Buscar usuario, email o rol..."
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
            <Button size="sm" className="h-8 w-full gap-2 sm:w-auto" onClick={openCreate} disabled={!canCreate}>
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

          <div className="space-y-3 p-3 md:hidden">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                canOpenEditor={canUpdate || (user.estado === "PENDIENTE_APROBACION" && canOpenPendingEditor)}
                onEdit={openEdit}
              />
            ))}
            {filteredUsers.length === 0 && (
              <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
                No hay usuarios para los filtros seleccionados.
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
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
                    Rol
                  </TableHead>
                  <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Verificacion
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
                    <TableCell className="max-w-[240px] truncate py-2.5 text-[13px] text-foreground">
                      {user.email}
                    </TableCell>
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
                        canOpenEditor={canUpdate || (user.estado === "PENDIENTE_APROBACION" && canOpenPendingEditor)}
                        onEdit={openEdit}
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
        <DialogContent className="grid-rows-[auto_minmax(0,1fr)_auto] max-w-2xl overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <DialogTitle>{selected ? "Editar usuario" : "Crear usuario"}</DialogTitle>
            <DialogDescription>
              {isPendingSelection
                ? "Revisa los datos de la solicitud y decide si apruebas o deniegas la cuenta."
                : "Edita los datos administrativos de la cuenta y define el rol asociado."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="user-username">Usuario</Label>
                <Input
                  id="user-username"
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  disabled={!canEditIdentityFields}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  disabled={!canEditIdentityFields}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="user-nombre">Nombre</Label>
                <Input
                  id="user-nombre"
                  value={form.nombre}
                  onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
                  disabled={!canEditIdentityFields}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-apellido">Apellido</Label>
                <Input
                  id="user-apellido"
                  value={form.apellido}
                  onChange={(event) => setForm((current) => ({ ...current, apellido: event.target.value }))}
                  disabled={!canEditIdentityFields}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Estado actual</Label>
                <div className="flex h-10 items-center rounded-md border border-input bg-background px-3">
                  <StatusBadge status={form.estado} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Rol</Label>
                <Select
                  value={form.roleCode || undefined}
                  onValueChange={(value) => setForm((current) => ({ ...current, roleCode: value }))}
                  disabled={!canEditRoleInModal}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {formRoleOptions.length === 0 && (
                      <SelectItem value="__sin_roles__" disabled>
                        No hay roles activos
                      </SelectItem>
                    )}
                    {formRoleOptions.map((role) => (
                      <SelectItem key={role.id} value={role.codigo} disabled={!role.activo}>
                        {role.nombre || role.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selected?.roles.length && selected.roles.length > 1 && (
              <div className="rounded-md border border-status-paused/30 bg-status-paused-soft px-3 py-2 text-xs text-status-paused">
                El usuario tenia multiples roles. Al guardar o aprobar, quedara normalizado a un solo rol.
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border px-4 py-3 sm:justify-between sm:px-6">
            <Button variant="outline" onClick={closeForm} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
              {selected?.estado === "PENDIENTE_APROBACION" && (
                <Button
                  variant="outline"
                  onClick={rejectSelected}
                  disabled={loading || !canReject}
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Denegar usuario
                </Button>
              )}
              {!isPendingSelection && (
                <Button onClick={save} disabled={loading || !canSaveForm} className="w-full sm:w-auto">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selected ? "Guardar cambios" : "Crear usuario"}
                </Button>
              )}
              {selected?.estado === "PENDIENTE_APROBACION" && (
                <Button
                  onClick={approveSelected}
                  disabled={loading || !canApprove || !form.roleCode}
                  className="w-full sm:w-auto"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Aceptar usuario
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CountPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "active" | "paused" | "debt" | "neutral";
}) {
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
  if (roles.length === 0) return <span className="text-[13px] text-muted-foreground">Sin rol</span>;

  return (
    <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
      {roles[0]}
    </span>
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
  canOpenEditor: boolean;
  onEdit: (user: AdminUser) => void;
}

function UserActions({ user, canOpenEditor, onEdit }: UserActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canOpenEditor}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Acciones
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onEdit(user)} disabled={!canOpenEditor} className="text-[13px]">
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Editar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserCard({ user, canOpenEditor, onEdit }: UserActionsProps) {
  return (
    <article className="rounded-md border border-border bg-background p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-foreground">
            {user.nombre} {user.apellido}
          </div>
          <div className="text-[12px] text-muted-foreground">{user.username}</div>
          <div className="mt-1 break-all text-[12px] text-muted-foreground">{user.email}</div>
        </div>
        <StatusBadge status={user.estado} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
        <div className="rounded-md bg-surface-muted/50 px-2.5 py-2">
          <div className="text-muted-foreground">Rol</div>
          <div className="font-medium text-foreground">{user.roles[0] ?? "Sin rol"}</div>
        </div>
        <div className="rounded-md bg-surface-muted/50 px-2.5 py-2">
          <div className="text-muted-foreground">Verificacion</div>
          <div className="font-medium text-foreground">
            {user.emailVerificado ? "Email verificado" : "Sin verificar"}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <div className="text-[11.5px] text-muted-foreground">Registro: {formatDate(user.createdAt)}</div>
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => onEdit(user)} disabled={!canOpenEditor}>
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      </div>
    </article>
  );
}

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(date);
}
