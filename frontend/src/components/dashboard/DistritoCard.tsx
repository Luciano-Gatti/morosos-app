import { Bell, FileWarning, Gavel, PowerOff, MapPin, Users, AlertCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { accionesLabels, type AccionClave, type DistritoStat } from "@/data/mock";

const iconMap: Record<AccionClave, LucideIcon> = {
  avisos_deuda: Bell,
  avisos_corte: FileWarning,
  intimaciones: Gavel,
  cortes: PowerOff,
};

const accentMap: Record<AccionClave, string> = {
  avisos_deuda: "bg-primary-soft text-primary",
  avisos_corte: "bg-status-active-soft text-status-active",
  intimaciones: "bg-accent-soft text-accent",
  cortes: "bg-status-debt-soft text-status-debt",
};

const fmt = (n: number) => n.toLocaleString("es-AR");

interface Props {
  data: DistritoStat;
}

export function DistritoCard({ data }: Props) {
  const tasa = (data.morosos / data.usuarios) * 100;
  const alDia = data.usuarios - data.deudores - data.morosos;

  return (
    <article className="@container flex flex-col rounded-lg border border-border bg-card shadow-institutional">
      {/* Header del distrito */}
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5 @md:px-5 @md:py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground @md:h-10 @md:w-10">
            <MapPin className="h-4 w-4 @md:h-5 @md:w-5" />
          </div>
          <div className="min-w-0">
            <div className="section-eyebrow">Distrito</div>
            <h3
              className="truncate font-serif font-semibold leading-tight text-foreground"
              style={{ fontSize: "clamp(15px, 1.6cqi + 12px, 20px)" }}
              title={data.distrito}
            >
              {data.distrito}
            </h3>
          </div>
        </div>
        <div
          className="shrink-0 whitespace-nowrap rounded-full border border-status-debt/20 bg-status-debt-soft px-2 py-0.5 text-[10px] font-medium tabular text-status-debt @md:px-2.5 @md:text-[11px]"
          title="Tasa de morosidad"
        >
          {tasa.toFixed(1).replace(".", ",")}% morosidad
        </div>
      </header>

      {/* Totales del distrito */}
      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
        <div className="px-4 py-3.5 @md:px-5 @md:py-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Usuarios
            </span>
          </div>
          <div
            className="mt-1.5 font-serif font-semibold leading-none tabular text-foreground"
            style={{ fontSize: "clamp(20px, 2.4cqi + 14px, 26px)" }}
          >
            {fmt(data.usuarios)}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Inmuebles registrados</div>
        </div>
        <div className="px-3 py-3.5 @md:px-4 @md:py-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-status-closed" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Al día
            </span>
          </div>
          <div className="mt-1.5 font-serif font-semibold leading-none tabular text-status-closed" style={{ fontSize: "clamp(18px, 2cqi + 12px, 24px)" }}>
            {fmt(alDia)}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Sin deuda</div>
        </div>
        <div className="px-3 py-3.5 @md:px-4 @md:py-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-status-active" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Deudores
            </span>
          </div>
          <div className="mt-1.5 font-serif font-semibold leading-none tabular text-status-active" style={{ fontSize: "clamp(18px, 2cqi + 12px, 24px)" }}>
            {fmt(data.deudores)}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Bajo umbral</div>
        </div>
        <div className="px-3 py-3.5 @md:px-4 @md:py-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-status-debt" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Morosos
            </span>
          </div>
          <div
            className="mt-1.5 font-serif font-semibold leading-none tabular text-status-debt"
            style={{ fontSize: "clamp(18px, 2cqi + 12px, 24px)" }}
          >
            {fmt(data.morosos)}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">En umbral</div>
        </div>
      </div>

      {/* Acciones del mes */}
      <div className="px-4 py-3.5 @md:px-5 @md:py-4">
        <div className="section-eyebrow mb-3">Gestiones del mes</div>
        <ul className="grid grid-cols-2 gap-2 @md:gap-2.5">
          {(Object.keys(accionesLabels) as AccionClave[]).map((k) => {
            const Icon = iconMap[k];
            return (
              <li
                key={k}
                className="flex items-center gap-2.5 rounded-md border border-border bg-surface-muted/40 px-2.5 py-2 @md:gap-3 @md:px-3 @md:py-2.5"
              >
                <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md @md:h-8 @md:w-8", accentMap[k])}>
                  <Icon className="h-[14px] w-[14px] @md:h-[16px] @md:w-[16px]" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground @md:text-[11px]">
                    {accionesLabels[k]}
                  </div>
                  <div
                    className="font-serif font-semibold leading-none tabular text-foreground"
                    style={{ fontSize: "clamp(15px, 1.6cqi + 11px, 18px)" }}
                  >
                    {fmt(data.acciones[k])}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}
