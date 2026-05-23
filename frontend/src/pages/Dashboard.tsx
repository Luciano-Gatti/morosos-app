import { AppHeader } from "@/components/layout/AppHeader";
import { EstadoInmueblesPieChart } from "@/components/dashboard/EstadoInmueblesPieChart";
import { USE_API } from "@/lib/apiClient";
import { dashboardApi } from "@/services/api/dashboardApi";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { isDashboardResumenEmpty, mapDashboardResumen, type DashboardResumenViewModel } from "@/adapters/dashboard";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardResumenViewModel | null>(null);

  useEffect(() => {
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
  const fechaActualizacion = useMemo(
    () => new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date()),
    [],
  );

  return (
    <>
      <AppHeader
        title="Panel general"
        description="Vista ejecutiva del estado de inmuebles por categoría de deuda."
        breadcrumb={[{ label: "Dashboard" }]}
      />

      <main className="flex-1 px-6 py-6">
        {loading && <div className="mb-3 text-xs text-muted-foreground">Cargando datos del backend…</div>}
        {!loading && error && <div className="mb-3 text-xs text-status-debt">Error API: {error}.</div>}
        {!loading && !error && data && isEmpty && (
          <div className="rounded-lg border border-dashed border-border bg-surface-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            No hay datos para mostrar.
          </div>
        )}

        {!loading && !error && data && !isEmpty && (
          <div className="space-y-6">
            <section aria-label="Estado general de inmuebles" className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <EstadoInmueblesPieChart
                titulo="Estado general de inmuebles"
                total={data.resumenMorosidad.totalInmuebles}
                alDia={data.resumenMorosidad.alDia}
                deudores={data.resumenMorosidad.deudores}
                morosos={data.resumenMorosidad.morosos}
              />
            </section>

            <section>
              <div className="mb-3">
                <h2 className="font-serif text-[18px] font-semibold text-foreground">Estado por distrito</h2>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Distribución de inmuebles por distrito en categorías al día, deudores y morosos.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {data.distritosStats.map((distrito) => (
                  <article key={distrito.distritoId} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                    <EstadoInmueblesPieChart
                      titulo={distrito.distritoNombre}
                      total={distrito.totalInmuebles}
                      alDia={distrito.alDia}
                      deudores={distrito.deudores}
                      morosos={distrito.morosos}
                    />
                  </article>
                ))}
              </div>
            </section>

            <div className="flex items-center gap-3 text-sm">
              <Link to="/reportes/estado-inmuebles" className="text-primary underline-offset-4 hover:underline">
                Ver reporte de inmuebles
              </Link>
              <Link to="/reportes" className="text-primary underline-offset-4 hover:underline">
                Ver reportes
              </Link>
            </div>
          </div>
        )}

        {!USE_API && <div className="mt-4 text-xs text-muted-foreground">Modo local sin backend activo.</div>}

        <footer className="mt-8 flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted-foreground">
          <span>AOSC · Ente Regulador — Sistema interno de seguimiento</span>
          <span>Datos actualizados al {fechaActualizacion}</span>
        </footer>
      </main>
    </>
  );
}
