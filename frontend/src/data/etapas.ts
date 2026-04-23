export interface EtapaConfig {
  id: string;
  nombre: string;
  descripcion?: string;
  procesosAsociados: number;
}

export const etapasIniciales: EtapaConfig[] = [
  {
    id: "e1",
    nombre: "Aviso de deuda",
    descripcion: "Notificación inicial al titular informando la situación de mora.",
    procesosAsociados: 412,
  },
  {
    id: "e2",
    nombre: "Notificación 1",
    descripcion: "Primera notificación formal con plazo de regularización.",
    procesosAsociados: 287,
  },
  {
    id: "e3",
    nombre: "Notificación 2",
    descripcion: "Segunda notificación previa a intimación legal.",
    procesosAsociados: 196,
  },
  {
    id: "e4",
    nombre: "Aviso de corte",
    descripcion: "Comunicación previa al corte del servicio.",
    procesosAsociados: 134,
  },
  {
    id: "e5",
    nombre: "Intimación legal",
    descripcion: "Intimación formal con intervención del área legal.",
    procesosAsociados: 89,
  },
  {
    id: "e6",
    nombre: "Corte",
    descripcion: "Ejecución del corte del servicio por falta de pago.",
    procesosAsociados: 41,
  },
];
