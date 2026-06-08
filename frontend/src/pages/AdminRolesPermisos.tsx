import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Loader2, MoreHorizontal, Pencil, Plus, Search } from "lucide-react";

import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { authService, isAuthError } from "@/services/api/authService";
import type { PermissionOption, RoleOption, RoleRequest } from "@/types/auth";

interface RoleFormState {
  codigo: string;
  nombre: string;
  descripcion: string;
  permissions: string[];
}

const emptyForm: RoleFormState = {
  codigo: "",
  nombre: "",
  descripcion: "",
  permissions: [],
};

const buildRoleCode = (nombre: string): string =>
  nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

export default function AdminRolesPermisos() {
  const { accessToken, hasAllPermissions, hasAnyPermission } = useAuth();
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [permissions, setPermissions] = useState<PermissionOption[]>([]);
  const [selected, setSelected] = useState<RoleOption | null>(null);
  const [form, setForm] = useState<RoleFormState>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleGroupFilter, setRoleGroupFilter] = useState("todos");
  const [permissionGroupFilter, setPermissionGroupFilter] = useState("todos");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCreate = hasAllPermissions(["ROLES_CREAR", "ROLES_ASIGNAR_PERMISOS"]);
  const canEdit = hasAllPermissions(["ROLES_EDITAR", "ROLES_ASIGNAR_PERMISOS"]);
  const canChangeStatus = hasAnyPermission(["ROLES_ACTIVAR_DESACTIVAR"]);
  const selectedIsProtected = selected?.systemRole && selected.codigo === "ADMIN";

  const permissionGroups = useMemo(
    () =>
      [...new Set(permissions.map((permission) => permission.modulo))]
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right, "es")),
    [permissions],
  );

  const permissionCodesByGroup = useMemo(() => {
    const groups = new Map<string, Set<string>>();

    permissions.forEach((permission) => {
      const codes = groups.get(permission.modulo) ?? new Set<string>();
      codes.add(permission.codigo);
      groups.set(permission.modulo, codes);
    });

    return groups;
  }, [permissions]);

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, Map<string, PermissionOption[]>>();

    permissions
      .filter((permission) => permissionGroupFilter === "todos" || permission.modulo === permissionGroupFilter)
      .forEach((permission) => {
        const moduleMap = groups.get(permission.modulo) ?? new Map<string, PermissionOption[]>();
        const list = moduleMap.get(permission.recurso) ?? [];
        list.push(permission);
        moduleMap.set(permission.recurso, list);
        groups.set(permission.modulo, moduleMap);
      });

    return [...groups.entries()].map(([modulo, recursoMap]) => ({
      modulo,
      recursos: [...recursoMap.entries()].map(([recurso, list]) => ({
        recurso,
        permissions: [...list].sort((left, right) => left.nombre.localeCompare(right.nombre, "es")),
      })),
    }));
  }, [permissionGroupFilter, permissions]);

  const filteredRoles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const groupPermissionCodes = permissionCodesByGroup.get(roleGroupFilter);

    return roles.filter((role) => {
      const matchesGroup =
        roleGroupFilter === "todos" ||
        (groupPermissionCodes !== undefined && role.permissions.some((code) => groupPermissionCodes.has(code)));

      if (!matchesGroup) return false;
      if (!normalizedSearch) return true;

      return [role.codigo, role.nombre, role.descripcion ?? "", role.permissions.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [permissionCodesByGroup, roleGroupFilter, roles, search]);

  const load = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const [loadedRoles, loadedPermissions] = await Promise.all([
        authService.adminRoles(accessToken, { includeInactive: true }),
        authService.adminPermissions(accessToken),
      ]);
      setRoles(loadedRoles);
      setPermissions(loadedPermissions);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "No se pudo cargar la gestion de roles.");
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
    setPermissionGroupFilter("todos");
    setMessage(null);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (role: RoleOption) => {
    setSelected(role);
    setForm({
      codigo: role.codigo,
      nombre: role.nombre,
      descripcion: role.descripcion ?? "",
      permissions: role.permissions,
    });
    setPermissionGroupFilter("todos");
    setMessage(null);
    setError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setSelected(null);
    setForm(emptyForm);
  };

  const save = async () => {
    if (!accessToken) return;

    const nombre = form.nombre.trim();
    const codigo = selected ? selected.codigo : buildRoleCode(nombre);

    if (!nombre) {
      setError("El nombre del rol es obligatorio.");
      return;
    }

    if (!codigo) {
      setError("El nombre debe contener letras o numeros para generar un codigo valido.");
      return;
    }

    const payload: RoleRequest = {
      codigo,
      nombre,
      descripcion: form.descripcion,
      permissions: form.permissions,
    };

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (selected) {
        await authService.adminUpdateRole(accessToken, selected.id, payload);
      } else {
        await authService.adminCreateRole(accessToken, payload);
      }
      setMessage(selected ? "Rol actualizado." : "Rol creado.");
      closeForm();
      await load();
    } catch (err) {
      setError(isAuthError(err) ? err.message : "No se pudo guardar el rol.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRoleStatus = async (role: RoleOption) => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await authService.adminChangeRoleStatus(accessToken, role.id, !role.activo);
      setMessage(role.activo ? "Rol desactivado." : "Rol reactivado.");
      await load();
    } catch (err) {
      setError(isAuthError(err) ? err.message : "No se pudo cambiar el estado del rol.");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionCode: string, checked: boolean) => {
    setForm((current) => ({
      ...current,
      permissions: checked
        ? [...current.permissions, permissionCode].sort()
        : current.permissions.filter((code) => code !== permissionCode),
    }));
  };

  return (
    <>
      <AppHeader
        title="Roles y permisos"
        description="Define los roles administrativos y el conjunto de permisos que hereda cada uno."
        breadcrumb={[{ label: "Administracion" }, { label: "Roles y permisos" }]}
      />

      <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">
        {loading && <div className="mb-2 text-xs text-muted-foreground">Cargando roles...</div>}
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
                  placeholder="Buscar rol o permiso..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Select value={roleGroupFilter} onValueChange={setRoleGroupFilter}>
                <SelectTrigger className="h-8 w-full text-[12.5px] sm:w-[180px]">
                  <SelectValue placeholder="Agrupador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos" className="text-[13px]">
                    Todos los agrupadores
                  </SelectItem>
                  {permissionGroups.map((group) => (
                    <SelectItem key={group} value={group} className="text-[13px]">
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="h-8 w-full gap-2 sm:w-auto" onClick={openCreate} disabled={!canCreate}>
              <Plus className="h-4 w-4" />
              Nuevo rol
            </Button>
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {filteredRoles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                canEdit={canEdit}
                canChangeStatus={canChangeStatus}
                onEdit={openEdit}
                onToggleStatus={toggleRoleStatus}
              />
            ))}
            {filteredRoles.length === 0 && (
              <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
                No hay roles para los filtros seleccionados.
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow className="border-border bg-surface-muted/60 hover:bg-surface-muted/60">
                  <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Rol
                  </TableHead>
                  <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Estado
                  </TableHead>
                  <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Permisos
                  </TableHead>
                  <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Descripcion
                  </TableHead>
                  <TableHead className="h-9 w-[72px] text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Opciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.id} className="border-border hover:bg-surface-muted/40">
                    <TableCell className="py-2.5">
                      <div className="text-[13px] font-medium text-foreground">{role.nombre}</div>
                      <div className="text-[12px] text-muted-foreground">{role.codigo}{role.systemRole ? " · sistema" : ""}</div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                          role.activo ? "bg-status-active-soft text-status-active" : "bg-surface-muted text-muted-foreground",
                        )}
                      >
                        {role.activo ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-[13px] text-foreground">
                      {role.permissions.length} permisos
                    </TableCell>
                    <TableCell className="max-w-[340px] py-2.5 text-[13px] text-muted-foreground">
                      {role.descripcion || "Sin descripcion"}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <RoleActions
                        role={role}
                        canEdit={canEdit}
                        canChangeStatus={canChangeStatus}
                        onEdit={openEdit}
                        onToggleStatus={toggleRoleStatus}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRoles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-[13px] text-muted-foreground">
                      No hay roles para los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <Dialog open={formOpen} onOpenChange={(open) => (open ? setFormOpen(true) : closeForm())}>
        <DialogContent className="grid-rows-[auto_minmax(0,1fr)_auto] max-w-4xl overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <DialogTitle>{selected ? "Editar rol" : "Crear rol"}</DialogTitle>
            <DialogDescription>
              Configura los datos del rol y selecciona los permisos que heredaran sus usuarios.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="role-name">Nombre</Label>
                <Input
                  id="role-name"
                  value={form.nombre}
                  onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
                  disabled={selected ? !canEdit || selectedIsProtected : !canCreate}
                />
                {!selected && (
                  <p className="text-[11px] text-muted-foreground">
                    El codigo se genera automaticamente a partir del nombre.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role-description">Descripcion</Label>
              <Textarea
                id="role-description"
                value={form.descripcion}
                onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))}
                disabled={selected ? !canEdit || selectedIsProtected : !canCreate}
              />
            </div>

            <div className="rounded-md border border-border bg-surface-muted/30 p-3 sm:p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-[13px] font-medium text-foreground">Permisos del rol</h3>
                  <p className="text-[12px] text-muted-foreground">
                    Seleccionados: {form.permissions.length}
                  </p>
                </div>
                <Select value={permissionGroupFilter} onValueChange={setPermissionGroupFilter}>
                  <SelectTrigger className="h-8 w-full text-[12.5px] sm:w-[190px]">
                    <SelectValue placeholder="Agrupador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos" className="text-[13px]">
                      Todos los agrupadores
                    </SelectItem>
                    {permissionGroups.map((group) => (
                      <SelectItem key={group} value={group} className="text-[13px]">
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4">
                {groupedPermissions.map((group) => (
                  <div key={group.modulo} className="rounded-md border border-border bg-surface p-3">
                    <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.modulo}
                    </div>
                    <div className="grid gap-3">
                      {group.recursos.map((resourceGroup) => (
                        <div key={`${group.modulo}-${resourceGroup.recurso}`} className="grid gap-2">
                          <div className="text-[12px] font-medium text-foreground">{resourceGroup.recurso}</div>
                          <div className="grid gap-2 lg:grid-cols-2">
                            {resourceGroup.permissions.map((permission) => {
                              const checked = form.permissions.includes(permission.codigo);
                              return (
                                <label
                                  key={permission.id}
                                  className="flex items-start gap-3 rounded-md border border-border px-3 py-2 text-left"
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(value) => togglePermission(permission.codigo, value === true)}
                                    disabled={selected ? !canEdit || selectedIsProtected : !canCreate}
                                    className="mt-0.5"
                                  />
                                  <div className="min-w-0 break-words">
                                    <div className="text-[12px] font-medium text-foreground">{permission.nombre}</div>
                                    <div className="text-[11px] text-muted-foreground">{permission.codigo}</div>
                                    <div className="text-[11px] text-muted-foreground">{permission.descripcion}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border px-4 py-3 sm:px-6">
            <Button variant="outline" onClick={closeForm} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={save} disabled={loading || (selected ? !canEdit || selectedIsProtected : !canCreate)} className="w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selected ? "Guardar cambios" : "Crear rol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface RoleActionsProps {
  role: RoleOption;
  canEdit: boolean;
  canChangeStatus: boolean;
  onEdit: (role: RoleOption) => void;
  onToggleStatus: (role: RoleOption) => void;
}

function RoleActions({ role, canEdit, canChangeStatus, onEdit, onToggleStatus }: RoleActionsProps) {
  const protectAdmin = role.systemRole && role.codigo === "ADMIN";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={(!canEdit && !canChangeStatus) || protectAdmin}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Acciones
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onEdit(role)} disabled={!canEdit} className="text-[13px]">
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onToggleStatus(role)} disabled={!canChangeStatus || protectAdmin} className="text-[13px]">
          {role.activo ? "Desactivar rol" : "Reactivar rol"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RoleCard({ role, canEdit, canChangeStatus, onEdit, onToggleStatus }: RoleActionsProps) {
  const protectAdmin = role.systemRole && role.codigo === "ADMIN";
  return (
    <article className="rounded-md border border-border bg-background p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-foreground">{role.nombre}</div>
          <div className="text-[12px] text-muted-foreground">{role.codigo}{role.systemRole ? " · sistema" : ""}</div>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
            role.activo ? "bg-status-active-soft text-status-active" : "bg-surface-muted text-muted-foreground",
          )}
        >
          {role.activo ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="mt-3 space-y-2 text-[12px]">
        <div className="rounded-md bg-surface-muted/50 px-2.5 py-2">
          <div className="text-muted-foreground">Permisos</div>
          <div className="font-medium text-foreground">{role.permissions.length}</div>
        </div>
        <div className="rounded-md bg-surface-muted/50 px-2.5 py-2">
          <div className="text-muted-foreground">Descripcion</div>
          <div className="text-foreground">{role.descripcion || "Sin descripcion"}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => onEdit(role)} disabled={!canEdit}>
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
        <Button variant="outline" size="sm" className="w-full" onClick={() => onToggleStatus(role)} disabled={!canChangeStatus || protectAdmin}>
          {role.activo ? "Desactivar rol" : "Reactivar rol"}
        </Button>
      </div>
    </article>
  );
}
