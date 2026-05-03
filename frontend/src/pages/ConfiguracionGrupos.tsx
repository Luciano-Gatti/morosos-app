import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  Users2,
  AlertTriangle,
  MapPin,
  X as XIcon,
  CheckCircle2,
  MinusCircle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { configuracionApi } from "@/services/api/configuracionApi";
import { ApiError, USE_API } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import {
  gruposIniciales,
  resumenSeguimiento,
  totalInmueblesGrupo,
  type Grupo,
  type GrupoDistrito,
} from "@/data/grupos";
import { distritosInmueble } from "@/data/inmuebles";

const numberFmt = new Intl.NumberFormat("es-AR");

interface FormState {
  nombre: string;
  descripcion: string;
}

const emptyForm: FormState = { nombre: "", descripcion: "" };

function hoy() {
  const t = new Date();
  return `${String(t.getDate()).padStart(2, "0")}/${String(
    t.getMonth() + 1,
  ).padStart(2, "0")}/${t.getFullYear()}`;
}

export default function ConfiguracionGrupos() {
  const { toast } = useToast();
  const [grupos, setGrupos] = useState<Grupo[]>(() => (USE_API ? [] : gruposIniciales));
  const [distritosCatalogo, setDistritosCatalogo] = useState<string[]>(() =>
    USE_API ? [] : distritosInmueble,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const [query, setQuery] = useState("");
  const [distritosRaw, setDistritosRaw] = useState<any[]>([]);
  const [distritoDialogOpen, setDistritoDialogOpen] = useState(false);
  const [editingDistrito, setEditingDistrito] = useState<any | null>(null);
  const [distritoForm, setDistritoForm] = useState({ nombre: "" });

  // Alta / edición de datos básicos del grupo
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Grupo | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  // Configurar distritos del grupo
  const [distritosTarget, setDistritosTarget] = useState<Grupo | null>(null);
  const [distritosDraft, setDistritosDraft] = useState<GrupoDistrito[]>([]);
  const [distritoNuevo, setDistritoNuevo] = useState<string>("");

  // Eliminar
  const [deleteTarget, setDeleteTarget] = useState<Grupo | null>(null);

  

  const toArray = (data: any) => (Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : []);
  const normalize = (rawGrupos: any[], rawDistritos: any[], rawCfg: any[]): Grupo[] => {
    const gruposById = new Map(rawGrupos.map((g: any) => [String(g.id), g]));
    const distritosById = new Map(rawDistritos.map((d: any) => [String(d.id), d]));
    const cfgByGrupo = new Map<string, any[]>();
    rawCfg.forEach((c: any) => {
      const gid = String(c.grupoId ?? c.grupo?.id ?? c.grupo_id ?? '');
      if (!gid) return;
      const arr = cfgByGrupo.get(gid) ?? [];
      arr.push(c);
      cfgByGrupo.set(gid, arr);
    });
    return rawGrupos.map((g: any) => {
      const gid = String(g.id ?? '');
      const distritos = (cfgByGrupo.get(gid) ?? []).map((c: any) => {
        const did = String(c.distritoId ?? c.distrito?.id ?? c.distrito_id ?? '');
        const d = distritosById.get(did) ?? c.distrito ?? {};
        return {
          distrito: String(d.nombre ?? d.distrito ?? c.distritoNombre ?? c.distrito_codigo ?? did || '-'),
          seguimientoHabilitado: Boolean(c.seguimientoHabilitado ?? c.seguimiento_habilitado ?? false),
          inmuebles: Number(c.inmuebles ?? 0),
          configId: String(c.id ?? ''),
          distritoId: did,
        } as any;
      });
      return {
        id: gid,
        nombre: String(g.nombre ?? g.grupo ?? ''),
        descripcion: g.descripcion ?? undefined,
        distritos,
        actualizado: new Date(g.updatedAt ?? g.actualizado ?? Date.now()).toLocaleDateString('es-AR'),
        activo: Boolean(g.activo ?? true),
      } as Grupo;
    });
  };

  const loadData = async () => {
    if (!USE_API) return;
    try {
      setLoading(true);
      setError(null);
      const [gs, ds, cfg] = await Promise.all([
        configuracionApi.grupos({ size: 500 }),
        configuracionApi.distritos({ size: 500 }),
        configuracionApi.grupoDistritoConfig({ size: 2000 }),
      ]);
      const gruposNorm = normalize(toArray(gs), toArray(ds), toArray(cfg));
      setGrupos(gruposNorm);
      const dsArr = toArray(ds);
      setDistritosRaw(dsArr);
      setDistritosCatalogo(dsArr.map((d: any) => String(d.nombre ?? d.distrito ?? d.codigo ?? d.id)).filter(Boolean));
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);
const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return grupos;
    return grupos.filter(
      (g) =>
        g.nombre.toLowerCase().includes(q) ||
        (g.descripcion?.toLowerCase().includes(q) ?? false),
    );
  }, [grupos, query]);

  const totalConSeguimiento = grupos.filter((g) => {
    if (!USE_API) return resumenSeguimiento(g).activos > 0;
    return g.distritos.some((d) => Boolean(d.seguimientoHabilitado));
  }).length;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (g: Grupo) => {
    setEditing(g);
    setForm({ nombre: g.nombre, descripcion: g.descripcion ?? "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const nombre = form.nombre.trim();
    if (!nombre) {
      toast({
        title: "Nombre requerido",
        description: "El nombre del grupo no puede estar vacío.",
        variant: "destructive",
      });
      return;
    }

    try {
      setMutating(true);
      if (USE_API) {
        if (editing) await configuracionApi.actualizarGrupo(editing.id, { nombre, descripcion: form.descripcion.trim() || null });
        else await configuracionApi.crearGrupo({ nombre, descripcion: form.descripcion.trim() || null });
        await loadData();
      } else {
        if (editing) {
          setGrupos((prev) => prev.map((g) => g.id === editing.id ? { ...g, nombre, descripcion: form.descripcion.trim() || undefined, actualizado: hoy() } : g));
        } else {
          const nuevo: Grupo = { id: `g-${Date.now()}`, nombre, descripcion: form.descripcion.trim() || undefined, distritos: [], actualizado: hoy() };
          setGrupos((prev) => [nuevo, ...prev]);
        }
      }
      toast({ title: editing ? 'Grupo actualizado' : 'Grupo creado', description: editing ? `Se guardaron los cambios en "${nombre}".` : `"${nombre}" fue creado.` });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof ApiError ? e.message : 'No se pudo guardar el grupo.', variant: 'destructive' });
      return;
    } finally {
      setMutating(false);
    }

    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const openDistritos = (g: Grupo) => {
    setDistritosTarget(g);
    setDistritosDraft(g.distritos.map((d) => ({ ...d })));
    setDistritoNuevo("");
  };

  const closeDistritos = () => {
    setDistritosTarget(null);
    setDistritosDraft([]);
    setDistritoNuevo("");
  };

  const distritosDisponibles = useMemo(() => {
    if (!distritosTarget) return [];
    const yaAsociados = new Set(distritosDraft.map((d) => d.distrito));
    return distritosCatalogo.filter((d) => !yaAsociados.has(d));
  }, [distritosTarget, distritosDraft]);

  const handleAgregarDistrito = () => {
    if (USE_API) {
      toast({
        title: "Operación no disponible",
        description:
          "La creación o eliminación de relaciones grupo-distrito no está disponible desde esta pantalla.",
        variant: "destructive",
      });
      return;
    }
    if (!distritoNuevo) return;
    setDistritosDraft((prev) => [
      ...prev,
      { distrito: distritoNuevo, seguimientoHabilitado: true, inmuebles: 0 },
    ]);
    setDistritoNuevo("");
  };

  const handleQuitarDistrito = (distrito: string) => {
    if (USE_API) {
      toast({
        title: "Operación no disponible",
        description:
          "La creación o eliminación de relaciones grupo-distrito no está disponible desde esta pantalla.",
        variant: "destructive",
      });
      return;
    }
    const item = distritosDraft.find((d) => d.distrito === distrito);
    if (item && item.inmuebles > 0) {
      toast({
        title: "No se puede quitar el distrito",
        description: `Este distrito tiene ${numberFmt.format(
          item.inmuebles,
        )} inmuebles asociados. Reasigná los inmuebles antes de quitarlo.`,
        variant: "destructive",
      });
      return;
    }
    setDistritosDraft((prev) => prev.filter((d) => d.distrito !== distrito));
  };

  const handleToggleSeguimiento = (distrito: string, value: boolean) => {
    setDistritosDraft((prev) =>
      prev.map((d) =>
        d.distrito === distrito ? { ...d, seguimientoHabilitado: value } : d,
      ),
    );
  };

  const handleSaveDistritos = async () => {
    if (!distritosTarget) return;
    try {
      setMutating(true);
      if (USE_API) {
        const hasUnsupported = (distritosDraft as any[]).some((d) => !d.configId);
        if (hasUnsupported) {
          toast({ title: 'Operación no soportada', description: 'El backend actual no expone alta/baja de relación grupo+distrito desde esta vista.', variant: 'destructive' });
          return;
        }
        for (const d of distritosDraft as any[]) {
          await configuracionApi.actualizarGrupoDistritoConfig(d.configId, { seguimientoHabilitado: d.seguimientoHabilitado });
        }
        await loadData();
      } else {
        setGrupos((prev) => prev.map((g) => g.id === distritosTarget.id ? { ...g, distritos: distritosDraft, actualizado: hoy() } : g));
      }
      toast({ title: 'Distritos actualizados', description: `Se actualizó la configuración de "${distritosTarget.nombre}".` });
      closeDistritos();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof ApiError ? e.message : 'No se pudo actualizar la configuración.', variant: 'destructive' });
    } finally {
      setMutating(false);
    }
  };


  const handleToggleGrupoActivo = async (g: Grupo) => {
    try {
      setMutating(true);
      if (USE_API) {
        await configuracionApi.toggleGrupoActivo(g.id, !g.activo);
        await loadData();
      } else {
        setGrupos((prev) => prev.map((x) => x.id === g.id ? { ...x, activo: !x.activo, actualizado: hoy() } : x));
      }
      toast({ title: !g.activo ? "Grupo activado" : "Grupo inactivado", description: `Se actualizó el estado de "${g.nombre}".` });
    } catch (e) {
      toast({ title: "Error", description: e instanceof ApiError ? e.message : "No se pudo actualizar el estado del grupo.", variant: "destructive" });
    } finally {
      setMutating(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const totalInm = USE_API
      ? deleteTarget.distritos.reduce((acc, d) => acc + Number(d.inmuebles ?? 0), 0)
      : totalInmueblesGrupo(deleteTarget);
    if (!USE_API && totalInm > 0) {
      toast({
        title: "No se puede eliminar el grupo",
        description: `"${deleteTarget.nombre}" tiene ${numberFmt.format(
          totalInm,
        )} inmuebles asignados.`,
        variant: "destructive",
      });
      setDeleteTarget(null);
      return;
    }
    try {
      setMutating(true);
      if (USE_API) {
        await configuracionApi.eliminarGrupo(deleteTarget.id);
        await loadData();
      } else {
        setGrupos((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      }
      toast({ title: 'Grupo eliminado', description: `Se eliminó "${deleteTarget.nombre}".` });
      setDeleteTarget(null);
    } catch (e) {
      toast({ title: 'No se puede eliminar', description: e instanceof ApiError ? e.message : 'El backend rechazó la eliminación.', variant: 'destructive' });
    } finally {
      setMutating(false);
    }
  };


  const openCreateDistrito = () => {
    setEditingDistrito(null);
    setDistritoForm({ nombre: "" });
    setDistritoDialogOpen(true);
  };

  const openEditDistrito = (d: any) => {
    setEditingDistrito(d);
    setDistritoForm({ nombre: String(d.nombre ?? d.distrito ?? "") });
    setDistritoDialogOpen(true);
  };

  const handleSaveDistrito = async () => {
    const nombre = distritoForm.nombre.trim();
    if (!nombre) {
      toast({ title: "Nombre requerido", description: "El nombre del distrito no puede estar vacío.", variant: "destructive" });
      return;
    }
    try {
      setMutating(true);
      if (USE_API) {
        if (editingDistrito) await configuracionApi.actualizarDistrito(String(editingDistrito.id), { nombre });
        else await configuracionApi.crearDistrito({ nombre });
        await loadData();
      } else {
        const next = editingDistrito
          ? distritosRaw.map((d) => String(d.id) === String(editingDistrito.id) ? { ...d, nombre } : d)
          : [{ id: `d-${Date.now()}`, nombre, activo: true }, ...distritosRaw];
        setDistritosRaw(next);
        setDistritosCatalogo(next.map((d: any) => String(d.nombre ?? d.distrito ?? d.codigo ?? d.id)).filter(Boolean));
      }
      toast({ title: editingDistrito ? "Distrito actualizado" : "Distrito creado", description: `Se guardó "${nombre}".` });
      setDistritoDialogOpen(false);
      setEditingDistrito(null);
      setDistritoForm({ nombre: "" });
    } catch (e) {
      toast({ title: "Error", description: e instanceof ApiError ? e.message : "No se pudo guardar el distrito.", variant: "destructive" });
    } finally {
      setMutating(false);
    }
  };

  const handleToggleDistritoActivo = async (d: any) => {
    try {
      setMutating(true);
      if (USE_API) {
        await configuracionApi.toggleDistritoActivo(String(d.id), !Boolean(d.activo));
        await loadData();
      } else {
        const next = distritosRaw.map((x) => String(x.id) === String(d.id) ? { ...x, activo: !Boolean(x.activo) } : x);
        setDistritosRaw(next);
      }
      toast({ title: !Boolean(d.activo) ? "Distrito activado" : "Distrito inactivado" });
    } catch (e) {
      toast({ title: "Error", description: e instanceof ApiError ? e.message : "No se pudo actualizar el estado del distrito.", variant: "destructive" });
    } finally {
      setMutating(false);
    }
  };
  return (
    <>
      <AppHeader
        title="Grupos"
        description="Catálogo de grupos para clasificar inmuebles. El seguimiento de morosidad se configura por distrito dentro de cada grupo."
        breadcrumb={[
          { label: "Configuración", to: "/configuracion" },
          { label: "Grupos" },
        ]}
      />

      <main className="flex-1 px-6 py-6">
        {loading && <div className="mb-2 text-xs text-muted-foreground">Cargando configuración…</div>}
        {error && <div className="mb-2 text-xs text-destructive">{error}</div>}
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
                  Con seguimiento activo:{" "}
                  <span className="tabular font-semibold text-foreground">
                    {numberFmt.format(totalConSeguimiento)}
                  </span>
                </span>
              </div>
              <Button variant="outline" onClick={openCreateDistrito} size="sm" className="h-8 gap-1.5 text-[12.5px]">
                <MapPin className="h-3.5 w-3.5" />
                Distritos
              </Button>
              <Button
                onClick={openCreate}
                size="sm"
                className="h-8 gap-1.5 text-[12.5px]"
              >
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
                  <TableHead className="h-9 w-[120px] text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Distritos
                  </TableHead>
                  <TableHead className="h-9 w-[260px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Estado del seguimiento
                  </TableHead>
                  <TableHead className="h-9 w-[120px] text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-[13px] text-muted-foreground"
                    >
                      No se encontraron grupos con los criterios actuales.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((g) => {
                    const totalInm = USE_API ? g.distritos.reduce((acc, d) => acc + Number(d.inmuebles ?? 0), 0) : totalInmueblesGrupo(g);
                    return (
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
                        <TableCell className="py-2.5 text-center text-[13px] tabular text-foreground">
                          {numberFmt.format(g.distritos.length)}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <SeguimientoResumen grupo={g} />
                        </TableCell>
                        <TableCell className="py-2.5 text-right text-[13px] tabular text-foreground">
                          {numberFmt.format(totalInm)}
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
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem
                                onClick={() => openEdit(g)}
                                className="text-[13px]"
                              >
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                Editar grupo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDistritos(g)}
                                className="text-[13px]"
                              >
                                <MapPin className="mr-2 h-3.5 w-3.5" />
                                Configurar distritos
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleGrupoActivo(g)}
                                disabled={mutating}
                                className="text-[13px]"
                              >
                                {g.activo ? <MinusCircle className="mr-2 h-3.5 w-3.5" /> : <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
                                {g.activo ? "Inactivar grupo" : "Activar grupo"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget(g)}
                                disabled={totalInm > 0}
                                className={cn(
                                  "text-[13px]",
                                  totalInm > 0
                                    ? "text-muted-foreground"
                                    : "text-destructive focus:text-destructive",
                                )}
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Eliminar
                                {totalInm > 0 && (
                                  <span className="ml-auto text-[10.5px] uppercase tracking-wider">
                                    Bloqueado
                                  </span>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
              El seguimiento se configura por distrito desde la opción
              "Configurar distritos".
            </span>
          </div>
        </div>
      </main>

      {/* Modal Alta / Edición de datos básicos */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">
              {editing ? "Editar grupo" : "Nuevo grupo"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              {editing
                ? "Modificá los datos del grupo. La configuración de distritos se gestiona desde la opción 'Configurar distritos'."
                : "Completá los datos del nuevo grupo. Una vez creado, asociale uno o más distritos."}
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, nombre: e.target.value }))
                }
                placeholder="Ej. Residencial C"
                className="h-9 text-[13px]"
                autoFocus
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="grupo-descripcion" className="text-[12.5px]">
                Descripción{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="grupo-descripcion"
                value={form.descripcion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descripcion: e.target.value }))
                }
                placeholder="Breve descripción del grupo o de los inmuebles que incluye."
                className="min-h-[72px] text-[13px]"
              />
            </div>

            <div className="rounded-md border border-border bg-surface-muted/40 px-3 py-2.5 text-[12px] leading-5 text-muted-foreground">
              El seguimiento de morosidad se configura por cada distrito
              asociado al grupo. Usá la opción{" "}
              <span className="font-medium text-foreground">
                Configurar distritos
              </span>{" "}
              para definirlo.
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
            <Button onClick={handleSave} className="h-9 text-[13px]" disabled={mutating}>
              {editing ? "Guardar cambios" : "Crear grupo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Configurar distritos */}
      <Dialog
        open={!!distritosTarget}
        onOpenChange={(o) => !o && closeDistritos()}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">
              Configurar distritos
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              {distritosTarget && (
                <>
                  Definí en qué distritos aplica el grupo{" "}
                  <span className="font-medium text-foreground">
                    {distritosTarget.nombre}
                  </span>{" "}
                  y si el seguimiento de morosidad está habilitado en cada uno.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Lista de distritos asociados */}
            <div className="rounded-md border border-border">
              <div className="border-b border-border bg-surface-muted/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Distritos asociados
              </div>
              {distritosDraft.length === 0 ? (
                <div className="px-3 py-6 text-center text-[12.5px] text-muted-foreground">
                  Este grupo no tiene distritos asociados todavía.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {distritosDraft.map((d) => (
                    <li
                      key={d.distrito}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface-muted/60">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-foreground">
                          {d.distrito}
                        </div>
                        <div className="text-[11.5px] text-muted-foreground">
                          {numberFmt.format(d.inmuebles)} inmuebles
                          {" · "}
                          {d.seguimientoHabilitado
                            ? "Seguimiento habilitado"
                            : "Seguimiento deshabilitado"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={d.seguimientoHabilitado}
                          onCheckedChange={(v) =>
                            handleToggleSeguimiento(d.distrito, v)
                          }
                          aria-label={`Seguimiento en ${d.distrito}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive disabled:opacity-40"
                          onClick={() => handleQuitarDistrito(d.distrito)}
                          disabled={d.inmuebles > 0}
                          title={
                            d.inmuebles > 0
                              ? "No se puede quitar: hay inmuebles asociados"
                              : "Quitar distrito"
                          }
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Asociar nuevo distrito */}
            {distritosDisponibles.length > 0 && (
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">
                    Asociar nuevo distrito
                  </Label>
                  <Select
                    value={distritoNuevo}
                    onValueChange={setDistritoNuevo}
                  >
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue placeholder="Seleccionar distrito..." />
                    </SelectTrigger>
                    <SelectContent>
                      {distritosDisponibles.map((d) => (
                        <SelectItem key={d} value={d} className="text-[13px]">
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 text-[12.5px]"
                  onClick={handleAgregarDistrito}
                  disabled={!distritoNuevo || USE_API}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Asociar
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={closeDistritos}
              className="h-9 text-[13px]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveDistritos}
              className="h-9 text-[13px]"
              disabled={mutating}
            >
              Guardar cambios
            </Button>
          </DialogFooter>
          {USE_API && (
            <p className="text-[12px] text-muted-foreground">
              La creación o eliminación de relaciones grupo-distrito no está disponible desde esta pantalla.
            </p>
          )}
        </DialogContent>
      </Dialog>



      <Dialog open={distritoDialogOpen} onOpenChange={setDistritoDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Gestión de distritos</DialogTitle>
            <DialogDescription className="text-[12.5px]">Crear, editar y activar/inactivar distritos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input value={distritoForm.nombre} onChange={(e) => setDistritoForm({ nombre: e.target.value })} placeholder="Nombre del distrito" className="h-9 text-[13px]" />
              <Button onClick={handleSaveDistrito} disabled={mutating} className="h-9 text-[13px]">{editingDistrito ? 'Guardar' : 'Crear'}</Button>
            </div>
            <div className="rounded-md border border-border max-h-64 overflow-auto">
              {distritosRaw.map((d: any) => (
                <div key={String(d.id)} className="flex items-center justify-between border-b border-border px-3 py-2 text-[13px]">
                  <div>
                    <div className="font-medium text-foreground">{String(d.nombre ?? d.distrito ?? d.codigo ?? d.id)}</div>
                    <div className="text-[11px] text-muted-foreground">{Boolean(d.activo ?? true) ? 'Activo' : 'Inactivo'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-[12px]" onClick={() => openEditDistrito(d)} disabled={mutating}>Editar</Button>
                    <Button variant="outline" size="sm" className="h-7 text-[12px]" onClick={() => handleToggleDistritoActivo(d)} disabled={mutating}>{Boolean(d.activo ?? true) ? 'Inactivar' : 'Activar'}</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

            {/* Confirmación de eliminación */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px]">
              {deleteTarget &&
              (USE_API
                ? deleteTarget.distritos.reduce((acc, d) => acc + Number(d.inmuebles ?? 0), 0)
                : totalInmueblesGrupo(deleteTarget)) > 0
                ? "No se puede eliminar el grupo"
                : "Eliminar grupo"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px]" asChild>
              <div>
                {deleteTarget &&
                (USE_API
                  ? deleteTarget.distritos.reduce((acc, d) => acc + Number(d.inmuebles ?? 0), 0)
                  : totalInmueblesGrupo(deleteTarget)) > 0 ? (
                  <>
                    El grupo{" "}
                    <span className="font-semibold text-foreground">
                      {deleteTarget.nombre}
                    </span>{" "}
                    tiene{" "}
                    <span className="font-semibold text-foreground">
                      {numberFmt.format(
                        USE_API
                          ? deleteTarget.distritos.reduce((acc, d) => acc + Number(d.inmuebles ?? 0), 0)
                          : totalInmueblesGrupo(deleteTarget),
                      )}{" "}
                      inmuebles
                    </span>{" "}
                    asignados, por lo que no puede eliminarse.
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                      Reasigná los inmuebles a otro grupo desde el módulo de
                      Inmuebles antes de intentar eliminarlo.
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
              {deleteTarget &&
              (USE_API
                ? deleteTarget.distritos.reduce((acc, d) => acc + Number(d.inmuebles ?? 0), 0)
                : totalInmueblesGrupo(deleteTarget)) > 0
                ? "Cerrar"
                : "Cancelar"}
            </AlertDialogCancel>
            {deleteTarget &&
              (USE_API
                ? deleteTarget.distritos.reduce((acc, d) => acc + Number(d.inmuebles ?? 0), 0)
                : totalInmueblesGrupo(deleteTarget)) === 0 && (
              <AlertDialogAction
                onClick={handleDelete}
                disabled={mutating}
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

function SeguimientoResumen({ grupo }: { grupo: Grupo }) {
  const { activos, total, estado } = resumenSeguimiento(grupo);

  if (estado === "sin-distritos") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted/60 px-2 py-0.5 text-[11.5px] font-medium text-muted-foreground">
        <AlertTriangle className="h-3 w-3" />
        Sin distritos asociados
      </span>
    );
  }

  if (estado === "todos") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Activo en {total} de {total} distritos
      </span>
    );
  }

  if (estado === "ninguno") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted/60 px-2 py-0.5 text-[11.5px] font-medium text-muted-foreground">
        <MinusCircle className="h-3 w-3" />
        Desactivado en todos
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11.5px] font-medium text-amber-700">
      <AlertTriangle className="h-3 w-3" />
      Activo en {activos} de {total} distritos
    </span>
  );
}
