import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Tag,
  Search,
  Info,
  AlertTriangle,
  Layers,
} from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { etapasIniciales } from "@/data/etapas";
import { motivosIniciales, type MotivoConfig } from "@/data/motivos";
import { Link } from "react-router-dom";

const numberFmt = new Intl.NumberFormat("es-AR");

interface FormState {
  nombre: string;
  etapaId: string;
  descripcion: string;
}

export default function ConfiguracionMotivos() {
  const { toast } = useToast();
  const etapas = etapasIniciales;
  const etapaMap = useMemo(
    () => Object.fromEntries(etapas.map((e) => [e.id, e])),
    [etapas],
  );
  const etapaOrden = useMemo(
    () => Object.fromEntries(etapas.map((e, i) => [e.id, i])),
    [etapas],
  );

  const [motivos, setMotivos] = useState<MotivoConfig[]>(motivosIniciales);
  const [search, setSearch] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState<string>("todas");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MotivoConfig | null>(null);
  const [form, setForm] = useState<FormState>({
    nombre: "",
    etapaId: etapas[0]?.id ?? "",
    descripcion: "",
  });
  const [deleteTarget, setDeleteTarget] = useState<MotivoConfig | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return motivos
      .filter((m) => {
        if (filtroEtapa !== "todas" && m.etapaId !== filtroEtapa) return false;
        if (!q) return true;
        return (
          m.nombre.toLowerCase().includes(q) ||
          (m.descripcion ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const oa = etapaOrden[a.etapaId] ?? 999;
        const ob = etapaOrden[b.etapaId] ?? 999;
        if (oa !== ob) return oa - ob;
        return a.nombre.localeCompare(b.nombre);
      });
  }, [motivos, search, filtroEtapa, etapaOrden]);

  const totalPorEtapa = useMemo(() => {
    const acc: Record<string, number> = {};
    etapas.forEach((e) => {
      acc[e.id] = 0;
    });
    motivos.forEach((m) => {
      acc[m.etapaId] = (acc[m.etapaId] ?? 0) + 1;
    });
    return acc;
  }, [motivos, etapas]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      nombre: "",
      etapaId:
        filtroEtapa !== "todas" ? filtroEtapa : etapas[0]?.id ?? "",
      descripcion: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (m: MotivoConfig) => {
    setEditing(m);
    setForm({
      nombre: m.nombre,
      etapaId: m.etapaId,
      descripcion: m.descripcion ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const nombre = form.nombre.trim();
    if (!nombre) {
      toast({
        title: "Nombre requerido",
        description: "El nombre del motivo no puede estar vacío.",
        variant: "destructive",
      });
      return;
    }
    if (!form.etapaId) {
      toast({
        title: "Etapa requerida",
        description: "Seleccioná la etapa a la que se asocia el motivo.",
        variant: "destructive",
      });
      return;
    }

    const duplicado = motivos.some(
      (m) =>
        m.id !== editing?.id &&
        m.etapaId === form.etapaId &&
        m.nombre.trim().toLowerCase() === nombre.toLowerCase(),
    );
    if (duplicado) {
      toast({
        title: "Motivo duplicado",
        description: `Ya existe un motivo "${nombre}" en la etapa seleccionada.`,
        variant: "destructive",
      });
      return;
    }

    if (editing) {
      setMotivos((prev) =>
        prev.map((m) =>
          m.id === editing.id
            ? {
                ...m,
                nombre,
                etapaId: form.etapaId,
                descripcion: form.descripcion.trim() || undefined,
              }
            : m,
        ),
      );
      toast({
        title: "Motivo actualizado",
        description: `Se guardaron los cambios en "${nombre}".`,
      });
    } else {
      const nuevo: MotivoConfig = {
        id: `m-${Date.now()}`,
        nombre,
        etapaId: form.etapaId,
        descripcion: form.descripcion.trim() || undefined,
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
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.usos > 0) {
      toast({
        title: "No se puede eliminar el motivo",
        description: `"${deleteTarget.nombre}" fue utilizado en ${numberFmt.format(
          deleteTarget.usos,
        )} registros. Solo es posible editarlo.`,
        variant: "destructive",
      });
      setDeleteTarget(null);
      return;
    }
    setMotivos((prev) => prev.filter((m) => m.id !== deleteTarget.id));
    toast({
      title: "Motivo eliminado",
      description: `Se eliminó "${deleteTarget.nombre}".`,
    });
    setDeleteTarget(null);
  };

  return (
    <>
      <AppHeader
        title="Motivos del proceso"
        description="Catálogo único de motivos utilizados en el seguimiento de morosidad. Cada motivo se asocia a una etapa específica del flujo."
        breadcrumb={[
          { label: "Configuración", to: "/configuracion" },
          { label: "Motivos" },
        ]}
        actions={
          <Button
            onClick={openCreate}
            size="sm"
            className="h-8 gap-1.5 text-[12.5px]"
          >
            <Plus className="h-3.5 w-3.5" />
            Crear motivo
          </Button>
        }
      />

      <main className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-6xl space-y-5">
          {/* Aviso institucional */}
          <div className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary-soft/40 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="text-[12.5px] leading-5 text-foreground">
              <span className="font-semibold">Catálogo único.</span> Los motivos
              se administran de forma centralizada y se asocian a una etapa del
              flujo de seguimiento. Las etapas disponibles dependen de la{" "}
              <Link
                to="/configuracion/etapas"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                configuración de etapas
              </Link>
              . Eliminar un motivo en uso no está permitido; en ese caso solo
              puede editarse su nombre o descripción.
            </div>
          </div>

          {/* Resumen por etapa */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {etapas.map((e, i) => (
              <button
                key={e.id}
                type="button"
                onClick={() =>
                  setFiltroEtapa((prev) => (prev === e.id ? "todas" : e.id))
                }
                className={cn(
                  "flex flex-col items-start gap-1 rounded-md border bg-surface px-3 py-2.5 text-left transition-colors",
                  filtroEtapa === e.id
                    ? "border-primary/60 bg-primary-soft/40"
                    : "border-border hover:border-primary/30",
                )}
                title={e.descripcion}
              >
                <span className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span className="tabular text-muted-foreground/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate">{e.nombre}</span>
                </span>
                <span className="tabular text-[18px] font-semibold leading-none text-foreground">
                  {numberFmt.format(totalPorEtapa[e.id] ?? 0)}
                </span>
              </button>
            ))}
          </div>

          {/* Listado */}
          <section className="overflow-hidden rounded-md border border-border bg-surface shadow-sm">
            <header className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-muted/40 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Listado de motivos
                </span>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar motivo…"
                    className="h-8 w-[220px] pl-8 text-[12.5px]"
                  />
                </div>
                <Select
                  value={filtroEtapa}
                  onValueChange={(v) => setFiltroEtapa(v)}
                >
                  <SelectTrigger className="h-8 w-[220px] text-[12.5px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas" className="text-[12.5px]">
                      Todas las etapas
                    </SelectItem>
                    {etapas.map((e) => (
                      <SelectItem
                        key={e.id}
                        value={e.id}
                        className="text-[12.5px]"
                      >
                        {e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </header>

            {filtered.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Tag className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-[13px] font-medium text-foreground">
                  No se encontraron motivos
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Ajustá los filtros o creá un nuevo motivo.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-surface-muted/30 hover:bg-surface-muted/30">
                    <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Motivo
                    </TableHead>
                    <TableHead className="h-9 w-[240px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Etapa
                    </TableHead>
                    <TableHead className="h-9 w-[110px] text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Usos
                    </TableHead>
                    <TableHead className="h-9 w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => {
                    const etapa = etapaMap[m.etapaId];
                    const orden = (etapaOrden[m.etapaId] ?? 0) + 1;
                    return (
                      <TableRow key={m.id} className="border-border align-top">
                        <TableCell className="py-3">
                          <div className="text-[13px] font-medium text-foreground">
                            {m.nombre}
                          </div>
                          {m.descripcion && (
                            <div className="mt-0.5 text-[12px] leading-5 text-muted-foreground">
                              {m.descripcion}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          {etapa ? (
                            <span className="inline-flex items-center gap-1.5 rounded border border-border bg-surface-muted px-2 py-0.5 text-[11.5px] text-foreground">
                              <Layers className="h-3 w-3 text-muted-foreground" />
                              <span className="tabular text-muted-foreground">
                                {String(orden).padStart(2, "0")}
                              </span>
                              <span className="font-medium">{etapa.nombre}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded border border-status-paused/30 bg-status-paused-soft px-2 py-0.5 text-[11.5px] text-status-paused">
                              <AlertTriangle className="h-3 w-3" />
                              Etapa inexistente
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <span className="tabular text-[12.5px] text-foreground">
                            {numberFmt.format(m.usos)}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-right">
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
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={() => openEdit(m)}
                                className="text-[12.5px]"
                              >
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget(m)}
                                disabled={m.usos > 0}
                                className={cn(
                                  "text-[12.5px]",
                                  m.usos === 0 &&
                                    "text-destructive focus:text-destructive",
                                )}
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                {m.usos > 0 ? "En uso" : "Eliminar"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            <div className="flex items-center justify-between border-t border-border bg-surface-muted/40 px-4 py-2 text-[11.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-status-paused" />
                No se pueden eliminar motivos con registros asociados.
              </span>
              <span>
                Mostrando{" "}
                <span className="tabular font-semibold text-foreground">
                  {numberFmt.format(filtered.length)}
                </span>{" "}
                de{" "}
                <span className="tabular font-semibold text-foreground">
                  {numberFmt.format(motivos.length)}
                </span>{" "}
                motivos
              </span>
            </div>
          </section>
        </div>
      </main>

      {/* Modal alta / edición */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">
              {editing ? "Editar motivo" : "Nuevo motivo"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              {editing
                ? "Modificá los datos del motivo. La etapa puede actualizarse para reasignarlo."
                : "Definí el nombre, la etapa asociada y una descripción opcional."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="motivo-nombre" className="text-[12.5px]">
                Nombre del motivo{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="motivo-nombre"
                value={form.nombre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nombre: e.target.value }))
                }
                placeholder="Ej. Domicilio incorrecto"
                className="h-9 text-[13px]"
                autoFocus
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="motivo-etapa" className="text-[12.5px]">
                Etapa asociada{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.etapaId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, etapaId: v }))
                }
              >
                <SelectTrigger
                  id="motivo-etapa"
                  className="h-9 w-full text-[13px]"
                >
                  <SelectValue placeholder="Seleccionar etapa" />
                </SelectTrigger>
                <SelectContent>
                  {etapas.map((e, i) => (
                    <SelectItem
                      key={e.id}
                      value={e.id}
                      className="text-[13px]"
                    >
                      <span className="tabular text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>{" "}
                      · {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {etapaMap[form.etapaId]?.descripcion && (
                <p className="text-[11.5px] text-muted-foreground">
                  {etapaMap[form.etapaId].descripcion}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="motivo-descripcion" className="text-[12.5px]">
                Descripción{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="motivo-descripcion"
                value={form.descripcion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descripcion: e.target.value }))
                }
                placeholder="Aclaración interna sobre cuándo aplicar este motivo."
                className="min-h-[72px] text-[13px]"
              />
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
              {editing ? "Guardar cambios" : "Crear motivo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación eliminar */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px]">
              {deleteTarget && deleteTarget.usos > 0
                ? "No se puede eliminar el motivo"
                : "Eliminar motivo"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px]" asChild>
              <div>
                {deleteTarget && deleteTarget.usos > 0 ? (
                  <>
                    El motivo{" "}
                    <span className="font-semibold text-foreground">
                      {deleteTarget.nombre}
                    </span>{" "}
                    fue utilizado en{" "}
                    <span className="font-semibold text-foreground">
                      {numberFmt.format(deleteTarget.usos)} registros
                    </span>
                    , por lo que no puede eliminarse.
                    <div className="mt-3 rounded-md border border-status-debt/30 bg-status-debt-soft px-3 py-2 text-[12px] text-foreground">
                      Para conservar la trazabilidad histórica, los motivos en
                      uso solo pueden editarse. Si no querés que siga
                      apareciendo, considerá renombrarlo o crear uno nuevo.
                    </div>
                  </>
                ) : (
                  <>
                    Vas a eliminar el motivo{" "}
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
              {deleteTarget && deleteTarget.usos > 0 ? "Cerrar" : "Cancelar"}
            </AlertDialogCancel>
            {deleteTarget && deleteTarget.usos === 0 && (
              <AlertDialogAction
                onClick={handleDelete}
                className="h-9 bg-destructive text-[13px] text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar motivo
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
