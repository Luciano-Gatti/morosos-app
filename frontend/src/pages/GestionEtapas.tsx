import { useEffect, useMemo, useState } from "react";
import {
  Filter,
  Search,
  CalendarClock,
  PlayCircle,
  StopCircle,
  ArrowRight,
  ArrowRightCircle,
  HandCoins,
  ChevronsRight,
  X,
  AlertTriangle,
  CalendarIcon,
  Layers,
  Building2,
  RotateCcw,
  PauseCircle,
  CheckCircle2,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
  DropdownMenuLabel,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { USE_API, ApiError } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import {
  inmueblesMorosos,
  etapasSeguimiento,
  estadosProceso,
  gruposSeguimiento,
  distritosSeguimiento,
  type InmuebleMoroso,
  type EtapaSeguimiento,
  type EstadoProceso,
} from "@/data/seguimiento";
import { parametrosSeguimiento } from "@/data/parametrosSeguimiento";
import { seguimientoApi } from "@/services/api/seguimientoApi";
import { configuracionApi } from "@/services/api/configuracionApi";
import { mapSeguimientoBandejaRow, type SeguimientoRow } from "@/adapters/seguimiento";
import { normalizePageResponse, normalizeSpringPage } from "@/adapters/pagination";
import { Link } from "react-router-dom";
import { Settings2 } from "lucide-react";

const numberFmt = new Intl.NumberFormat("es-AR");
const moneyFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const dateFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// Fecha programada determinística por inmueble (solo operativa/informativa).
function fechaProgramadaPara(id: string): Date | null {
  const n = parseInt(id, 10);
  if (!Number.isFinite(n)) return null;
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const offset = ((n * 7) % 45) - 15; // rango -15 a +29 días
  base.setDate(base.getDate() + offset);
  return base;
}

function etapaIndex(e: EtapaSeguimiento | null): number {
  if (!e) return -1;
  return etapasSeguimiento.indexOf(e);
}

function etapaSiguiente(e: EtapaSeguimiento | null): EtapaSeguimiento | null {
  const i = etapaIndex(e);
  if (i === -1) return etapasSeguimiento[0];
  if (i >= etapasSeguimiento.length - 1) return null;
  return etapasSeguimiento[i + 1];
}

const PAGE_SIZE = 15;

type EtapaFiltro = "all" | "sin-etapa" | EtapaSeguimiento;
type EstadoFiltro = "all" | EstadoProceso;

type AccionMasiva =
  | { kind: "enviar-etapa"; etapa: EtapaSeguimiento }
  | { kind: "enviar-siguiente" }
  | { kind: "repetir-etapa" }
  | { kind: "iniciar" }
  | { kind: "cerrar" }
  | { kind: "compromiso" };

export type BulkSeguimientoPayload = {
  ids: string[];
  observacion?: string;
};

export type CerrarProcesoPayload = {
  casoSeguimientoId: string;
  motivoCodigo: string;
  observacion?: string;
  planPago?: {
    cantidadCuotas: number;
    fechaVencimientoPrimeraCuota: string;
  };
  cambioParametro?: {
    parametro: string;
    valorAnterior: string;
    valorNuevo: string;
  };
};

export type CompromisoPagoPayload = {
  casoSeguimientoId: string;
  fechaDesde: string;
  fechaHasta: string;
  montoComprometido?: number;
  observacion?: string;
};

type AccionDialogConfirmPayload =
  | { kind: "enviar-etapa" | "enviar-siguiente" | "repetir-etapa" | "iniciar" | "pausar" | "reabrir"; payload: Omit<BulkSeguimientoPayload, "ids"> }
  | { kind: "cerrar"; payload: Omit<CerrarProcesoPayload, "casoSeguimientoId"> }
  | { kind: "compromiso"; payload: Omit<CompromisoPagoPayload, "casoSeguimientoId"> };


export default function GestionEtapas() {
  const { toast } = useToast();
  const umbralCuotas = parametrosSeguimiento.cuotasParaMoroso;

  // Universo base: solo los inmuebles que cumplen con el umbral configurado en
  // /configuracion/seguimiento. El resto no debe aparecer en gestión de etapas.
  const universoMorosos = useMemo(
    () => inmueblesMorosos.filter((m) => m.cuotasAdeudadas >= umbralCuotas),
    [umbralCuotas],
  );
  const excluidosPorUmbral = inmueblesMorosos.length - universoMorosos.length;

  const [query, setQuery] = useState("");
  const [etapaFiltro, setEtapaFiltro] = useState<EtapaFiltro>("all");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("all");
  const [grupo, setGrupo] = useState<string>("all");
  const [distrito, setDistrito] = useState<string>("all");
  const [cuotasMin, setCuotasMin] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [accion, setAccion] = useState<AccionMasiva | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const [rows, setRows] = useState<SeguimientoRow[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [gruposApi, setGruposApi] = useState<string[]>([]);
  const [distritosApi, setDistritosApi] = useState<string[]>([]);
  const [etapasApi, setEtapasApi] = useState<string[]>([]);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [gs, ds, es] = await Promise.all([configuracionApi.grupos(), configuracionApi.distritos(), configuracionApi.etapas()]);
        setGruposApi((gs?.content ?? gs ?? []).map((x: any) => x.nombre ?? x.grupo ?? String(x)));
        setDistritosApi((ds?.content ?? ds ?? []).map((x: any) => x.nombre ?? x.distrito ?? String(x)));
        setEtapasApi((es?.content ?? es ?? []).map((x: any) => x.nombre ?? x.etapa ?? String(x)));
      } catch {}
    };
    loadCatalogs();
  }, []);

  const fetchBandeja = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await seguimientoApi.getBandeja({
        query: query || undefined,
        grupoId: grupo === "all" ? undefined : grupo,
        distritoId: distrito === "all" ? undefined : distrito,
        etapaId: etapaFiltro === "all" || etapaFiltro === "sin-etapa" ? undefined : etapaFiltro,
        estado: estadoFiltro === "all" ? undefined : estadoFiltro,
        cuotasMin: cuotasMin || undefined,
        page: page - 1,
        size: PAGE_SIZE,
      });
      const pageData = "number" in res ? normalizeSpringPage(res) : normalizePageResponse(res);
      setRows((pageData.content || []).map(mapSeguimientoBandejaRow));
      setTotalElements(pageData.totalElements);
      setTotalPages(Math.max(1, pageData.totalPages));
    } catch (e) {
      setError("No se pudo cargar la bandeja de seguimiento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBandeja();
  }, [query, grupo, distrito, etapaFiltro, estadoFiltro, cuotasMin, page]);

  const filtered = rows as any[];

  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered as any[];

  const pageIds = pageRows.map((r) => r.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const somePageSelected = pageIds.some((id) => selected.has(id));

  const togglePageSelection = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const seleccionados = useMemo(
    () => universoMorosos.filter((m) => selected.has(m.id)),
    [universoMorosos, selected],
  );

  const hasFilters =
    query !== "" ||
    etapaFiltro !== "all" ||
    estadoFiltro !== "all" ||
    grupo !== "all" ||
    distrito !== "all" ||
    cuotasMin !== "";

  const resetFilters = () => {
    setQuery("");
    setEtapaFiltro("all");
    setEstadoFiltro("all");
    setGrupo("all");
    setDistrito("all");
    setCuotasMin("");
    setPage(1);
  };

  const confirmarAccion = async (data: AccionDialogConfirmPayload) => {
    const selectedRows = rows.filter((r) => selected.has(r.id));
    if (!USE_API) {
      const total = selected.size;
      toast({ title: "Acción aplicada", description: `${total} inmueble(s) procesado(s) correctamente.` });
      setAccion(null);
      clearSelection();
      return;
    }
    try {
      setMutating(true);
      let result: any = null;
      if (data.kind === "iniciar") {
        const inmuebleIds = selectedRows.filter((r) => !r.casoId).map((r) => r.inmuebleId || r.id);
        result = await seguimientoApi.iniciar({ inmuebleIds, observacion: data.payload.observacion });
      } else if (data.kind === "enviar-siguiente" || data.kind === "enviar-etapa") {
        const casoIds = selectedRows.map((r) => r.casoId).filter(Boolean);
        result = await seguimientoApi.avanzar({ casoIds, observacion: data.payload.observacion });
      } else if (data.kind === "repetir-etapa") {
        const casoIds = selectedRows.map((r) => r.casoId).filter(Boolean);
        result = await seguimientoApi.repetir({ casoIds, observacion: data.payload.observacion });
      } else if (data.kind === "pausar") {
        const casoIds = selectedRows.map((r) => r.casoId).filter(Boolean);
        result = await seguimientoApi.pausar({ casoIds, observacion: data.payload.observacion });
      } else if (data.kind === "reabrir") {
        const casoIds = selectedRows.map((r) => r.casoId).filter(Boolean);
        result = await seguimientoApi.reabrir({ casoIds, observacion: data.payload.observacion });
      } else if (data.kind === "cerrar") {
        const casoIds = selectedRows.map((r) => r.casoId).filter(Boolean);
        for (const casoSeguimientoId of casoIds) {
          result = await seguimientoApi.cerrar({ casoSeguimientoId, ...data.payload });
        }
      } else if (data.kind === "compromiso") {
        const casoIds = selectedRows.map((r) => r.casoId).filter(Boolean);
        for (const casoSeguimientoId of casoIds) {
          result = await seguimientoApi.registrarCompromiso({ casoSeguimientoId, ...data.payload });
        }
      }
      const aplicados = Number(result?.aplicados ?? result?.applied ?? selectedRows.length);
      const omitidos = Number(result?.omitidos ?? result?.skipped ?? 0);
      const errores = Number(result?.errores ?? result?.errors ?? 0);
      toast({ title: "Acción ejecutada", description: `Aplicados: ${aplicados} · Omitidos: ${omitidos} · Errores: ${errores}` });
      await fetchBandeja();
      setAccion(null);
      clearSelection();
    } catch (e) {
      toast({ title: "Error", description: e instanceof ApiError ? e.message : "No se pudo ejecutar la acción.", variant: "destructive" });
    } finally {
      setMutating(false);
    }
  };

  return (
    <>
      <AppHeader
        title="Gestión de etapas"
        description="Vista operativa para mover inmuebles dentro del proceso de seguimiento. Las etapas son configurables, el paso es manual y no admite retroceso."
        breadcrumb={[{ label: "Gestión de etapas" }]}
      />

      <main className="flex-1 px-6 py-6">
        {/* Aviso de universo: solo entran inmuebles que cumplen el umbral configurado */}
        <div className="mb-3 flex flex-wrap items-start gap-3 rounded-md border border-primary/20 bg-primary-soft/40 px-3 py-2.5 text-[12.5px] text-foreground">
          <Settings2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <div className="flex-1 leading-5">
            Esta vista solo incluye inmuebles con{" "}
            <span className="font-semibold">{umbralCuotas} o más cuotas adeudadas</span>,
            según el umbral configurado para considerar moroso.
            {excluidosPorUmbral > 0 && (
              <>
                {" "}
                <span className="text-muted-foreground">
                  ({numberFmt.format(excluidosPorUmbral)} inmuebles del padrón quedan
                  fuera del seguimiento por no alcanzar ese mínimo.)
                </span>
              </>
            )}
          </div>
          <Link
            to="/configuracion/seguimiento"
            className="shrink-0 text-[12px] font-medium text-primary underline-offset-2 hover:underline"
          >
            Configurar umbral
          </Link>
        </div>

        <div className="rounded-md border border-border bg-surface shadow-sm">
          {/* Barra de filtros */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
            <div className="flex items-center gap-1.5 pr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Filtros
            </div>

            <div className="relative min-w-[220px] flex-1 sm:max-w-[280px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Cuenta, titular o dirección..."
                className="h-8 pl-8 text-[12.5px]"
              />
            </div>

            <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

            <Select
              value={etapaFiltro}
              onValueChange={(v) => {
                setEtapaFiltro(v as EtapaFiltro);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[180px] text-[12.5px]">
                <SelectValue placeholder="Etapa actual" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">Todas las etapas</SelectItem>
                <SelectItem value="sin-etapa" className="text-[13px]">Sin etapa asignada</SelectItem>
                {(etapasApi.length ? etapasApi : etapasSeguimiento).map((e) => (
                  <SelectItem key={e} value={e} className="text-[13px]">{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={estadoFiltro}
              onValueChange={(v) => {
                setEstadoFiltro(v as EstadoFiltro);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[160px] text-[12.5px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">Todos los estados</SelectItem>
                {estadosProceso.map((e) => (
                  <SelectItem key={e} value={e} className="text-[13px]">{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

            <Select value={grupo} onValueChange={(v) => { setGrupo(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-[140px] text-[12.5px]">
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">Todos los grupos</SelectItem>
                {(gruposApi.length ? gruposApi : gruposSeguimiento).map((g) => (
                  <SelectItem key={g} value={g} className="text-[13px]">{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={distrito} onValueChange={(v) => { setDistrito(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-[140px] text-[12.5px]">
                <SelectValue placeholder="Distrito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">Todos los distritos</SelectItem>
                {(distritosApi.length ? distritosApi : distritosSeguimiento).map((d) => (
                  <SelectItem key={d} value={d} className="text-[13px]">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative w-[130px]">
              <Input
                type="number"
                inputMode="numeric"
                min={umbralCuotas}
                value={cuotasMin}
                onChange={(e) => {
                  setCuotasMin(e.target.value);
                  setPage(1);
                }}
                placeholder={`Cuotas ≥ ${umbralCuotas}`}
                className="h-8 text-[12.5px] tabular"
                title={`El umbral mínimo del sistema es ${umbralCuotas} cuotas.`}
              />
            </div>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="ml-auto h-8 px-2 text-[12px] text-muted-foreground hover:text-foreground"
              >
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Resumen / barra de selección */}
          {selected.size === 0 ? (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-border bg-surface-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
              <div>
                <span className="tabular font-semibold text-foreground">{numberFmt.format(filtered.length)}</span>{" "}
                inmuebles
              </div>
              <div>
                Sin etapa:{" "}
                <span className="tabular font-semibold text-foreground">
                  {numberFmt.format(filtered.filter((m) => m.etapa === null).length)}
                </span>
              </div>
              <div>
                Activos:{" "}
                <span className="tabular font-semibold text-foreground">
                  {numberFmt.format(filtered.filter((m) => m.estado === "Activo").length)}
                </span>
              </div>
              <div>
                Pausados:{" "}
                <span className="tabular font-semibold text-foreground">
                  {numberFmt.format(filtered.filter((m) => m.estado === "Pausado").length)}
                </span>
              </div>
              <div className="ml-auto hidden items-center gap-1.5 text-[11px] sm:flex">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Las etapas avanzan en forma manual y no pueden retroceder.
              </div>
            </div>
          ) : (
            <SelectionBar
              count={selected.size}
              hasSinEtapa={seleccionados.some((m) => m.etapa === null)}
              hasConEtapa={seleccionados.some((m) => m.etapa !== null)}
              onClear={clearSelection}
              onAction={setAccion}
            />
          )}

          {/* Tabla */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-surface-muted/60 hover:bg-surface-muted/60">
                  <TableHead className="h-9 w-[44px] pl-4">
                    <Checkbox
                      checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false}
                      onCheckedChange={togglePageSelection}
                      aria-label="Seleccionar página"
                    />
                  </TableHead>
                  <TableHead className="h-9 w-[120px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    N° cuenta
                  </TableHead>
                  <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Titular
                  </TableHead>
                  <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Dirección
                  </TableHead>
                  <TableHead className="h-9 w-[120px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Grupo
                  </TableHead>
                  <TableHead className="h-9 w-[120px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Distrito
                  </TableHead>
                  <TableHead className="h-9 w-[80px] text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Cuotas
                  </TableHead>
                  <TableHead className="h-9 w-[130px] text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Monto adeudado
                  </TableHead>
                  <TableHead className="h-9 w-[150px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Etapa actual
                  </TableHead>
                  <TableHead className="h-9 w-[130px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Fecha programada
                  </TableHead>
                  <TableHead className="h-9 w-[130px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Estado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center text-[13px] text-muted-foreground">
                      {loading ? "Cargando bandeja..." : error ?? "No se encontraron inmuebles con los filtros aplicados."}
                    </TableCell>
                  </TableRow>
                )}
                {pageRows.map((m) => (
                  <InmuebleRow
                    key={m.id}
                    m={m}
                    checked={selected.has(m.id)}
                    onToggle={() => toggleOne(m.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          <div className="flex flex-col items-center justify-between gap-2 border-t border-border px-3 py-2.5 text-[12px] text-muted-foreground sm:flex-row">
            <div>
              Mostrando{" "}
              <span className="tabular font-medium text-foreground">
                {totalElements === 0 ? 0 : pageStart + 1}–
                {Math.min(pageStart + PAGE_SIZE, totalElements)}
              </span>{" "}
              de <span className="tabular font-medium text-foreground">{totalElements}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[12px]"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span className="px-2 tabular">
                {safePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[12px]"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </main>

      <AccionDialog
        accion={accion}
        seleccionados={seleccionados}
        onCancel={() => setAccion(null)}
        onConfirm={confirmarAccion}
        mutating={mutating}
      />
    </>
  );
}

/* -------- Fila de inmueble -------- */

function InmuebleRow({
  m,
  checked,
  onToggle,
}: {
  m: InmuebleMoroso;
  checked: boolean;
  onToggle: () => void;
}) {
  const fecha = fechaProgramadaPara(m.id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const vencida = fecha ? fecha.getTime() < today.getTime() : false;
  const hoy = fecha ? fecha.getTime() === today.getTime() : false;

  return (
    <TableRow
      className={cn(
        "border-border text-[13px]",
        checked && "bg-primary-soft/40 hover:bg-primary-soft/50",
      )}
    >
      <TableCell className="pl-4">
        <Checkbox checked={checked} onCheckedChange={onToggle} aria-label={`Seleccionar ${m.cuenta}`} />
      </TableCell>
      <TableCell className="font-mono text-[12.5px] text-foreground">{m.cuenta}</TableCell>
      <TableCell className="text-foreground">{m.titular}</TableCell>
      <TableCell className="text-muted-foreground">{m.direccion}</TableCell>
      <TableCell className="text-muted-foreground">{m.grupo}</TableCell>
      <TableCell className="text-muted-foreground">{m.distrito}</TableCell>
      <TableCell className="text-right tabular text-foreground">
        {numberFmt.format(m.cuotasAdeudadas)}
      </TableCell>
      <TableCell className="text-right tabular font-medium text-foreground">
        {moneyFmt.format(m.montoAdeudado)}
      </TableCell>
      <TableCell>
        <EtapaPill etapa={m.etapa} />
      </TableCell>
      <TableCell>
        {fecha ? (
          <div
            className={cn(
              "inline-flex items-center gap-1.5 text-[12.5px] tabular",
              vencida && "text-destructive",
              hoy && "font-medium text-amber-700 dark:text-amber-400",
              !vencida && !hoy && "text-muted-foreground",
            )}
          >
            <CalendarClock className="h-3.5 w-3.5 opacity-80" />
            {dateFmt.format(fecha)}
          </div>
        ) : (
          <span className="text-[12px] italic text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <EstadoPill estado={m.estado} />
      </TableCell>
    </TableRow>
  );
}

/* -------- Barra de selección con acciones masivas -------- */

function SelectionBar({
  count,
  hasSinEtapa,
  hasConEtapa,
  onClear,
  onAction,
}: {
  count: number;
  hasSinEtapa: boolean;
  hasConEtapa: boolean;
  onClear: () => void;
  onAction: (a: AccionMasiva) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-primary/20 bg-primary-soft/60 px-3 py-2 text-[12.5px]">
      <div className="flex items-center gap-2 pr-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onClear}
          aria-label="Limpiar selección"
        >
          <X className="h-4 w-4" />
        </Button>
        <span className="font-medium text-foreground">
          {numberFmt.format(count)} seleccionado{count === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mx-1 h-5 w-px bg-border" />

      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 text-[12.5px]"
        onClick={() => onAction({ kind: "enviar-etapa", etapa: etapasSeguimiento[0] })}
      >
        <ChevronsRight className="h-3.5 w-3.5" />
        Enviar a etapa
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 text-[12.5px]"
        onClick={() => onAction({ kind: "enviar-siguiente" })}
      >
        <ArrowRightCircle className="h-3.5 w-3.5" />
        Etapa siguiente
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 text-[12.5px]"
        onClick={() => onAction({ kind: "repetir-etapa" })}
        disabled={!hasConEtapa}
        title={!hasConEtapa ? "Requiere inmuebles con etapa asignada" : undefined}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Repetir etapa
      </Button>

      {hasSinEtapa && !hasConEtapa && (
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-[12.5px]"
          onClick={() => onAction({ kind: "iniciar" })}
        >
          <PlayCircle className="h-3.5 w-3.5" />
          Iniciar proceso
        </Button>
      )}

      {hasConEtapa && !hasSinEtapa && (
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-[12.5px]"
          onClick={() => onAction({ kind: "cerrar" })}
        >
          <StopCircle className="h-3.5 w-3.5" />
          Cerrar proceso
        </Button>
      )}

      <div className="mx-1 h-5 w-px bg-border" />

      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 text-[12.5px]"
        onClick={() => onAction({ kind: "compromiso" })}
      >
        <HandCoins className="h-3.5 w-3.5" />
        Compromiso de pago
      </Button>
    </div>
  );
}

/* -------- Pills de etapa y estado -------- */

function EtapaPill({ etapa }: { etapa: EtapaSeguimiento | null }) {
  if (!etapa) {
    return (
      <span className="inline-flex items-center rounded-md border border-dashed border-border px-2 py-0.5 text-[11.5px] italic text-muted-foreground">
        Sin etapa
      </span>
    );
  }
  const cls: Record<EtapaSeguimiento, string> = {
    "Aviso de deuda": "border-border bg-muted text-foreground",
    "Intimación": "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    "Aviso de corte": "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400",
    "Corte": "border-destructive/20 bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11.5px] font-medium",
        cls[etapa],
      )}
    >
      {etapa}
    </span>
  );
}

function EstadoPill({ estado }: { estado: EstadoProceso }) {
  const cls: Record<EstadoProceso, string> = {
    "No iniciado": "border-border bg-muted text-muted-foreground",
    Activo:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    Pausado:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    Cerrado: "border-status-closed/20 bg-status-closed-soft text-status-closed",
  };
  const dot: Record<EstadoProceso, string> = {
    "No iniciado": "bg-muted-foreground/60",
    Activo: "bg-emerald-500",
    Pausado: "bg-amber-500",
    Cerrado: "bg-status-closed",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11.5px] font-medium",
        cls[estado],
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", dot[estado])} />
      {estado}
    </span>
  );
}

/* -------- Diálogo de confirmación de acción masiva -------- */

function AccionDialog({
  accion,
  seleccionados,
  onCancel,
  onConfirm,
  mutating = false,
}: {
  accion: AccionMasiva | null;
  seleccionados: InmuebleMoroso[];
  onCancel: () => void;
  onConfirm: (data: AccionDialogConfirmPayload) => void;
  mutating?: boolean;
}) {
  const open = accion !== null;

  // Modal dedicado e institucional para mover a una etapa.
  if (accion && accion.kind === "enviar-etapa") {
    return (
      <MoverEtapaDialog
        accion={accion}
        seleccionados={seleccionados}
        onCancel={onCancel}
        onConfirm={onConfirm}
        mutating={mutating}
      />
    );
  }

  if (accion && (accion.kind === "enviar-siguiente" || accion.kind === "repetir-etapa")) {
    return (
      <ConfirmarEtapaDialog
        accion={accion}
        seleccionados={seleccionados}
        onCancel={onCancel}
        onConfirm={onConfirm}
        mutating={mutating}
      />
    );
  }

  // Modal dedicado e institucional para compromiso de pago.
  if (accion && accion.kind === "compromiso") {
    return (
      <CompromisoPagoDialog
        seleccionados={seleccionados}
        onCancel={onCancel}
        onConfirm={onConfirm}
        mutating={mutating}
      />
    );
  }

  // Modal dedicado e institucional para cerrar proceso (con motivo dinámico).
  if (accion && accion.kind === "cerrar") {
    return (
      <CerrarProcesoDialog
        seleccionados={seleccionados}
        onCancel={onCancel}
        onConfirm={onConfirm}
        mutating={mutating}
      />
    );
  }

  const total = seleccionados.length;

  const info = accionInfo(accion);

  // Validaciones contextuales
  let warning: string | null = null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{info.titulo}</DialogTitle>
          <DialogDescription className="text-[13px]">
            {info.descripcion} Se aplicará a{" "}
            <span className="font-semibold text-foreground">{numberFmt.format(total)}</span>{" "}
            inmueble{total === 1 ? "" : "s"} seleccionado{total === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        {warning && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-800 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        {seleccionados.length > 0 && (
          <div className="max-h-32 overflow-y-auto rounded-md border border-border bg-surface-muted/40 px-3 py-2 text-[12px]">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Resumen
            </div>
            <div className="text-muted-foreground">
              Deuda total involucrada:{" "}
              <span className="font-semibold text-foreground">
                {moneyFmt.format(seleccionados.reduce((s, m) => s + m.montoAdeudado, 0))}
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onConfirm({ kind: accion?.kind as any, payload: {} })
            }
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmarEtapaDialog({
  accion,
  seleccionados,
  onCancel,
  onConfirm,
  mutating = false,
}: {
  accion: Extract<AccionMasiva, { kind: "enviar-siguiente" | "repetir-etapa" }>;
  seleccionados: InmuebleMoroso[];
  onCancel: () => void;
  onConfirm: (data: AccionDialogConfirmPayload) => void;
  mutating?: boolean;
}) {
  const total = seleccionados.length;
  const isSiguiente = accion.kind === "enviar-siguiente";
  const [fecha, setFecha] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [observacion, setObservacion] = useState("");
  const [montoComprometido, setMontoComprometido] = useState("");
  const [calOpen, setCalOpen] = useState(false);

  const avanzados = isSiguiente
    ? seleccionados.filter((m) => m.etapa !== null && etapaSiguiente(m.etapa) !== null).length
    : 0;
  const iniciados = isSiguiente ? seleccionados.filter((m) => m.etapa === null).length : 0;
  const repetidos = !isSiguiente ? seleccionados.filter((m) => m.etapa !== null).length : 0;
  const omitidos = isSiguiente
    ? seleccionados.filter((m) => m.etapa !== null && etapaSiguiente(m.etapa) === null).length
    : total - repetidos;
  const aplicables = isSiguiente ? avanzados + iniciados : repetidos;
  const Icon = isSiguiente ? ArrowRightCircle : RotateCcw;

  const handleConfirm = () => {
    const partes: string[] = [];
    if (isSiguiente) {
      if (avanzados) partes.push(`${avanzados} avanzaron a su siguiente etapa`);
      if (iniciados) partes.push(`${iniciados} iniciaron en "${etapasSeguimiento[0]}"`);
      if (omitidos) partes.push(`${omitidos} ya estaban en la última etapa y fueron omitidos`);
      onConfirm({ kind: "enviar-siguiente", payload: { observacion: observacion.trim() || undefined } });
      return;
    }
    if (repetidos) partes.push(`${repetidos} re-emitieron su etapa actual`);
    if (omitidos) partes.push(`${omitidos} sin etapa fueron omitidos`);
    onConfirm({ kind: "repetir-etapa", payload: { observacion: observacion.trim() || undefined } });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="space-y-1 border-b border-border bg-surface-muted/40 px-6 py-4 text-left">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            Gestión de etapas
          </div>
          <DialogTitle className="font-serif text-xl leading-tight">
            {isSiguiente ? "Enviar a etapa siguiente" : "Repetir etapa actual"}
          </DialogTitle>
          <DialogDescription className="text-[12.5px]">
            {isSiguiente
              ? "Cada inmueble avanzará a su próxima etapa disponible dentro del proceso."
              : "Se re-emitirá la etapa actual para los inmuebles que ya tienen una etapa asignada."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="flex items-center justify-between rounded-md border border-border bg-surface-muted/40 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft text-primary">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Inmuebles seleccionados
                </div>
                <div className="text-[13px] text-foreground">
                  Se aplicará la operación al conjunto seleccionado.
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-serif text-2xl font-semibold tabular leading-none text-foreground">
                {numberFmt.format(total)}
              </div>
              <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                inmueble{total === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-surface-muted/30 px-3 py-2.5 text-[12.5px] text-muted-foreground">
              <div className="text-[11px] font-semibold uppercase tracking-wider">Resumen</div>
              <div className="mt-1 space-y-1">
                {isSiguiente ? (
                  <>
                    <div><span className="tabular font-semibold text-foreground">{avanzados}</span> avanzan</div>
                    <div><span className="tabular font-semibold text-foreground">{iniciados}</span> inician seguimiento</div>
                  </>
                ) : (
                  <div><span className="tabular font-semibold text-foreground">{repetidos}</span> repiten etapa</div>
                )}
                <div><span className="tabular font-semibold text-foreground">{omitidos}</span> omitidos</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium">Fecha programada</Label>
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 w-full justify-start text-left text-[13px] font-normal">
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-70" />
                    {fecha ? format(fecha, "dd 'de' MMMM yyyy", { locale: es }) : "Sin fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fecha}
                    onSelect={(d) => {
                      setFecha(d);
                      setCalOpen(false);
                    }}
                    initialFocus
                    locale={es}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label className="text-[12px] font-medium">Observación</Label>
              <span className="text-[11px] text-muted-foreground">Opcional</span>
            </div>
            <Textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Detalle interno de la operación"
              rows={3}
              maxLength={500}
              className="resize-none text-[13px]"
            />
          </div>

          {omitidos > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-800 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{omitidos} inmueble{omitidos === 1 ? " será omitido" : "s serán omitidos"} por no cumplir las condiciones de esta acción.</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-3 border-t border-border bg-surface-muted/40 px-6 py-3 sm:justify-between">
          <div className="text-[12px] text-muted-foreground">
            Se aplicará a <span className="tabular font-semibold text-foreground">{numberFmt.format(aplicables)}</span> de {numberFmt.format(total)}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onCancel} className="h-9">Cancelar</Button>
            <Button onClick={handleConfirm} disabled={aplicables === 0 || mutating} className="h-9">
              Confirmar acción
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------- Modal institucional: Cerrar proceso (motivo dinámico) -------- */

type MotivoCierre = "REGULARIZACION" | "PLAN_DE_PAGO" | "CAMBIO_PARAMETRO" | "JUDICIALIZACION" | "OTRO";

function CerrarProcesoDialog({
  seleccionados,
  onCancel,
  onConfirm,
  mutating = false,
}: {
  seleccionados: InmuebleMoroso[];
  onCancel: () => void;
  onConfirm: (data: AccionDialogConfirmPayload) => void;
  mutating?: boolean;
}) {
  const total = seleccionados.length;

  const today = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const [motivo, setMotivo] = useState<MotivoCierre | "">("");
  const [parametro, setParametro] = useState("");
  const [valorAnterior, setValorAnterior] = useState("");
  const [valorNuevo, setValorNuevo] = useState("");
  const [observacion, setObservacion] = useState("");
  const [montoComprometido, setMontoComprometido] = useState("");

  // Regularización
  const [fechaReg, setFechaReg] = useState<Date | undefined>(today);
  const [openFechaReg, setOpenFechaReg] = useState(false);

  // Plan de pago
  const [fechaPlan, setFechaPlan] = useState<Date | undefined>(today);
  const [openFechaPlan, setOpenFechaPlan] = useState(false);
  const [cuotas, setCuotas] = useState<string>("6");
  const [fechaPrimera, setFechaPrimera] = useState<Date | undefined>(today);
  const [openFechaPrimera, setOpenFechaPrimera] = useState(false);

  const cuotasNum = parseInt(cuotas, 10);
  const cuotasValidas = Number.isFinite(cuotasNum) && cuotasNum > 0 && cuotasNum <= 120;

  const puedeConfirmar = (() => {
    if (!motivo) return false;
    if (motivo === "REGULARIZACION") return !!fechaReg;
    if (motivo === "PLAN_DE_PAGO") return !!fechaPlan && !!fechaPrimera && cuotasValidas;
    if (motivo === "CAMBIO_PARAMETRO") return parametro.trim() && valorAnterior.trim() && valorNuevo.trim();
    if (motivo === "OTRO" || motivo === "JUDICIALIZACION")
      return observacion.trim().length > 0;
    return false;
  })();

  const handleConfirm = () => {
    if (!puedeConfirmar) return;
    const payload: Omit<CerrarProcesoPayload, "casoSeguimientoId"> = {
      motivoCodigo: motivo,
      observacion: observacion.trim() || undefined,
    };
    if (motivo === "PLAN_DE_PAGO" && fechaPrimera) {
      payload.planPago = { cantidadCuotas: cuotasNum, fechaVencimientoPrimeraCuota: format(fechaPrimera, "yyyy-MM-dd") };
    }
    if (motivo === "CAMBIO_PARAMETRO") {
      payload.cambioParametro = { parametro: parametro.trim(), valorAnterior: valorAnterior.trim(), valorNuevo: valorNuevo.trim() };
    }
    onConfirm({ kind: "cerrar", payload });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
        {/* Header institucional */}
        <DialogHeader className="space-y-1 border-b border-border bg-surface-muted/40 px-6 py-4 text-left">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <StopCircle className="h-3.5 w-3.5" />
            Seguimiento de morosidad
          </div>
          <DialogTitle className="font-serif text-xl leading-tight">
            Cerrar proceso
          </DialogTitle>
          <DialogDescription className="text-[12.5px]">
            Indicá el motivo de cierre. El proceso quedará cerrado y se registrará en el historial del inmueble.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {/* Cantidad seleccionada */}
          <div className="flex items-center justify-between rounded-md border border-border bg-surface-muted/40 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft text-primary">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Inmuebles alcanzados
                </div>
                <div className="text-[13px] text-foreground">
                  Se cerrará el proceso de cada inmueble seleccionado.
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-serif text-2xl font-semibold tabular leading-none text-foreground">
                {numberFmt.format(total)}
              </div>
              <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                inmueble{total === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          {/* Motivo de cierre */}
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium">
              Motivo de cierre <span className="text-destructive">*</span>
            </Label>
            <Select value={motivo} onValueChange={(v) => setMotivo(v as MotivoCierre)}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue placeholder="Seleccionar motivo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REGULARIZACION" className="text-[13px]">
                  Regularización total
                </SelectItem>
                <SelectItem value="PLAN_DE_PAGO" className="text-[13px]">
                  Plan de pago
                </SelectItem>
                <SelectItem value="JUDICIALIZACION" className="text-[13px]">
                  Judicialización
                </SelectItem>
                <SelectItem value="OTRO" className="text-[13px]">
                  Otro
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CASO 1: Regularización total */}
          {motivo === "REGULARIZACION" && (
            <div className="space-y-4 rounded-md border border-border bg-surface-muted/30 px-4 py-3.5">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium">
                  Fecha de regularización <span className="text-destructive">*</span>
                </Label>
                <Popover open={openFechaReg} onOpenChange={setOpenFechaReg}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 w-full justify-start text-left text-[13px] font-normal",
                        !fechaReg && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-70" />
                      {fechaReg
                        ? format(fechaReg, "dd 'de' MMMM yyyy", { locale: es })
                        : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fechaReg}
                      onSelect={(d) => {
                        setFechaReg(d);
                        setOpenFechaReg(false);
                      }}
                      initialFocus
                      locale={es}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <ObservacionField
                value={observacion}
                onChange={setObservacion}
                required={false}
              />
            </div>
          )}

          {/* CASO 2: Plan de pago */}
          {motivo === "PLAN_DE_PAGO" && (
            <div className="space-y-4 rounded-md border border-border bg-surface-muted/30 px-4 py-3.5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium">
                    Fecha de creación <span className="text-destructive">*</span>
                  </Label>
                  <Popover open={openFechaPlan} onOpenChange={setOpenFechaPlan}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-9 w-full justify-start text-left text-[13px] font-normal",
                          !fechaPlan && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-70" />
                        {fechaPlan
                          ? format(fechaPlan, "dd/MM/yyyy", { locale: es })
                          : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fechaPlan}
                        onSelect={(d) => {
                          setFechaPlan(d);
                          setOpenFechaPlan(false);
                        }}
                        initialFocus
                        locale={es}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium">
                    Cantidad de cuotas <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={cuotas}
                    onChange={(e) => setCuotas(e.target.value)}
                    className="h-9 text-[13px]"
                    placeholder="Ej. 6"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium">
                  1° vencimiento <span className="text-destructive">*</span>
                </Label>
                <Popover open={openFechaPrimera} onOpenChange={setOpenFechaPrimera}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 w-full justify-start text-left text-[13px] font-normal",
                        !fechaPrimera && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-70" />
                      {fechaPrimera
                        ? format(fechaPrimera, "dd 'de' MMMM yyyy", { locale: es })
                        : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fechaPrimera}
                      onSelect={(d) => {
                        setFechaPrimera(d);
                        setOpenFechaPrimera(false);
                      }}
                      initialFocus
                      locale={es}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {fechaPrimera && cuotasValidas && cuotasNum > 1 && (
                  <p className="text-[11.5px] text-muted-foreground">
                    Las cuotas siguientes vencen el día {fechaPrimera.getDate()} de cada mes.
                  </p>
                )}
              </div>

              <ObservacionField
                value={observacion}
                onChange={setObservacion}
                required={false}
              />

              <div className="flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2 text-[11.5px] text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  El sistema solo guarda el plan como información histórica. No realiza seguimiento de cuotas.
                </span>
              </div>
            </div>
          )}

          {/* CASO 3: Otros / Judicialización */}
          {(motivo === "OTRO" || motivo === "JUDICIALIZACION") && (
            <div className="space-y-4 rounded-md border border-border bg-surface-muted/30 px-4 py-3.5">
              <div className="text-[11.5px] text-muted-foreground">
                Fecha de cierre:{" "}
                <span className="tabular font-medium text-foreground">
                  {format(today, "dd/MM/yyyy")}
                </span>{" "}
                (automática)
              </div>
              <ObservacionField
                value={observacion}
                onChange={setObservacion}
                required
              />
            </div>
          )}

          {motivo === "CAMBIO_PARAMETRO" && (
            <div className="space-y-4 rounded-md border border-border bg-surface-muted/30 px-4 py-3.5">
              <div className="grid gap-4 sm:grid-cols-3">
                <Input value={parametro} onChange={(e) => setParametro(e.target.value)} placeholder="Parámetro" className="h-9 text-[13px]" />
                <Input value={valorAnterior} onChange={(e) => setValorAnterior(e.target.value)} placeholder="Valor anterior" className="h-9 text-[13px]" />
                <Input value={valorNuevo} onChange={(e) => setValorNuevo(e.target.value)} placeholder="Valor nuevo" className="h-9 text-[13px]" />
              </div>
              <ObservacionField value={observacion} onChange={setObservacion} required={false} />
            </div>
          )}

          {motivo && (
            <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12.5px] text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Al confirmar, el proceso quedará{" "}
                <span className="font-semibold">cerrado</span> de forma definitiva.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex-row items-center justify-end gap-2 border-t border-border bg-surface-muted/40 px-6 py-3">
          <Button variant="outline" onClick={onCancel} className="h-9">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!puedeConfirmar || mutating} className="h-9">
            Confirmar cierre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ObservacionField({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  required: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label className="text-[12px] font-medium">
          Observación{" "}
          {required ? (
            <span className="text-destructive">*</span>
          ) : (
            <span className="text-[11px] font-normal text-muted-foreground">(opcional)</span>
          )}
        </Label>
        <span className="text-[10.5px] tabular text-muted-foreground">{value.length}/500</span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Detalle del cierre..."
        rows={3}
        maxLength={500}
        className="resize-none text-[13px]"
      />
    </div>
  );
}

/* -------- Modal institucional: Compromiso de pago -------- */

function CompromisoPagoDialog({
  seleccionados,
  onCancel,
  onConfirm,
  mutating = false,
}: {
  seleccionados: InmuebleMoroso[];
  onCancel: () => void;
  onConfirm: (data: AccionDialogConfirmPayload) => void;
  mutating?: boolean;
}) {
  const total = seleccionados.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const en30 = new Date(today);
  en30.setDate(en30.getDate() + 30);

  const [desde, setDesde] = useState<Date | undefined>(today);
  const [hasta, setHasta] = useState<Date | undefined>(en30);
  const [observacion, setObservacion] = useState("");
  const [montoComprometido, setMontoComprometido] = useState("");
  const [openDesde, setOpenDesde] = useState(false);
  const [openHasta, setOpenHasta] = useState(false);

  const rangoInvalido = !!(desde && hasta && hasta.getTime() < desde.getTime());
  const puedeConfirmar = !!desde && !!hasta && !rangoInvalido;

  const handleConfirm = () => {
    if (!puedeConfirmar || !desde || !hasta) return;
onConfirm({ kind: "compromiso", payload: { fechaDesde: format(desde, "yyyy-MM-dd"), fechaHasta: format(hasta, "yyyy-MM-dd"), montoComprometido: montoComprometido.trim() ? Number(montoComprometido) : undefined, observacion: observacion.trim() || undefined } });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
        {/* Header institucional */}
        <DialogHeader className="space-y-1 border-b border-border bg-surface-muted/40 px-6 py-4 text-left">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <HandCoins className="h-3.5 w-3.5" />
            Seguimiento de morosidad
          </div>
          <DialogTitle className="font-serif text-xl leading-tight">
            Registrar compromiso de pago
          </DialogTitle>
          <DialogDescription className="text-[12.5px]">
            Definí el período comprometido por el contribuyente. El proceso quedará pausado mientras esté vigente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {/* Cantidad seleccionada */}
          <div className="flex items-center justify-between rounded-md border border-border bg-surface-muted/40 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft text-primary">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Inmuebles alcanzados
                </div>
                <div className="text-[13px] text-foreground">
                  Se registrará un compromiso por cada inmueble seleccionado.
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-serif text-2xl font-semibold tabular leading-none text-foreground">
                {numberFmt.format(total)}
              </div>
              <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                inmueble{total === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          {/* Fecha desde / Fecha hasta */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium">
                Fecha desde <span className="text-destructive">*</span>
              </Label>
              <Popover open={openDesde} onOpenChange={setOpenDesde}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 w-full justify-start text-left text-[13px] font-normal",
                      !desde && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-70" />
                    {desde
                      ? format(desde, "dd 'de' MMMM yyyy", { locale: es })
                      : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={desde}
                    onSelect={(d) => {
                      setDesde(d);
                      setOpenDesde(false);
                    }}
                    initialFocus
                    locale={es}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium">
                Fecha hasta <span className="text-destructive">*</span>
              </Label>
              <Popover open={openHasta} onOpenChange={setOpenHasta}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 w-full justify-start text-left text-[13px] font-normal",
                      !hasta && "text-muted-foreground",
                      rangoInvalido && "border-destructive text-destructive",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-70" />
                    {hasta
                      ? format(hasta, "dd 'de' MMMM yyyy", { locale: es })
                      : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={hasta}
                    onSelect={(d) => {
                      setHasta(d);
                      setOpenHasta(false);
                    }}
                    disabled={(d) => (desde ? d.getTime() < desde.getTime() : false)}
                    initialFocus
                    locale={es}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {rangoInvalido && (
                <p className="text-[11.5px] text-destructive">
                  La fecha hasta no puede ser anterior a la fecha desde.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium">Monto comprometido <span className="text-[11px] font-normal text-muted-foreground">(opcional)</span></Label>
            <Input type="number" min={0} value={montoComprometido} onChange={(e) => setMontoComprometido(e.target.value)} className="h-9 text-[13px]" placeholder="Ej. 150000" />
          </div>

          {/* Observación */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label className="text-[12px] font-medium">Observación</Label>
              <span className="text-[11px] text-muted-foreground">Opcional</span>
            </div>
            <Textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Detalle del compromiso (ej. acordado por mostrador, plan informal, etc.)"
              rows={3}
              maxLength={500}
              className="resize-none text-[13px]"
            />
            <div className="text-right text-[10.5px] tabular text-muted-foreground">
              {observacion.length}/500
            </div>
          </div>

          {/* Aviso de pausa */}
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-800 dark:text-amber-300">
            <PauseCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Al confirmar, el proceso de seguimiento quedará{" "}
              <span className="font-semibold">pausado</span> mientras el compromiso esté vigente.
            </span>
          </div>
        </div>

        {/* Footer institucional */}
        <DialogFooter className="flex-row items-center justify-between gap-3 border-t border-border bg-surface-muted/40 px-6 py-3 sm:justify-between">
          <div className="text-[12px] text-muted-foreground">
            {desde && hasta && !rangoInvalido ? (
              <>
                Vigencia:{" "}
                <span className="tabular font-semibold text-foreground">
                  {format(desde, "dd/MM/yyyy")} – {format(hasta, "dd/MM/yyyy")}
                </span>
              </>
            ) : (
              "Definí el período de vigencia"
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onCancel} className="h-9">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!puedeConfirmar || mutating} className="h-9">
              Confirmar y pausar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function accionInfo(accion: AccionMasiva | null): { titulo: string; descripcion: string } {
  if (!accion) return { titulo: "", descripcion: "" };
  switch (accion.kind) {
    case "enviar-etapa":
      return {
        titulo: `Enviar a "${accion.etapa}"`,
        descripcion: "Los inmuebles avanzarán manualmente a la etapa seleccionada. Recordá que las etapas no pueden retroceder.",
      };
    case "enviar-siguiente":
      return {
        titulo: "Enviar a etapa siguiente",
        descripcion: "Cada inmueble avanzará una posición en el proceso configurado.",
      };
    case "iniciar":
      return {
        titulo: "Iniciar proceso",
        descripcion: "Se iniciará el seguimiento en la primera etapa configurada para los inmuebles seleccionados.",
      };
    case "cerrar":
      return {
        titulo: "Cerrar proceso",
        descripcion: "El proceso actual quedará cerrado. La acción registrará el cierre en el historial del inmueble.",
      };
    case "compromiso":
      return {
        titulo: "Registrar compromiso de pago",
        descripcion: "Se registrará un compromiso operativo. No modifica el estado de etapa.",
      };
  }
}

/* -------- Modal institucional: Mover a etapa -------- */

function MoverEtapaDialog({
  accion,
  seleccionados,
  onCancel,
  onConfirm,
  mutating = false,
}: {
  accion: Extract<AccionMasiva, { kind: "enviar-etapa" }>;
  seleccionados: InmuebleMoroso[];
  onCancel: () => void;
  onConfirm: (data: AccionDialogConfirmPayload) => void;
  mutating?: boolean;
}) {
  const total = seleccionados.length;
  const [etapaDestino, setEtapaDestino] = useState<EtapaSeguimiento>(accion.etapa);
  const [fecha, setFecha] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [observacion, setObservacion] = useState("");
  const [montoComprometido, setMontoComprometido] = useState("");
  const [calOpen, setCalOpen] = useState(false);

  // Validación: cantidad que ya está en una etapa posterior (no puede retroceder).
  const idxDestino = etapaIndex(etapaDestino);
  const bloqueados = seleccionados.filter((m) => etapaIndex(m.etapa) > idxDestino).length;
  const aplicables = total - bloqueados;

  const handleConfirm = () => {
onConfirm({ kind: "enviar-etapa", payload: { observacion: observacion.trim() || undefined } });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
        {/* Header institucional */}
        <DialogHeader className="space-y-1 border-b border-border bg-surface-muted/40 px-6 py-4 text-left">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            Gestión de etapas
          </div>
          <DialogTitle className="font-serif text-xl leading-tight">
            Mover inmuebles a una etapa
          </DialogTitle>
          <DialogDescription className="text-[12.5px]">
            Operación manual e irreversible: las etapas no admiten retroceso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {/* Cantidad seleccionada */}
          <div className="flex items-center justify-between rounded-md border border-border bg-surface-muted/40 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft text-primary">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Inmuebles seleccionados
                </div>
                <div className="text-[13px] text-foreground">
                  Se aplicará la operación al conjunto seleccionado.
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-serif text-2xl font-semibold tabular leading-none text-foreground">
                {numberFmt.format(total)}
              </div>
              <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                inmueble{total === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          {/* Etapa destino + Fecha programada */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium">
                Etapa destino <span className="text-destructive">*</span>
              </Label>
              <Select
                value={etapaDestino}
                onValueChange={(v) => setEtapaDestino(v as EtapaSeguimiento)}
              >
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(etapasApi.length ? etapasApi : etapasSeguimiento).map((e) => (
                    <SelectItem key={e} value={e} className="text-[13px]">
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11.5px] text-muted-foreground">
                Solo se mueven hacia adelante en el proceso configurado.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium">Fecha programada</Label>
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 w-full justify-start text-left text-[13px] font-normal",
                      !fecha && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-70" />
                    {fecha
                      ? format(fecha, "dd 'de' MMMM yyyy", { locale: es })
                      : "Sin fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fecha}
                    onSelect={(d) => {
                      setFecha(d);
                      setCalOpen(false);
                    }}
                    initialFocus
                    locale={es}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-[11.5px] text-muted-foreground">
                Solo informativa para planificación operativa.
              </p>
            </div>
          </div>

          {/* Observación opcional */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label className="text-[12px] font-medium">Observación</Label>
              <span className="text-[11px] text-muted-foreground">Opcional</span>
            </div>
            <Textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Detalle interno del movimiento (motivo, instrucción al área, etc.)"
              rows={3}
              maxLength={500}
              className="resize-none text-[13px]"
            />
            <div className="text-right text-[10.5px] tabular text-muted-foreground">
              {observacion.length}/500
            </div>
          </div>

          {/* Aviso de bloqueos por no-retroceso */}
          {bloqueados > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-800 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <span className="font-semibold">{bloqueados}</span> inmueble
                {bloqueados === 1 ? "" : "s"} ya{" "}
                {bloqueados === 1 ? "está" : "están"} en una etapa posterior y{" "}
                {bloqueados === 1 ? "será omitido" : "serán omitidos"} (no se permite retroceso).
              </span>
            </div>
          )}
        </div>

        {/* Footer institucional con resumen */}
        <DialogFooter className="flex-row items-center justify-between gap-3 border-t border-border bg-surface-muted/40 px-6 py-3 sm:justify-between">
          <div className="text-[12px] text-muted-foreground">
            Se aplicará a{" "}
            <span className="tabular font-semibold text-foreground">
              {numberFmt.format(aplicables)}
            </span>{" "}
            de {numberFmt.format(total)}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onCancel} className="h-9">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={aplicables === 0 || mutating} className="h-9">
              Confirmar movimiento
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}