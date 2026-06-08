import { useEffect, useState } from "react";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { USE_API } from "@/lib/apiClient";
import { seguimientoApi } from "@/services/api/seguimientoApi";
import { inmueblesApi } from "@/services/api/inmueblesApi";
import { isHistorialEmpty, mapHistorialSeguimiento, type HistorialSeguimientoViewModel } from "@/adapters/historialSeguimiento";
import type { CierreProceso, ProcesoSeguimiento, RegistroHistorial } from "@/types/historialSeguimiento";
import type { EstadoProceso, EtapaSeguimiento } from "@/types/seguimiento";

export default function HistorialSeguimiento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [historialVm, setHistorialVm] = useState<HistorialSeguimientoViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openObsModal, setOpenObsModal] = useState(false);
  const [obsTexto, setObsTexto] = useState("");
  const [guardandoObs, setGuardandoObs] = useState(false);
  const [obsError, setObsError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
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

  if (!id) {
    return (
      <>
        <AppHeader
          title="Historial no disponible"
          breadcrumb={[
            { label: "Inmuebles", to: "/inmuebles" },
            { label: "Historial" },
          ]}
        />
        <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
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

  if (loading) {
    return (
      <>
        <AppHeader
          title="Historial de seguimiento"
          breadcrumb={[
            { label: "Inmuebles", to: "/inmuebles" },
            { label: "Historial" },
          ]}
        />
        <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <div className="rounded-md border border-border bg-surface p-8 text-center text-[13px] text-muted-foreground">
            Cargando historial…
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AppHeader
          title="Historial de seguimiento"
          breadcrumb={[
            { label: "Inmuebles", to: "/inmuebles" },
            { label: "Historial" },
          ]}
        />
        <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <div className="rounded-md border border-border bg-surface p-8 text-center text-[13px] text-status-debt">
            Error al cargar historial: {error}.
          </div>
        </main>
      </>
    );
  }

  if (!historialVm || !inmueble) {
    return (
      <>
        <AppHeader
          title="Historial no disponible"
          breadcrumb={[
            { label: "Inmuebles", to: "/inmuebles" },
            { label: "Historial" },
          ]}
        />
        <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <div className="rounded-md border border-border bg-surface p-8 text-center text-[13px] text-muted-foreground">
            No se encontró información del inmueble solicitado.
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
  const hayProcesoIniciado = (historialVm?.casos ?? []).some((c) => c.estado.toUpperCase() !== "NO_INICIADO");
  const sinProcesoIniciado = !hayProcesoIniciado;
  const observacionesLibres = historial?.observacionesLibres ?? [];
  const procesoActual = procesos.find((p) => p.estado === "abierto") ?? procesos[procesos.length - 1] ?? null;
  const ultimoRegistro = procesoActual?.registros?.[procesoActual.registros.length - 1] ?? { etapa: "—", fecha: null, estado: "No iniciado", responsable: "No informado" };

  const totalRegistros = procesos.reduce((s, p) => s + p.registros.length, 0);
  const totalProcesos = procesos.length;
  const procesosCerrados = procesos.filter((p) => p.estado === "cerrado").length;

  // ordenamos procesos: actual (abierto) primero, luego cerrados desc
  const procesosOrdenados = [...procesos].reverse();
  const casoAbierto = (historialVm?.casos ?? []).find((c) => ["ABIERTO", "PAUSADO"].includes(String(c.estado ?? "").toUpperCase()));

  const guardarObservacionEtapa = async () => {
    if (!casoAbierto?.casoId || !obsTexto.trim()) return;
    setObsError(null);
    setGuardandoObs(true);
    try {
      await seguimientoApi.agregarObservacionEtapa({ casoSeguimientoId: casoAbierto.casoId, observacion: obsTexto.trim() });
      const [historialRes, inmuebleRes] = await Promise.all([seguimientoApi.historialInmueble(id!), inmueblesApi.getById(id!)]);
      const merged = { ...historialRes, inmueble: (historialRes as any)?.inmueble ?? inmuebleRes };
      setHistorialVm(mapHistorialSeguimiento(merged, id!));
      setOpenObsModal(false);
      setObsTexto("");
    } catch (e: any) {
      setObsError(e?.message ?? "No se pudo guardar la observación de etapa.");
    } finally {
      setGuardandoObs(false);
    }
  };

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

      <main className="flex-1 space-y-6 px-4 py-4 sm:px-6 sm:py-6">
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


        {!loading && !error && empty && !sinProcesoIniciado && (
          <section className="rounded-md border border-border bg-surface p-8 text-center text-[13px] text-muted-foreground">
            No hay historial registrado para este inmueble.
          </section>
        )}
        {/* Resumen del estado actual */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <ResumenCard
            label="Proceso actual"
            valor={sinProcesoIniciado ? "Sin proceso iniciado" : procesoActual?.id ?? "-"}
            sub={
              sinProcesoIniciado
                ? "El inmueble aún no tiene un proceso de seguimiento iniciado."
                : procesoActual?.estado === "abierto"
                  ? "En curso"
                  : "Último cerrado"
            }
            icon={GitBranch}
            tone={sinProcesoIniciado ? "neutral" : procesoActual?.estado === "abierto" ? "active" : "neutral"}
          />
          <ResumenCard
            label="Etapa actual"
            valor={sinProcesoIniciado ? "—" : ultimoRegistro.etapa ?? "Sin etapa asignada"}
            sub={`Última actualización: ${formatFechaHora(ultimoRegistro.fecha)}`}
            icon={ListOrdered}
            tone="neutral"
          />
          <ResumenCard
            label="Estado"
            valor={ultimoRegistro.estado ?? "No informado"}
            sub={`Responsable: ${ultimoRegistro.responsable ?? "No informado"}`}
            icon={
              ultimoRegistro.estado === "Iniciado"
                ? PlayCircle
                : ultimoRegistro.estado === "Pausado"
                  ? PauseCircle
                  : CircleDashed
            }
            tone={
              ultimoRegistro.estado === "Iniciado"
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
            {sinProcesoIniciado ? (
              <section className="rounded-md border border-border bg-surface p-8 text-center">
                <h3 className="text-[14px] font-semibold text-foreground">Sin seguimiento iniciado</h3>
                <p className="mt-2 text-[13px] text-muted-foreground">
                  El inmueble aún no tiene un proceso de seguimiento iniciado.
                </p>
              </section>
            ) : (
              procesosOrdenados.map((proceso) => (
                <ProcesoTimeline
                  key={proceso.id}
                  proceso={proceso}
                  onAgregarObservacion={casoAbierto?.casoId && ["abierto", "pausado"].includes(proceso.estado) ? () => setOpenObsModal(true) : undefined}
                />
              ))
            )}
          </div>
        )}

        {/* Vista tabla */}
        {vista === "tabla" && (
          <div className="space-y-6">
            {sinProcesoIniciado ? (
              <section className="rounded-md border border-border bg-surface p-8 text-center">
                <h3 className="text-[14px] font-semibold text-foreground">Sin seguimiento iniciado</h3>
                <p className="mt-2 text-[13px] text-muted-foreground">
                  El inmueble aún no tiene un proceso de seguimiento iniciado.
                </p>
              </section>
            ) : (
              procesosOrdenados.map((proceso) => (
                <ProcesoTabla key={proceso.id} proceso={proceso} />
              ))
            )}
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
              {observacionesLibres.length} observaciones
            </span>
          </div>

          <div className="divide-y divide-border">
            {observacionesLibres.map((obs) => (
              <article key={obs.id} className="px-5 py-5">
                <header className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-[13px] font-semibold text-foreground">{obs.autor}</span>
                  <span className="text-[11.5px] text-muted-foreground">{obs.cargo}</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[11.5px] tabular text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatFechaHora(obs.fecha)}
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

      <Dialog open={openObsModal} onOpenChange={(open) => {
        setOpenObsModal(open);
        if (!open) {
          setObsTexto("");
          setObsError(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar observación a etapa</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={obsTexto}
              onChange={(e) => setObsTexto(e.target.value)}
              rows={4}
              placeholder="Escribí la observación de la etapa actual"
            />
            {obsError && <p className="text-sm text-destructive">{obsError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenObsModal(false)} disabled={guardandoObs}>Cancelar</Button>
            <Button onClick={guardarObservacionEtapa} disabled={guardandoObs || obsTexto.trim().length === 0}>
              {guardandoObs ? "Guardando..." : "Guardar observación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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


const formatFechaHora = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

const formatFecha = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const formatCurrencyOrDash = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") return "—";
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "—";
  return currencyFormatter.format(numericValue);
};

const formatHora = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

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
  const abierto = proceso.estado !== "cerrado";
  const pausado = proceso.estado === "pausado";
  const tituloEstado = !abierto ? "Proceso cerrado" : pausado ? "Proceso pausado" : "Proceso abierto";
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
          {tituloEstado}
        </span>
        <span className="font-serif text-[16px] font-semibold tracking-tight text-foreground">
          {proceso.id}
        </span>
        <span className="text-[12px] text-muted-foreground">
          Inicio:{" "}
          <span className="tabular text-foreground">{formatFechaHora(proceso.fechaInicio)}</span>
          {proceso.fechaFin && (
            <>
              {"  ·  "}Cierre:{" "}
              <span className="tabular text-foreground">{formatFechaHora(proceso.fechaFin)}</span>
            </>
          )}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted-foreground">
        {proceso.motivoCierre && <CierrePill cierre={proceso.motivoCierre} />}
      </div>
    </div>
  );
}

function ProcesoTimeline({ proceso, onAgregarObservacion }: { proceso: ProcesoSeguimiento; onAgregarObservacion?: () => void }) {
  const etapas = buildEtapaTimeline(proceso);
  const cierreRegistro = [...proceso.registros].reverse().find((registro) => isRegistroCierre(registro)) ?? null;

  const registrosOrdenados = [...proceso.registros].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  const observacionesPorEtapa = new Map<string, RegistroHistorial[]>();

  registrosOrdenados.forEach((registro) => {
    if (!isObservacionEtapa(registro)) return;
    const etapaKey = String(registro.etapa ?? "").trim();
    if (!etapaKey) return;
    const lista = observacionesPorEtapa.get(etapaKey) ?? [];
    lista.push(registro);
    observacionesPorEtapa.set(etapaKey, lista);
  });

  const filasVisibles = registrosOrdenados.filter((fila) => !!fila.etapa && !isObservacionEtapa(fila));

  const renderResumenObservacionesEtapa = (registro: RegistroHistorial) => {
    const etapaKey = String(registro.etapa ?? "").trim();
    if (!etapaKey) return null;
    const observaciones = [...(observacionesPorEtapa.get(etapaKey) ?? [])].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    if (observaciones.length === 0) return null;

    const ultimaObservacion = observaciones[observaciones.length - 1];
    const ultimaObservacionTexto = getObservacionVisible(ultimaObservacion.observaciones);
    if (!ultimaObservacionTexto) return null;

    return (
      <div className="mt-2 rounded-md border border-border/70 bg-surface-muted/20 p-2">
        <div className="font-medium">Última observación de etapa: {ultimaObservacionTexto}</div>
        {observaciones.length > 1 && (
          <div className="mt-1 text-[11.5px] text-muted-foreground">
            Hay {observaciones.length} observaciones registradas. Ver historial completo en Observaciones del expediente.
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="rounded-md border border-border bg-surface shadow-sm">
      <ProcesoHeader proceso={proceso} />
      <ol className="relative px-5 py-6">
        <span
          aria-hidden
          className="absolute bottom-6 left-[34px] top-6 w-px bg-border"
        />
        {etapas.map((etapa, idx) => <TimelineEtapaItem key={etapa.id} etapa={etapa} esUltimo={idx === etapas.length - 1} onAgregarObservacion={idx === etapas.length - 1 ? onAgregarObservacion : undefined} />)}
      </ol>
      {proceso.estado === "cerrado" && <CierreProcesoBloque proceso={proceso} cierreRegistro={cierreRegistro} />}
    </section>
  );
}

function buildEtapaTimeline(proceso: ProcesoSeguimiento) {
  const registros = [...proceso.registros].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  const etapas: Array<any> = [];
  let actual: any = null;

  registros.forEach((registro: any) => {
    const tipo = String(registro?.tipoAccion ?? "").toUpperCase();
    const esEtapa = !registro.esEventoProceso;
    const esInterno = registro.esEventoProceso && !isRegistroCierre(registro);
    if (esEtapa) {
      if (actual) {
        actual.estado = "Cerrado";
        actual.fechaCierre = registro.fecha;
      }
      actual = {
        id: registro.id,
        etapa: registro.etapa,
        estado: "Iniciado",
        fechaApertura: registro.fecha,
        fechaCierre: null,
        responsable: registro.responsable,
        observaciones: registro.observaciones,
        eventosInternos: [],
      };
      etapas.push(actual);
      return;
    }

    if (esInterno && actual) {
      actual.eventosInternos.push(registro);
    }

    if (tipo.includes("REANUDAR") && actual) {
      actual.estado = "Iniciado";
    }
  });

  if (actual && proceso.estado === "pausado") actual.estado = "Pausado";
  if (proceso.estado === "cerrado" && etapas.length > 0) {
    const ultima = etapas[etapas.length - 1];
    ultima.estado = "Cerrado";
    if (!ultima.fechaCierre) ultima.fechaCierre = proceso.fechaFin;
  }
  return etapas;
}

function TimelineEtapaItem({ etapa, esUltimo, onAgregarObservacion }: { etapa: any; esUltimo: boolean; onAgregarObservacion?: () => void }) {
  const observacionEtapa = getResumenObservacionesEtapa(etapa);
  const eventosInternosVisibles = (etapa.eventosInternos ?? []).filter((evento: RegistroHistorial) => !isObservacionEtapa(evento));
  return <li className="relative flex gap-4 pb-6 last:pb-0">
    <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface shadow-sm">
      <EtapaIcon etapa={etapa.etapa} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <EtapaPill etapa={etapa.etapa} />
        <EstadoPill estado={etapa.estado} />
        {onAgregarObservacion && etapa.estado !== "Cerrado" && (
          <Button variant="outline" size="sm" className="ml-auto h-7 text-[11.5px]" onClick={onAgregarObservacion}>
            Agregar observación
          </Button>
        )}
      </div>
      <div className="mt-2 grid gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-[auto_1fr]">
        <span className="font-medium uppercase tracking-wider text-muted-foreground">Apertura</span>
        <span className="text-foreground tabular">{formatFechaHora(etapa.fechaApertura)}</span>
        {etapa.fechaCierre && <>
          <span className="font-medium uppercase tracking-wider text-muted-foreground">Cierre</span>
          <span className="text-foreground tabular">{formatFechaHora(etapa.fechaCierre)}</span>
        </>}
        <span className="font-medium uppercase tracking-wider text-muted-foreground">Responsable</span>
        <span className="text-foreground">{etapa.responsable}</span>
      </div>
      <p className="mt-2 max-w-[72ch] rounded-md border border-border bg-surface-muted/40 px-3 py-2 text-[13px] leading-relaxed text-foreground">
        {observacionEtapa.ultimaObservacionTexto ? <><span className="font-medium">Última observación de etapa:</span> {observacionEtapa.ultimaObservacionTexto}</> : "No se dejaron asentadas observaciones para esta etapa."}
      </p>
      {observacionEtapa.totalObservaciones > 1 && (
        <p className="mt-2 text-[12px] text-muted-foreground">
          Hay {observacionEtapa.totalObservaciones} observaciones registradas. Ver historial completo en Observaciones del expediente.
        </p>
      )}
      {eventosInternosVisibles.map((evento: any) => <EventoInternoItem key={evento.id} registro={evento} />)}
    </div>
  </li>;
}

function EventoInternoItem({ registro }: { registro: RegistroHistorial }) {
  const tipo = String(registro.tipoAccion ?? "Evento");
  const mostrarCompromisoCompleto = String(registro.tipoAccion ?? "").toUpperCase().includes("COMPROMISO");
  const observacionCompromiso = getObservacionVisible(registro.compromisoPago?.observacion);
  return <div className="mt-3 rounded-md border border-border/80 bg-surface px-3 py-2 text-[12.5px]">
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 font-medium text-foreground"><HandCoins className="h-3.5 w-3.5" />{tipo}</span>
      <span className="ml-auto text-muted-foreground tabular">{formatFechaHora(registro.fecha)}</span>
    </div>
    <div className="mt-1 text-foreground">Responsable: {registro.responsable ?? "Sistema"}</div>
    {mostrarCompromisoCompleto && registro.compromisoPago && <div className="mt-2 grid gap-1 text-foreground">
      <div>Monto: {formatCurrencyOrDash(registro.compromisoPago.montoComprometido)}</div>
      <div>Vigencia: {formatFecha(registro.compromisoPago.fechaDesde)} - {formatFecha(registro.compromisoPago.fechaHasta)}</div>
      <div>Estado: {registro.compromisoPago.estadoLabel ?? registro.compromisoPago.estado}</div>
      <div className="font-medium">Observación:</div>
      <div>{observacionCompromiso ?? "No se dejaron asentadas observaciones para este compromiso."}</div>
    </div>}
  </div>;
}

function TimelineItem({
  registro,
  esUltimo,
}: {
  registro: RegistroHistorial;
  esUltimo: boolean;
}) {
  const observacion = getObservacionVisible(registro.observaciones);

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
            {formatFechaHora(registro.fecha)}
          </span>
        </div>

        <div className="mt-2 grid gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-[auto_1fr]">
          <span className="font-medium uppercase tracking-wider text-muted-foreground">
            Responsable
          </span>
          <span className="text-foreground">{registro.responsable}</span>
        </div>

        <p className="mt-2 max-w-[72ch] rounded-md border border-border bg-surface-muted/40 px-3 py-2 text-[13px] leading-relaxed text-foreground">
          {observacion ?? "No se dejaron asentadas observaciones para esta etapa."}
        </p>

        {registro.compromisoPago && (
          <div className="mt-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[12.5px] dark:bg-amber-500/10">
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
              <HandCoins className="h-3.5 w-3.5" />
              Compromiso de pago
            </span>
            <div className="mt-1 grid gap-1 text-foreground">
              <div>Responsable: {registro.compromisoPago.responsable ?? registro.responsable}</div>
              <div>Monto: {formatCurrencyOrDash(registro.compromisoPago.montoComprometido)}</div>
              <div>Vigencia: {formatFecha(registro.compromisoPago.fechaDesde)} - {formatFecha(registro.compromisoPago.fechaHasta)}</div>
              <div>Estado: {registro.compromisoPago.estadoLabel ?? registro.compromisoPago.estado}</div>
              <div className="font-medium">Observación:</div>
              <div>{getObservacionVisible(registro.compromisoPago.observacion) ?? "No se dejaron asentadas observaciones para este compromiso."}</div>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}



function normalizarTipoEvento(valor: unknown) {
  return String(valor ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "_");
}

function isObservacionEtapa(registro: RegistroHistorial | Record<string, unknown>) {
  const raw = registro as any;
  const candidatos = [raw.tipoEvento, raw.tipoAccion, raw.tipo, raw.accion, raw.nombre];
  return candidatos.some((candidato) => {
    const tipo = normalizarTipoEvento(candidato);
    return tipo === "OBSERVACION_ETAPA" || tipo === "OBSERVACION_DE_ETAPA";
  });
}

function getResumenObservacionesEtapa(etapa: any) {
  const observacionesEvento = (etapa.eventosInternos ?? []).filter((evento: RegistroHistorial) => isObservacionEtapa(evento));
  const observacionApertura = getObservacionVisible(etapa.observaciones);
  const observaciones = [...observacionesEvento].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  const ultimaObservacionEvento = observaciones[observaciones.length - 1];
  const totalObservaciones = observacionesEvento.length + (observacionApertura ? 1 : 0);
  const ultimaObservacionTexto =
    getObservacionVisible(ultimaObservacionEvento?.observaciones) ??
    observacionApertura ??
    (totalObservaciones > 0 ? "Sin detalle informado." : null);

  return {
    ultimaObservacionTexto,
    totalObservaciones,
  };
}

function isRegistroCierre(registro: RegistroHistorial) {
  const tipoEvento = String(registro.tipoAccion ?? "").toUpperCase();
  return tipoEvento.includes("CIERRE");
}
function CierreProcesoBloque({
  proceso,
  cierreRegistro,
}: {
  proceso: ProcesoSeguimiento;
  cierreRegistro: RegistroHistorial | null;
}) {
  const motivoCierre = proceso.motivoCierre ?? cierreRegistro?.cierre ?? "No informado";
  const fechaCierre = proceso.fechaFin ?? cierreRegistro?.fecha ?? null;
  const cierreDetalle = proceso.cierre as any;
  const responsable = cierreDetalle?.responsableCierre ?? cierreRegistro?.responsable ?? "Sistema";
  const observacion = getObservacionVisible(cierreDetalle?.observacionCierre ?? cierreRegistro?.observaciones) ?? "No informado";

  return (
    <div className="border-t border-border bg-surface-muted/20 px-5 py-4">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Cierre del proceso
      </div>
      <div className="grid gap-2 text-[12.5px] sm:grid-cols-[auto_1fr]">
        <span className="font-medium uppercase tracking-wider text-muted-foreground">Motivo de cierre</span>
        <span className="text-foreground">{motivoCierre}</span>
        <span className="font-medium uppercase tracking-wider text-muted-foreground">Fecha de cierre</span>
        <span className="tabular text-foreground">{formatFechaHora(fechaCierre)}</span>
        <span className="font-medium uppercase tracking-wider text-muted-foreground">Responsable</span>
        <span className="text-foreground">{responsable}</span>
        <span className="font-medium uppercase tracking-wider text-muted-foreground">Observación</span>
        <span className="text-foreground">{observacion}</span>
      </div>
    </div>
  );
}

function getObservacionVisible(observaciones?: string | null) {
  if (!observaciones) return null;
  const valor = observaciones.trim();
  if (!valor) return null;
  if (valor.toLowerCase() === "no informado") return null;
  return valor;
}

function ProcesoTabla({ proceso }: { proceso: ProcesoSeguimiento }) {
  const renderCompromisoResumen = (r: any) => {
    const tipo = String(r.tipoAccion ?? "").toUpperCase();
    if (!r.compromisoPago) return "—";
    if (!["COMPROMISO_REGISTRADO", "ACTUALIZAR_COMPROMISO", "RENOVAR_COMPROMISO"].some((token) => tipo.includes(token))) return "—";
    const observacion = getObservacionVisible(r.compromisoPago.observacion);
    return (
      <div className="grid gap-1 whitespace-pre-line">
        <div>Monto: {formatCurrencyOrDash(r.compromisoPago.montoComprometido)}</div>
        <div>Vigencia: {formatFecha(r.compromisoPago.fechaDesde)} - {formatFecha(r.compromisoPago.fechaHasta)}</div>
        <div>Estado: {r.compromisoPago.estadoLabel ?? r.compromisoPago.estado}</div>
        <div className="font-medium">Observación:</div>
        <div>{observacion ?? "No se dejaron asentadas observaciones para este compromiso."}</div>
      </div>
    );
  };

  const renderCierreResumen = (r: any) => {
    if (!r.cierre) return "—";
    const motivo = r.cierre?.motivoCierreCodigo || r.cierre?.motivoCierreNombre;
    const parts: string[] = [];
    if (motivo) parts.push(`Motivo: ${motivo}`);
    if (r.cierre?.fechaCierre) parts.push(`Fecha: ${formatFechaHora(r.cierre.fechaCierre)}`);
    if (r.cierre?.observacionCierre && r.cierre.observacionCierre !== "No informado") parts.push(`Obs.: ${r.cierre.observacionCierre}`);
    if (r.cierre?.responsableCierre && r.cierre.responsableCierre !== "-") parts.push(`Resp.: ${r.cierre.responsableCierre}`);
    return parts.length > 0 ? parts.join(" · ") : "—";
  };

  const registrosOrdenados = [...proceso.registros].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  const observacionesPorEtapa = new Map<string, RegistroHistorial[]>();

  registrosOrdenados.forEach((registro) => {
    if (!isObservacionEtapa(registro)) return;
    const etapaKey = String(registro.etapa ?? "").trim();
    if (!etapaKey) return;
    const lista = observacionesPorEtapa.get(etapaKey) ?? [];
    lista.push(registro);
    observacionesPorEtapa.set(etapaKey, lista);
  });

  const filasVisibles = registrosOrdenados.filter((fila) => !!fila.etapa && !isObservacionEtapa(fila));

  const renderResumenObservacionesEtapa = (registro: RegistroHistorial) => {
    const etapaKey = String(registro.etapa ?? "").trim();
    if (!etapaKey) return null;
    const observaciones = [...(observacionesPorEtapa.get(etapaKey) ?? [])].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    if (observaciones.length === 0) return null;

    const ultimaObservacion = observaciones[observaciones.length - 1];
    const ultimaObservacionTexto = getObservacionVisible(ultimaObservacion.observaciones);
    if (!ultimaObservacionTexto) return null;

    return (
      <div className="mt-2 rounded-md border border-border/70 bg-surface-muted/20 p-2">
        <div className="font-medium">Última observación de etapa: {ultimaObservacionTexto}</div>
        {observaciones.length > 1 && (
          <div className="mt-1 text-[11.5px] text-muted-foreground">
            Hay {observaciones.length} observaciones registradas. Ver historial completo en Observaciones del expediente.
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="rounded-md border border-border bg-surface shadow-sm">
      <ProcesoHeader proceso={proceso} />
      <div className="overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted/30">
              <Th className="w-[110px]">Fecha</Th>
              <Th className="w-[130px]">Proceso</Th>
              <Th className="w-[160px]">Etapa relacionada</Th>
              <Th className="w-[120px]">Estado</Th>
              <Th className="w-[180px]">Acción</Th>
              <Th>Observaciones</Th>
              <Th className="w-[200px]">Compromiso de pago</Th>
              <Th className="w-[160px]">Cierre</Th>
            </tr>
          </thead>
          <tbody>
            {filasVisibles.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 align-top hover:bg-surface-muted/30">
                <td className="px-4 py-3 tabular text-[12.5px] text-foreground">
                  <div className="font-medium">{formatFecha(r.fecha)}</div>
                  <div className="text-[11.5px] text-muted-foreground">{formatHora(r.fecha)}</div>
                </td>
                <td className="px-4 py-3 tabular text-[12.5px] text-foreground">{r.numeroProceso}</td>
                <td className="px-4 py-3">
                  {r.esEventoProceso ? (
                    <span className="text-[12.5px] text-foreground">Durante {r.etapa ?? "—"}</span>
                  ) : (
                    <EtapaPill etapa={r.etapa} />
                  )}
                </td>
                <td className="px-4 py-3">
                  <EstadoPill estado={r.estado} />
                </td>
                <td className="px-4 py-3 text-[12.5px] text-foreground">{r.tipoAccion ?? "Evento"}</td>
                <td className="px-4 py-3 text-[12.5px] text-foreground">
                  <p className="max-w-[48ch] leading-relaxed">{getObservacionVisible(r.observaciones) ?? "—"}</p>
                  <p className="mt-1 text-[11.5px] text-muted-foreground">
                    Resp.: {r.responsable}
                  </p>
                  {renderResumenObservacionesEtapa(r)}
                </td>
                <td className="px-4 py-3 text-[12.5px]">
                  <span className={cn("text-[12.5px]", r.compromisoPago ? "text-foreground" : "italic text-muted-foreground")}>{renderCompromisoResumen(r)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("text-[12.5px]", r.cierre ? "text-foreground" : "italic text-muted-foreground")}>{renderCierreResumen(r)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {proceso.estado === "cerrado" && (
        <div className="border-t border-border bg-surface-muted/20 px-4 py-3">
          <div className="text-[12px] font-medium text-foreground">
            Motivo de cierre: <span className="font-semibold">{proceso.motivoCierre ?? "Motivo de cierre no registrado"}</span>
            <span className="ml-3 text-muted-foreground">Fecha: {formatFechaHora(proceso.fechaFin)}</span>
          </div>
        </div>
      )}
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
  const cls: Record<string, string> = {
    "Aviso de deuda": "border-border bg-muted text-foreground",
    "Intimación": "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    "Aviso de corte": "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400",
    "Corte": "border-destructive/20 bg-destructive/10 text-destructive",
    "Sin etapa asignada": "border-border bg-muted text-muted-foreground",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[11.5px] font-medium", cls[etapa] ?? "border-border bg-muted text-foreground")}>
      {etapa}
    </span>
  );
}

const formatEstadoLabel = (value?: string | null) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "Sin estado";

  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Sin estado";
};

const normalizeEstadoKey = (value?: string | null) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "SIN_ESTADO";

  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
};

type EstadoPillConfig = { cls: string; Icon: typeof PlayCircle; label: string };

function EstadoPill({ estado }: { estado?: EstadoProceso | string | null }) {
  const map: Record<string, EstadoPillConfig> = {
    SIN_ESTADO: { cls: "border-border bg-muted text-muted-foreground", Icon: CircleDashed, label: "Sin estado" },
    NO_INICIADO: { cls: "border-border bg-muted text-muted-foreground", Icon: CircleDashed, label: "No iniciado" },
    INICIADO: { cls: "border-status-active/20 bg-status-active-soft text-status-active", Icon: PlayCircle, label: "Iniciado" },
    ACTIVO: { cls: "border-status-active/20 bg-status-active-soft text-status-active", Icon: PlayCircle, label: "Activo" },
    ABIERTO: { cls: "border-status-active/20 bg-status-active-soft text-status-active", Icon: PlayCircle, label: "Abierto" },
    PAUSADO: { cls: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400", Icon: PauseCircle, label: "Pausado" },
    PENDIENTE: { cls: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400", Icon: CircleDashed, label: "Pendiente" },
    CERRADO: { cls: "border-status-closed/20 bg-status-closed-soft text-status-closed", Icon: CircleCheck, label: "Cerrado" },
    FINALIZADO: { cls: "border-status-closed/20 bg-status-closed-soft text-status-closed", Icon: CircleCheck, label: "Finalizado" },
    CUMPLIDO: { cls: "border-status-closed/20 bg-status-closed-soft text-status-closed", Icon: CircleCheck, label: "Cumplido" },
    INCUMPLIDO: { cls: "border-destructive/20 bg-destructive/10 text-destructive", Icon: AlertCircle, label: "Incumplido" },
    CANCELADO: { cls: "border-border bg-muted text-muted-foreground", Icon: CircleDashed, label: "Cancelado" },
  };
  const estadoKey = normalizeEstadoKey(estado);
  const fallback: EstadoPillConfig = {
    cls: "border-border bg-muted text-muted-foreground",
    Icon: CircleDashed,
    label: formatEstadoLabel(estado),
  };
  const { cls, Icon, label } = map[estadoKey] ?? fallback;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium", cls)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function CierrePill({ cierre }: { cierre: NonNullable<CierreProceso> }) {
  const cls = "border-status-closed/20 bg-status-closed-soft text-status-closed";
  const Icon = CircleCheck;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11.5px] font-medium", cls)}>
      <Icon className="h-3 w-3" />
      Motivo de cierre: {cierre}
    </span>
  );
}

const normalizeEtapaKey = (value?: string | null) => {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-") return "DEFAULT";

  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
};

function EtapaIcon({ etapa }: { etapa?: string | null }) {
  const map: Record<string, { Icon: typeof FileText; color: string; label: string }> = {
    AVISO_DE_DEUDA: { Icon: FileText, color: "text-muted-foreground", label: "Aviso de deuda" },
    INTIMACION: { Icon: StickyNote, color: "text-amber-600 dark:text-amber-400", label: "Intimación" },
    AVISO_DE_CORTE: { Icon: AlertCircle, color: "text-orange-600 dark:text-orange-400", label: "Aviso de corte" },
    CORTE: { Icon: Lock, color: "text-destructive", label: "Corte" },
    DEFAULT: { Icon: FileText, color: "text-muted-foreground", label: "Sin etapa asignada" },
  };

  const etapaKey = normalizeEtapaKey(etapa);
  const config = map[etapaKey] ?? map.DEFAULT;
  const { Icon, color, label } = config;
  const title = etapa?.trim() ? etapa : label;

  return <span title={title} aria-label={title}><Icon className={cn("h-4 w-4", color)} /></span>;
}
