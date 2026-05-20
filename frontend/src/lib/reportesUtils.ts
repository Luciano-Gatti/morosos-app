import type { AccionRegistro, AccionTipo } from "@/types/reportes";

export const TIPOS_NOTIFICACION: AccionTipo[] = [
  "Aviso de deuda",
  "Intimación",
  "Aviso de corte",
  "Corte",
];

export const TIPOS_REGULARIZACION: AccionTipo[] = [
  "Regularización",
  "Plan de pago",
  "Compromiso de pago",
];

export interface AccionConteo {
  tipo: AccionTipo;
  cantidad: number;
}

export function conteoPorTipo(rows: AccionRegistro[], tipos: AccionTipo[]): AccionConteo[] {
  return tipos.map((t) => ({
    tipo: t,
    cantidad: rows.filter((r) => r.tipo === t).length,
  }));
}

export interface AccionesPorFechaRow {
  fechaISO: string;
  fechaLabel: string;
  total: number;
  porTipo: Record<AccionTipo, number>;
}

export function serieDiaria(rows: AccionRegistro[]): AccionesPorFechaRow[] {
  const map = new Map<string, AccionesPorFechaRow>();

  rows.forEach((r) => {
    const key = r.fecha.toISOString().slice(0, 10);
    let row = map.get(key);

    if (!row) {
      row = {
        fechaISO: key,
        fechaLabel: r.fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
        total: 0,
        porTipo: {},
      };
      map.set(key, row);
    }

    row.total += 1;
    row.porTipo[r.tipo] = (row.porTipo[r.tipo] ?? 0) + 1;
  });

  return Array.from(map.values()).sort((a, b) => a.fechaISO.localeCompare(b.fechaISO));
}
