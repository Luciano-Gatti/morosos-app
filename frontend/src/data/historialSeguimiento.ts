import { inmueblesPadron } from "./inmuebles";
import { etapasSeguimiento, type EtapaSeguimiento, type EstadoOperativo } from "./seguimiento";

export type CierreProceso =
  | "Regularización total"
  | "Plan de pago acordado"
  | "Cierre administrativo"
  | null;

export interface RegistroHistorial {
  id: string;
  fecha: string; // dd/mm/aaaa
  hora: string;
  numeroProceso: string; // PRC-2024-001
  etapa: EtapaSeguimiento;
  estadoOperativo: EstadoOperativo;
  motivo: string;
  observaciones: string;
  compromisoPago?: {
    fechaCompromiso: string;
    monto: number;
    cumplido: boolean;
  } | null;
  cierre?: CierreProceso;
  responsable: string;
}

export interface ProcesoSeguimiento {
  id: string; // PRC-XXXX-NNN
  fechaInicio: string;
  fechaFin: string | null; // null si está abierto
  estado: "abierto" | "cerrado";
  motivoApertura: string;
  motivoCierre: CierreProceso;
  registros: RegistroHistorial[];
}

export interface HistorialInmueble {
  inmuebleId: string;
  procesos: ProcesoSeguimiento[];
  observacionesLibres: ObservacionLibre[];
}

export interface ObservacionLibre {
  id: string;
  fecha: string;
  autor: string;
  cargo: string;
  texto: string;
}

const motivos = [
  "Mora superior a 3 períodos",
  "Reincidencia en mora",
  "Falta de respuesta a aviso previo",
  "Detección por auditoría interna",
  "Solicitud de área comercial",
];

const responsables = [
  "J. Ramírez",
  "M. Soto",
  "L. Vega",
  "C. Domínguez",
  "P. Aguirre",
  "Sistema automático",
];

const observacionesEjemplo = [
  "Se intentó contacto telefónico al titular sin respuesta. Se deja mensaje en buzón.",
  "Titular notificado en domicilio fiscal. Firma constancia de recepción.",
  "Se recibe llamada del titular manifestando voluntad de regularizar la deuda.",
  "Notificación devuelta por correo: domicilio cerrado en sucesivas visitas.",
  "Reunión presencial en oficinas del organismo. Se acuerda esquema de pagos.",
  "Acta labrada por inspector zonal. Se constata medidor en funcionamiento normal.",
  "Solicitud de plan de pago presentada por mesa de entradas.",
  "Cumplimiento parcial del compromiso. Se reanuda gestión en próxima etapa.",
];

