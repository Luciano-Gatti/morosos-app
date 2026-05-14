import type {
  AccionRegistro,
  AccionTipo,
  EstadoInmueble,
  InmuebleEstadoRow,
  MorosidadPorcentajeTotal,
  MorososPorDistritoRow,
  MorososPorGrupoRow,
  AccionesRegularizacionViewModel,
} from "@/types/reportes";

const toNum = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const toStr = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const toDate = (v: unknown) => (v ? new Date(v as string | number | Date) : new Date(0));

export function mapReporteMorosos(payload: any): {
  grupos: MorososPorGrupoRow[];
  distritos: MorososPorDistritoRow[];
  total: MorosidadPorcentajeTotal;
  parametroCuotasMoroso: number;
} {
  const root = payload ?? {};
  const gruposRaw = root.porDistritoGrupo ?? root.grupos ?? root.porGrupo ?? root.filas ?? root.content ?? [];
  const distritosRaw = root.distritos ?? root.porDistrito ?? [];
  const grupos: MorososPorGrupoRow[] = (Array.isArray(gruposRaw) ? gruposRaw : []).map((r: any) => ({
    grupo: toStr(r.grupo ?? r.grupoNombre),
    distrito: toStr(r.distrito ?? r.distritoNombre),
    etiqueta: toStr(r.etiqueta, `${toStr(r.grupo ?? r.grupoNombre)} — ${toStr(r.distrito ?? r.distritoNombre)}`),
    totalInmuebles: toNum(r.totalInmuebles ?? r.totalPadron ?? r.padron),
    deudores: toNum(r.deudores),
    morosos: toNum(r.morosos),
    porcentaje: toNum(r.porcentaje ?? r.porcentajeMorosidad),
  })).sort((a, b) => {
    const grupoCmp = a.grupo.localeCompare(b.grupo, "es", { sensitivity: "base" });
    if (grupoCmp !== 0) return grupoCmp;
    return a.distrito.localeCompare(b.distrito, "es", { sensitivity: "base" });
  });
  const distritos: MorososPorDistritoRow[] = (Array.isArray(distritosRaw) ? distritosRaw : []).map((r: any) => ({
    distrito: toStr(r.distrito ?? r.distritoNombre),
    totalInmuebles: toNum(r.totalInmuebles ?? r.padron),
    deudores: toNum(r.deudores),
    morosos: toNum(r.morosos),
    porcentaje: toNum(r.porcentaje ?? r.porcentajeMorosidad),
  }));
  const total: MorosidadPorcentajeTotal = {
    totalInmuebles: toNum(root.totalInmuebles ?? root.totalPadron),
    deudores: toNum(root.deudores ?? root.totalDeudores),
    morosos: toNum(root.morosos ?? root.totalMorosos),
    alDia: toNum(root.alDia ?? root.totalAlDia),
    porcentajeMorosidad: toNum(root.porcentajeMorosidad ?? root.porcentajeMorosidadGeneral),
  };
  return { grupos, distritos, total, parametroCuotasMoroso: toNum(root.parametroCuotasMoroso, 0) };
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
  const vm = mapReporteAccionesRegularizacionDetallado(payload);
  return vm.rows;
}

