import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarIcon,
  FileDown,
  FileSpreadsheet,
  Building2,
  HandCoins,
  ListChecks,
  CalendarRange,
  Filter,
  History,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  conteoPorTipo,
  filtrarAcciones,
  getEstadoInmuebles,
  getMorosidadTotal,
  getMorososPorDistrito,
  getMorososPorGrupo,
  getPlanesDePago,
  serieDiaria,
  TIPOS_NOTIFICACION,
  TIPOS_REGULARIZACION,
} from "@/data/reportes";
import { exportarReportePdf, exportarReporteXlsx } from "@/lib/exportReporte";
import { ultimosMovimientos } from "@/data/mock";
import type { AccionRegistro, AccionTipo } from "@/types/reportes";
import type { MovimientoTipo } from "@/types/mock";
import { reportesApi } from "@/services/api/reportesApi";
import { mapReporteAccionesFechas, mapReporteAccionesRegularizacion, mapReporteEstadoInmuebles, mapReporteHistorialMovimientos, mapReporteMorosos } from "@/adapters/reportes";
import { USE_API } from "@/lib/apiClient";

/* ---------- Helpers ---------- */

const numberFmt = new Intl.NumberFormat("es-AR");
const moneyFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const pctFmt = (n: number) => `${n.toFixed(1)}%`;
const dateFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const ORGANISMO = "AOSC — Administración de Obras Sanitarias";

type ReporteId =
  | "morosos-grupo-distrito"
  | "acciones-regularizacion"
  | "estado-inmuebles"
  | "acciones-fechas"
  | "historial-movimientos";

type ReporteSource = "api" | "mock";
type ReporteDataState<T> = { data: T; loading: boolean; error: string | null; empty: boolean; source: ReporteSource };

function getReporteMorososViewModel() {
  const grupos = getMorososPorGrupo();
  const distritos = getMorososPorDistrito();
  const total = getMorosidadTotal();
  return { grupos, distritos, total };
}
function getReporteEstadoInmueblesViewModel() {
  return { rows: getEstadoInmuebles() };
}
function getReporteHistorialMovimientosViewModel() {
  return { rows: ultimosMovimientos };
}
function getReporteAccionesFechasViewModel(desde: Date | null, hasta: Date | null) {
  const rows = filtrarAcciones(desde, hasta);
  return { rows };
}
function getReporteAccionesRegularizacionViewModel(desde: Date | null, hasta: Date | null) {
  const rows = filtrarAcciones(desde, hasta, TIPOS_REGULARIZACION);
  return { rows };
}

interface ReporteDef {
  id: ReporteId;
  titulo: string;
  descripcion: string;
  icono: React.ComponentType<{ className?: string }>;
  conFechas: boolean;
}

const REPORTES: ReporteDef[] = [
  {
    id: "morosos-grupo-distrito",
    titulo: "Morosos por grupo y distrito",
    descripcion: "Distribución actual de inmuebles morosos.",
    icono: Building2,
    conFechas: false,
  },
  {
    id: "acciones-regularizacion",
    titulo: "Regularizaciones y planes",
    descripcion: "Regularizaciones, planes de pago y compromisos.",
    icono: HandCoins,
    conFechas: true,
  },
  {
    id: "estado-inmuebles",
    titulo: "Estado actual de inmuebles",
    descripcion: "Listado completo del padrón con su estado.",
    icono: ListChecks,
    conFechas: false,
  },
  {
    id: "acciones-fechas",
    titulo: "Acciones entre fechas",
    descripcion:
      "Avisos, intimaciones, cortes y demás acciones del período, con evolución diaria y detalle.",
    icono: CalendarRange,
    conFechas: true,
  },
  {
    id: "historial-movimientos",
    titulo: "Historial de movimientos",
    descripcion: "Acciones registradas en el sistema con filtros y detalle.",
    icono: History,
    conFechas: false,
  },
];

/* ---------- Presets de fecha ---------- */

type PresetId = "hoy" | "7dias" | "mes" | "anio" | "custom";

function presetRange(p: PresetId): { desde: Date | null; hasta: Date | null } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (p === "hoy") return { desde: now, hasta: now };
  if (p === "7dias") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { desde: d, hasta: now };
  }
  if (p === "mes") {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { desde: d, hasta: now };
  }
  if (p === "anio") {
    const d = new Date(now.getFullYear(), 0, 1);
    return { desde: d, hasta: now };
  }
  return { desde: null, hasta: null };
}

/* ============================================================
   Página principal — Reportes
   ============================================================ */

export default function Reportes() {
  const { reporteId } = useParams<{ reporteId?: string }>();
  const navigate = useNavigate();
  const reporteActivo =
    REPORTES.find((r) => r.id === reporteId) ?? REPORTES[0];

  const breadcrumb = reporteId
    ? [{ label: "Reportes", to: "/reportes" }, { label: reporteActivo.titulo }]
    : [{ label: "Reportes" }];

  return (
    <>
      <AppHeader
        title="Reportes"
        description="Reportes operativos del sistema. Visualizá indicadores en pantalla y exportá a PDF o Excel."
        breadcrumb={breadcrumb}
      />

      <main className="flex-1 px-6 py-6">
        {!reporteId ? (
          <ReportesCatalogo onSelect={(id) => navigate(`/reportes/${id}`)} />
        ) : (
          <div className="rounded-md border border-border bg-surface shadow-sm">
            <ReportePanel key={reporteActivo.id} reporte={reporteActivo} />
          </div>
        )}
      </main>
    </>
  );
}

/* ============================================================
   Catálogo (vista al entrar sin reporte seleccionado)
   ============================================================ */

