import { AppHeader } from "@/components/layout/AppHeader";
import { DistritosGrid } from "@/components/dashboard/DistritosGrid";
import { MorosidadResumen } from "@/components/dashboard/MorosidadResumen";
import { AccionesMesGrid } from "@/components/dashboard/AccionesMesGrid";
import { UltimosMovimientos } from "@/components/dashboard/UltimosMovimientos";
import { distritosStats } from "@/data/mock";

export default function Dashboard() {
  return (
    <>
      <AppHeader
        title="Panel general"
        description="Resumen ejecutivo y operativo del mes en curso — Abril 2026."
        breadcrumb={[{ label: "Dashboard" }]}
      />

      <main className="flex-1 px-6 py-6">
        {/* Bloque superior: Morosidad + Actividad del mes */}
        <section aria-label="Resumen ejecutivo" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MorosidadResumen />
          <AccionesMesGrid />
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

          <DistritosGrid distritos={distritosStats} />
        </section>

        {/* Últimos movimientos */}
        <section className="mt-6">
          <UltimosMovimientos />
        </section>

        <footer className="mt-8 flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted-foreground">
          <span>AOSC · Ente Regulador — Sistema interno de seguimiento</span>
          <span>Datos actualizados al 15/04/2026</span>
        </footer>
      </main>
    </>
  );
}
