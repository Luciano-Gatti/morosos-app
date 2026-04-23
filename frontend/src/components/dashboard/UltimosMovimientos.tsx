import {
  Gavel,
  PowerOff,
  CheckCircle2,
  CalendarClock,
  Handshake,
  Bell,
  FileWarning,
  Settings,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ultimosMovimientos, type MovimientoTipo } from "@/data/mock";
import { useNavigate } from "react-router-dom";

const tipoMeta: Record<MovimientoTipo, { icon: LucideIcon; accent: string; label: string }> = {
  intimacion: { icon: Gavel, accent: "bg-accent-soft text-accent", label: "Intimación" },
  corte: { icon: PowerOff, accent: "bg-status-debt-soft text-status-debt", label: "Corte" },
  regularizacion: {
    icon: CheckCircle2,
    accent: "bg-status-closed-soft text-status-closed",
    label: "Regularización",
  },
  plan_pago: {
    icon: CalendarClock,
    accent: "bg-primary-soft text-primary",
    label: "Plan de pago",
  },
  compromiso: {
    icon: Handshake,
    accent: "bg-status-active-soft text-status-active",
    label: "Compromiso",
  },
  aviso_deuda: { icon: Bell, accent: "bg-primary-soft text-primary", label: "Aviso de deuda" },
  aviso_corte: {
    icon: FileWarning,
    accent: "bg-status-active-soft text-status-active",
    label: "Aviso de corte",
  },
  configuracion: {
    icon: Settings,
    accent: "bg-surface-muted text-muted-foreground",
    label: "Configuración",
  },
};

export function UltimosMovimientos() {
  const navigate = useNavigate();
  const visibles = ultimosMovimientos.slice(0, 5);
  return (
    <div className="rounded-lg border border-border bg-card shadow-institutional">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-serif text-[16px] font-semibold text-foreground">
            Últimos movimientos
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Acciones recientes registradas en el sistema.
          </p>
        </div>
        <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {visibles.length} de {ultimosMovimientos.length}
        </span>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-2.5">Fecha</th>
              <th className="px-3 py-2.5">N.º cuenta</th>
              <th className="px-3 py-2.5">Titular</th>
              <th className="px-3 py-2.5">Acción</th>
              <th className="px-5 py-2.5">Etapa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibles.map((m) => {
              const meta = tipoMeta[m.tipo];
              const Icon = meta.icon;
              return (
                <tr key={m.id} className="transition-colors hover:bg-surface-muted/60">
                  <td className="whitespace-nowrap px-5 py-3 text-[12px] tabular text-muted-foreground">
                    {m.fecha}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-[12px] text-foreground">
                    {m.cuenta}
                  </td>
                  <td className="px-3 py-3 text-foreground">{m.titular}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                          meta.accent,
                        )}
                      >
                        <Icon className="h-[14px] w-[14px]" />
                      </span>
                      <span className="text-foreground">{m.accion}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    {m.etapa && (
                      <span className="rounded-sm border border-border bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {m.etapa}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="flex items-center justify-between border-t border-border px-5 py-3">
        <span className="text-[11px] text-muted-foreground">
          Mostrando los {visibles.length} movimientos más recientes.
        </span>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate("/reportes/historial-movimientos")}
        >
          Ver más
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </footer>
    </div>
  );
}
