import { AppHeader } from "@/components/layout/AppHeader";
import { DistritosGrid } from "@/components/dashboard/DistritosGrid";
import { MorosidadResumen } from "@/components/dashboard/MorosidadResumen";
import { AccionesMesGrid } from "@/components/dashboard/AccionesMesGrid";
import { UltimosMovimientos } from "@/components/dashboard/UltimosMovimientos";
import { distritosStats, resumenMorosidad, accionesMes, ultimosMovimientos } from "@/data/mock";
import { USE_API } from "@/lib/apiClient";
import { dashboardApi } from "@/services/api/dashboardApi";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState({ resumenMorosidad, accionesMes, distritosStats, ultimosMovimientos });

  useEffect(() => {
    if (!USE_API) return;
    setLoading(true);
    dashboardApi.getResumen()
      .then((res) => {
        setData((prev) => ({
          ...prev,
          resumenMorosidad: res.kpis ? {
            totalInmuebles: res.kpis.totalInmuebles ?? prev.resumenMorosidad.totalInmuebles,
            alDia: res.kpis.alDia ?? prev.resumenMorosidad.alDia,
            deudores: res.kpis.deudores ?? prev.resumenMorosidad.deudores,
            morosos: res.kpis.morosos ?? prev.resumenMorosidad.morosos,
          } : prev.resumenMorosidad,
          accionesMes: Array.isArray(res.accionesMes) ? res.accionesMes.map((a) => ({ clave: String(a.clave), label: String(a.clave), cantidad: Number(a.cantidad ?? 0) })) : prev.accionesMes,
          distritosStats: Array.isArray(res.distritos) ? res.distritos as any : prev.distritosStats,
          ultimosMovimientos: Array.isArray(res.movimientos) ? res.movimientos as any : prev.ultimosMovimientos,
        }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <AppHeader
        title="Panel general"
        description="Resumen ejecutivo y operativo del mes en curso — Abril 2026."
        breadcrumb={[{ label: "Dashboard" }]}
      />

      <main className="flex-1 px-6 py-6">
        {loading && <div className="mb-3 text-xs text-muted-foreground">Cargando datos del backend…</div>}
        {error && <div className="mb-3 text-xs text-status-debt">Error API: {error}. Mostrando datos mock.</div>}
        {/* Bloque superior: Morosidad + Actividad del mes */}
        <section aria-label="Resumen ejecutivo" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MorosidadResumen data={data.resumenMorosidad} />
          <AccionesMesGrid data={data.accionesMes as any} />
        </section>

        {/* Análisis por distrito */}
        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-[18px] font-semibold text-foreground">
                Análisis por distrito
              </h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Indicadores diferenciados por jurisdicción del ente.
              </p>
            </div>
            <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              Abril 2026
            </span>
          </div>

          <DistritosGrid distritos={data.distritosStats as any} />
        </section>

        {/* Últimos movimientos */}
        <section className="mt-6">
          <UltimosMovimientos data={data.ultimosMovimientos as any} />
        </section>

        <footer className="mt-8 flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted-foreground">
          <span>AOSC · Ente Regulador — Sistema interno de seguimiento</span>
          <span>Datos actualizados al 15/04/2026</span>
        </footer>
      </main>
    </>
  );
}
