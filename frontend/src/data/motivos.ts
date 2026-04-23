export interface MotivoConfig {
  id: string;
  nombre: string;
  etapaId: string;
  descripcion?: string;
  usos: number;
}

export const motivosIniciales: MotivoConfig[] = [
  // Aviso de deuda (e1)
  {
    id: "m-001",
    nombre: "Aviso enviado por correo postal",
    etapaId: "e1",
    descripcion: "Notificación inicial despachada al domicilio fiscal.",
    usos: 184,
  },
  {
    id: "m-002",
    nombre: "Aviso entregado en mano",
    etapaId: "e1",
    usos: 42,
  },
  // Notificación 1 (e2)
  {
    id: "m-003",
    nombre: "Domicilio incorrecto",
    etapaId: "e2",
    descripcion: "El titular no reside en el domicilio registrado.",
    usos: 31,
  },
  {
    id: "m-004",
    nombre: "Titular ausente",
    etapaId: "e2",
    usos: 27,
  },
  {
    id: "m-005",
    nombre: "Notificación recibida sin observaciones",
    etapaId: "e2",
    usos: 96,
  },
  // Notificación 2 (e3)
  {
    id: "m-006",
    nombre: "Solicitud de revisión de deuda",
    etapaId: "e3",
    descripcion: "El contribuyente cuestiona el monto liquidado.",
    usos: 18,
  },
  {
    id: "m-007",
    nombre: "Reclamo administrativo en curso",
    etapaId: "e3",
    usos: 12,
  },
  // Aviso de corte (e4)
  {
    id: "m-008",
    nombre: "Inmueble desocupado",
    etapaId: "e4",
    descripcion: "Verificación de campo: el inmueble no se encuentra habitado.",
    usos: 22,
  },
  {
    id: "m-009",
    nombre: "Adhesión a plan de pagos",
    etapaId: "e4",
    descripcion: "Suscripción a un plan de financiación vigente.",
    usos: 64,
  },
  // Intimación legal (e5)
  {
    id: "m-010",
    nombre: "Pase a apremio",
    etapaId: "e5",
    descripcion: "Derivación al área legal para inicio de juicio.",
    usos: 9,
  },
  {
    id: "m-011",
    nombre: "Prescripción de la deuda",
    etapaId: "e5",
    usos: 5,
  },
  // Corte (e6)
  {
    id: "m-012",
    nombre: "Corte ejecutado",
    etapaId: "e6",
    descripcion: "Se realizó la suspensión efectiva del servicio.",
    usos: 28,
  },
  {
    id: "m-013",
    nombre: "Corte no ejecutado por imposibilidad técnica",
    etapaId: "e6",
    usos: 7,
  },
];
