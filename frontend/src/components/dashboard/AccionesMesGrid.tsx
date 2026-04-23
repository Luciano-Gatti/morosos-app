import { Bell, FileWarning, Gavel, PowerOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { accionesMes } from "@/data/mock";

const meta: Record<
  string,
  { label: string; hint: string; icon: LucideIcon; accent: string }
> = {
  avisos_deuda: {
    label: "Avisos de deuda",
    hint: "Notificaciones emitidas",
    icon: Bell,
    accent: "bg-primary-soft text-primary",
  },
  avisos_corte: {
    label: "Avisos de corte",
    hint: "Notif. de suspensión",
    icon: FileWarning,
    accent: "bg-status-active-soft text-status-active",
  },
  intimaciones: {
    label: "Intimaciones",
    hint: "Elevadas a instancia legal",
    icon: Gavel,
    accent: "bg-accent-soft text-accent",
  },
  cortes: {
    label: "Cortes realizados",
    hint: "Suspensiones ejecutadas",
    icon: PowerOff,
    accent: "bg-status-debt-soft text-status-debt",
  },
};

export function AccionesMesGrid() {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card shadow-institutional">
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div>
          <h2 className="font-serif text-[14px] font-semibold text-foreground">
            Actividad del mes
          </h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Gestiones operativas registradas — Abril 2026.
          </p>
        </div>
        <span className="rounded-sm border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Consolidado
        </span>
      </header>

      <div className="grid flex-1 grid-cols-2 grid-rows-2 divide-x divide-y divide-border">
        {accionesMes.map((a) => {
          const m = meta[a.clave];
          if (!m) return null;
          const Icon = m.icon;
          return (
            <div
              key={a.clave}
              className="flex items-start gap-3 px-4 py-3 first:border-t-0 [&:nth-child(-n+2)]:border-t-0 [&:nth-child(odd)]:border-l-0"
            >
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", m.accent)}>
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {m.label}
                </div>
                <div className="mt-0.5 font-serif text-[24px] font-semibold leading-none tabular text-foreground">
                  {a.cantidad.toLocaleString("es-AR")}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">{m.hint}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
