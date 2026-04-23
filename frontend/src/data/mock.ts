import type { EstadoSeguimiento } from "@/components/StatusBadge";

export interface InmuebleMoroso {
  id: string;
  cuenta: string;
  titular: string;
  direccion: string;
  grupo: string;
  deuda: number;
  periodos: number;
  etapa: string;
  estado: EstadoSeguimiento;
  ultimaGestion: string;
}

export const inmueblesMorososRecientes: InmuebleMoroso[] = [
  {
    id: "1",
    cuenta: "0045-218-7",
    titular: "González, María Inés",
    direccion: "Av. San Martín 1245",
    grupo: "Residencial A",
    deuda: 184_320,
    periodos: 7,
    etapa: "Notificación 2",
    estado: "activo",
    ultimaGestion: "12/04/2026",
  },
  {
    id: "2",
    cuenta: "0182-094-3",
    titular: "Comercial del Sur S.R.L.",
    direccion: "Belgrano 882",
    grupo: "Comercial",
    deuda: 612_800,
    periodos: 11,
    etapa: "Intimación legal",
    estado: "activo",
    ultimaGestion: "11/04/2026",
  },
  {
    id: "3",
    cuenta: "0073-551-1",
    titular: "Pereyra, Carlos A.",
    direccion: "Sarmiento 4501",
    grupo: "Residencial B",
    deuda: 92_140,
    periodos: 4,
    etapa: "Plan de pago",
    estado: "pausado",
    ultimaGestion: "09/04/2026",
  },
  {
    id: "4",
    cuenta: "0291-712-9",
    titular: "Industrias Norte S.A.",
    direccion: "Ruta 11 Km 8",
    grupo: "Industrial",
    deuda: 1_245_000,
    periodos: 14,
    etapa: "Intimación legal",
    estado: "activo",
    ultimaGestion: "08/04/2026",
  },
  {
    id: "5",
    cuenta: "0017-330-2",
    titular: "Martínez, Laura B.",
    direccion: "Mitre 322",
    grupo: "Residencial A",
    deuda: 47_900,
    periodos: 3,
    etapa: "Notificación 1",
    estado: "cerrado",
    ultimaGestion: "05/04/2026",
  },
  {
    id: "6",
    cuenta: "0410-118-6",
    titular: "Rodríguez, Hugo D.",
    direccion: "España 76",
    grupo: "Residencial B",
    deuda: 218_650,
    periodos: 6,
    etapa: "Notificación 2",
    estado: "activo",
    ultimaGestion: "04/04/2026",
  },
];

export interface ActividadItem {
  id: string;
  hora: string;
  usuario: string;
  accion: string;
  detalle: string;
}

export const actividadReciente: ActividadItem[] = [
  { id: "a1", hora: "Hoy · 10:42", usuario: "J. Ramírez", accion: "Cambio de etapa", detalle: "Cuenta 0182-094-3 → Intimación legal" },
  { id: "a2", hora: "Hoy · 09:15", usuario: "M. Soto", accion: "Observación registrada", detalle: "Cuenta 0073-551-1 — Contacto telefónico realizado" },
  { id: "a3", hora: "Ayer · 17:30", usuario: "Sistema", accion: "Importación de deuda", detalle: "1.284 registros procesados (período 04/2026)" },
  { id: "a4", hora: "Ayer · 14:08", usuario: "L. Vega", accion: "Cierre de proceso", detalle: "Cuenta 0017-330-2 regularizada" },
  { id: "a5", hora: "15/04 · 11:22", usuario: "J. Ramírez", accion: "Plan de pago", detalle: "Cuenta 0291-712-9 — 6 cuotas acordadas" },
];

export const distribucionEtapas = [
  { etapa: "Notificación 1", cantidad: 412 },
  { etapa: "Notificación 2", cantidad: 287 },
  { etapa: "Plan de pago", cantidad: 154 },
  { etapa: "Intimación legal", cantidad: 89 },
  { etapa: "Cerrado", cantidad: 63 },
];

// ---- Dashboard institucional ----

export type AccionClave = "avisos_deuda" | "avisos_corte" | "intimaciones" | "cortes";

export interface DistritoStat {
  distrito: string;
  usuarios: number;
  morosos: number;
  acciones: Record<AccionClave, number>;
}