export function mapReporteAccionesRegularizacionDetallado(payload: any): AccionesRegularizacionViewModel {
  const root = payload ?? {};
  const porTipoRaw = root?.porTipo ?? [];
  const planesRaw = root?.planesPago?.content ?? root?.planesDePago ?? [];
  const compromisosRaw = root?.compromisos?.content ?? root?.compromisosDePago ?? [];
  const regularizacionesRaw = root?.regularizaciones?.content ?? [];

  const regularizaciones = (Array.isArray(regularizacionesRaw) ? regularizacionesRaw : []).map((r: any) => ({
    id: String(r?.casoSeguimientoId ?? r?.inmuebleId ?? r?.cuenta ?? crypto.randomUUID?.() ?? Math.random()),
    fecha: toDate(r?.fechaCierre ?? r?.fecha),
    tipo: "Regularización" as const,
    cuenta: toStr(r?.cuenta),
    titular: toStr(r?.titular),
    grupo: toStr(r?.grupoNombre ?? r?.grupo),
    distrito: toStr(r?.distritoNombre ?? r?.distrito),
    usuario: toStr(r?.actorId ?? r?.usuario ?? r?.responsable),
  }));
  const planes = (Array.isArray(planesRaw) ? planesRaw : []).map((r: any) => ({
    fechaAlta: toDate(r?.fechaCierre ?? r?.fechaAlta),
    cuenta: toStr(r?.cuenta),
    titular: toStr(r?.titular),
    grupo: toStr(r?.grupoNombre ?? r?.grupo),
    cuotas: toNum(r?.cantidadCuotas ?? r?.cuotas),
    montoTotal: toNum(r?.montoTotal),
    proximoVencimiento: r?.fechaVencimientoPrimeraCuota ? toDate(r?.fechaVencimientoPrimeraCuota) : null,
    vencimientoFinal: r?.fechaVencimientoFinal ? toDate(r?.fechaVencimientoFinal) : null,
    estado: toStr(r?.estadoLabel ?? r?.estado),
  }));
  const compromisos = (Array.isArray(compromisosRaw) ? compromisosRaw : []).map((r: any) => ({
    fecha: toDate(r?.fechaDesde ?? r?.fecha),
    cuenta: toStr(r?.cuenta),
    titular: toStr(r?.titular),
    grupo: toStr(r?.grupoNombre ?? r?.grupo),
    distrito: toStr(r?.distritoNombre ?? r?.distrito),
    responsable: toStr(r?.actorId ?? r?.responsable ?? r?.usuario),
  }));
  const rows = [
    ...regularizaciones,
    ...planes.map((p) => ({ ...p, id: `${p.cuenta}-${p.fechaAlta.toISOString()}`, fecha: p.fechaAlta, tipo: "Plan de pago" as const, distrito: "", usuario: "" })),
    ...compromisos.map((c) => ({ ...c, id: `${c.cuenta}-${c.fecha.toISOString()}`, tipo: "Compromiso de pago" as const, grupo: c.grupo, usuario: c.responsable })),
  ] as AccionRegistro[];

  const detallePorTipo = (Array.isArray(porTipoRaw) ? porTipoRaw : []).map((r: any) => ({
    tipo: toStr(r?.tipoLabel ?? r?.tipo, "Regularización") as any,
    cantidad: toNum(r?.cantidad),
    porcentaje: toNum(r?.porcentaje),
  }));

  return {
    rows,
    detallePorTipo,
    planesDePago: planes,
    compromisosDePago: compromisos,
  };
}

export function mapReporteEstadoInmuebles(payload: any): { rows: InmuebleEstadoRow[]; totales: { totalInmuebles:number; alDia:number; deudores:number; morosos:number; deudaTotal:number }; distribucion: { estado:string; cantidad:number; porcentaje:number }[]; parametroCuotasMoroso:number } {
  const root = payload ?? {};
  const rows = root?.inmuebles ?? root?.filas ?? root?.rows ?? root?.content ?? root ?? [];
  const mappedRows = (Array.isArray(rows) ? rows : []).map((r: any) => ({
    cuenta: toStr(r.cuenta),
    titular: toStr(r.titular),
    grupo: toStr(r.grupoNombre ?? r.grupo),
    distrito: toStr(r.distritoNombre ?? r.distrito),
    cuotasAdeudadas: toNum(r.cuotasAdeudadas ?? r.cuotas),
    montoAdeudado: toNum(r.montoAdeudado ?? r.deudaTotal),
    estado: toStr(r.estado) as EstadoInmueble,
    etapa: toStr(r.etapa ?? r.etapaNombre),
  }));
  const t = root?.totales ?? {};
  const distribucionRaw = root?.distribucion ?? [];
  return {
    rows: mappedRows,
    parametroCuotasMoroso: toNum(root?.parametroCuotasMoroso),
    totales: {
      totalInmuebles: toNum(t?.totalInmuebles, mappedRows.length),
      alDia: toNum(t?.alDia),
      deudores: toNum(t?.deudores),
      morosos: toNum(t?.morosos),
      deudaTotal: toNum(t?.deudaTotal),
    },
    distribucion: (Array.isArray(distribucionRaw) ? distribucionRaw : []).map((d: any) => ({
      estado: toStr(d?.estado),
      cantidad: toNum(d?.cantidad),
      porcentaje: toNum(d?.porcentaje),
    })),
  };
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