function ReportesCatalogo({ onSelect }: { onSelect: (id: ReporteId) => void }) {
  return (
    <div className="rounded-md border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Catálogo
        </div>
        <h2 className="mt-0.5 font-serif text-[19px] font-semibold leading-tight text-foreground">
          Reportes disponibles
        </h2>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          Seleccioná un reporte del menú lateral o desde las tarjetas siguientes.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTES.map((r) => {
          const Icon = r.icono;
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onSelect(r.id)}
                className="group flex w-full items-start gap-3 rounded-md border border-border bg-surface px-3 py-3 text-left transition-colors hover:border-primary/30 hover:bg-primary-soft"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-muted text-muted-foreground group-hover:border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium leading-tight text-foreground">
                    {r.titulo}
                  </span>
                  <span className="mt-1 block text-[12px] leading-snug text-muted-foreground">
                    {r.descripcion}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ============================================================
   Panel del reporte activo
   ============================================================ */

function ReportePanel({ reporte }: { reporte: ReporteDef }) {
  const { toast } = useToast();
  const [preset, setPreset] = useState<PresetId>("mes");
  const [{ desde, hasta }, setRango] = useState(() => presetRange("mes"));
  const [exportando, setExportando] = useState(false);
  const [morososState, setMorososState] = useState<ReporteDataState<ReturnType<typeof getReporteMorososViewModel>>>({
    data: getReporteMorososViewModel(),
    loading: false,
    error: null,
    empty: false,
    source: "mock",
  });
  const [accionesFechasState, setAccionesFechasState] = useState<ReporteDataState<ReturnType<typeof getReporteAccionesFechasViewModel>>>({
    data: getReporteAccionesFechasViewModel(desde, hasta),
    loading: false,
    error: null,
    empty: false,
    source: "mock",
  });
  const [accionesRegularizacionState, setAccionesRegularizacionState] = useState<ReporteDataState<ReturnType<typeof getReporteAccionesRegularizacionViewModel>>>({
    data: getReporteAccionesRegularizacionViewModel(desde, hasta),
    loading: false,
    error: null,
    empty: false,
    source: "mock",
  });
  const [estadoInmueblesState, setEstadoInmueblesState] = useState<ReporteDataState<ReturnType<typeof getReporteEstadoInmueblesViewModel>>>({
    data: getReporteEstadoInmueblesViewModel(),
    loading: false,
    error: null,
    empty: false,
    source: "mock",
  });
  const [historialState, setHistorialState] = useState<ReporteDataState<ReturnType<typeof getReporteHistorialMovimientosViewModel>>>({
    data: getReporteHistorialMovimientosViewModel(),
    loading: false,
    error: null,
    empty: false,
    source: "mock",
  });

  useEffect(() => {
    if (reporte.id !== "morosos-grupo-distrito" || !USE_API) return;
    let cancelled = false;
    setMorososState((s) => ({ ...s, loading: true, error: null }));
    reportesApi
      .morososGrupoDistrito()
      .then((payload) => {
        if (cancelled) return;
        const vm = mapReporteMorosos(payload);
        setMorososState({
          data: vm,
          loading: false,
          error: null,
          empty: vm.grupos.length === 0 && vm.distritos.length === 0,
          source: "api",
        });
      })
      .catch((e: any) => {
        if (cancelled) return;
        setMorososState((s) => ({
          ...s,
          loading: false,
          error: e?.message ?? "No se pudo cargar el reporte.",
          source: "mock",
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [reporte.id]);

  useEffect(() => {
    if (reporte.id !== "acciones-fechas") return;
    if (!USE_API) {
      const vm = getReporteAccionesFechasViewModel(desde, hasta);
      setAccionesFechasState({ data: vm, loading: false, error: null, empty: vm.rows.length === 0, source: "mock" });
      return;
    }
    let cancelled = false;
    setAccionesFechasState((s) => ({ ...s, loading: true, error: null }));
    reportesApi
      .accionesFechas({
        fechaDesde: desde ? format(desde, "yyyy-MM-dd") : undefined,
        fechaHasta: hasta ? format(hasta, "yyyy-MM-dd") : undefined,
      })
      .then((payload) => {
        if (cancelled) return;
        const vm = { rows: mapReporteAccionesFechas(payload) };
        setAccionesFechasState({ data: vm, loading: false, error: null, empty: vm.rows.length === 0, source: "api" });
      })
      .catch((e: any) => {
        if (cancelled) return;
        setAccionesFechasState((s) => ({ ...s, loading: false, error: e?.message ?? "No se pudo cargar el reporte." }));
        toast({ title: "Error al cargar reporte", description: "No fue posible obtener acciones entre fechas.", variant: "destructive" });
      });
    return () => {
      cancelled = true;
    };
  }, [reporte.id, desde, hasta, toast]);

  useEffect(() => {
    if (reporte.id !== "estado-inmuebles") return;
    if (!USE_API) {
      const vm = getReporteEstadoInmueblesViewModel();
      setEstadoInmueblesState({ data: vm, loading: false, error: null, empty: vm.rows.length === 0, source: "mock" });
      return;
    }
    let cancelled = false;
    setEstadoInmueblesState((s) => ({ ...s, loading: true, error: null }));
    reportesApi
      .estadoInmuebles()
      .then((payload) => {
        if (cancelled) return;
        const vm = { rows: mapReporteEstadoInmuebles(payload) };
        setEstadoInmueblesState({ data: vm, loading: false, error: null, empty: vm.rows.length === 0, source: "api" });
      })
      .catch((e: any) => {
        if (cancelled) return;
        setEstadoInmueblesState((s) => ({ ...s, loading: false, error: e?.message ?? "No se pudo cargar el reporte." }));
        toast({ title: "Error al cargar reporte", description: "No fue posible obtener estado de inmuebles.", variant: "destructive" });
      });
    return () => {
      cancelled = true;
    };
  }, [reporte.id, toast]);

  useEffect(() => {
    if (reporte.id !== "historial-movimientos") return;
    if (!USE_API) {
      const vm = getReporteHistorialMovimientosViewModel();
      setHistorialState({ data: vm, loading: false, error: null, empty: vm.rows.length === 0, source: "mock" });
      return;
    }
    let cancelled = false;
    setHistorialState((s) => ({ ...s, loading: true, error: null }));
    reportesApi
      .historialMovimientos()
      .then((payload) => {
        if (cancelled) return;
        const vm = { rows: mapReporteHistorialMovimientos(payload) };
        setHistorialState({ data: vm, loading: false, error: null, empty: vm.rows.length === 0, source: "api" });
      })
      .catch((e: any) => {
        if (cancelled) return;
        setHistorialState((s) => ({ ...s, loading: false, error: e?.message ?? "No se pudo cargar el reporte." }));
        toast({ title: "Error al cargar reporte", description: "No fue posible obtener historial de movimientos.", variant: "destructive" });
      });
    return () => {
      cancelled = true;
    };
  }, [reporte.id, toast]);

  useEffect(() => {
    if (reporte.id !== "acciones-regularizacion") return;
    if (!USE_API) {
      const vm = getReporteAccionesRegularizacionViewModel(desde, hasta);
      setAccionesRegularizacionState({ data: vm, loading: false, error: null, empty: vm.rows.length === 0, source: "mock" });
      return;
    }
    let cancelled = false;
    setAccionesRegularizacionState((s) => ({ ...s, loading: true, error: null }));
    reportesApi
      .accionesRegularizacion({
        fechaDesde: desde ? format(desde, "yyyy-MM-dd") : undefined,
        fechaHasta: hasta ? format(hasta, "yyyy-MM-dd") : undefined,
      })
      .then((payload) => {
        if (cancelled) return;
        const vm = { rows: mapReporteAccionesRegularizacion(payload) };
        setAccionesRegularizacionState({ data: vm, loading: false, error: null, empty: vm.rows.length === 0, source: "api" });
      })
      .catch((e: any) => {
        if (cancelled) return;
        setAccionesRegularizacionState((s) => ({ ...s, loading: false, error: e?.message ?? "No se pudo cargar el reporte." }));
        toast({ title: "Error al cargar reporte", description: "No fue posible obtener regularizaciones.", variant: "destructive" });
      });
    return () => {
      cancelled = true;
    };
  }, [reporte.id, desde, hasta, toast]);

  const reporteState = useMemo(() => {
    if (reporte.id === "morosos-grupo-distrito") {
      return morososState;
    }
    if (reporte.id === "estado-inmuebles") {
      return estadoInmueblesState;
    }
    if (reporte.id === "historial-movimientos") {
      return historialState;
    }
    if (reporte.id === "acciones-fechas") {
      return accionesFechasState;
    }
    if (reporte.id === "acciones-regularizacion") {
      return accionesRegularizacionState;
    }
    return { data: null, loading: false, error: null, empty: false, source: "mock" as ReporteSource };
  }, [reporte.id, morososState, accionesFechasState, accionesRegularizacionState, estadoInmueblesState, historialState]);

  const setPresetSafe = (p: PresetId) => {
    setPreset(p);
    if (p !== "custom") setRango(presetRange(p));
  };

  const filtrosLabel = useMemo(() => {
    if (!reporte.conFechas) return [];
    const desdeS = desde ? dateFmt.format(desde) : "Inicio";
    const hastaS = hasta ? dateFmt.format(hasta) : "Hoy";
    return [`Período: ${desdeS} — ${hastaS}`];
  }, [reporte.conFechas, desde, hasta]);

  const Header = (
    <div className="border-b border-border px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Reporte
          </div>
          <h2 className="mt-0.5 font-serif text-[19px] font-semibold leading-tight text-foreground">
            {reporte.titulo}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">{reporte.descripcion}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11.5px] text-muted-foreground">Exportar:</span>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-[12.5px]"
            disabled={exportando}
            onClick={() => handleExport("xlsx")}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel (.xlsx)
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-[12.5px]"
            disabled={exportando}
            onClick={() => handleExport("pdf")}
          >
            <FileDown className="h-3.5 w-3.5" />
            PDF
          </Button>
        </div>
      </div>

      {reporte.conFechas && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <div className="flex items-center gap-1.5 pr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Período
          </div>

          <div className="flex items-center gap-1 rounded-md border border-border bg-surface-muted/40 p-0.5">
            {(
              [
                { id: "hoy", label: "Hoy" },
                { id: "7dias", label: "Últimos 7 días" },
                { id: "mes", label: "Mes actual" },
                { id: "anio", label: "Año actual" },
                { id: "custom", label: "Personalizado" },
              ] as { id: PresetId; label: string }[]
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPresetSafe(p.id)}
                className={cn(
                  "rounded-[4px] px-2 py-1 text-[12px] font-medium transition-colors",
                  preset === p.id
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <DateInput
            label="Desde"
            date={desde}
            onChange={(d) => {
              setPreset("custom");
              setRango((r) => ({ ...r, desde: d }));
            }}
          />
          <DateInput
            label="Hasta"
            date={hasta}
            onChange={(d) => {
              setPreset("custom");
              setRango((r) => ({ ...r, hasta: d }));
            }}
          />
        </div>
      )}
    </div>
  );

  const handleExport = async (kind: "pdf" | "xlsx") => {
    setExportando(true);
    try {
      await runExport(kind, reporte, { desde, hasta }, filtrosLabel, reporteState);
      toast({
        title: kind === "pdf" ? "PDF generado" : "Excel generado",
        description: `Reporte “${reporte.titulo}” exportado correctamente.`,
      });
    } catch (e) {
      toast({
        title: "Error al exportar",
        description: "No fue posible generar el archivo.",
        variant: "destructive",
      });
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="flex flex-col">
      {Header}
      <div className="px-4 py-4">
        {reporte.id === "morosos-grupo-distrito" && <ReporteMorososGrupoDistrito state={reporteState as ReporteDataState<ReturnType<typeof getReporteMorososViewModel>>} />}
        {reporte.id === "acciones-regularizacion" && (
          <ReporteAcciones state={reporteState as ReporteDataState<ReturnType<typeof getReporteAccionesRegularizacionViewModel>>} tipos={TIPOS_REGULARIZACION} variante="regularizacion" />
        )}
        {reporte.id === "estado-inmuebles" && <ReporteEstadoInmuebles state={reporteState as ReporteDataState<ReturnType<typeof getReporteEstadoInmueblesViewModel>>} />}
        {reporte.id === "acciones-fechas" && <ReporteAccionesFechas state={reporteState as ReporteDataState<ReturnType<typeof getReporteAccionesFechasViewModel>>} />}
        {reporte.id === "historial-movimientos" && <ReporteHistorialMovimientos state={reporteState as ReporteDataState<ReturnType<typeof getReporteHistorialMovimientosViewModel>>} />}
      </div>
    </div>
  );
}

function DateInput({
  label,
  date,
  onChange,
}: {
  label: string;
  date: Date | null;
  onChange: (d: Date | null) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[12.5px] tabular">
          <CalendarIcon className="h-3.5 w-3.5 opacity-70" />
          <span className="text-muted-foreground">{label}:</span>
          {date ? format(date, "dd/MM/yyyy", { locale: es }) : "—"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date ?? undefined}
          onSelect={(d) => onChange(d ?? null)}
          initialFocus
          locale={es}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

/* ============================================================
   Bloques visuales reutilizables
   ============================================================ */

function KpiBar({ items }: { items: { label: string; value: string; tone?: "default" | "primary" | "danger" | "ok" }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((k) => (
        <div
          key={k.label}
          className="rounded-md border border-border bg-surface-muted/40 px-3 py-2.5"
        >
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            {k.label}
          </div>
          <div
            className={cn(
              "mt-0.5 font-serif text-[20px] font-semibold leading-tight tabular",
              k.tone === "danger" && "text-destructive",
              k.tone === "ok" && "text-[hsl(var(--status-closed))]",
              k.tone === "primary" && "text-primary",
              !k.tone && "text-foreground",
            )}
          >
            {k.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  );
}

function ChartBox({
  id,
  title,
  children,
  height = 240,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <SectionTitle>{title}</SectionTitle>
      <div id={id} style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const COLORS_BAR = ["#1c355c", "#2c5282", "#3b6db1", "#5b8bd1", "#82a9e0", "#a8c2eb"];
const COLORS_TIPO: Record<string, string> = {
  "Aviso de deuda": "#3b6db1",
  "Intimación": "#d97706",
  "Aviso de corte": "#ea580c",
  "Corte": "#b91c1c",
  "Regularización": "#15803d",
  "Plan de pago": "#0d9488",
  "Compromiso de pago": "#7c3aed",
};

/* ============================================================
   Reporte 1 — Morosos por grupo y distrito
   ============================================================ */

function ReporteMorososGrupoDistrito({
  state,
}: {
  state: ReporteDataState<ReturnType<typeof getReporteMorososViewModel>>;
}) {
  if (state.loading) {
    return <div className="rounded-md border border-border bg-surface-muted/30 px-4 py-8 text-center text-[12.5px] text-muted-foreground">Cargando reporte…</div>;
  }
  if (state.error) {
    return <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-8 text-center text-[12.5px] text-destructive">{state.error}</div>;
  }
  const { grupos, distritos, total } = state.data;
  if (state.empty) {
    return <div className="rounded-md border border-border bg-surface-muted/30 px-4 py-8 text-center text-[12.5px] text-muted-foreground">Sin datos para el reporte seleccionado.</div>;
  }

  return (
    <div className="space-y-5">
      <KpiBar
        items={[
          { label: "Total padrón", value: numberFmt.format(total.totalInmuebles) },
          { label: "Deudores", value: numberFmt.format(total.deudores), tone: "primary" },
          { label: "Morosos", value: numberFmt.format(total.morosos), tone: "danger" },
          { label: "Al día", value: numberFmt.format(total.alDia), tone: "ok" },
          { label: "% morosidad", value: pctFmt(total.porcentajeMorosidad), tone: "primary" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartBox id="rep-grupos-chart" title="Morosos por grupo">
          <BarChart data={grupos} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e9ef" />
            <XAxis dataKey="etiqueta" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="morosos" radius={[3, 3, 0, 0]}>
              {grupos.map((_, i) => (
                <Cell key={i} fill={COLORS_BAR[i % COLORS_BAR.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartBox>
        <ChartBox id="rep-distritos-chart" title="Morosos por distrito">
          <BarChart data={distritos} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e9ef" />
            <XAxis dataKey="distrito" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="morosos" radius={[3, 3, 0, 0]}>
              {distritos.map((_, i) => (
                <Cell key={i} fill={COLORS_BAR[i % COLORS_BAR.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartBox>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <SectionTitle>Por grupo</SectionTitle>
          <DataTable
            head={["Grupo", "Distrito", "Padrón", "Deudores", "Morosos", "% Morosidad"]}
            rows={grupos.map((g) => [
              g.grupo,
              g.distrito,
              numberFmt.format(g.totalInmuebles),
              numberFmt.format(g.deudores),
              numberFmt.format(g.morosos),
              pctFmt(g.porcentaje),
            ])}
            alignRight={[2, 3, 4, 5]}
          />
        </div>
        <div>
          <SectionTitle>Por distrito</SectionTitle>
          <DataTable
            head={["Distrito", "Padrón", "Deudores", "Morosos", "% Morosidad"]}
            rows={distritos.map((d) => [
              d.distrito,
              numberFmt.format(d.totalInmuebles),
              numberFmt.format(d.deudores),
              numberFmt.format(d.morosos),
              pctFmt(d.porcentaje),
            ])}
            alignRight={[1, 2, 3, 4]}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Reporte 2 / 3 — Acciones por tipo
   ============================================================ */

function ReporteAcciones({
  state,
  tipos,
  variante,
}: {
  state: ReporteDataState<{ rows: AccionRegistro[] }>;
  tipos: AccionTipo[];
  variante: "notificacion" | "regularizacion";
}) {
  const filtradas = useMemo(() => (state.data.rows ?? []).filter((r) => tipos.includes(r.tipo)), [state.data.rows, tipos]);
  const conteos = useMemo(() => conteoPorTipo(filtradas, tipos), [filtradas, tipos]);
  const total = filtradas.length;
  if (state.loading) return <div className="text-sm text-muted-foreground">Cargando reporte…</div>;
  if (state.error) return <div className="text-sm text-destructive">{state.error}</div>;
  if (state.empty) return <div className="text-sm text-muted-foreground">No hay acciones para el período seleccionado.</div>;

  return (
    <div className="space-y-5">
      <KpiBar
        items={[
          { label: "Total acciones", value: numberFmt.format(total), tone: "primary" },
          ...conteos.slice(0, 3).map((c) => ({
            label: c.tipo,
            value: numberFmt.format(c.cantidad),
          })),
        ]}
      />

      <ChartBox
        id={`rep-acciones-${variante}-chart`}
        title={variante === "notificacion" ? "Acciones de notificación" : "Acciones de regularización"}
      >
        <BarChart data={conteos} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6e9ef" />
          <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="cantidad" radius={[3, 3, 0, 0]}>
            {conteos.map((c, i) => (
              <Cell key={i} fill={COLORS_TIPO[c.tipo] ?? COLORS_BAR[i % COLORS_BAR.length]} />
            ))}
          </Bar>
        </BarChart>
      </ChartBox>

      <div>
        <SectionTitle>Detalle por tipo</SectionTitle>
        <DataTable
          head={["Tipo de acción", "Cantidad", "% del total"]}
          rows={conteos.map((c) => [
            c.tipo,
            numberFmt.format(c.cantidad),
            total === 0 ? "—" : pctFmt((c.cantidad / total) * 100),
          ])}
          alignRight={[1, 2]}
        />
      </div>

      {variante === "regularizacion" && (
        <>
          <ReporteAccionesDetalle
            titulo="Regularizaciones — detalle"
            descripcion="Inmuebles que regularizaron su situación en el período."
            acciones={filtradas.filter((a) => a.tipo === "Regularización")}
          />
          <ReportePlanesDePagoDetalle desde={desde} hasta={hasta} />
          <ReporteAccionesDetalle
            titulo="Compromisos de pago — detalle"
            descripcion="Compromisos de pago asumidos por los titulares en el período."
            acciones={filtradas.filter((a) => a.tipo === "Compromiso de pago")}
          />
        </>
      )}
    </div>
  );
}

/* ============================================================
   Detalle simple de acciones (regularizaciones / compromisos)
   ============================================================ */

function ReporteAccionesDetalle({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion?: string;
  acciones: AccionRegistro[];
}) {
  const PAGE = 15;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(acciones.length / PAGE));
  const safePage = Math.min(page, totalPages);
  const slice = acciones.slice((safePage - 1) * PAGE, safePage * PAGE);

  return (
    <div className="space-y-3">
      <div>
        <SectionTitle>{titulo}</SectionTitle>
        {descripcion && (
          <p className="-mt-1 mb-2 text-[12px] text-muted-foreground">{descripcion}</p>
        )}
      </div>
      {acciones.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-surface-muted/30 px-4 py-6 text-center text-[12.5px] text-muted-foreground">
          Sin registros en el período seleccionado.
        </div>
      ) : (
        <>
          <DataTable
            head={["Fecha", "Cuenta", "Titular", "Grupo", "Distrito", "Responsable"]}
            rows={slice.map((a) => [
              dateFmt.format(a.fecha),
              a.cuenta,
              a.titular,
              a.grupo,
              a.distrito,
              a.usuario,
            ])}
          />
          <Paginador
            page={safePage}
            totalPages={totalPages}
            setPage={setPage}
            total={acciones.length}
            pageSize={PAGE}
          />
        </>
      )}
    </div>
  );
}

/* ============================================================
   Detalle de planes de pago (subtabla del reporte de regularización)
   ============================================================ */

function ReportePlanesDePagoDetalle({
  desde,
  hasta,
}: {
  desde: Date | null;
  hasta: Date | null;
}) {
  const planes = useMemo(() => getPlanesDePago(desde, hasta), [desde, hasta]);
  const PAGE = 15;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(planes.length / PAGE));
  const slice = planes.slice((page - 1) * PAGE, page * PAGE);

  const totalCuotas = planes.reduce((acc, p) => acc + p.cuotas, 0);
  const promedioCuotas = planes.length === 0 ? 0 : totalCuotas / planes.length;
  const montoTotal = planes.reduce((acc, p) => acc + p.montoTotal, 0);

  return (
    <div className="space-y-3">
      <SectionTitle>Planes de pago — detalle</SectionTitle>
      <KpiBar
        items={[
          { label: "Planes en el período", value: numberFmt.format(planes.length), tone: "primary" },
          { label: "Promedio de cuotas", value: promedioCuotas.toFixed(1) },
          { label: "Monto comprometido", value: moneyFmt.format(montoTotal) },
        ]}
      />
      <DataTable
        head={[
          "Fecha alta",
          "Cuenta",
          "Titular",
          "Grupo",
          "Cuotas",
          "Monto total",
          "Próx. vencimiento",
          "Vto. final",
          "Estado",
        ]}
        rows={slice.map((p) => [
          dateFmt.format(p.fechaAlta),
          p.cuenta,
          p.titular,
          p.grupo,
          numberFmt.format(p.cuotas),
          moneyFmt.format(p.montoTotal),
          dateFmt.format(p.proximoVencimiento),
          dateFmt.format(p.vencimientoFinal),
          p.estado,
        ])}
        alignRight={[4, 5]}
      />
      <Paginador
        page={page}
        totalPages={totalPages}
        setPage={setPage}
        total={planes.length}
        pageSize={PAGE}
      />
    </div>
  );
}

/* ============================================================
   Reporte 4 — Estado actual de inmuebles
   ============================================================ */

function ReporteEstadoInmuebles({
  state,
}: {
  state: ReporteDataState<ReturnType<typeof getReporteEstadoInmueblesViewModel>>;
}) {
  if (state.loading) return <div className="text-sm text-muted-foreground">Cargando reporte…</div>;
  if (state.error) return <div className="text-sm text-destructive">{state.error}</div>;
  if (state.empty) return <div className="text-sm text-muted-foreground">Sin datos para el reporte seleccionado.</div>;
  const rows = state.data.rows;
  const morosos = rows.filter((r) => r.estado === "Moroso").length;
  const deudores = rows.filter((r) => r.estado === "Deudor").length;
  const alDia = rows.filter((r) => r.estado === "Al día").length;
  const totalDeuda = rows.reduce((acc, r) => acc + r.montoAdeudado, 0);

  const PAGE = 25;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE));
  const slice = rows.slice((page - 1) * PAGE, page * PAGE);

  return (
    <div className="space-y-5">
      <KpiBar
        items={[
          { label: "Total inmuebles", value: numberFmt.format(rows.length) },
          { label: "Al día", value: numberFmt.format(alDia), tone: "ok" },
          { label: "Deudores", value: numberFmt.format(deudores), tone: "primary" },
          { label: "Morosos", value: numberFmt.format(morosos), tone: "danger" },
          { label: "Deuda total", value: moneyFmt.format(totalDeuda), tone: "primary" },
        ]}
      />

      <ChartBox id="rep-estado-chart" title="Distribución de inmuebles por estado" height={220}>
        <PieChart>
          <Pie
            data={[
              { name: "Al día", value: alDia, fill: "hsl(145 35% 38%)" },
              { name: "Deudores", value: deudores, fill: "hsl(215 75% 38%)" },
              { name: "Morosos", value: morosos, fill: "hsl(8 78% 50%)" },
            ]}
            dataKey="value"
            nameKey="name"
            innerRadius={45}
            outerRadius={80}
            paddingAngle={2}
          />
          <Tooltip />
          <Legend />
        </PieChart>
      </ChartBox>

      <div>
        <SectionTitle>Listado completo del padrón</SectionTitle>
        <DataTable
          head={["N° cuenta", "Titular", "Grupo", "Distrito", "Estado", "Etapa", "Cuotas", "Deuda"]}
          rows={slice.map((r) => [
            r.cuenta,
            r.titular,
            r.grupo,
            r.distrito,
            r.estado,
            r.etapa,
            r.cuotasAdeudadas === 0 ? "—" : numberFmt.format(r.cuotasAdeudadas),
            r.montoAdeudado === 0 ? "—" : moneyFmt.format(r.montoAdeudado),
          ])}
          alignRight={[6, 7]}
        />
        <Paginador page={page} totalPages={totalPages} setPage={setPage} total={rows.length} pageSize={PAGE} />
      </div>
    </div>
  );
}

/* ============================================================
   Reporte 5 — Acciones entre fechas
   ============================================================ */

function ReporteAccionesFechas({
  state,
}: {
  state: ReporteDataState<ReturnType<typeof getReporteAccionesFechasViewModel>>;
}) {
  const ALL_TIPOS: AccionTipo[] = useMemo(
    () => [...TIPOS_NOTIFICACION, ...TIPOS_REGULARIZACION],
    [],
  );
  const [tiposSeleccionados, setTiposSeleccionados] = useState<AccionTipo[]>(ALL_TIPOS);

  const toggleTipo = (t: AccionTipo) => {
    setTiposSeleccionados((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };
  const seleccionarTodos = () => setTiposSeleccionados(ALL_TIPOS);
  const limpiarTodos = () => setTiposSeleccionados([]);

  const filtradas = useMemo(() => {
    const base = state.data.rows ?? [];
    if (tiposSeleccionados.length === 0) return [];
    return base.filter((a) => tiposSeleccionados.includes(a.tipo));
  }, [state.data.rows, tiposSeleccionados]);
  const serie = useMemo(() => serieDiaria(filtradas), [filtradas]);
  const conteos = useMemo(() => conteoPorTipo(filtradas, ALL_TIPOS), [filtradas, ALL_TIPOS]);
  const conteosVisibles = useMemo(
    () => conteos.filter((c) => tiposSeleccionados.includes(c.tipo)),
    [conteos, tiposSeleccionados],
  );

  const PAGE = 25;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtradas.length / PAGE));
  const safePage = Math.min(page, totalPages);
  const slice = filtradas.slice((safePage - 1) * PAGE, safePage * PAGE);

  const usuariosUnicos = new Set(filtradas.map((a) => a.usuario)).size;
  const tipoTop = [...conteos].sort((a, b) => b.cantidad - a.cantidad)[0]?.tipo ?? "—";
  const total = filtradas.length;

  if (state.loading) return <div className="text-sm text-muted-foreground">Cargando reporte…</div>;
  if (state.error) return <div className="text-sm text-destructive">{state.error}</div>;
  if (state.empty) return <div className="text-sm text-muted-foreground">No hay acciones para el período seleccionado.</div>;

  return (
    <div className="space-y-5">
      <KpiBar
        items={[
          { label: "Total acciones", value: numberFmt.format(total), tone: "primary" },
          { label: "Días con actividad", value: numberFmt.format(serie.length) },
          { label: "Usuarios distintos", value: numberFmt.format(usuariosUnicos) },
          { label: "Tipo más frecuente", value: tipoTop },
        ]}
      />

      {/* Filtros por tipo de acción */}
      <div className="rounded-md border border-border bg-surface-muted/40 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 pr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Tipos
          </div>
          {ALL_TIPOS.map((t) => {
            const activo = tiposSeleccionados.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTipo(t)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                  activo
                    ? "border-border bg-surface text-foreground shadow-sm"
                    : "border-transparent bg-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: COLORS_TIPO[t] ?? "#94a3b8", opacity: activo ? 1 : 0.4 }}
                />
                {t}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={seleccionarTodos}
              className="rounded-[4px] px-2 py-1 text-[11.5px] font-medium text-muted-foreground hover:text-foreground"
            >
              Todos
            </button>
            <span className="text-muted-foreground/60">·</span>
            <button
              type="button"
              onClick={limpiarTodos}
              className="rounded-[4px] px-2 py-1 text-[11.5px] font-medium text-muted-foreground hover:text-foreground"
            >
              Ninguno
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartBox id="rep-acciones-fechas-chart" title="Acciones por día">
          <LineChart data={serie} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e9ef" />
            <XAxis dataKey="fechaLabel" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="total"
              stroke="hsl(215 65% 32%)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartBox>

        <ChartBox id="rep-acciones-fechas-tipo-chart" title="Acciones por tipo">
          <BarChart data={conteosVisibles} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e9ef" />
            <XAxis dataKey="tipo" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="cantidad" radius={[3, 3, 0, 0]}>
              {conteosVisibles.map((c, i) => (
                <Cell key={i} fill={COLORS_TIPO[c.tipo] ?? COLORS_BAR[i % COLORS_BAR.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartBox>
      </div>

      <div>
        <SectionTitle>Resumen por tipo</SectionTitle>
        <DataTable
          head={["Tipo de acción", "Cantidad", "% del total"]}
          rows={conteosVisibles.map((c) => [
            c.tipo,
            numberFmt.format(c.cantidad),
            total === 0 ? "—" : pctFmt((c.cantidad / total) * 100),
          ])}
          alignRight={[1, 2]}
        />
      </div>

      <div>
        <SectionTitle>Detalle de acciones en el período</SectionTitle>
        <DataTable
          head={["Fecha", "Cuenta", "Titular", "Tipo", "Grupo", "Distrito", "Usuario"]}
          rows={slice.map((a) => [
            dateFmt.format(a.fecha),
            a.cuenta,
            a.titular,
            a.tipo,
            a.grupo,
            a.distrito,
            a.usuario,
          ])}
        />
        <Paginador
          page={safePage}
          totalPages={totalPages}
          setPage={setPage}
          total={filtradas.length}
          pageSize={PAGE}
        />
      </div>
    </div>
  );
}

/* ============================================================
   Reporte 7 — Historial de movimientos
   ============================================================ */

const MOVIMIENTO_TIPO_LABEL: Record<MovimientoTipo, string> = {
  intimacion: "Intimación",
  corte: "Corte",
  regularizacion: "Regularización",
  plan_pago: "Plan de pago",
  compromiso: "Compromiso",
  aviso_deuda: "Aviso de deuda",
  aviso_corte: "Aviso de corte",
  configuracion: "Configuración",
};

function ReporteHistorialMovimientos({
  state,
}: {
  state: ReporteDataState<ReturnType<typeof getReporteHistorialMovimientosViewModel>>;
}) {
  if (state.loading) return <div className="text-sm text-muted-foreground">Cargando reporte…</div>;
  if (state.error) return <div className="text-sm text-destructive">{state.error}</div>;
  if (state.empty) return <div className="text-sm text-muted-foreground">Sin movimientos para mostrar.</div>;
  const baseRows = state.data.rows;
  const [tipo, setTipo] = useState<MovimientoTipo | "todos">("todos");
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const PAGE = 25;

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return baseRows.filter((m) => {
      if (tipo !== "todos" && m.tipo !== tipo) return false;
      if (!q) return true;
      return (
        (m.cuenta?.toLowerCase().includes(q) ?? false) ||
        (m.titular?.toLowerCase().includes(q) ?? false) ||
        m.usuario.toLowerCase().includes(q) ||
        m.accion.toLowerCase().includes(q) ||
        (m.etapa?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [tipo, busqueda]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE));
  const safePage = Math.min(page, totalPages);
  const slice = filtrados.slice((safePage - 1) * PAGE, safePage * PAGE);

  const conteoPorTipoMov = useMemo(() => {
    const counts: Partial<Record<MovimientoTipo, number>> = {};
    filtrados.forEach((m) => {
      counts[m.tipo] = (counts[m.tipo] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([k, v]) => ({ tipo: MOVIMIENTO_TIPO_LABEL[k as MovimientoTipo], cantidad: v ?? 0 }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [filtrados]);

  const tipoTop = conteoPorTipoMov[0]?.tipo ?? "—";

  return (
    <div className="space-y-5">
      <KpiBar
        items={[
          { label: "Total movimientos", value: numberFmt.format(filtrados.length), tone: "primary" },
          { label: "Usuarios distintos", value: numberFmt.format(new Set(filtrados.map((m) => m.usuario)).size) },
          { label: "Tipos representados", value: numberFmt.format(conteoPorTipoMov.length) },
          { label: "Tipo más frecuente", value: tipoTop },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface-muted/40 px-3 py-2">
        <div className="flex items-center gap-1.5 pr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filtros
        </div>
        <Select
          value={tipo}
          onValueChange={(v) => {
            setTipo(v as MovimientoTipo | "todos");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-[200px] text-[12.5px]">
            <SelectValue placeholder="Tipo de movimiento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {(Object.keys(MOVIMIENTO_TIPO_LABEL) as MovimientoTipo[]).map((t) => (
              <SelectItem key={t} value={t}>
                {MOVIMIENTO_TIPO_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por usuario, cuenta, titular o acción…"
          className="h-8 w-[280px] text-[12.5px]"
        />
      </div>

      <div>
        <SectionTitle>Detalle de movimientos</SectionTitle>
        <DataTable
          head={["Fecha", "Usuario", "Acción"]}
          rows={slice.map((m) => [
            m.fecha,
            m.usuario,
            m.accion,
          ])}
        />
        <Paginador
          page={safePage}
          totalPages={totalPages}
          setPage={setPage}
          total={filtrados.length}
          pageSize={PAGE}
        />
      </div>
    </div>
  );
}

/* ============================================================
   Tabla de datos compacta
   ============================================================ */

function DataTable({
  head,
  rows,
  alignRight = [],
}: {
  head: string[];
  rows: (string | number)[][];
  alignRight?: number[];
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-border bg-surface-muted/60 hover:bg-surface-muted/60">
            {head.map((h, i) => (
              <TableHead
                key={i}
                className={cn(
                  "h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
                  alignRight.includes(i) && "text-right",
                )}
              >
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={head.length}
                className="h-24 text-center text-[13px] text-muted-foreground"
              >
                Sin registros para el período/filtros seleccionados.
              </TableCell>
            </TableRow>
          )}
          {rows.map((r, ri) => (
            <TableRow key={ri} className="border-border text-[13px]">
              {r.map((c, ci) => (
                <TableCell
                  key={ci}
                  className={cn(
                    alignRight.includes(ci) && "text-right tabular",
                    ci === 0 && "font-medium text-foreground",
                  )}
                >
                  {c}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function Paginador({
  page,
  totalPages,
  setPage,
  total,
  pageSize,
}: {
  page: number;
  totalPages: number;
  setPage: (n: number) => void;
  total: number;
  pageSize: number;
}) {
  if (total <= pageSize) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="mt-2 flex items-center justify-between text-[12px] text-muted-foreground">
      <div>
        Mostrando <span className="tabular font-medium text-foreground">{start}–{end}</span> de{" "}
        <span className="tabular font-medium text-foreground">{total}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[12px]"
          disabled={page <= 1}
          onClick={() => setPage(Math.max(1, page - 1))}
        >
          Anterior
        </Button>
        <span className="px-2 tabular">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[12px]"
          disabled={page >= totalPages}
          onClick={() => setPage(Math.min(totalPages, page + 1))}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
   Lógica de exportación
   ============================================================ */

async function runExport(
  kind: "pdf" | "xlsx",
  reporte: ReporteDef,
  rango: { desde: Date | null; hasta: Date | null },
  filtrosLabel: string[],
  reporteState?: ReporteDataState<any>,
) {
  const stamp = new Date().toISOString().slice(0, 10);
  const baseName = reporte.titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const filename = `${baseName}-${stamp}.${kind === "pdf" ? "pdf" : "xlsx"}`;

  const meta = {
    organismo: ORGANISMO,
    titulo: reporte.titulo,
    subtitulo: reporte.descripcion,
    filtros: filtrosLabel,
    generadoEn: new Date(),
  };

  if (reporte.id === "morosos-grupo-distrito") {
    const grupos = reporteState?.data?.grupos ?? getMorososPorGrupo();
    const distritos = reporteState?.data?.distritos ?? getMorososPorDistrito();
    const total = reporteState?.data?.total ?? getMorosidadTotal();
    const head = ["Categoría", "Grupo", "Distrito", "Padrón", "Deudores", "Morosos", "% Morosidad"];
    const body: (string | number)[][] = [
      ...grupos.map((g) => ["Grupo", g.grupo, g.distrito, g.totalInmuebles, g.deudores, g.morosos, pctFmt(g.porcentaje)]),
      ...distritos.map((d) => ["Distrito", "—", d.distrito, d.totalInmuebles, d.deudores, d.morosos, pctFmt(d.porcentaje)]),
    ];
    if (kind === "pdf") {
      await exportarReportePdf({
        meta: {
          ...meta,
          kpis: [
            { label: "Total padrón", value: numberFmt.format(total.totalInmuebles) },
            { label: "Deudores", value: numberFmt.format(total.deudores) },
            { label: "Morosos", value: numberFmt.format(total.morosos) },
            { label: "Al día", value: numberFmt.format(total.alDia) },
            { label: "% morosidad", value: pctFmt(total.porcentajeMorosidad) },
          ],
        },
        chartElementIds: ["rep-grupos-chart", "rep-distritos-chart"],
        table: { head, body, columnStyles: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } } },
        filename,
      });
    } else {
      exportarReporteXlsx({
        sheets: [
          { name: "Por grupo", head: ["Grupo", "Distrito", "Padrón", "Deudores", "Morosos", "% Morosidad"], body: grupos.map((g) => [g.grupo, g.distrito, g.totalInmuebles, g.deudores, g.morosos, pctFmt(g.porcentaje)]) },
          { name: "Por distrito", head: ["Distrito", "Padrón", "Deudores", "Morosos", "% Morosidad"], body: distritos.map((d) => [d.distrito, d.totalInmuebles, d.deudores, d.morosos, pctFmt(d.porcentaje)]) },
        ],
        filename,
      });
    }
    return;
  }

  if (reporte.id === "acciones-regularizacion") {
    const tipos = TIPOS_REGULARIZACION;
    const filtradas = (reporteState?.data?.rows as AccionRegistro[] | undefined) ?? filtrarAcciones(rango.desde, rango.hasta, tipos);
    const conteos = conteoPorTipo(filtradas, tipos);
    const total = filtradas.length;
    const head = ["Tipo de acción", "Cantidad", "% del total"];
    const body = conteos.map((c) => [c.tipo, c.cantidad, total === 0 ? "—" : pctFmt((c.cantidad / total) * 100)]);
    const chartId = "rep-acciones-regularizacion-chart";
    const planes = getPlanesDePago(rango.desde, rango.hasta);
    const regularizaciones = filtradas.filter((a) => a.tipo === "Regularización");
    const compromisos = filtradas.filter((a) => a.tipo === "Compromiso de pago");
    const detalleAccionHead = ["Fecha", "Cuenta", "Titular", "Grupo", "Distrito", "Responsable"];
    const toDetalleBody = (rows: AccionRegistro[]) =>
      rows.map((a) => [
        dateFmt.format(a.fecha),
        a.cuenta,
        a.titular,
        a.grupo,
        a.distrito,
        a.usuario,
      ]);
    const planesHead = [
      "Fecha alta", "Cuenta", "Titular", "Grupo", "Distrito",
      "Cuotas", "Monto cuota", "Monto total",
      "Próx. vencimiento", "Vto. final", "Estado", "Responsable",
    ];
    const planesBody = planes.map((p) => [
      dateFmt.format(p.fechaAlta),
      p.cuenta,
      p.titular,
      p.grupo,
      p.distrito,
      p.cuotas,
      p.montoCuota,
      p.montoTotal,
      dateFmt.format(p.proximoVencimiento),
      dateFmt.format(p.vencimientoFinal),
      p.estado,
      p.responsable,
    ]);
    if (kind === "pdf") {
      const extraTables: NonNullable<Parameters<typeof exportarReportePdf>[0]["extraTables"]> = [];
      if (regularizaciones.length > 0) {
        extraTables.push({
          title: "Regularizaciones — detalle",
          head: detalleAccionHead,
          body: toDetalleBody(regularizaciones),
        });
      }
      if (planes.length > 0) {
        extraTables.push({
          title: "Planes de pago — detalle",
          head: ["Fecha", "Cuenta", "Titular", "Grupo", "Cuotas", "Monto total", "Próx. vto.", "Vto. final", "Estado"],
          body: planes.map((p) => [
            dateFmt.format(p.fechaAlta),
            p.cuenta,
            p.titular,
            p.grupo,
            p.cuotas,
            moneyFmt.format(p.montoTotal),
            dateFmt.format(p.proximoVencimiento),
            dateFmt.format(p.vencimientoFinal),
            p.estado,
          ]),
          columnStyles: { 4: { halign: "right" }, 5: { halign: "right" } },
        });
      }
      if (compromisos.length > 0) {
        extraTables.push({
          title: "Compromisos de pago — detalle",
          head: detalleAccionHead,
          body: toDetalleBody(compromisos),
        });
      }
      await exportarReportePdf({
        meta: {
          ...meta,
          kpis: [
            { label: "Total", value: numberFmt.format(total) },
            ...conteos.slice(0, 3).map((c) => ({ label: c.tipo, value: numberFmt.format(c.cantidad) })),
          ],
        },
        chartElementIds: [chartId],
        table: { head, body, columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } } },
        extraTables: extraTables.length > 0 ? extraTables : undefined,
        filename,
      });
    } else {
      exportarReporteXlsx({
        sheets: [
          { name: "Resumen", head, body },
          {
            name: "Detalle",
            head: ["Fecha", "Cuenta", "Titular", "Tipo", "Grupo", "Distrito", "Usuario"],
            body: filtradas.map((a) => [
              dateFmt.format(a.fecha),
              a.cuenta,
              a.titular,
              a.tipo,
              a.grupo,
              a.distrito,
              a.usuario,
            ]),
          },
          ...(regularizaciones.length > 0
            ? [{ name: "Regularizaciones", head: detalleAccionHead, body: toDetalleBody(regularizaciones) }]
            : []),
          ...(planes.length > 0
            ? [{ name: "Planes de pago", head: planesHead, body: planesBody }]
            : []),
          ...(compromisos.length > 0
            ? [{ name: "Compromisos de pago", head: detalleAccionHead, body: toDetalleBody(compromisos) }]
            : []),
        ],
        filename,
      });
    }
    return;
  }

  if (reporte.id === "estado-inmuebles") {
    const rows = reporteState?.data?.rows ?? getEstadoInmuebles();
    const morosos = rows.filter((r) => r.estado === "Moroso").length;
    const deudores = rows.filter((r) => r.estado === "Deudor").length;
    const alDia = rows.filter((r) => r.estado === "Al día").length;
    const totalDeuda = rows.reduce((acc, r) => acc + r.montoAdeudado, 0);
    const head = ["N° cuenta", "Titular", "Grupo", "Distrito", "Estado", "Etapa", "Cuotas", "Deuda"];
    const body = rows.map((r) => [
      r.cuenta,
      r.titular,
      r.grupo,
      r.distrito,
      r.estado,
      r.etapa,
      r.cuotasAdeudadas,
      r.montoAdeudado,
    ]);
    if (kind === "pdf") {
      await exportarReportePdf({
        meta: {
          ...meta,
          kpis: [
            { label: "Total", value: numberFmt.format(rows.length) },
            { label: "Al día", value: numberFmt.format(alDia) },
            { label: "Deudores", value: numberFmt.format(deudores) },
            { label: "Morosos", value: numberFmt.format(morosos) },
            { label: "Deuda total", value: moneyFmt.format(totalDeuda) },
          ],
        },
        chartElementIds: ["rep-estado-chart"],
        table: {
          head,
          body: body.map((r) => [
            r[0], r[1], r[2], r[3], r[4], r[5],
            r[6] === 0 ? "—" : numberFmt.format(r[6] as number),
            r[7] === 0 ? "—" : moneyFmt.format(r[7] as number),
          ]),
          columnStyles: { 6: { halign: "right" }, 7: { halign: "right" } },
        },
        filename,
      });
    } else {
      exportarReporteXlsx({
        sheets: [{ name: "Inmuebles", head, body }],
        filename,
      });
    }
    return;
  }

  if (reporte.id === "acciones-fechas") {
    const filtradas = reporteState?.data?.rows ?? filtrarAcciones(rango.desde, rango.hasta);
    const ALL_TIPOS: AccionTipo[] = [...TIPOS_NOTIFICACION, ...TIPOS_REGULARIZACION];
    const conteos = conteoPorTipo(filtradas, ALL_TIPOS);
    const total = filtradas.length;
    const usuariosUnicos = new Set(filtradas.map((a) => a.usuario)).size;
    const tipoTop = [...conteos].sort((a, b) => b.cantidad - a.cantidad)[0]?.tipo ?? "—";
    const head = ["Fecha", "Cuenta", "Titular", "Tipo", "Grupo", "Distrito", "Usuario"];
    const body = filtradas.map((a) => [
      dateFmt.format(a.fecha),
      a.cuenta,
      a.titular,
      a.tipo,
      a.grupo,
      a.distrito,
      a.usuario,
    ]);
    const resumenHead = ["Tipo de acción", "Cantidad", "% del total"];
    const resumenBody = conteos.map((c) => [
      c.tipo,
      c.cantidad,
      total === 0 ? "—" : pctFmt((c.cantidad / total) * 100),
    ]);
    if (kind === "pdf") {
      await exportarReportePdf({
        meta: {
          ...meta,
          kpis: [
            { label: "Total acciones", value: numberFmt.format(total) },
            { label: "Días con actividad", value: numberFmt.format(serieDiaria(filtradas).length) },
            { label: "Usuarios distintos", value: numberFmt.format(usuariosUnicos) },
            { label: "Tipo más frecuente", value: tipoTop },
          ],
        },
        chartElementIds: ["rep-acciones-fechas-chart", "rep-acciones-fechas-tipo-chart"],
        table: {
          head: resumenHead,
          body: resumenBody,
          columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
        },
        extraTables: [
          { title: "Detalle de acciones en el período", head, body },
        ],
        filename,
      });
    } else {
      exportarReporteXlsx({
        sheets: [
          { name: "Resumen por tipo", head: resumenHead, body: resumenBody },
          { name: "Detalle", head, body },
        ],
        filename,
      });
    }
    return;
  }

  if (reporte.id === "historial-movimientos") {
    const rows = reporteState?.data?.rows ?? ultimosMovimientos;
    const head = ["Fecha", "Usuario", "Acción"];
    const body = rows.map((m) => [
      m.fecha,
      m.usuario,
      m.accion,
    ]);
    if (kind === "pdf") {
      const tiposUnicos = new Set(rows.map((m) => m.tipo)).size;
      const usuariosUnicos = new Set(rows.map((m) => m.usuario)).size;
      await exportarReportePdf({
        meta: {
          ...meta,
          kpis: [
            { label: "Total movimientos", value: numberFmt.format(rows.length) },
            { label: "Usuarios distintos", value: numberFmt.format(usuariosUnicos) },
            { label: "Tipos representados", value: numberFmt.format(tiposUnicos) },
          ],
        },
        chartElementIds: [],
        table: { head, body },
        filename,
      });
    } else {
      exportarReporteXlsx({ sheets: [{ name: "Historial", head, body }], filename });
    }
    return;
  }
}

/* Marker para evitar tree-shake del import del tipo */
export type _AccionRegistroExportType = AccionRegistro;