export const distritosStats: DistritoStat[] = [
  {
    distrito: "Loreto",
    usuarios: 4_820,
    morosos: 412,
    acciones: {
      avisos_deuda: 1_124,
      avisos_corte: 386,
      intimaciones: 142,
      cortes: 58,
    },
  },
  {
    distrito: "Ituzaingó",
    usuarios: 3_540,
    morosos: 287,
    acciones: {
      avisos_deuda: 718,
      avisos_corte: 226,
      intimaciones: 76,
      cortes: 36,
    },
  },
  {
    distrito: "San Roque",
    usuarios: 2_980,
    morosos: 341,
    acciones: {
      avisos_deuda: 845,
      avisos_corte: 268,
      intimaciones: 98,
      cortes: 41,
    },
  },
  {
    distrito: "Goya",
    usuarios: 5_210,
    morosos: 498,
    acciones: {
      avisos_deuda: 1_312,
      avisos_corte: 412,
      intimaciones: 165,
      cortes: 72,
    },
  },
  {
    distrito: "Mercedes",
    usuarios: 2_140,
    morosos: 198,
    acciones: {
      avisos_deuda: 524,
      avisos_corte: 162,
      intimaciones: 54,
      cortes: 22,
    },
  },
  {
    distrito: "Curuzú Cuatiá",
    usuarios: 1_860,
    morosos: 156,
    acciones: {
      avisos_deuda: 398,
      avisos_corte: 124,
      intimaciones: 41,
      cortes: 18,
    },
  },
];

export const accionesLabels: Record<AccionClave, string> = {
  avisos_deuda: "Avisos de deuda",
  avisos_corte: "Avisos de corte",
  intimaciones: "Intimaciones",
  cortes: "Cortes realizados",
};

const sumar = (k: AccionClave) => distritosStats.reduce((acc, d) => acc + d.acciones[k], 0);

export const accionesMes = (Object.keys(accionesLabels) as AccionClave[]).map((k) => ({
  clave: k,
  label: accionesLabels[k],
  cantidad: sumar(k),
}));

const totalUsuarios = distritosStats.reduce((a, b) => a + b.usuarios, 0);
const totalMorosos = distritosStats.reduce((a, b) => a + b.morosos, 0);

export const resumenMorosidad = {
  totalInmuebles: totalUsuarios,
  alDia: totalUsuarios - totalMorosos,
  morosos: totalMorosos,
};

// ---- Últimos movimientos ----

export type MovimientoTipo =
  | "intimacion"
  | "corte"
  | "regularizacion"
  | "plan_pago"
  | "compromiso"
  | "aviso_deuda"
  | "aviso_corte";

export interface Movimiento {
  id: string;
  fecha: string;
  cuenta: string;
  titular: string;
  accion: string;
  etapa?: string;
  tipo: MovimientoTipo;
}

export const ultimosMovimientos: Movimiento[] = [
  {
    id: "m1",
    fecha: "15/04/2026 · 11:42",
    cuenta: "0182-094-3",
    titular: "Comercial del Sur S.R.L.",
    accion: "Pasó a etapa de Intimación",
    etapa: "Intimación legal",
    tipo: "intimacion",
  },
  {
    id: "m2",
    fecha: "15/04/2026 · 10:15",
    cuenta: "0291-712-9",
    titular: "Industrias Norte S.A.",
    accion: "Pasó a etapa de Corte",
    etapa: "Corte",
    tipo: "corte",
  },
  {
    id: "m3",
    fecha: "14/04/2026 · 17:08",
    cuenta: "0017-330-2",
    titular: "Martínez, Laura B.",
    accion: "Proceso cerrado por regularización",
    etapa: "Cerrado",
    tipo: "regularizacion",
  },
  {
    id: "m4",
    fecha: "14/04/2026 · 14:22",
    cuenta: "0073-551-1",
    titular: "Pereyra, Carlos A.",
    accion: "Plan de pago acordado (6 cuotas)",
    etapa: "Plan de pago",
    tipo: "plan_pago",
  },
  {
    id: "m5",
    fecha: "14/04/2026 · 11:30",
    cuenta: "0410-118-6",
    titular: "Rodríguez, Hugo D.",
    accion: "Compromiso de pago registrado",
    etapa: "Notificación 2",
    tipo: "compromiso",
  },
  {
    id: "m6",
    fecha: "13/04/2026 · 16:48",
    cuenta: "0045-218-7",
    titular: "González, María Inés",
    accion: "Aviso de corte emitido",
    etapa: "Notificación 2",
    tipo: "aviso_corte",
  },
  {
    id: "m7",
    fecha: "13/04/2026 · 09:12",
    cuenta: "0512-301-4",
    titular: "Fernández, Roberto",
    accion: "Aviso de deuda emitido",
    etapa: "Notificación 1",
    tipo: "aviso_deuda",
  },
];
