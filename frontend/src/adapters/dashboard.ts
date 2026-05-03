import type { DashboardResumenDto } from "@/services/api/dashboardApi";

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

export function mapDashboardResumen(input: DashboardResumenDto): DashboardResumenViewModel {
  const kpisRaw = input?.kpis ?? {};
  const totalInmuebles = asNumber((kpisRaw as any).totalInmuebles);
  const alDia = asNumber((kpisRaw as any).alDia);
  const deudores = asNumber((kpisRaw as any).deudores);
  const morosos = asNumber((kpisRaw as any).morosos);

  const accionesMes = (Array.isArray(input?.accionesMes) ? input.accionesMes : []).map((a: any) => ({
    clave: asString(a?.clave, "sin-clave"),
    label: asString(a?.clave, "Sin clave"),
    cantidad: asNumber(a?.cantidad),
  }));

  const distritosStats = (Array.isArray(input?.distritos) ? input.distritos : []).map((d: any, idx: number) => ({
    distritoId: asString(d?.distritoId ?? d?.id, `d-${idx}`),
    distritoNombre: asString(d?.distritoNombre ?? d?.nombre),
    totalInmuebles: asNumber(d?.totalInmuebles),
    alDia: asNumber(d?.alDia),
    deudores: asNumber(d?.deudores),
    morosos: asNumber(d?.morosos),
    porcentajeMorosidad: asNumber(d?.porcentajeMorosidad),
    montoTotalDeuda: asNumber(d?.montoTotalDeuda),
    avisosDeuda: asNumber(d?.avisosDeuda),
    avisosCorte: asNumber(d?.avisosCorte),
    intimaciones: asNumber(d?.intimaciones),
    cortes: asNumber(d?.cortes),
  }));

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
  const hasAcciones = vm.accionesMes.length > 0;
  const hasDistritos = vm.distritosStats.length > 0;
  const hasMovimientos = vm.ultimosMovimientos.length > 0;
  return !(hasKpis || hasAcciones || hasDistritos || hasMovimientos);
}
