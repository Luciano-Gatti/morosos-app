import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DistritoCard } from "./DistritoCard";
import type { DistritoStat } from "@/data/mock";

const VISIBLE_LIMIT = 6;

interface Props {
  distritos: DistritoStat[];
}

export function DistritosGrid({ distritos }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Orden por mayor morosidad (cantidad absoluta de morosos, desc)
  const ordenados = useMemo(
    () => [...distritos].sort((a, b) => b.morosos - a.morosos),
    [distritos],
  );

  const total = ordenados.length;
  const hayMas = total > VISIBLE_LIMIT;
  const visibles = expanded || !hayMas ? ordenados : ordenados.slice(0, VISIBLE_LIMIT);

  // Grid dinámico según cantidad visible:
  // 1 → 1 col · 2 → 2 cols · 3 → 3 cols · 4 → 2 cols · 5-6 → 3 cols
  const count = visibles.length;
  const gridCols =
    count === 1
      ? "grid-cols-1"
      : count === 2 || count === 4
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div>
      <div className={`grid gap-4 ${gridCols}`}>
        {visibles.map((d) => (
          <DistritoCard key={d.distrito} data={d} />
        ))}
      </div>

      {hayMas && (
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-[11px] text-muted-foreground">
            {expanded
              ? `Mostrando ${total} de ${total} distritos`
              : `Mostrando ${VISIBLE_LIMIT} de ${total} distritos`}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <>
                Ver menos
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Ver más
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
