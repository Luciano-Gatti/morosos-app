export interface MotivoCierre {
  id: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  isSystem: boolean;
  usos: number;
}

export const motivosCierreIniciales: MotivoCierre[] = [
  {
    id: "mc-001",
    codigo: "PAGO_TOTAL",
    nombre: "Pago total de la deuda",
    descripcion: "El contribuyente regularizó completamente la deuda pendiente.",
    activo: true,
    isSystem: true,
    usos: 312,
  },
  {
    id: "mc-002",
    codigo: "PLAN_PAGOS",
    nombre: "Adhesión a plan de pagos",
    descripcion: "Suscripción a un plan de financiación vigente.",
    activo: true,
    isSystem: true,
    usos: 148,
  },
  {
    id: "mc-003",
    codigo: "CAMBIO_PARAMETRO",
    nombre: "Cambio de parámetro",
    descripcion: "Cierre automático por modificación de umbrales o reglas de seguimiento.",
    activo: true,
    isSystem: true,
    usos: 27,
  },
  {
    id: "mc-004",
    codigo: "PRESCRIPCION",
    nombre: "Prescripción de la deuda",
    descripcion: "La deuda fue declarada prescripta administrativamente.",
    activo: true,
    isSystem: false,
    usos: 9,
  },
  {
    id: "mc-005",
    codigo: "INMUEBLE_DESOCUPADO",
    nombre: "Inmueble desocupado",
    descripcion: "Verificación de campo confirma que el inmueble no está habitado.",
    activo: true,
    isSystem: false,
    usos: 14,
  },
  {
    id: "mc-006",
    nombre: "Acuerdo administrativo especial",
    descripcion: "Resolución particular firmada por autoridad competente.",
    activo: false,
    isSystem: false,
    usos: 0,
  },
];
