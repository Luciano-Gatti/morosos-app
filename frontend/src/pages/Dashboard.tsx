import { AppHeader } from "@/components/layout/AppHeader";
import { DistritosGrid } from "@/components/dashboard/DistritosGrid";
import { MorosidadResumen } from "@/components/dashboard/MorosidadResumen";
import { AccionesMesGrid } from "@/components/dashboard/AccionesMesGrid";
import { UltimosMovimientos } from "@/components/dashboard/UltimosMovimientos";
import { distritosStats, resumenMorosidad, accionesMes, ultimosMovimientos } from "@/data/mock";
import { USE_API } from "@/lib/apiClient";
import { dashboardApi } from "@/services/api/dashboardApi";
import { useEffect, useMemo, useState } from "react";
import { isDashboardResumenEmpty, mapDashboardResumen, type DashboardResumenViewModel } from "@/adapters/dashboard";

export default function Dashboard() {
  const [loading, setLoading] = useState(USE_API);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardResumenViewModel | null>(
    USE_API
      ? null
      : mapDashboardResumen({
          kpis: resumenMorosidad as any,
          accionesMes: accionesMes as any,
          distritos: distritosStats as any,
          movimientos: ultimosMovimientos as any,
        }),
  );

  useEffect(() => {
    if (!USE_API) return;
    setLoading(true);
    setError(null);
    dashboardApi
      .getResumen()
      .then((res) => {
        setData(mapDashboardResumen(res));
      })
      .catch((e: unknown) => {
        setData(null);
        setError(e instanceof Error ? e.message : "No se pudo cargar el dashboard.");
      })
      .finally(() => setLoading(false));
  }, []);

  const isEmpty = useMemo(() => (data ? isDashboardResumenEmpty(data) : false), [data]);

  return (
    <>
      <AppHeader
        title="Panel general"
        description="Resumen ejecutivo y operativo del mes en curso — Abril 2026."
        breadcrumb={[{ label: "Dashboard" }]}
      />

      <main className="flex-1 px-6 py-6">
        {loading && <div className="mb-3 text-xs text-muted-foreground">Cargando datos del backend…</div>}
        {!loading && error && <div className="mb-3 text-xs text-status-debt">Error API: {error}.</div>}
        {!loading && !error && data && isEmpty && (
          <div className="mb-3 text-xs text-muted-foreground">No hay datos disponibles para mostrar.</div>
        )}

        {!loading && !error && data && !isEmpty && (
          <>
            <section aria-label="Resumen ejecutivo" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <MorosidadResumen data={data.resumenMorosidad as any} />
              <AccionesMesGrid data={data.accionesMes as any} />
            </section>

            <section className="mt-6">
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h2 className="font-serif text-[18px] font-semibold text-foreground">Análisis por distrito</h2>
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

            <section className="mt-6">
              <UltimosMovimientos data={data.ultimosMovimientos as any} />
            </section>
          </>
        )}

        <footer className="mt-8 flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted-foreground">
          <span>AOSC · Ente Regulador — Sistema interno de seguimiento</span>
          <span>Datos actualizados al 15/04/2026</span>
        </footer>
      </main>
    </>
  );
}
