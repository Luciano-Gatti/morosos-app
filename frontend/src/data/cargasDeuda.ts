export type CargaEstado = "completada" | "con_errores" | "fallida" | "procesando";

export interface CargaDeuda {
  id: string;
  nombre: string;
  archivo: string;
  fecha: string; // ISO
  usuario: string;
  estado: CargaEstado;
  morosos: number;
  montoTotal: number;
  procesados: number;
  creados: number;
  actualizados: number;
  errores: number;
  noEncontradas: number;
}

const nombres = [
  "Padrón Municipal",
  "Cuotas Vencidas",
  "Liquidación Mensual",
  "Cargas Comerciales",
  "Distrito Loreto",
  "Periodo 03/2025",
  "Recategorización Industrial",
  "Refacturación Goya",
  "Servicios Generales",
  "Padrón Comercial",
  "Cuotas Atrasadas",
  "Distrito Mercedes",
  "Cargas Especiales",
  "Periodo 02/2025",
  "Industrias Norte",
];

const usuarios = [
  "J. Ramírez",
  "M. González",
  "C. Pereyra",
  "L. Martínez",
  "R. Fernández",
];

const estados: CargaEstado[] = [
  "completada",
  "completada",
  "con_errores",
  "completada",
  "con_errores",
  "completada",
  "fallida",
  "completada",
  "con_errores",
  "completada",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export const cargasDeuda: CargaDeuda[] = Array.from({ length: 24 }, (_, i) => {
  const idx = i + 1;
  const estado = estados[i % estados.length];
  const fail = estado === "fallida";
  const morosos = fail ? 0 : 80 + ((idx * 47) % 1900);
  const monto = fail ? 0 : Math.round((morosos * (12000 + ((idx * 813) % 48000))) / 10) * 10;
  const procesados = fail ? 0 : morosos + ((idx * 11) % 40);
  const errores =
    estado === "con_errores"
      ? 5 + ((idx * 13) % 80)
      : estado === "fallida"
      ? 1
      : (idx * 3) % 4;
  const noEncontradas = estado === "con_errores" ? 2 + ((idx * 7) % 25) : (idx * 2) % 5;
  const creados = fail ? 0 : Math.floor(morosos * 0.35);
  const actualizados = fail ? 0 : morosos - creados;

  // distribuir fechas en los últimos ~60 días
  const daysAgo = (idx * 53) % 60;
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(8 + ((idx * 5) % 10), (idx * 17) % 60, 0, 0);

  const periodo = `${pad(((idx + 2) % 12) + 1)}/2025`;
  const cuenta = String(2400 + idx);

  return {
    id: String(idx),
    nombre: `${nombres[i % nombres.length]} — ${periodo}`,
    archivo: `deuda_${cuenta}_${pad(d.getMonth() + 1)}${pad(d.getDate())}.xlsx`,
    fecha: d.toISOString(),
    usuario: usuarios[i % usuarios.length],
    estado,
    morosos,
    montoTotal: monto,
    procesados,
    creados,
    actualizados,
    errores,
    noEncontradas,
  };
});
