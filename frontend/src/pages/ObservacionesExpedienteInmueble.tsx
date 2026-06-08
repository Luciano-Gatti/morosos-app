import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { seguimientoApi } from "@/services/api/seguimientoApi";
import { inmueblesApi, type ObservacionesExpedienteResponse } from "@/services/api/inmueblesApi";

type Periodo = "ultimos7" | "mes" | "anio" | "custom";
const toIso = (d: Date) => d.toISOString().slice(0, 10);
function getRange(p: Periodo) { const now = new Date(); if (p === "ultimos7") { const f = new Date(now); f.setDate(f.getDate() - 6); return { fechaDesde: toIso(f), fechaHasta: toIso(now) }; } if (p === "mes") return { fechaDesde: toIso(new Date(now.getFullYear(), now.getMonth(), 1)), fechaHasta: toIso(now) }; return { fechaDesde: toIso(new Date(now.getFullYear(), 0, 1)), fechaHasta: toIso(now) }; }
const fmt = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

export default function ObservacionesExpedienteInmueble() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [q, setQ] = useState("");
  const [etapaId, setEtapaId] = useState("all");
  const [estadoProceso, setEstadoProceso] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ObservacionesExpedienteResponse | null>(null);
  const [textoObs, setTextoObs] = useState("");
  const [guardando, setGuardando] = useState(false);

  const rango = periodo === "custom" ? { fechaDesde: desde || undefined, fechaHasta: hasta || undefined } : getRange(periodo);

  const load = () => {
    if (!id) return;
    setLoading(true); setError(null);
    inmueblesApi.getObservacionesExpediente(id, { ...rango, etapaId: etapaId === "all" ? undefined : etapaId, q: q || undefined, estadoProceso: estadoProceso === "ALL" ? undefined : estadoProceso })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "No se pudo cargar observaciones del expediente."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id, periodo, desde, hasta, etapaId, estadoProceso]);
  const etapas = useMemo(() => Array.from(new Map((data?.procesos ?? []).flatMap((p) => p.etapas.map((e) => [e.etapaId, e.etapaNombre]))).entries()), [data]);
  const procesos = data?.procesos ?? [];
  const procesoActual = procesos.find((p) => ["INICIADO", "PAUSADO"].includes((p.estado ?? "").toUpperCase()));
  const puedeAgregar = !!procesoActual?.etapaActualId && ["INICIADO", "PAUSADO"].includes((procesoActual?.estado ?? "").toUpperCase());

  const agregarObs = async () => {
    if (!puedeAgregar || !procesoActual?.procesoId || !textoObs.trim()) return;
    setGuardando(true);
    try {
      await seguimientoApi.agregarObservacionEtapa({ casoSeguimientoId: procesoActual.procesoId, observacion: textoObs.trim() });
      setTextoObs("");
      load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "No se pudo guardar la observación."); }
    finally { setGuardando(false); }
  };

  return <>
    <AppHeader title="Observaciones del expediente" description={data?.inmueble ? `${data.inmueble.cuenta} · ${data.inmueble.titular}` : undefined}
      breadcrumb={[{ label: "Inmuebles", to: "/inmuebles" }, { label: data?.inmueble?.cuenta ?? "Detalle", to: id ? `/inmuebles/${id}` : undefined }, { label: "Observaciones del expediente" }]}
      actions={<Button variant="outline" size="sm" onClick={() => navigate(`/inmuebles/${id}`)}><ArrowLeft className="mr-2 h-4 w-4"/>Volver al inmueble</Button>} />
    <main className="flex-1 space-y-6 px-4 py-4 sm:px-6 sm:py-6">
      <section className="rounded-md border border-border bg-surface p-4 space-y-3">
        <div className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Buscar por texto" value={q} onChange={(e) => setQ(e.target.value)} onBlur={load} />
          <Select value={estadoProceso} onValueChange={setEstadoProceso}><SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="INICIADO">Abierto</SelectItem><SelectItem value="PAUSADO">Pausado</SelectItem><SelectItem value="CERRADO">Cerrado</SelectItem></SelectContent></Select>
          <Select value={etapaId} onValueChange={setEtapaId}><SelectTrigger><SelectValue placeholder="Etapa" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem>{etapas.map(([id,n]) => <SelectItem key={id} value={id}>{n}</SelectItem>)}</SelectContent></Select>
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ultimos7">Últimos 7 días</SelectItem><SelectItem value="mes">Mes actual</SelectItem><SelectItem value="anio">Año actual</SelectItem><SelectItem value="custom">Personalizado</SelectItem></SelectContent></Select>
        </div>
        {periodo === "custom" && <div className="grid gap-3 md:grid-cols-2"><Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /><Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>}
      </section>

      {puedeAgregar && <section className="rounded-md border border-border bg-surface p-4 space-y-2"><div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Agregar observación a etapa actual</div><Textarea value={textoObs} onChange={(e) => setTextoObs(e.target.value)} placeholder="Escribí la observación..." rows={3} /><Button size="sm" disabled={guardando || !textoObs.trim()} onClick={agregarObs}>Guardar observación</Button></section>}
      {error && <section className="rounded-md border border-status-debt/40 bg-status-debt/5 p-4 text-sm text-status-debt">Error: {error}</section>}

      <section className="rounded-md border border-border bg-surface p-4">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Historial completo ({data?.totalObservaciones ?? 0})</div>
        {loading ? <p className="text-sm text-muted-foreground">Cargando observaciones…</p> : procesos.length === 0 ? <p className="text-sm text-muted-foreground">No hay observaciones de expediente para el período seleccionado.</p> :
          <Accordion type="single" collapsible defaultValue={procesos[0]?.procesoId}>
            {procesos.map((proceso) => <AccordionItem key={proceso.procesoId} value={proceso.procesoId}><AccordionTrigger>Proceso {proceso.procesoId.slice(0, 8)}... · Estado: {proceso.estado} · Inicio: {proceso.fechaInicio ? fmt.format(new Date(proceso.fechaInicio)) : "-"}</AccordionTrigger><AccordionContent><div className="space-y-3">{proceso.etapas.map((et) => <div key={et.etapaId} className="rounded-md border border-border p-3"><div className="text-sm font-medium">Etapa: {et.etapaNombre}</div>{et.observaciones.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Sin observaciones registradas</p> : <ul className="mt-2 space-y-2">{et.observaciones.map((o) => <li key={o.id} className="text-sm"><div className="text-muted-foreground">{fmt.format(new Date(o.fecha))} · {o.responsable}</div><div>{o.texto}</div></li>)}</ul>}</div>)}</div></AccordionContent></AccordionItem>)}
          </Accordion>}
      </section>
    </main>
  </>;
}
