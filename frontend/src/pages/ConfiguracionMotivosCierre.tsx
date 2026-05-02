import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  Search,
  Info,
  AlertTriangle,
  Lock,
  Power,
  ListChecks,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { configuracionApi } from "@/services/api/configuracionApi";
import { ApiError } from "@/lib/apiClient";
import { mapMotivoCierre } from "@/adapters/motivosCierre";
import {
  motivosCierreIniciales,
  type MotivoCierre,
} from "@/data/motivosCierre";

const numberFmt = new Intl.NumberFormat("es-AR");

type Filtro = "todos" | "activos" | "inactivos" | "sistema" | "configurables";

interface FormState {
  nombre: string;
  descripcion: string;
  activo: boolean;
}

const emptyForm: FormState = { nombre: "", descripcion: "", activo: true };

export default function ConfiguracionMotivosCierre() {
  const { toast } = useToast();
  const [motivos, setMotivos] = useState<MotivoCierre[]>([]);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MotivoCierre | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<MotivoCierre | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMotivos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await configuracionApi.motivosCierre({ size: 200 });
      const rows = (data?.content ?? data ?? []).map(mapMotivoCierre);
      setMotivos(rows);
    } catch (e) {
      setError("No se pudieron cargar los motivos de cierre.");
      if (motivosCierreIniciales.length > 0) setMotivos(motivosCierreIniciales);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotivos();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return motivos
      .filter((m) => {
        if (filtro === "activos" && !m.activo) return false;
        if (filtro === "inactivos" && m.activo) return false;
        if (filtro === "sistema" && !m.isSystem) return false;
        if (filtro === "configurables" && m.isSystem) return false;
        if (!q) return true;
        return (
          m.nombre.toLowerCase().includes(q) ||
          (m.descripcion ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
        return a.nombre.localeCompare(b.nombre);
      });
  }, [motivos, search, filtro]);

  const counts = useMemo(
    () => ({
      total: motivos.length,
      activos: motivos.filter((m) => m.activo).length,
      sistema: motivos.filter((m) => m.isSystem).length,
      configurables: motivos.filter((m) => !m.isSystem).length,
    }),
    [motivos],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (m: MotivoCierre) => {
    if (m.isSystem) return;
    setEditing(m);
    setForm({
      nombre: m.nombre,
      descripcion: m.descripcion ?? "",
      activo: m.activo,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const nombre = form.nombre.trim();
    if (!nombre) {
      toast({
        title: "Nombre requerido",
        description: "El nombre del motivo no puede estar vacío.",
        variant: "destructive",
      });
      return;
    }
    const duplicado = motivos.some(
      (m) =>
        m.id !== editing?.id &&
        m.nombre.trim().toLowerCase() === nombre.toLowerCase(),
    );
    if (duplicado) {
      toast({
        title: "Motivo duplicado",
        description: `Ya existe un motivo con el nombre "${nombre}".`,
        variant: "destructive",
      });
      return;
    }

    try {
    if (editing) {
      await configuracionApi.actualizarMotivoCierre(editing.id, {
        nombre,
        descripcion: form.descripcion.trim() || null,
        activo: form.activo,
      });
      setMotivos((prev) =>
        prev.map((m) =>
          m.id === editing.id
            ? {
                ...m,
                nombre,
                descripcion: form.descripcion.trim() || undefined,
                activo: form.activo,
              }
            : m,
        ),
      );
      toast({
        title: "Motivo actualizado",
        description: `Se guardaron los cambios en "${nombre}".`,
      });
    } else {
      await configuracionApi.crearMotivoCierre({
        nombre,
        descripcion: form.descripcion.trim() || null,
        activo: form.activo,
      });
      const nuevo: MotivoCierre = {
        id: `mc-${Date.now()}`,
        nombre,
        descripcion: form.descripcion.trim() || undefined,
        activo: form.activo,
        isSystem: false,
        usos: 0,
      };
      setMotivos((prev) => [nuevo, ...prev]);
      toast({
        title: "Motivo creado",
        description: `Se creó el motivo "${nombre}".`,
      });
    }

    setDialogOpen(false);
    setEditing(null);
    await fetchMotivos();
    } catch (e) {
      toast({ title: "Error", description: e instanceof ApiError ? e.message : "No se pudo guardar el motivo.", variant: "destructive" });
    }
  };

  const toggleActivo = async (m: MotivoCierre) => {
    try {
      setSaving(true);
      await configuracionApi.toggleMotivoCierreActivo(m.id, !m.activo);
    setMotivos((prev) =>
      prev.map((x) => (x.id === m.id ? { ...x, activo: !x.activo } : x)),
    );
    toast({
      title: m.activo ? "Motivo desactivado" : "Motivo activado",
      description: `"${m.nombre}" ahora está ${m.activo ? "inactivo" : "activo"}.`,
    });
      await fetchMotivos();
    } catch (e) {
      toast({ title: "Error", description: e instanceof ApiError ? e.message : "No se pudo actualizar el estado.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.isSystem) {
      toast({
        title: "No se puede eliminar",
        description: "Los motivos del sistema no pueden eliminarse.",
        variant: "destructive",
      });
      setDeleteTarget(null);
      return;
    }
    if (deleteTarget.usos > 0) {
      toast({
        title: "No se puede eliminar",
        description: `"${deleteTarget.nombre}" ya fue utilizado en procesos cerrados.`,
        variant: "destructive",
      });
      setDeleteTarget(null);
      return;
    }
    try {
      await configuracionApi.eliminarMotivoCierre(deleteTarget.id);
      setMotivos((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      toast({
        title: "Motivo eliminado",
        description: `Se eliminó "${deleteTarget.nombre}".`,
      });
      setDeleteTarget(null);
      await fetchMotivos();
    } catch (e) {
      toast({ title: "No se puede eliminar", description: e instanceof ApiError ? e.message : "El backend rechazó la eliminación.", variant: "destructive" });
      setDeleteTarget(null);
    }
  };

  const isEmpty = motivos.length === 0;

  return (
    <TooltipProvider delayDuration={200}>
      <AppHeader
        title="Motivos de cierre de proceso"
        description="Catálogo de motivos por los cuales un proceso de seguimiento se da por finalizado."
        breadcrumb={[
          { label: "Configuración", to: "/configuracion" },
          { label: "Motivos de cierre" },
        ]}
      />

      <main className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-6xl space-y-5">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-[12.5px] text-destructive">
              {error}
            </div>
          )}
          {/* Aviso */}
          <div className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary-soft/40 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="text-[12.5px] leading-5 text-foreground">
              <span className="font-semibold">Cierre de proceso.</span> Estos
              motivos se utilizan al finalizar un proceso de seguimiento. Los
              motivos del <span className="font-medium">sistema</span> son
              obligatorios y no pueden eliminarse ni modificarse, solo
              activarse o desactivarse. Los motivos{" "}
              <span className="font-medium">configurables</span> pueden editarse
              y eliminarse mientras no hayan sido utilizados.
            </div>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Total", value: counts.total, key: "todos" as Filtro },
              { label: "Activos", value: counts.activos, key: "activos" as Filtro },
              { label: "Sistema", value: counts.sistema, key: "sistema" as Filtro },
              { label: "Configurables", value: counts.configurables, key: "configurables" as Filtro },
            ].map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setFiltro((prev) => (prev === c.key ? "todos" : c.key))}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-md border bg-surface px-3 py-2.5 text-left transition-colors",
                  filtro === c.key
                    ? "border-primary/60 bg-primary-soft/40"
                    : "border-border hover:border-primary/30",
                )}
              >
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </span>
                <span className="tabular text-[18px] font-semibold leading-none text-foreground">
                  {numberFmt.format(c.value)}
                </span>
              </button>
            ))}
          </div>

          {/* Listado */}
          <section className="overflow-hidden rounded-md border border-border bg-surface shadow-sm">
            <header className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-muted/40 px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 pr-1">
                  <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Motivos de cierre
                  </span>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre o descripción…"
                    className="h-8 w-[260px] pl-8 text-[12.5px]"
                  />
                </div>
                <Select value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
                  <SelectTrigger className="h-8 w-[180px] text-[12.5px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos" className="text-[12.5px]">Todos</SelectItem>
                    <SelectItem value="activos" className="text-[12.5px]">Activos</SelectItem>
                    <SelectItem value="inactivos" className="text-[12.5px]">Inactivos</SelectItem>
                    <SelectItem value="sistema" className="text-[12.5px]">Sistema</SelectItem>
                    <SelectItem value="configurables" className="text-[12.5px]">Configurables</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={openCreate}
                size="sm"
                className="ml-auto h-8 gap-1.5 text-[12.5px]"
              >
                <Plus className="h-3.5 w-3.5" />
                Nuevo motivo
              </Button>
            </header>

            {loading ? (
              <div className="px-4 py-12 text-center text-[13px] text-muted-foreground">Cargando motivos...</div>
            ) : isEmpty ? (
              <div className="px-4 py-16 text-center">
                <ListChecks className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-[13px] font-medium text-foreground">
                  No hay motivos configurados
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Comenzá creando el primer motivo de cierre.
                </p>
                <Button
                  onClick={openCreate}
                  size="sm"
                  className="mt-4 h-8 gap-1.5 text-[12.5px]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Crear primer motivo
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Search className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-[13px] font-medium text-foreground">
                  No se encontraron motivos
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Ajustá los filtros o la búsqueda.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-surface-muted/30 hover:bg-surface-muted/30">
                    <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Nombre
                    </TableHead>
                    <TableHead className="h-9 w-[110px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Tipo
                    </TableHead>
                    <TableHead className="h-9 w-[110px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Estado
                    </TableHead>
                    <TableHead className="h-9 w-[90px] text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Usos
                    </TableHead>
                    <TableHead className="h-9 w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => {
                    const canDelete = !m.isSystem && m.usos === 0;
                    return (
                      <TableRow key={m.id} className="border-border align-top">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium text-foreground">
                              {m.nombre}
                            </span>
                            {m.codigo && (
                              <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
                                {m.codigo}
                              </span>
                            )}
                          </div>
                          {m.descripcion && (
                            <div className="mt-0.5 text-[12px] leading-5 text-muted-foreground">
                              {m.descripcion}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          {m.isSystem ? (
                            <span className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
                              <Lock className="h-3 w-3" />
                              Sistema
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded border border-border bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              Configurable
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="inline-flex items-center gap-2">
                                <Switch
                                  checked={m.activo}
                                  onCheckedChange={() => toggleActivo(m)}
                                  disabled={saving}
                                  aria-label="Activar / desactivar"
                                />
                                <span
                                  className={cn(
                                    "text-[11.5px] font-medium",
                                    m.activo
                                      ? "text-status-active"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {m.activo ? "Activo" : "Inactivo"}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[11.5px]">
                              {m.activo ? "Desactivar motivo" : "Activar motivo"}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <span className="tabular text-[12.5px] text-foreground">
                            {numberFmt.format(m.usos)}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          {m.isSystem ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 cursor-not-allowed opacity-60"
                                  aria-label="Bloqueado"
                                >
                                  <Lock className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-[240px] text-[11.5px]">
                                Este motivo es obligatorio del sistema y no puede modificarse.
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  aria-label="Acciones"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => openEdit(m)}
                                  className="text-[12.5px]"
                                >
                                  <Pencil className="mr-2 h-3.5 w-3.5" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => toggleActivo(m)}
                                  className="text-[12.5px]"
                                >
                                  <Power className="mr-2 h-3.5 w-3.5" />
                                  {m.activo ? "Desactivar" : "Activar"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <DropdownMenuItem
                                        onClick={() => canDelete && setDeleteTarget(m)}
                                        disabled={!canDelete}
                                        className={cn(
                                          "text-[12.5px]",
                                          canDelete && "text-destructive focus:text-destructive",
                                        )}
                                      >
                                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                                        {m.usos > 0 ? "En uso" : "Eliminar"}
                                      </DropdownMenuItem>
                                    </div>
                                  </TooltipTrigger>
                                  {!canDelete && (
                                    <TooltipContent side="left" className="max-w-[240px] text-[11.5px]">
                                      No se puede eliminar porque ya fue utilizado en procesos.
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {!isEmpty && (
              <div className="flex items-center justify-between border-t border-border bg-surface-muted/40 px-4 py-2 text-[11.5px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-status-paused" />
                  Los motivos del sistema y los que tienen registros asociados no se pueden eliminar.
                </span>
                <span>
                  Mostrando{" "}
                  <span className="tabular font-semibold text-foreground">
                    {numberFmt.format(filtered.length)}
                  </span>{" "}
                  de{" "}
                  <span className="tabular font-semibold text-foreground">
                    {numberFmt.format(motivos.length)}
                  </span>
                </span>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Modal alta / edición */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">
              {editing ? "Editar motivo" : "Nuevo motivo de cierre"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              {editing
                ? "Modificá los datos del motivo configurable."
                : "Completá los datos para crear un nuevo motivo de cierre."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nombre" className="text-[12.5px]">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Resolución por convenio especial"
                className="h-9 text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descripcion" className="text-[12.5px]">
                Descripción <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="descripcion"
                value={form.descripcion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descripcion: e.target.value }))
                }
                placeholder="Detalle el alcance o uso de este motivo…"
                rows={3}
                className="text-[13px]"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-surface-muted/40 px-3 py-2">
              <div>
                <div className="text-[12.5px] font-medium text-foreground">
                  Activo
                </div>
                <div className="text-[11.5px] text-muted-foreground">
                  Disponible para seleccionar al cerrar un proceso.
                </div>
              </div>
              <Switch
                checked={form.activo}
                onCheckedChange={(v) => setForm((f) => ({ ...f, activo: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              className="h-8 text-[12.5px]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="h-8 gap-1.5 text-[12.5px]"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {editing ? "Guardar cambios" : "Crear motivo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación eliminación */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px]">
              ¿Estás seguro de eliminar este motivo?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px]">
              {deleteTarget && (
                <>
                  Se eliminará el motivo{" "}
                  <span className="font-medium text-foreground">
                    "{deleteTarget.nombre}"
                  </span>
                  . Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-[12.5px]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-8 bg-destructive text-[12.5px] text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
