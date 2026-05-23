import type { DashboardResumenDto } from "@/services/api/dashboardApi";
import type { AccionClave } from "@/types/dashboard";

export interface DashboardResumenViewModel {
  resumenMorosidad: {
    totalInmuebles: number;
    alDia: number;
    deudores: number;
    morosos: number;
    porcentajeMorosidad: number;
    montoTotalDeuda: number;
  };
  accionesMes: Array<{ clave: string; label: string; cantidad: number }>;
  distritosStats: Array<{
    distritoId: string;
    distritoNombre: string;
    totalInmuebles: number;
    alDia: number;
    deudores: number;
    morosos: number;
    porcentajeMorosidad: number;
    montoTotalDeuda: number;
    avisosDeuda: number;
    avisosCorte: number;
    intimaciones: number;
    cortes: number;
  }>;
  ultimosMovimientos: Array<{
    fecha: string;
    tipo: string;
    cuenta: string;
    titular: string;
    etapa: string;
    actorId: string;
    categoria: string;
  }>;
}

const asNumber = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const asString = (v: unknown, fallback = "-"): string => (typeof v === "string" && v.trim() ? v : fallback);
const asAccion = (v: unknown): AccionClave => (v === "avisos_deuda" || v === "avisos_corte" || v === "intimaciones" || v === "cortes" ? v : "avisos_deuda");

export function mapDashboardResumen(input: DashboardResumenDto): DashboardResumenViewModel {
  const kpisRaw = input?.kpis ?? {};
  const totalInmuebles = asNumber((kpisRaw as any).totalInmuebles);
  const alDia = asNumber((kpisRaw as any).alDia);
  const deudores = asNumber((kpisRaw as any).deudores);
  const morosos = asNumber((kpisRaw as any).morosos);

  const accionesRaw: any = input?.accionesMes ?? {};
  const accionesMes = [
    { clave: "avisos_deuda", cantidad: asNumber(accionesRaw.avisosDeuda) },
    { clave: "avisos_corte", cantidad: asNumber(accionesRaw.avisosCorte) },
    { clave: "intimaciones", cantidad: asNumber(accionesRaw.intimaciones) },
    { clave: "cortes", cantidad: asNumber(accionesRaw.cortes) },
  ].map((a) => ({ clave: asAccion(a.clave), label: asString(a.clave), cantidad: a.cantidad }));

  const distritosStats = (Array.isArray(input?.distritos) ? input.distritos : []).map((d: any, idx: number) => {
    const totalInmuebles = asNumber(d?.totalInmuebles ?? d?.usuarios ?? d?.totalPadron);
    const deudores = asNumber(d?.deudores ?? d?.bajoUmbral);
    const morosos = asNumber(d?.morosos ?? d?.enUmbral);
    const alDiaRaw = d?.alDia ?? d?.sinDeuda;
    const alDia = typeof alDiaRaw === "number" && Number.isFinite(alDiaRaw)
      ? asNumber(alDiaRaw)
      : Math.max(totalInmuebles - deudores - morosos, 0);
    const porcentajeMorosidad = totalInmuebles > 0
      ? asNumber(d?.porcentajeMorosidad) || (morosos / totalInmuebles) * 100
      : 0;

    return {
      distrito: asString(d?.distritoNombre ?? d?.nombreDistrito ?? d?.distrito ?? d?.nombre, "Distrito sin nombre"),
      usuarios: totalInmuebles,
      deudores,
      morosos,
      acciones: {
        avisos_deuda: asNumber(d?.avisosDeuda),
        avisos_corte: asNumber(d?.avisosCorte),
        intimaciones: asNumber(d?.intimaciones),
        cortes: asNumber(d?.cortes),
      },
      distritoId: asString(d?.distritoId ?? d?.id, `d-${idx}`),
      distritoNombre: asString(d?.distritoNombre ?? d?.nombreDistrito ?? d?.distrito ?? d?.nombre, "Distrito sin nombre"),
      totalInmuebles,
      alDia,
      porcentajeMorosidad,
      montoTotalDeuda: asNumber(d?.montoTotalDeuda),
      avisosDeuda: asNumber(d?.avisosDeuda),
      avisosCorte: asNumber(d?.avisosCorte),
      intimaciones: asNumber(d?.intimaciones),
      cortes: asNumber(d?.cortes),
    };
  });

  const ultimosMovimientos = (Array.isArray(input?.movimientos) ? input.movimientos : []).map((m: any) => ({
    fecha: asString(m?.fecha),
    tipo: asString(m?.tipo),
    cuenta: asString(m?.cuenta),
    titular: asString(m?.titular),
    etapa: asString(m?.etapa),
    actorId: asString(m?.actorId),
    categoria: asString(m?.categoria),
  }));

  return {
    resumenMorosidad: {
      totalInmuebles,
      alDia,
      deudores,
      morosos,
      porcentajeMorosidad: asNumber((kpisRaw as any).porcentajeMorosidad),
      montoTotalDeuda: asNumber((kpisRaw as any).montoTotalDeuda),
    },
    accionesMes,
    distritosStats,
    ultimosMovimientos,
  };
}

export function isDashboardResumenEmpty(vm: DashboardResumenViewModel): boolean {
  const hasKpis = vm.resumenMorosidad.totalInmuebles > 0 || vm.resumenMorosidad.deudores > 0 || vm.resumenMorosidad.morosos > 0;
  const hasDistritos = vm.distritosStats.length > 0;
  return !(hasKpis || hasDistritos);
}
