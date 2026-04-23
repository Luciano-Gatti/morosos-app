import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type EstadoSeguimiento = "activo" | "pausado" | "cerrado" | "moroso" | "regularizado";

const labels: Record<EstadoSeguimiento, string> = {
  activo: "Activo",
  pausado: "Pausado",
  cerrado: "Cerrado",
  moroso: "Moroso",
  regularizado: "Regularizado",
};

const variantMap: Record<EstadoSeguimiento, "active" | "paused" | "closed" | "debt" | "neutral"> = {
  activo: "active",
  pausado: "paused",
  cerrado: "closed",
  moroso: "debt",
  regularizado: "neutral",
};

interface Props {
  estado: EstadoSeguimiento;
  className?: string;
}

export function StatusBadge({ estado, className }: Props) {
  return (
    <Badge variant={variantMap[estado]} className={cn("gap-1.5", className)}>
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          estado === "activo" && "bg-status-active",
          estado === "pausado" && "bg-status-paused",
          estado === "cerrado" && "bg-status-closed",
          estado === "moroso" && "bg-status-debt",
          estado === "regularizado" && "bg-muted-foreground",
        )}
      />
      {labels[estado]}
    </Badge>
  );
}
