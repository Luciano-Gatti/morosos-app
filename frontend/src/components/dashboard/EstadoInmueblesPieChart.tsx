import { PieChart, Pie, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface EstadoInmueblesPieChartProps {
  titulo: string;
  total: number;
  alDia: number;
  deudores: number;
  morosos: number;
}

const numberFmt = new Intl.NumberFormat("es-AR");
const pctFmt = (value: number): string => `${value.toFixed(1)}%`;

export function EstadoInmueblesPieChart({ titulo, total, alDia, deudores, morosos }: EstadoInmueblesPieChartProps) {
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
  const data = [
    { name: "Al día", value: Number.isFinite(alDia) ? alDia : 0, fill: "hsl(145 35% 38%)" },
    { name: "Deudores", value: Number.isFinite(deudores) ? deudores : 0, fill: "hsl(215 75% 38%)" },
    { name: "Morosos", value: Number.isFinite(morosos) ? morosos : 0, fill: "hsl(8 78% 50%)" },
  ].map((item) => ({
    ...item,
    pct: safeTotal === 0 ? 0 : (item.value * 100) / safeTotal,
  }));

  const hasData = data.some((item) => item.value > 0);

  return (
    <div>
      <h3 className="font-serif text-base font-semibold text-foreground">{titulo}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Total inmuebles: {numberFmt.format(safeTotal)}</p>

      <div className="mt-4 h-64">
        {!hasData ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No hay datos para mostrar.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={90} paddingAngle={2} />
              <Tooltip formatter={(value: number, _n, payload: unknown) => {
                const meta = payload as { payload?: { pct?: number } };
                return `${numberFmt.format(value)} (${pctFmt(Number(meta?.payload?.pct ?? 0))})`;
              }} />
              <Legend formatter={(value: string, entry: unknown) => {
                const meta = entry as { payload?: { value?: number; pct?: number } };
                return `${value}: ${numberFmt.format(Number(meta?.payload?.value ?? 0))} (${pctFmt(Number(meta?.payload?.pct ?? 0))})`;
              }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
