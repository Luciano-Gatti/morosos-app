import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Hash,
  User,
  MapPin,
  Building2,
  PlayCircle,
  PauseCircle,
  CircleCheck,
  CircleDashed,
  Calendar,
  FileText,
  HandCoins,
  Lock,
  AlertCircle,
  StickyNote,
  ListOrdered,
  GitBranch,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { USE_API } from "@/lib/apiClient";
import { seguimientoApi } from "@/services/api/seguimientoApi";
import { inmueblesApi } from "@/services/api/inmueblesApi";
import {
  getHistorialInmueble,
} from "@/demo/historialSeguimientoDemo";
import { isHistorialEmpty, mapHistorialSeguimiento, type HistorialSeguimientoViewModel } from "@/adapters/historialSeguimiento";
import type { CierreProceso, ProcesoSeguimiento, RegistroHistorial } from "@/types/historialSeguimiento";
import type { EstadoProceso, EtapaSeguimiento } from "@/types/seguimiento";

export default function HistorialSeguimiento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [historialVm, setHistorialVm] = useState<HistorialSeguimientoViewModel | null>(null);
  const [loading, setLoading] = useState(USE_API);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    if (!USE_API) {
      const mock = getHistorialInmueble(id);
      const inmuebleMock = {
        id,
        cuenta: `Cuenta ${id}`,
        titular: "Titular demo",
        direccion: "Dirección demo",
        grupo: "-",
        distrito: "-",
        activo: true,
        seguimientoHabilitado: true,
      };
      setHistorialVm(
        mapHistorialSeguimiento(
          {
            inmueble: inmuebleMock,
            casos: mock.procesos.map((p) => ({ id: p.id, estado: p.estado, eventos: p.registros, cierre: null, compromisos: [] })),
            observaciones: mock.observacionesLibres,
          },
          id,
        ),
      );
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    Promise.all([seguimientoApi.historialInmueble(id), inmueblesApi.getById(id)])
      .then(([historialRes, inmuebleRes]) => {
        const merged = { ...historialRes, inmueble: (historialRes as any)?.inmueble ?? inmuebleRes };
        setHistorialVm(mapHistorialSeguimiento(merged, id));
      })
      .catch((e: unknown) => {
        setHistorialVm(null);
        setError(e instanceof Error ? e.message : "No se pudo cargar el historial.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const [vista, setVista] = useState<"timeline" | "tabla">("timeline");

  const inmueble = historialVm?.inmueble;
  const historial = historialVm ? { procesos: historialVm.procesos as any[], observacionesLibres: historialVm.observacionesLibres } : null;
  const empty = historialVm ? isHistorialEmpty(historialVm) : false;

  if (!id || (!loading && !error && !historial)) {
    return (
      <>
        <AppHeader
          title="Historial no disponible"
          breadcrumb={[
            { label: "Inmuebles", to: "/inmuebles" },
            { label: "Historial" },
          ]}
        />
        <main className="flex-1 px-6 py-10">
          <div className="rounded-md border border-border bg-surface p-8 text-center text-[13px] text-muted-foreground">
            El inmueble solicitado no existe.
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/inmuebles">Volver al listado</Link>
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  const procesos = historial?.procesos ?? [];
  const procesoActual = procesos.find((p) => p.estado === "abierto") ?? procesos[procesos.length - 1] ?? null;
  const ultimoRegistro = procesoActual?.registros?.[procesoActual.registros.length - 1] ?? { etapa: "-", fecha: "-", estado: "-", responsable: "-" };

  const totalRegistros = procesos.reduce((s, p) => s + p.registros.length, 0);
  const totalProcesos = procesos.length;
  const procesosCerrados = procesos.filter((p) => p.estado === "cerrado").length;

  // ordenamos procesos: actual (abierto) primero, luego cerrados desc
  const procesosOrdenados = [...procesos].reverse();

  return (
    <>
      <AppHeader
        title={`Historial de seguimiento`}
        description={`${inmueble.cuenta} · ${inmueble.titular}`}
        breadcrumb={[
          { label: "Inmuebles", to: "/inmuebles" },
          { label: inmueble.cuenta, to: `/inmuebles/${inmueble.inmuebleId}` },
          { label: "Historial de seguimiento" },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2"
            onClick={() => navigate(`/inmuebles/${inmueble.inmuebleId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inmueble
          </Button>
        }
      />

      <main className="flex-1 space-y-6 px-6 py-6">
        {loading && <div className="text-xs text-muted-foreground">Cargando historial…</div>}
        {error && <div className="text-xs text-status-debt">Error al cargar historial: {error}.</div>}
        {/* Cabecera con datos del inmueble */}
        <section className="rounded-md border border-border bg-surface shadow-sm">
          <div className="border-b border-border bg-surface-muted/40 px-5 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Datos del inmueble
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 px-5 py-5 md:grid-cols-4">
            <DataField icon={Hash} label="N° de cuenta" value={inmueble.cuenta} mono />
            <DataField icon={User} label="Titular" value={inmueble.titular} />
            <DataField icon={MapPin} label="Dirección" value={inmueble.direccion} />
            <DataField icon={Building2} label="Grupo / Distrito" value={`${inmueble.grupo} · ${inmueble.distrito}`} />
          </div>
        </section>


        {!loading && !error && empty && (
          <section className="rounded-md border border-border bg-surface p-8 text-center text-[13px] text-muted-foreground">
            No hay historial registrado para este inmueble.
          </section>
        )}
        {/* Resumen del estado actual */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <ResumenCard
            label="Proceso actual"
            valor={procesoActual?.id ?? "-"}
            sub={procesoActual?.estado === "abierto" ? "En curso" : "Último cerrado"}
            icon={GitBranch}
            tone={procesoActual?.estado === "abierto" ? "active" : "neutral"}
          />
          <ResumenCard
            label="Etapa actual"
            valor={ultimoRegistro.etapa}
            sub={`Última actualización: ${ultimoRegistro.fecha}`}
            icon={ListOrdered}
            tone="neutral"
          />
          <ResumenCard
            label="Estado"
            valor={ultimoRegistro.estado}
            sub={`Responsable: ${ultimoRegistro.responsable}`}
            icon={
              ultimoRegistro.estado === "Activo"
                ? PlayCircle
                : ultimoRegistro.estado === "Pausado"
                  ? PauseCircle
                  : CircleDashed
            }
            tone={
              ultimoRegistro.estado === "Activo"
                ? "active"
                : ultimoRegistro.estado === "Pausado"
                  ? "warn"
                  : "neutral"
            }
          />
          <ResumenCard
            label="Trazabilidad"
            valor={`${totalRegistros} actuaciones`}
            sub={`${totalProcesos} procesos · ${procesosCerrados} cerrados`}
            icon={FileText}
            tone="neutral"
          />
        </section>

        {/* Switch de vista */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-[18px] font-semibold tracking-tight text-foreground">
              Historial de procesos y actuaciones
            </h2>
            <p className="text-[12.5px] text-muted-foreground">
              Registro cronológico de todas las gestiones realizadas sobre el inmueble.
            </p>
          </div>
          <Tabs value={vista} onValueChange={(v) => setVista(v as typeof vista)}>
            <TabsList className="h-8">
              <TabsTrigger value="timeline" className="h-7 px-3 text-[12px]">
                Línea de tiempo
              </TabsTrigger>
              <TabsTrigger value="tabla" className="h-7 px-3 text-[12px]">
                Tabla cronológica
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Vista timeline */}
        {vista === "timeline" && (
          <div className="space-y-6">
            {procesosOrdenados.map((proceso) => (
              <ProcesoTimeline key={proceso.id} proceso={proceso} />
            ))}
          </div>
        )}

        {/* Vista tabla */}
        {vista === "tabla" && (
          <div className="space-y-6">
            {procesosOrdenados.map((proceso) => (
              <ProcesoTabla key={proceso.id} proceso={proceso} />
            ))}
          </div>
        )}

        {/* Observaciones libres */}
        <section className="rounded-md border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-border bg-surface-muted/40 px-5 py-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Observaciones del expediente
              </div>
              <div className="mt-0.5 text-[12px] text-muted-foreground/80">
                Notas internas registradas sobre el inmueble por el personal del organismo.
              </div>
            </div>
            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {historial.observacionesLibres.length} observaciones
            </span>
          </div>

          <div className="divide-y divide-border">
            {historial.observacionesLibres.map((obs) => (
              <article key={obs.id} className="px-5 py-5">
                <header className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-[13px] font-semibold text-foreground">{obs.autor}</span>
                  <span className="text-[11.5px] text-muted-foreground">{obs.cargo}</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[11.5px] tabular text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {obs.fecha}
                  </span>
                </header>
                <p className="max-w-[78ch] font-serif text-[15px] leading-relaxed text-foreground">
                  {obs.texto}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

/* ---------- Subcomponentes ---------- */

function DataField({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div className={cn("text-[13.5px] text-foreground", mono && "tabular font-medium")}>
        {value}
      </div>
    </div>
  );
}

type Tone = "active" | "warn" | "neutral" | "closed";

function ResumenCard({
  label,
  valor,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  valor: React.ReactNode;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
}) {
  const toneCls: Record<Tone, string> = {
    active: "text-status-active",
    warn: "text-amber-600 dark:text-amber-400",
    closed: "text-status-closed",
    neutral: "text-muted-foreground",
  };
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <Icon className={cn("h-4 w-4", toneCls[tone])} />
      </div>
      <div className="mt-1 text-[15px] font-semibold text-foreground">{valor}</div>
      {sub && <div className="mt-0.5 text-[11.5px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function ProcesoHeader({ proceso }: { proceso: ProcesoSeguimiento }) {
  const abierto = proceso.estado === "abierto";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-muted/40 px-5 py-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11.5px] font-semibold uppercase tracking-wider",
            abierto
              ? "border-status-active/20 bg-status-active-soft text-status-active"
              : "border-status-closed/20 bg-status-closed-soft text-status-closed",
          )}
        >
          {abierto ? <PlayCircle className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          {abierto ? "Proceso abierto" : "Proceso cerrado"}
        </span>
        <span className="font-serif text-[16px] font-semibold tracking-tight text-foreground">
          {proceso.id}
        </span>
        <span className="text-[12px] text-muted-foreground">
          Inicio:{" "}
          <span className="tabular text-foreground">{proceso.fechaInicio}</span>
          {proceso.fechaFin && (
            <>
              {"  ·  "}Cierre:{" "}
              <span className="tabular text-foreground">{proceso.fechaFin}</span>
            </>
          )}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted-foreground">
        <span>
          <span className="font-medium uppercase tracking-wider text-muted-foreground/80">
            Motivo apertura:
          </span>{" "}
          <span className="text-foreground">{proceso.motivoApertura}</span>
        </span>
        {proceso.motivoCierre && <CierrePill cierre={proceso.motivoCierre} />}
      </div>
    </div>
  );
}

function ProcesoTimeline({ proceso }: { proceso: ProcesoSeguimiento }) {
  return (
    <section className="rounded-md border border-border bg-surface shadow-sm">
      <ProcesoHeader proceso={proceso} />
      <ol className="relative px-5 py-6">
        <span
          aria-hidden
          className="absolute bottom-6 left-[34px] top-6 w-px bg-border"
        />
        {proceso.registros.map((r, idx) => (
          <TimelineItem
            key={r.id}
            registro={r}
            esUltimo={idx === proceso.registros.length - 1}
          />
        ))}
      </ol>
    </section>
  );
}

function TimelineItem({
  registro,
  esUltimo,
}: {
  registro: RegistroHistorial;
  esUltimo: boolean;
}) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface shadow-sm">
        <EtapaIcon etapa={registro.etapa} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <EtapaPill etapa={registro.etapa} />
          <EstadoPill estado={registro.estado} />
          {esUltimo && registro.cierre && <CierrePill cierre={registro.cierre} />}
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11.5px] tabular text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {registro.fecha} · {registro.hora}
          </span>
        </div>

        <div className="mt-2 grid gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-[auto_1fr]">
          <span className="font-medium uppercase tracking-wider text-muted-foreground">
            Motivo
          </span>
          <span className="text-foreground">{registro.motivo}</span>

          <span className="font-medium uppercase tracking-wider text-muted-foreground">
            Responsable
          </span>
          <span className="text-foreground">{registro.responsable}</span>
        </div>

        <p className="mt-2 max-w-[72ch] rounded-md border border-border bg-surface-muted/40 px-3 py-2 text-[13px] leading-relaxed text-foreground">
          {registro.observaciones}
        </p>

        {registro.compromisoPago && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[12.5px] dark:bg-amber-500/10">
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
              <HandCoins className="h-3.5 w-3.5" />
              Compromiso de pago
            </span>
            <span className="text-foreground">
              Desde:{" "}
              <span className="tabular font-medium">{registro.compromisoPago.fechaDesde}</span>
            </span>
            <span className="text-foreground">
              Hasta: <span className="tabular font-medium">{registro.compromisoPago.fechaHasta}</span>
            </span>
            <span className="ml-auto text-muted-foreground">{registro.compromisoPago.observacion}</span>
          </div>
        )}
      </div>
    </li>
  );
}

function ProcesoTabla({ proceso }: { proceso: ProcesoSeguimiento }) {
  return (
    <section className="rounded-md border border-border bg-surface shadow-sm">
      <ProcesoHeader proceso={proceso} />
      <div className="overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted/30">
              <Th className="w-[110px]">Fecha</Th>
              <Th className="w-[130px]">Proceso</Th>
              <Th className="w-[140px]">Etapa</Th>
              <Th className="w-[120px]">Estado</Th>
              <Th className="w-[180px]">Motivo</Th>
              <Th>Observaciones</Th>
              <Th className="w-[200px]">Compromiso de pago</Th>
              <Th className="w-[160px]">Cierre</Th>
            </tr>
          </thead>
          <tbody>
            {proceso.registros.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 align-top hover:bg-surface-muted/30">
                <td className="px-4 py-3 tabular text-[12.5px] text-foreground">
                  <div className="font-medium">{r.fecha}</div>
                  <div className="text-[11.5px] text-muted-foreground">{r.hora} hs</div>
                </td>
                <td className="px-4 py-3 tabular text-[12.5px] text-foreground">{r.numeroProceso}</td>
                <td className="px-4 py-3">
                  <EtapaPill etapa={r.etapa} />
                </td>
                <td className="px-4 py-3">
                  <EstadoPill estado={r.estado} />
                </td>
                <td className="px-4 py-3 text-[12.5px] text-foreground">{r.motivo}</td>
                <td className="px-4 py-3 text-[12.5px] text-foreground">
                  <p className="max-w-[48ch] leading-relaxed">{r.observaciones}</p>
                  <p className="mt-1 text-[11.5px] text-muted-foreground">
                    Resp.: {r.responsable}
                  </p>
                </td>
                <td className="px-4 py-3 text-[12.5px]">
                  {r.compromisoPago ? (
                    <div className="space-y-0.5">
                      <div className="tabular font-medium text-foreground">
                        {r.compromisoPago.fechaDesde} – {r.compromisoPago.fechaHasta}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground tabular">
                        {r.compromisoPago.observacion}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[12px] italic text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.cierre ? (
                    <CierrePill cierre={r.cierre} />
                  ) : (
                    <span className="text-[12px] italic text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "h-9 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  );
}

function EtapaPill({ etapa }: { etapa: EtapaSeguimiento }) {
  const cls: Record<EtapaSeguimiento, string> = {
    "Aviso de deuda": "border-border bg-muted text-foreground",
    "Intimación": "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    "Aviso de corte": "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400",
    "Corte": "border-destructive/20 bg-destructive/10 text-destructive",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[11.5px] font-medium", cls[etapa])}>
      {etapa}
    </span>
  );
}

function EstadoPill({ estado }: { estado: EstadoProceso }) {
  const map: Record<EstadoProceso, { cls: string; Icon: typeof PlayCircle }> = {
    "No iniciado": { cls: "border-border bg-muted text-muted-foreground", Icon: CircleDashed },
    "Activo": { cls: "border-status-active/20 bg-status-active-soft text-status-active", Icon: PlayCircle },
    "Pausado": { cls: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400", Icon: PauseCircle },
    "Cerrado": { cls: "border-status-closed/20 bg-status-closed-soft text-status-closed", Icon: CircleCheck },
  };
  const { cls, Icon } = map[estado];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium", cls)}>
      <Icon className="h-3 w-3" />
      {estado}
    </span>
  );
}

function CierrePill({ cierre }: { cierre: NonNullable<CierreProceso> }) {
  const map: Record<NonNullable<CierreProceso>, { cls: string; Icon: typeof CircleCheck }> = {
    "Regularización total": {
      cls: "border-status-closed/20 bg-status-closed-soft text-status-closed",
      Icon: CircleCheck,
    },
    "Plan de pago acordado": {
      cls: "border-status-active/20 bg-status-active-soft text-status-active",
      Icon: HandCoins,
    },
    "Cierre administrativo": {
      cls: "border-border bg-muted text-muted-foreground",
      Icon: Lock,
    },
  };
  const { cls, Icon } = map[cierre];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11.5px] font-medium", cls)}>
      <Icon className="h-3 w-3" />
      {cierre}
    </span>
  );
}

function EtapaIcon({ etapa }: { etapa: EtapaSeguimiento }) {
  const map: Record<EtapaSeguimiento, { Icon: typeof FileText; color: string }> = {
    "Aviso de deuda": { Icon: FileText, color: "text-muted-foreground" },
    "Intimación": { Icon: StickyNote, color: "text-amber-600 dark:text-amber-400" },
    "Aviso de corte": { Icon: AlertCircle, color: "text-orange-600 dark:text-orange-400" },
    "Corte": { Icon: Lock, color: "text-destructive" },
  };
  const { Icon, color } = map[etapa];
  return <Icon className={cn("h-4 w-4", color)} />;
}
