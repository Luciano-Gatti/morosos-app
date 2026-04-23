import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  Users2,
  CheckCircle2,
  MinusCircle,
  AlertTriangle,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { gruposIniciales, type Grupo } from "@/data/grupos";

const numberFmt = new Intl.NumberFormat("es-AR");

interface FormState {
  nombre: string;
  descripcion: string;
  seguimientoHabilitado: boolean;
}

const emptyForm: FormState = {
  nombre: "",
  descripcion: "",
  seguimientoHabilitado: true,
};

export default function ConfiguracionGrupos() {
  const { toast } = useToast();
  const [grupos, setGrupos] = useState<Grupo[]>(gruposIniciales);
  const [query, setQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Grupo | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Grupo | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return grupos;
    return grupos.filter(
      (g) =>
        g.nombre.toLowerCase().includes(q) ||
        (g.descripcion?.toLowerCase().includes(q) ?? false),
    );
  }, [grupos, query]);

  const totalHabilitados = grupos.filter((g) => g.seguimientoHabilitado).length;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (g: Grupo) => {
    setEditing(g);
    setForm({
      nombre: g.nombre,
      descripcion: g.descripcion ?? "",
      seguimientoHabilitado: g.seguimientoHabilitado,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const nombre = form.nombre.trim();
    if (!nombre) {
      toast({
        title: "Nombre requerido",
        description: "El nombre del grupo no puede estar vacío.",
        variant: "destructive",
      });
      return;
    }

    const today = new Date();
    const fecha = `${String(today.getDate()).padStart(2, "0")}/${String(
      today.getMonth() + 1,
    ).padStart(2, "0")}/${today.getFullYear()}`;

    if (editing) {
      setGrupos((prev) =>
        prev.map((g) =>
          g.id === editing.id
            ? {
                ...g,
                nombre,
                descripcion: form.descripcion.trim() || undefined,
                seguimientoHabilitado: form.seguimientoHabilitado,
                actualizado: fecha,
              }
            : g,
        ),
      );
      toast({
        title: "Grupo actualizado",
        description: `Se guardaron los cambios en "${nombre}".`,
      });
    } else {
      const nuevo: Grupo = {
        id: `g-${Date.now()}`,
        nombre,
        descripcion: form.descripcion.trim() || undefined,
        seguimientoHabilitado: form.seguimientoHabilitado,
        inmuebles: 0,
        actualizado: fecha,
      };
      setGrupos((prev) => [nuevo, ...prev]);
      toast({
        title: "Grupo creado",
        description: `Se creó el grupo "${nombre}".`,
      });
    }

    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.inmuebles > 0) {
      toast({
        title: "No se puede eliminar el grupo",
        description: `"${deleteTarget.nombre}" tiene ${numberFmt.format(
          deleteTarget.inmuebles,
        )} inmuebles asignados. Reasigná los inmuebles antes de eliminarlo.`,
        variant: "destructive",
      });
      setDeleteTarget(null);
      return;
    }
    setGrupos((prev) => prev.filter((g) => g.id !== deleteTarget.id));
    toast({
      title: "Grupo eliminado",
      description: `Se eliminó "${deleteTarget.nombre}".`,
    });
    setDeleteTarget(null);
  };

  return (
    <>
      <AppHeader
        title="Grupos"
        description="Catálogo de grupos para clasificar inmuebles. Define qué grupos participan del proceso de seguimiento de morosidad."
        breadcrumb={[{ label: "Configuración", to: "/configuracion" }, { label: "Grupos" }]}
      />

      <main className="flex-1 px-6 py-6">
        <div className="rounded-md border border-border bg-surface shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
            <div className="relative min-w-[220px] flex-1 sm:max-w-[320px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar grupo..."
                className="h-8 pl-8 text-[12.5px]"
              />
            </div>

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-3 text-[12px] text-muted-foreground sm:flex">
                <span>
                  Total:{" "}
                  <span className="tabular font-semibold text-foreground">
                    {numberFmt.format(grupos.length)}
                  </span>
                </span>
                <span className="h-4 w-px bg-border" />
                <span>
                  Con seguimiento:{" "}
                  <span className="tabular font-semibold text-foreground">
                    {numberFmt.format(totalHabilitados)}
                  </span>
                </span>
              </div>
              <Button onClick={openCreate} size="sm" className="h-8 gap-1.5 text-[12.5px]">
                <Plus className="h-3.5 w-3.5" />
                Crear grupo
              </Button>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-surface-muted/60 hover:bg-surface-muted/60">
                  <TableHead className="h-9 pl-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Nombre del grupo
                  </TableHead>
                  <TableHead className="h-9 w-[200px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Seguimiento
                  </TableHead>
                  <TableHead className="h-9 w-[130px] text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Inmuebles
                  </TableHead>
                  <TableHead className="h-9 w-[140px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Última actualización
                  </TableHead>
                  <TableHead className="h-9 w-[80px] pr-4 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Opciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-[13px] text-muted-foreground">
                      No se encontraron grupos con los criterios actuales.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((g) => (
                    <TableRow key={g.id} className="border-border">
                      <TableCell className="py-2.5 pl-4">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface-muted/60">
                            <Users2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium leading-5 text-foreground">
                              {g.nombre}
                            </div>
                            {g.descripcion && (
                              <div className="mt-0.5 line-clamp-1 text-[12px] leading-4 text-muted-foreground">
                                {g.descripcion}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <SeguimientoBadge habilitado={g.seguimientoHabilitado} />
                      </TableCell>
                      <TableCell className="py-2.5 text-right text-[13px] tabular text-foreground">
                        {numberFmt.format(g.inmuebles)}
                      </TableCell>
                      <TableCell className="py-2.5 text-[12.5px] text-muted-foreground">
                        {g.actualizado}
                      </TableCell>
                      <TableCell className="py-2.5 pr-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => openEdit(g)} className="text-[13px]">
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(g)}
                              disabled={g.inmuebles > 0}
                              className={cn(
                                "text-[13px]",
                                g.inmuebles > 0
                                  ? "text-muted-foreground"
                                  : "text-destructive focus:text-destructive",
                              )}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Eliminar
                              {g.inmuebles > 0 && (
                                <span className="ml-auto text-[10.5px] uppercase tracking-wider">
                                  Bloqueado
                                </span>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-between border-t border-border bg-surface-muted/40 px-3 py-2 text-[11.5px] text-muted-foreground">
            <span>
              Mostrando{" "}
              <span className="tabular font-semibold text-foreground">
                {numberFmt.format(filtered.length)}
              </span>{" "}
              de {numberFmt.format(grupos.length)} grupos
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              Eliminar un grupo no afecta a los inmuebles ya asignados.
            </span>
          </div>
        </div>
      </main>

      {/* Modal Alta / Edición */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">
              {editing ? "Editar grupo" : "Nuevo grupo"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              {editing
                ? "Modificá la información del grupo. Los cambios se aplican inmediatamente."
                : "Completá los datos del nuevo grupo de inmuebles."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="grupo-nombre" className="text-[12.5px]">
                Nombre del grupo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="grupo-nombre"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej. Residencial C"
                className="h-9 text-[13px]"
                autoFocus
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="grupo-descripcion" className="text-[12.5px]">
                Descripción <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="grupo-descripcion"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Breve descripción del grupo o de los inmuebles que incluye."
                className="min-h-[72px] text-[13px]"
              />
            </div>

            <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface-muted/40 px-3 py-2.5">
              <div className="min-w-0">
                <Label
                  htmlFor="grupo-seguimiento"
                  className="text-[13px] font-medium text-foreground"
                >
                  Seguimiento de morosidad
                </Label>
                <p className="mt-0.5 text-[12px] leading-4 text-muted-foreground">
                  Si está habilitado, los inmuebles de este grupo participan del proceso
                  de seguimiento (avisos, intimaciones y cortes).
                </p>
              </div>
              <Switch
                id="grupo-seguimiento"
                checked={form.seguimientoHabilitado}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, seguimientoHabilitado: v }))
                }
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
              {editing ? "Guardar cambios" : "Crear grupo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminación */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px]">
              {deleteTarget && deleteTarget.inmuebles > 0
                ? "No se puede eliminar el grupo"
                : "Eliminar grupo"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px]" asChild>
              <div>
                {deleteTarget && deleteTarget.inmuebles > 0 ? (
                  <>
                    El grupo{" "}
                    <span className="font-semibold text-foreground">
                      {deleteTarget.nombre}
                    </span>{" "}
                    tiene{" "}
                    <span className="font-semibold text-foreground">
                      {numberFmt.format(deleteTarget.inmuebles)} inmuebles
                    </span>{" "}
                    asignados, por lo que no puede eliminarse.
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                      Reasigná los inmuebles a otro grupo desde el módulo de Inmuebles
                      antes de intentar eliminarlo. La edición del grupo sí está
                      permitida.
                    </div>
                  </>
                ) : (
                  <>
                    Vas a eliminar el grupo{" "}
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
              {deleteTarget && deleteTarget.inmuebles > 0 ? "Cerrar" : "Cancelar"}
            </AlertDialogCancel>
            {deleteTarget && deleteTarget.inmuebles === 0 && (
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

function SeguimientoBadge({ habilitado }: { habilitado: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium",
        habilitado
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-border bg-surface-muted/60 text-muted-foreground",
      )}
    >
      {habilitado ? (
        <>
          <CheckCircle2 className="h-3 w-3" />
          Habilitado
        </>
      ) : (
        <>
          <MinusCircle className="h-3 w-3" />
          Deshabilitado
        </>
      )}
    </span>
  );
}
