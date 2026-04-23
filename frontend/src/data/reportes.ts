import { inmueblesPadron } from "./inmuebles";
import { inmueblesMorosos, etapasSeguimiento, type EtapaSeguimiento } from "./seguimiento";

/* =====================================================
   Datasets agregados para la vista de Reportes.
   Generación determinística a partir de datos mock.
   ===================================================== */

function pseudo(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/* ---------- Reporte 1: Morosos por grupo y distrito ---------- */

export interface MorososPorGrupoRow {
  grupo: string;
  totalInmuebles: number;
  morosos: number;
  porcentaje: number;
}

export interface MorososPorDistritoRow {
  distrito: string;
  totalInmuebles: number;
  morosos: number;
  porcentaje: number;
}

export function getMorososPorGrupo(): MorososPorGrupoRow[] {
  const map = new Map<string, { total: number; morosos: number }>();
  inmueblesPadron.forEach((i) => {
    const cur = map.get(i.grupo) ?? { total: 0, morosos: 0 };
    cur.total += 1;
    map.set(i.grupo, cur);
  });
  inmueblesMorosos.forEach((m) => {
    const cur = map.get(m.grupo);
    if (cur) cur.morosos += 1;
  });
  return Array.from(map.entries())
    .map(([grupo, v]) => ({
      grupo,
      totalInmuebles: v.total,
      morosos: v.morosos,
      porcentaje: v.total === 0 ? 0 : (v.morosos / v.total) * 100,
    }))
    .sort((a, b) => b.morosos - a.morosos);
}

export function getMorososPorDistrito(): MorososPorDistritoRow[] {
  const map = new Map<string, { total: number; morosos: number }>();
  inmueblesPadron.forEach((i) => {
    const cur = map.get(i.distrito) ?? { total: 0, morosos: 0 };
    cur.total += 1;
    map.set(i.distrito, cur);
  });
  inmueblesMorosos.forEach((m) => {
    const cur = map.get(m.distrito);
    if (cur) cur.morosos += 1;
  });
  return Array.from(map.entries())
    .map(([distrito, v]) => ({
      distrito,
      totalInmuebles: v.total,
      morosos: v.morosos,
      porcentaje: v.total === 0 ? 0 : (v.morosos / v.total) * 100,
    }))
    .sort((a, b) => b.morosos - a.morosos);
}

/* ---------- Reporte 2 y 3: Acciones realizadas ---------- */

export type AccionTipo =
  | "Aviso de deuda"
  | "Intimación"
  | "Aviso de corte"
  | "Corte"
  | "Regularización"
  | "Plan de pago"
  | "Compromiso de pago";

export interface AccionRegistro {
  id: string;
  fecha: Date;
  tipo: AccionTipo;
  cuenta: string;
  titular: string;
  grupo: string;
  distrito: string;
  usuario: string;
}

const usuariosMock = [
  "M. Rodríguez",
  "L. Fernández",
  "P. Sosa",
  "R. Acosta",
  "J. Benítez",
  "C. Molina",
];

const tiposPesos: { tipo: AccionTipo; peso: number }[] = [
  { tipo: "Aviso de deuda", peso: 32 },
  { tipo: "Intimación", peso: 22 },
  { tipo: "Aviso de corte", peso: 14 },
  { tipo: "Corte", peso: 8 },
  { tipo: "Regularización", peso: 10 },
  { tipo: "Plan de pago", peso: 9 },
  { tipo: "Compromiso de pago", peso: 5 },
];

function pickTipo(r: number): AccionTipo {
  const total = tiposPesos.reduce((acc, t) => acc + t.peso, 0);
  let cum = 0;
  const target = r * total;
  for (const t of tiposPesos) {
    cum += t.peso;
    if (target <= cum) return t.tipo;
  }
  return tiposPesos[0].tipo;
}

/** Genera un historial de ~420 acciones distribuidas en los últimos 240 días. */
export const accionesHistorial: AccionRegistro[] = (() => {
  const out: AccionRegistro[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const totalDias = 240;
  const totalAcciones = 420;

  for (let i = 0; i < totalAcciones; i++) {
    const r1 = pseudo(i + 1);
    const r2 = pseudo(i + 101);
    const r3 = pseudo(i + 211);
    const r4 = pseudo(i + 313);

    const inm = inmueblesPadron[Math.floor(r2 * inmueblesPadron.length)];
    const offsetDias = Math.floor(r1 * totalDias);
    const fecha = new Date(today);
    fecha.setDate(fecha.getDate() - offsetDias);
    const tipo = pickTipo(r3);
    const usuario = usuariosMock[Math.floor(r4 * usuariosMock.length)];

    out.push({
      id: String(i + 1),
      fecha,
      tipo,
      cuenta: inm.cuenta,
      titular: inm.titular,
      grupo: inm.grupo,
      distrito: inm.distrito,
      usuario,
    });
  }
  return out.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
})();

const tiposNotificacion: AccionTipo[] = [
  "Aviso de deuda",
  "Intimación",
  "Aviso de corte",
  "Corte",
];
const tiposRegularizacion: AccionTipo[] = [
  "Regularización",
  "Plan de pago",
  "Compromiso de pago",
];

export function filtrarAcciones(
  desde: Date | null,
  hasta: Date | null,
  tipos?: AccionTipo[],
): AccionRegistro[] {
  return accionesHistorial.filter((a) => {
    if (desde && a.fecha < desde) return false;
    if (hasta) {
      const h = new Date(hasta);
      h.setHours(23, 59, 59, 999);
      if (a.fecha > h) return false;
    }
    if (tipos && !tipos.includes(a.tipo)) return false;
    return true;
  });
}

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

export const TIPOS_NOTIFICACION = tiposNotificacion;
export const TIPOS_REGULARIZACION = tiposRegularizacion;

/* ---------- Reporte 4: Estado actual de cada inmueble ---------- */

export type EstadoInmueble = "Al día" | "Moroso";

export interface InmuebleEstadoRow {
  cuenta: string;
  titular: string;
  direccion: string;
  grupo: string;
  distrito: string;
  estado: EstadoInmueble;
  etapa: EtapaSeguimiento | "—";
  cuotasAdeudadas: number;
  montoAdeudado: number;
}

export function getEstadoInmuebles(): InmuebleEstadoRow[] {
  const morososMap = new Map(inmueblesMorosos.map((m) => [m.id, m]));
  return inmueblesPadron.map((inm) => {
    const mor = morososMap.get(inm.id);
    return {
      cuenta: inm.cuenta,
      titular: inm.titular,
      direccion: inm.direccion,
      grupo: inm.grupo,
      distrito: inm.distrito,
      estado: mor ? "Moroso" : "Al día",
      etapa: mor?.etapa ?? "—",
      cuotasAdeudadas: mor?.cuotasAdeudadas ?? 0,
      montoAdeudado: mor?.montoAdeudado ?? 0,
    };
  });
}

/* ---------- Reporte 6: Porcentajes de morosidad ---------- */

export interface MorosidadPorcentajeTotal {
  totalInmuebles: number;
  morosos: number;
  alDia: number;
  porcentajeMorosidad: number;
}

export function getMorosidadTotal(): MorosidadPorcentajeTotal {
  const total = inmueblesPadron.length;
  const morosos = inmueblesMorosos.length;
  return {
    totalInmuebles: total,
    morosos,
    alDia: total - morosos,
    porcentajeMorosidad: total === 0 ? 0 : (morosos / total) * 100,
  };
}

/* ---------- Reporte 5: Acciones por fecha (serie diaria) ---------- */

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
        porTipo: {
          "Aviso de deuda": 0,
          "Intimación": 0,
          "Aviso de corte": 0,
          "Corte": 0,
          "Regularización": 0,
          "Plan de pago": 0,
          "Compromiso de pago": 0,
        },
      };
      map.set(key, row);
    }
    row.total += 1;
    row.porTipo[r.tipo] += 1;
  });
  return Array.from(map.values()).sort((a, b) => a.fechaISO.localeCompare(b.fechaISO));
}

/* Helper común */
export const ETAPAS = etapasSeguimiento;