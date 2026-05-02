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
  const rows = payload?.content ?? payload?.rows ?? payload ?? [];
  return (Array.isArray(rows) ? rows : []).map((r: any) => ({
    id: String(r.id ?? r.accionId ?? ""),
    fecha: toDate(r.fecha ?? r.fechaAccion),
    tipo: toStr(r.tipo ?? r.tipoAccion) as AccionTipo,
    cuenta: toStr(r.cuenta),
    titular: toStr(r.titular),
    grupo: toStr(r.grupo),
    distrito: toStr(r.distrito),
    usuario: toStr(r.usuario ?? r.actor),
  }));
}

export function mapReporteAccionesRegularizacion(payload: any): AccionRegistro[] {
  return mapReporteAccionesFechas(payload);
}

export function mapReporteEstadoInmuebles(payload: any): InmuebleEstadoRow[] {
  const rows = payload?.content ?? payload?.rows ?? payload ?? [];
  return (Array.isArray(rows) ? rows : []).map((r: any) => ({
    cuenta: toStr(r.cuenta),
    titular: toStr(r.titular),
    grupo: toStr(r.grupo),
    distrito: toStr(r.distrito),
    cuotasAdeudadas: toNum(r.cuotasAdeudadas ?? r.cuotas),
    deudaTotal: toNum(r.deudaTotal ?? r.montoAdeudado),
    estado: toStr(r.estado) as EstadoInmueble,
    etapa: (r.etapa ?? null) as any,
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
  const rows = payload?.content ?? payload?.rows ?? payload ?? [];
  return Array.isArray(rows) ? rows : [];
}

