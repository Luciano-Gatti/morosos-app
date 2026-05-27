import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inmueblesApi, type HistorialDeudaResponse } from "@/services/api/inmueblesApi";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type PeriodoRapido = "hoy" | "ultimos7" | "mes" | "anio" | "custom";

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
function rangeFrom(periodo: PeriodoRapido) {
  const now = new Date();
  if (periodo === "hoy") return { fechaDesde: isoDate(now), fechaHasta: isoDate(now) };
  if (periodo === "ultimos7") {
    const from = new Date(now); from.setDate(from.getDate() - 6);
    return { fechaDesde: isoDate(from), fechaHasta: isoDate(now) };
  }
  if (periodo === "mes") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { fechaDesde: isoDate(from), fechaHasta: isoDate(now) };
  }
  const from = new Date(now.getFullYear(), 0, 1);
  return { fechaDesde: isoDate(from), fechaHasta: isoDate(now) };
}

const moneyFmt = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const dtFmt = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

export default function HistorialDeudaInmueble() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<PeriodoRapido>("mes");
  const [customDesde, setCustomDesde] = useState("");
  const [customHasta, setCustomHasta] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HistorialDeudaResponse | null>(null);

  const rango = useMemo(() => {
    if (periodo === "custom") return { fechaDesde: customDesde || undefined, fechaHasta: customHasta || undefined };
    return rangeFrom(periodo);
  }, [periodo, customDesde, customHasta]);

  useEffect(() => {
    if (!id) return;
    setLoading(true); setError(null);
    inmueblesApi.getHistorialDeuda(id, rango)
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "No se pudo cargar el historial de deuda."))
      .finally(() => setLoading(false));
  }, [id, rango]);

  const inmueble = data?.inmueble;
  const items = data?.items ?? [];
  const resumen = data?.resumen;
  return (
    <>
      <AppHeader
        title="Historial de deuda"
        description={inmueble ? `${inmueble.cuenta} · ${inmueble.titular}` : undefined}
        breadcrumb={[{ label: "Inmuebles", to: "/inmuebles" }, { label: inmueble?.cuenta ?? "Detalle", to: id ? `/inmuebles/${id}` : undefined }, { label: "Historial de deuda" }]}
        actions={<Button variant="outline" size="sm" onClick={() => navigate(`/inmuebles/${id}`)}><ArrowLeft className="mr-2 h-4 w-4" />Volver al inmueble</Button>}
      />
      <main className="flex-1 space-y-6 px-6 py-6">
        <section className="rounded-md border border-border bg-surface p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Período</div>
          <div className="flex flex-wrap gap-2">
            {[["hoy","Hoy"],["ultimos7","Últimos 7 días"],["mes","Mes actual"],["anio","Año actual"],["custom","Personalizado"] as const].map(([k,l]) => <Button key={k} variant={periodo===k?"default":"outline"} size="sm" onClick={() => setPeriodo(k)}>{l}</Button>)}
          </div>
          {periodo === "custom" && <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3"><Input type="date" value={customDesde} onChange={(e) => setCustomDesde(e.target.value)} /><Input type="date" value={customHasta} onChange={(e) => setCustomHasta(e.target.value)} /><div className="text-xs text-muted-foreground self-center">Seleccioná fecha desde/hasta para recargar.</div></div>}
        </section>

        {error && <section className="rounded-md border border-status-debt/40 bg-status-debt/5 p-4 text-sm text-status-debt">Error al cargar datos: {error}</section>}

        <section className="grid gap-3 md:grid-cols-4">
          <Card title="Deuda actual" value={moneyFmt.format(resumen?.deudaActual ?? 0)} />
          <Card title="Cuotas adeudadas actuales" value={String(resumen?.cuotasActuales ?? 0)} />
          <Card title="Mayor deuda del período" value={moneyFmt.format(resumen?.mayorDeuda ?? 0)} />
          <Card title="Última actualización" value={resumen?.ultimaActualizacion ? dtFmt.format(new Date(resumen.ultimaActualizacion)) : "Sin datos"} />
        </section>

        <section className="rounded-md border border-border bg-surface p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Evolución de deuda</div>
          {loading ? <p className="text-sm text-muted-foreground">Cargando gráfico…</p> : items.length === 0 ? <p className="text-sm text-muted-foreground">No hay datos de deuda para el período seleccionado.</p> : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={items}>
                  <XAxis dataKey="periodo" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value: any, name) => name === "montoAdeudado" ? moneyFmt.format(Number(value)) : value} />
                  <Line yAxisId="left" dataKey="montoAdeudado" stroke="#0f766e" name="montoAdeudado" />
                  <Line yAxisId="right" dataKey="cuotasAdeudadas" stroke="#8b5cf6" name="cuotasAdeudadas" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-md border border-border bg-surface p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Detalle por carga</div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th>Fecha de carga</th><th>Período</th><th>Cuotas</th><th>Monto adeudado</th><th>Estado</th><th>Observación/origen</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} className="py-4 text-muted-foreground">Cargando…</td></tr> : items.length === 0 ? <tr><td colSpan={6} className="py-4 text-muted-foreground">No hay registros de deuda para este inmueble en el período seleccionado.</td></tr> : items.map((it) => <tr key={`${it.fechaCarga}-${it.periodo}`} className="border-t border-border"><td className="py-2">{it.fechaCarga}</td><td>{it.periodo}</td><td>{it.cuotasAdeudadas}</td><td>{moneyFmt.format(it.montoAdeudado)}</td><td>{calcEstado(it.cuotasAdeudadas)}</td><td>{it.observacion ?? "—"}</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}

function calcEstado(cuotas: number) { if (cuotas <= 0) return "Al día"; if (cuotas <= 4) return "Deudor"; return "Moroso"; }
function Card({ title, value }: { title: string; value: string }) { return <div className="rounded-md border border-border bg-surface p-4"><div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div><div className="mt-2 text-lg font-semibold">{value}</div></div>; }