function pseudo(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function pad(n: number, w = 2) {
  return String(n).padStart(w, "0");
}

function fmtFecha(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function fmtHora(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildHistorial(seed: number): HistorialInmueble {
  const cantProcesos = 1 + Math.floor(pseudo(seed) * 3); // 1..3
  const procesos: ProcesoSeguimiento[] = [];

  let fecha = new Date(2024, 0, 5 + Math.floor(pseudo(seed + 1) * 60));

  for (let p = 0; p < cantProcesos; p++) {
    const esUltimo = p === cantProcesos - 1;
    const numero = `PRC-${fecha.getFullYear()}-${pad(seed * 7 + p, 3)}`;
    const fechaInicio = new Date(fecha);
    const motivoApertura = motivos[Math.floor(pseudo(seed + p + 2) * motivos.length)];

    const registros: RegistroHistorial[] = [];
    const cantEtapasRecorridas = esUltimo
      ? 1 + Math.floor(pseudo(seed + p + 5) * etapasSeguimiento.length)
      : 1 + Math.floor(pseudo(seed + p + 5) * etapasSeguimiento.length);

    for (let e = 0; e < cantEtapasRecorridas; e++) {
      fecha = new Date(fecha);
      fecha.setDate(fecha.getDate() + 12 + Math.floor(pseudo(seed + p * 10 + e) * 25));
      fecha.setHours(8 + Math.floor(pseudo(seed + p * 10 + e + 1) * 9));
      fecha.setMinutes(Math.floor(pseudo(seed + p * 10 + e + 2) * 60));

      const r = pseudo(seed + p * 17 + e * 31);
      const estadoOperativo: EstadoOperativo =
        esUltimo && e === cantEtapasRecorridas - 1
          ? r < 0.7
            ? "Activo"
            : "Pausado"
          : "Activo";

      const tieneCompromiso = pseudo(seed + p + e + 7) < 0.35;
      const compromisoFecha = new Date(fecha);
      compromisoFecha.setDate(compromisoFecha.getDate() + 15);

      registros.push({
        id: `${numero}-${e + 1}`,
        fecha: fmtFecha(fecha),
        hora: fmtHora(fecha),
        numeroProceso: numero,
        etapa: etapasSeguimiento[e % etapasSeguimiento.length],
        estadoOperativo,
        motivo: motivos[(e + p) % motivos.length],
        observaciones: observacionesEjemplo[(seed + p * 3 + e) % observacionesEjemplo.length],
        compromisoPago: tieneCompromiso
          ? {
              fechaCompromiso: fmtFecha(compromisoFecha),
              monto: 25_000 + Math.floor(pseudo(seed + p + e + 11) * 220_000),
              cumplido: pseudo(seed + p + e + 13) > 0.4,
            }
          : null,
        cierre: null,
        responsable: responsables[(seed + p + e) % responsables.length],
      });
    }

    let motivoCierre: CierreProceso = null;
    let fechaFin: string | null = null;
    if (!esUltimo) {
      const cierreOptions: Exclude<CierreProceso, null>[] = [
        "Regularización total",
        "Plan de pago acordado",
        "Cierre administrativo",
      ];
      motivoCierre = cierreOptions[(seed + p) % cierreOptions.length];
      fecha = new Date(fecha);
      fecha.setDate(fecha.getDate() + 7);
      fechaFin = fmtFecha(fecha);

      // marcar el último registro con el cierre
      const last = registros[registros.length - 1];
      last.cierre = motivoCierre;
      last.estadoOperativo = "Activo";

      // gap antes del próximo proceso
      fecha.setDate(fecha.getDate() + 90 + Math.floor(pseudo(seed + p + 17) * 120));
    }

    procesos.push({
      id: numero,
      fechaInicio: fmtFecha(fechaInicio),
      fechaFin,
      estado: esUltimo ? "abierto" : "cerrado",
      motivoApertura,
      motivoCierre,
      registros,
    });
  }

  // Observaciones libres
  const cantObs = 2 + Math.floor(pseudo(seed + 99) * 3);
  const observacionesLibres: ObservacionLibre[] = Array.from({ length: cantObs }, (_, i) => {
    const f = new Date(2025, (seed + i) % 12, 1 + ((seed + i * 3) % 27));
    return {
      id: `OBS-${seed}-${i}`,
      fecha: fmtFecha(f),
      autor: responsables[(seed + i) % (responsables.length - 1)],
      cargo: i % 2 === 0 ? "Analista de gestión" : "Inspector zonal",
      texto:
        i === 0
          ? "El titular manifiesta dificultades económicas transitorias por el contexto comercial del rubro. Se sugiere acompañamiento con plan de pago flexible y seguimiento mensual hasta regularización completa."
          : i === 1
            ? "Inmueble verificado en terreno: se constata uso conforme y medidor en correcto funcionamiento. No hay indicios de conexión irregular ni manipulación. Se deja constancia para futuras auditorías."
            : "Se mantiene comunicación estable con el responsable del inmueble. Compromisos previos cumplidos parcialmente. Conviene mantener contacto periódico.",
    };
  });

  return {
    inmuebleId: String(seed),
    procesos,
    observacionesLibres,
  };
}

const cache = new Map<string, HistorialInmueble>();

export function getHistorialInmueble(id: string): HistorialInmueble {
  if (cache.has(id)) return cache.get(id)!;
  const seed = Number(id) || 1;
  const h = buildHistorial(seed);
  h.inmuebleId = id;
  cache.set(id, h);
  return h;
}

export function inmuebleExists(id: string): boolean {
  return inmueblesPadron.some((i) => i.id === id);
}