import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authService, isAuthError } from "@/services/api/authService";
import { useAuth } from "@/hooks/useAuth";
import type { AdminUser, PermissionOption, RoleOption, UserStatus } from "@/types/auth";

const emptyForm = { username: "", email: "", nombre: "", apellido: "", estado: "PENDIENTE_APROBACION" as UserStatus, roles: "", permissions: "" };

export default function AdminUsuarios() {
  const { accessToken, hasAnyPermission } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [permissions, setPermissions] = useState<PermissionOption[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canEdit = hasAnyPermission(["USUARIOS_CREAR", "USUARIOS_EDITAR", "USUARIOS_APROBAR", "USUARIOS_RECHAZAR"]);

  const pendingUsers = useMemo(() => users.filter((user) => user.estado === "PENDIENTE_APROBACION"), [users]);

  const load = async () => {
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
  };

  useEffect(() => { void load(); }, [accessToken]);

  const selectUser = (user: AdminUser) => {
    setSelected(user);
    setForm({ username: user.username, email: user.email, nombre: user.nombre, apellido: user.apellido, estado: user.estado, roles: user.roles.join(", "), permissions: user.permissions.join(", ") });
    setMessage(null);
    setError(null);
  };

  const resetForm = () => { setSelected(null); setForm(emptyForm); setMotivo(""); };

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
    setLoading(true); setError(null); setMessage(null);
    try {
      if (selected) await authService.adminUpdateUser(accessToken, selected.id, payload());
      else await authService.adminCreateUser(accessToken, payload());
      setMessage(selected ? "Usuario actualizado." : "Usuario creado.");
      resetForm();
      await load();
    } catch (err) {
      setError(isAuthError(err) ? err.message : "No se pudo guardar el usuario.");
    } finally { setLoading(false); }
  };

  const approve = async (user: AdminUser) => {
    if (!accessToken) return;
    setLoading(true); setError(null); setMessage(null);
    try {
      await authService.adminApproveUser(accessToken, user.id, { roles: splitCodes(form.roles || user.roles.join(",")), permissions: splitCodes(form.permissions || user.permissions.join(",")) });
      setMessage("Usuario aprobado.");
      await load();
    } catch (err) { setError(isAuthError(err) ? err.message : "No se pudo aprobar el usuario."); }
    finally { setLoading(false); }
  };

  const reject = async (user: AdminUser) => {
    if (!accessToken) return;
    setLoading(true); setError(null); setMessage(null);
    try {
      await authService.adminRejectUser(accessToken, user.id, motivo || "Rechazado por administración");
      setMessage("Usuario rechazado.");
      await load();
    } catch (err) { setError(isAuthError(err) ? err.message : "No se pudo rechazar el usuario."); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Gestión de usuarios</h1><p className="text-sm text-muted-foreground">Aprobación, creación manual y asignación administrativa de roles/permisos.</p></div>
        <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Actualizar</Button>
      </div>
      {message && <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">{message}</div>}
      {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card><CardHeader><CardTitle>Pendientes de aprobación ({pendingUsers.length})</CardTitle></CardHeader><CardContent className="space-y-3">{pendingUsers.map((user) => <UserRow key={user.id} user={user} onSelect={selectUser} onApprove={approve} onReject={reject} />)}{pendingUsers.length === 0 && <p className="text-sm text-muted-foreground">No hay usuarios pendientes.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>{selected ? "Editar usuario" : "Crear usuario"}</CardTitle></CardHeader><CardContent className="space-y-3">
          <Input placeholder="Usuario" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={!canEdit} />
          <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!canEdit} />
          <div className="grid grid-cols-2 gap-3"><Input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} disabled={!canEdit} /><Input placeholder="Apellido" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} disabled={!canEdit} /></div>
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as UserStatus })} disabled={!canEdit}><option value="PENDIENTE_APROBACION">Pendiente</option><option value="ACTIVO">Activo</option><option value="INACTIVO">Inactivo</option><option value="RECHAZADO">Rechazado</option></select>
          <Textarea placeholder="Roles separados por coma (ej.: OPERADOR)" value={form.roles} onChange={(e) => setForm({ ...form, roles: e.target.value })} disabled={!canEdit} />
          <Textarea placeholder="Permisos directos separados por coma" value={form.permissions} onChange={(e) => setForm({ ...form, permissions: e.target.value })} disabled={!canEdit} />
          <Textarea placeholder="Motivo de rechazo" value={motivo} onChange={(e) => setMotivo(e.target.value)} disabled={!canEdit} />
          <div className="flex gap-2"><Button onClick={save} disabled={loading || !canEdit}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar</Button><Button variant="outline" onClick={resetForm}>Limpiar</Button></div>
          <p className="text-xs text-muted-foreground">Roles disponibles: {roles.map((r) => r.codigo).join(", ") || "sin datos"}</p>
          <p className="text-xs text-muted-foreground">Permisos disponibles: {permissions.map((p) => p.codigo).join(", ") || "sin datos"}</p>
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Todos los usuarios</CardTitle></CardHeader><CardContent className="space-y-2">{users.map((user) => <UserRow key={user.id} user={user} onSelect={selectUser} onApprove={approve} onReject={reject} />)}</CardContent></Card>
    </div>
  );
}

function UserRow({ user, onSelect, onApprove, onReject }: { user: AdminUser; onSelect: (user: AdminUser) => void; onApprove: (user: AdminUser) => void; onReject: (user: AdminUser) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><div className="font-medium">{user.nombre} {user.apellido} <span className="text-muted-foreground">({user.username})</span></div><div className="text-sm text-muted-foreground">{user.email}</div><div className="mt-1 flex flex-wrap gap-1"><Badge variant="outline">{user.estado}</Badge>{user.roles.map((r) => <Badge key={r}>{r}</Badge>)}</div></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => onSelect(user)}>Editar</Button>{user.estado === "PENDIENTE_APROBACION" && <><Button size="sm" onClick={() => onApprove(user)}>Aprobar</Button><Button size="sm" variant="destructive" onClick={() => onReject(user)}>Rechazar</Button></>}</div></div>;
}

function splitCodes(value: string) { return value.split(",").map((code) => code.trim()).filter(Boolean); }
