import { resumenMorosidad } from "@/data/mock";

export function MorosidadResumen() {
  const { totalInmuebles, alDia, deudores, morosos } = resumenMorosidad;
  const pctMorosos = (morosos / totalInmuebles) * 100;
  const pctDeudores = (deudores / totalInmuebles) * 100;
  const pctAlDia = (alDia / totalInmuebles) * 100;
  const fmt = (n: number) => n.toLocaleString("es-AR");

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card shadow-institutional">
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div>
          <h2 className="font-serif text-[14px] font-semibold text-foreground">
            Resumen de morosidad actual
          </h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Estado consolidado del padrón.
          </p>
        </div>
        <span className="rounded-sm border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground tabular">
          {fmt(totalInmuebles)} inmuebles
        </span>
      </header>

      <div className="flex flex-1 flex-col px-4 py-3">
        {/* KPI principal + barra */}
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Morosidad total
            </div>
            <div className="mt-0.5 font-serif text-[34px] font-semibold leading-none tracking-tight text-status-debt tabular">
              {pctMorosos.toFixed(2).replace(".", ",")}%
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground tabular">
              Sobre {fmt(totalInmuebles)} inmuebles
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full bg-status-closed"
                style={{ width: `${pctAlDia}%` }}
                title={`Al día: ${pctAlDia.toFixed(1)}%`}
              />
              <div
                className="h-full bg-status-active"
                style={{ width: `${pctDeudores}%` }}
                title={`Deudores: ${pctDeudores.toFixed(1)}%`}
              />
              <div
                className="h-full bg-status-debt"
                style={{ width: `${pctMorosos}%` }}
                title={`Morosos: ${pctMorosos.toFixed(1)}%`}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-status-closed" />
                Al día {pctAlDia.toFixed(1).replace(".", ",")}%
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-status-active" />
                Deudores {pctDeudores.toFixed(1).replace(".", ",")}%
              </span>
              <span className="inline-flex items-center gap-1.5">
                Morosos {pctMorosos.toFixed(1).replace(".", ",")}%
                <span className="h-2 w-2 rounded-sm bg-status-debt" />
              </span>
            </div>
          </div>
        </div>

        {/* Detalle al día / deudores / morosos */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="flex items-baseline justify-between rounded-md border border-border bg-status-closed-soft/40 px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Al día
            </div>
            <div className="font-serif text-[18px] font-semibold leading-none tabular text-status-closed">
              {fmt(alDia)}
            </div>
          </div>
          <div className="flex items-baseline justify-between rounded-md border border-border bg-status-active-soft/40 px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Deudores
            </div>
            <div className="font-serif text-[18px] font-semibold leading-none tabular text-status-active">
              {fmt(deudores)}
            </div>
          </div>
          <div className="flex items-baseline justify-between rounded-md border border-border bg-status-debt-soft/40 px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Morosos
            </div>
            <div className="font-serif text-[18px] font-semibold leading-none tabular text-status-debt">
              {fmt(morosos)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
