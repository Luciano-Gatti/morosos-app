import type {
  AccionRegistro,
  AccionTipo,
  EstadoInmueble,
  InmuebleEstadoRow,
  MorosidadPorcentajeTotal,
  MorososPorDistritoRow,
  MorososPorGrupoRow,
} from "@/data/reportes";

const toNum = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const toStr = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const toDate = (v: unknown) => (v ? new Date(v as string | number | Date) : new Date(0));

export function mapReporteMorosos(payload: any): {
  grupos: MorososPorGrupoRow[];
  distritos: MorososPorDistritoRow[];
  total: MorosidadPorcentajeTotal;
} {
  const root = payload ?? {};
  const gruposRaw = root.grupos ?? root.porGrupo ?? root.content ?? [];
  const distritosRaw = root.distritos ?? root.porDistrito ?? [];
  const grupos: MorososPorGrupoRow[] = (Array.isArray(gruposRaw) ? gruposRaw : []).map((r: any) => ({
    grupo: toStr(r.grupo),
    distrito: toStr(r.distrito),
    etiqueta: toStr(r.etiqueta, `${toStr(r.grupo)} — ${toStr(r.distrito)}`),
    totalInmuebles: toNum(r.totalInmuebles),
    deudores: toNum(r.deudores),
    morosos: toNum(r.morosos),
    porcentaje: toNum(r.porcentaje),
  }));
  const distritos: MorososPorDistritoRow[] = (Array.isArray(distritosRaw) ? distritosRaw : []).map((r: any) => ({
    distrito: toStr(r.distrito),
    totalInmuebles: toNum(r.totalInmuebles),
    deudores: toNum(r.deudores),
    morosos: toNum(r.morosos),
    porcentaje: toNum(r.porcentaje),
  }));
  const total: MorosidadPorcentajeTotal = {
    totalInmuebles: toNum(root.totalInmuebles),
    deudores: toNum(root.deudores),
    morosos: toNum(root.morosos),
    alDia: toNum(root.alDia),
    porcentajeMorosidad: toNum(root.porcentajeMorosidad),
  };
  return { grupos, distritos, total };
}

export function mapReporteAccionesFechas(payload: any): AccionRegistro[] {
  const root = payload ?? {};
  const rows = root?.detalle ?? root?.content ?? root?.rows ?? root ?? [];
  return (Array.isArray(rows) ? rows : []).map((r: any) => ({
    id: String(r.id ?? r.accionId ?? ""),
    fecha: toDate(r.fecha ?? r.fechaAccion),
    tipo: toStr(r.tipoAccion ?? r.tipo ?? r.tipoAccionLabel) as AccionTipo,
    cuenta: toStr(r.cuenta),
    titular: toStr(r.titular),
    grupo: toStr(r.grupoNombre ?? r.grupo),
    distrito: toStr(r.distritoNombre ?? r.distrito),
    usuario: toStr(r.actorId ?? r.usuario ?? r.actor),
  }));
}

export function mapReporteAccionesRegularizacion(payload: any): AccionRegistro[] {
  return mapReporteAccionesFechas(payload);
}

export function mapReporteEstadoInmuebles(payload: any): InmuebleEstadoRow[] {
  const root = payload ?? {};
  const rows = root?.filas ?? root?.rows ?? root?.content ?? root ?? [];
  return (Array.isArray(rows) ? rows : []).map((r: any) => ({
    cuenta: toStr(r.cuenta),
    titular: toStr(r.titular),
    grupo: toStr(r.grupoNombre ?? r.grupo),
    distrito: toStr(r.distritoNombre ?? r.distrito),
    cuotasAdeudadas: toNum(r.cuotasAdeudadas ?? r.cuotas),
    montoAdeudado: toNum(r.montoAdeudado ?? r.deudaTotal),
    estado: toStr(r.estado) as EstadoInmueble,
    etapa: toStr(r.etapa ?? r.etapaNombre),
  }));
}

export function mapReportePorcentajesMorosidad(payload: any): MorosidadPorcentajeTotal {
  const root = payload ?? {};
  return {
    totalInmuebles: toNum(root.totalInmuebles),
    deudores: toNum(root.deudores),
    morosos: toNum(root.morosos),
    alDia: toNum(root.alDia),
    porcentajeMorosidad: toNum(root.porcentajeMorosidad ?? root.porcentaje),
  };
}

export function mapReporteHistorialMovimientos(payload: any): any[] {
  const rows = payload?.content ?? payload?.rows ?? payload?.movimientos ?? payload ?? [];
  return (Array.isArray(rows) ? rows : []).map((r: any, i: number) => ({
    id: String(r.id ?? r.eventId ?? `mov-${i}`),
    fecha: toStr(r.fecha ?? r.createdAt ?? r.timestamp),
    cuenta: toStr(r.cuenta),
    titular: toStr(r.titular),
    accion: toStr(r.actionLabel ?? r.resumen ?? r.action),
    etapa: toStr(r.etapa ?? r.entityType),
    tipo: toStr(r.action ?? r.tipo, "configuracion"),
    usuario: toStr(r.actorId ?? r.usuario ?? r.actor, "Sistema"),
    categoria: "movimiento",
  }));
}
