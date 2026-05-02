import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  MoreHorizontal,
  Layers,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Info,
  Save,
  RotateCcw,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { etapasIniciales, type EtapaConfig } from "@/data/etapas";
import { configuracionApi } from "@/services/api/configuracionApi";
import { mapEtapa } from "@/adapters/etapas";
import { ApiError } from "@/lib/apiClient";

const numberFmt = new Intl.NumberFormat("es-AR");

interface FormState {
  nombre: string;
  descripcion: string;
  orden: number;
}

export default function ConfiguracionEtapas() {
  const { toast } = useToast();
  const [etapasGuardadas, setEtapasGuardadas] = useState<EtapaConfig[]>([]);
  const [etapas, setEtapas] = useState<EtapaConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EtapaConfig | null>(null);
  const [form, setForm] = useState<FormState>({ nombre: "", descripcion: "", orden: 1 });
  const [deleteTarget, setDeleteTarget] = useState<EtapaConfig | null>(null);

  const ordenModificado = useMemo(() => {
    if (etapas.length !== etapasGuardadas.length) return false;
    return etapas.some((e, i) => e.id !== etapasGuardadas[i]?.id);
  }, [etapas, etapasGuardadas]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchEtapas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await configuracionApi.etapas({ size: 200 });
      const rows = (data?.content ?? data ?? [])
        .sort((a: any, b: any) => Number(a.orden ?? 0) - Number(b.orden ?? 0))
        .map(mapEtapa);
      setEtapas(rows);
      setEtapasGuardadas(rows);
    } catch (e) {
      setError("No se pudieron cargar las etapas.");
      // Fallback temporal local: se usa solo si falla backend.
      if (etapasIniciales.length > 0) {
        setEtapas(etapasIniciales);
        setEtapasGuardadas(etapasIniciales);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEtapas();
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setEtapas((prev) => {
      const oldIndex = prev.findIndex((e) => e.id === active.id);
      const newIndex = prev.findIndex((e) => e.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const moveBy = (id: string, dir: -1 | 1) => {
    setEtapas((prev) => {
      const i = prev.findIndex((e) => e.id === id);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= prev.length) return prev;
      return arrayMove(prev, i, j);
    });
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: "", descripcion: "", orden: etapas.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (e: EtapaConfig) => {
    const orden = etapas.findIndex((x) => x.id === e.id) + 1;
    setEditing(e);
    setForm({
      nombre: e.nombre,
      descripcion: e.descripcion ?? "",
      orden,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const nombre = form.nombre.trim();
    if (!nombre) {
      toast({
        title: "Nombre requerido",
        description: "El nombre de la etapa no puede estar vacío.",
        variant: "destructive",
      });
      return;
    }

    const ordenSeguro = Math.max(1, Math.min(form.orden, (editing ? etapas.length : etapas.length + 1)));

    try {
    if (editing) {
      await configuracionApi.actualizarEtapa(editing.id, { nombre, descripcion: form.descripcion.trim() || null, orden: ordenSeguro });
      setEtapas((prev) => {
        const updated = prev.map((e) =>
          e.id === editing.id
            ? { ...e, nombre, descripcion: form.descripcion.trim() || undefined }
            : e,
        );
        const currentIndex = updated.findIndex((e) => e.id === editing.id);
        const targetIndex = ordenSeguro - 1;
        if (currentIndex !== targetIndex) {
          return arrayMove(updated, currentIndex, targetIndex);
        }
        return updated;
      });
      toast({
        title: "Etapa actualizada",
        description: `Se guardaron los cambios en "${nombre}".`,
      });
    } else {
      await configuracionApi.crearEtapa({ nombre, descripcion: form.descripcion.trim() || null, orden: ordenSeguro });
      const nueva: EtapaConfig = {
        id: `e-${Date.now()}`,
        nombre,
        descripcion: form.descripcion.trim() || undefined,
        procesosAsociados: 0,
      };
      setEtapas((prev) => {
        const next = [...prev];
        next.splice(ordenSeguro - 1, 0, nueva);
        return next;
      });
      toast({
        title: "Etapa creada",
        description: `Se creó la etapa "${nombre}" en la posición ${ordenSeguro}.`,
      });
    }

    setDialogOpen(false);
    setEditing(null);
    await fetchEtapas();
    } catch (e) {
      toast({ title: "Error", description: e instanceof ApiError ? e.message : "No se pudo guardar la etapa.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.procesosAsociados > 0) {
      toast({
        title: "No se puede eliminar la etapa",
        description: `"${deleteTarget.nombre}" tiene ${numberFmt.format(
          deleteTarget.procesosAsociados,
        )} procesos asociados. Movélos a otra etapa antes de eliminarla.`,
        variant: "destructive",
      });
      setDeleteTarget(null);
      return;
    }
    try {
      await configuracionApi.eliminarEtapa(deleteTarget.id);
      setEtapas((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      toast({
        title: "Etapa eliminada",
        description: `Se eliminó "${deleteTarget.nombre}".`,
      });
      setDeleteTarget(null);
      await fetchEtapas();
    } catch (e) {
      toast({
        title: "No se puede eliminar la etapa",
        description: e instanceof ApiError ? e.message : "El backend rechazó la eliminación.",
        variant: "destructive",
      });
      setDeleteTarget(null);
    }
  };

  const guardarOrden = async () => {
    try {
      setSaving(true);
      await configuracionApi.reordenarEtapas({
        etapas: etapas.map((e, index) => ({ id: e.id, orden: index + 1 })),
      });
      await fetchEtapas();
      toast({
        title: "Orden actualizado",
        description: "La nueva secuencia de etapas fue guardada.",
      });
    } catch (e) {
      setEtapas(etapasGuardadas);
      toast({
        title: "Error al reordenar",
        description: e instanceof ApiError ? e.message : "No se pudo guardar el nuevo orden.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const descartarOrden = () => {
    setEtapas(etapasGuardadas);
    toast({
      title: "Cambios descartados",
      description: "Se restauró el orden anterior de las etapas.",
    });
  };

  return (
    <>
      <AppHeader
        title="Etapas del seguimiento"
        description="Definición y orden de las etapas que conforman el proceso de seguimiento de morosidad. El flujo es configurable: las etapas pueden crearse, eliminarse y reordenarse."
        breadcrumb={[{ label: "Configuración", to: "/configuracion" }, { label: "Etapas" }]}
        actions={
          <Button onClick={openCreate} size="sm" className="h-8 gap-1.5 text-[12.5px]">
            <Plus className="h-3.5 w-3.5" />
            Crear etapa
          </Button>
        }
      />

      <main className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-4xl space-y-5">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-[12.5px] text-destructive">
              {error}
            </div>
          )}
          {/* Aviso institucional */}
          <div className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary-soft/40 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="text-[12.5px] leading-5 text-foreground">
              <span className="font-semibold">Flujo configurable.</span> El orden define
              la secuencia que siguen los procesos. Reordenar o eliminar etapas no afecta
              a procesos ya iniciados, pero impacta en los nuevos avances. Arrastrá las
              etapas o usá las flechas para modificar la secuencia.
            </div>
          </div>

          {/* Listado */}
          <section className="overflow-hidden rounded-md border border-border bg-surface shadow-sm">
            <header className="flex items-center justify-between border-b border-border bg-surface-muted/40 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Secuencia de etapas
                </span>
              </div>
              <span className="text-[11.5px] text-muted-foreground">
                <span className="tabular font-semibold text-foreground">
                  {numberFmt.format(etapas.length)}
                </span>{" "}
                etapas configuradas
              </span>
            </header>

            {loading ? (
              <div className="px-4 py-12 text-center text-[13px] text-muted-foreground">Cargando etapas...</div>
            ) : etapas.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Layers className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-[13px] font-medium text-foreground">
                  Aún no hay etapas configuradas
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Creá la primera etapa para comenzar a definir el flujo de seguimiento.
                </p>
                <Button onClick={openCreate} size="sm" className="mt-4 h-8 gap-1.5 text-[12.5px]">
                  <Plus className="h-3.5 w-3.5" />
                  Crear etapa
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={etapas.map((e) => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="divide-y divide-border">
                    {etapas.map((e, idx) => (
                      <EtapaRow
                        key={e.id}
                        etapa={e}
                        orden={idx + 1}
                        total={etapas.length}
                        onEdit={() => openEdit(e)}
                        onDelete={() => setDeleteTarget(e)}
                        onMoveUp={() => moveBy(e.id, -1)}
                        onMoveDown={() => moveBy(e.id, 1)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}

            <div className="flex items-center justify-between border-t border-border bg-surface-muted/40 px-4 py-2 text-[11.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-status-paused" />
                No se pueden eliminar etapas con procesos asociados.
              </span>
              <span className="hidden sm:inline">
                Total de procesos en flujo:{" "}
                <span className="tabular font-semibold text-foreground">
                  {numberFmt.format(
                    etapas.reduce((acc, e) => acc + e.procesosAsociados, 0),
                  )}
                </span>
              </span>
            </div>
          </section>

          {/* Footer sticky para guardar orden */}
          {ordenModificado && (
            <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-md border border-status-paused/40 bg-status-paused-soft px-4 py-2.5 shadow-md">
              <AlertTriangle className="h-4 w-4 text-status-paused" />
              <div className="flex-1 text-[12.5px] text-foreground">
                El orden de las etapas fue modificado.{" "}
                <span className="text-muted-foreground">
                  Confirmá los cambios para aplicarlos al flujo.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={descartarOrden}
                  disabled={saving}
                  className="h-8 gap-1.5 text-[12.5px]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Descartar
                </Button>
                <Button onClick={guardarOrden} size="sm" disabled={saving} className="h-8 gap-1.5 text-[12.5px]">
                  <Save className="h-3.5 w-3.5" />
                  Guardar orden
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal alta / edición */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">
              {editing ? "Editar etapa" : "Nueva etapa"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              {editing
                ? "Modificá los datos de la etapa. El cambio de orden reordenará el flujo."
                : "Definí los datos de la nueva etapa y su posición en el flujo."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="etapa-nombre" className="text-[12.5px]">
                Nombre de la etapa <span className="text-destructive">*</span>
              </Label>
              <Input
                id="etapa-nombre"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej. Notificación final"
                className="h-9 text-[13px]"
                autoFocus
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="etapa-descripcion" className="text-[12.5px]">
                Descripción <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="etapa-descripcion"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Descripción operativa de la etapa."
                className="min-h-[68px] text-[13px]"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="etapa-orden" className="text-[12.5px]">
                Orden en el flujo
              </Label>
              <Select
                value={String(form.orden)}
                onValueChange={(v) => setForm((f) => ({ ...f, orden: Number(v) }))}
              >
                <SelectTrigger id="etapa-orden" className="h-9 w-full text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: editing ? etapas.length : etapas.length + 1 },
                    (_, i) => i + 1,
                  ).map((n) => (
                    <SelectItem key={n} value={String(n)} className="text-[13px]">
                      Posición {n}
                      {n === 1 && " (primera)"}
                      {n === (editing ? etapas.length : etapas.length + 1) && " (última)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11.5px] text-muted-foreground">
                Posición que ocupará en la secuencia del flujo de seguimiento.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="h-9 text-[13px]"
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} className="h-9 text-[13px]">
              {editing ? "Guardar cambios" : "Crear etapa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación eliminar */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px]">
              {deleteTarget && deleteTarget.procesosAsociados > 0
                ? "No se puede eliminar la etapa"
                : "Eliminar etapa"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px]" asChild>
              <div>
                {deleteTarget && deleteTarget.procesosAsociados > 0 ? (
                  <>
                    La etapa{" "}
                    <span className="font-semibold text-foreground">
                      {deleteTarget.nombre}
                    </span>{" "}
                    tiene{" "}
                    <span className="font-semibold text-foreground">
                      {numberFmt.format(deleteTarget.procesosAsociados)} procesos
                    </span>{" "}
                    asociados, por lo que no puede eliminarse.
                    <div className="mt-3 rounded-md border border-status-debt/30 bg-status-debt-soft px-3 py-2 text-[12px] text-foreground">
                      Movélos a otra etapa desde el módulo de Gestión de etapas antes de
                      intentar eliminarla. La edición del nombre sí está permitida.
                    </div>
                  </>
                ) : (
                  <>
                    Vas a eliminar la etapa{" "}
                    <span className="font-semibold text-foreground">
                      {deleteTarget?.nombre}
                    </span>
                    . Esta acción no puede deshacerse.
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-[13px]">
              {deleteTarget && deleteTarget.procesosAsociados > 0 ? "Cerrar" : "Cancelar"}
            </AlertDialogCancel>
            {deleteTarget && deleteTarget.procesosAsociados === 0 && (
              <AlertDialogAction
                onClick={handleDelete}
                className="h-9 bg-destructive text-[13px] text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* -------------------- Fila ordenable -------------------- */

function EtapaRow({
  etapa,
  orden,
  total,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  etapa: EtapaConfig;
  orden: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: etapa.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 5 : "auto",
  };

  const tieneProcesos = etapa.procesosAsociados > 0;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 bg-surface px-3 py-2.5 transition-colors",
        isDragging && "border-y border-primary/30 bg-primary-soft/30 shadow-md",
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reordenar ${etapa.nombre}`}
        className="flex h-8 w-7 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-surface-muted hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Posición */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-muted/60 text-[12.5px] font-semibold tabular text-foreground">
        {orden}
      </div>

      {/* Datos */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13.5px] font-medium text-foreground">
            {etapa.nombre}
          </span>
          {tieneProcesos && (
            <span className="inline-flex items-center gap-1 rounded-full border border-status-active/30 bg-status-active-soft px-2 py-0.5 text-[10.5px] font-medium text-status-active">
              {numberFmt.format(etapa.procesosAsociados)} en curso
            </span>
          )}
        </div>
        {etapa.descripcion && (
          <p className="mt-0.5 line-clamp-1 text-[12px] text-muted-foreground">
            {etapa.descripcion}
          </p>
        )}
      </div>

      {/* Flechas accesibles */}
      <div className="hidden items-center gap-0.5 sm:flex">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMoveUp}
          disabled={orden === 1}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label="Mover arriba"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onMoveDown}
          disabled={orden === total}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label="Mover abajo"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Acciones */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Opciones"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={onEdit} className="text-[13px]">
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            disabled={tieneProcesos}
            className={cn(
              "text-[13px]",
              tieneProcesos
                ? "text-muted-foreground"
                : "text-destructive focus:text-destructive",
            )}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Eliminar
            {tieneProcesos && (
              <span className="ml-auto text-[10.5px] uppercase tracking-wider">
                Bloqueado
              </span>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
