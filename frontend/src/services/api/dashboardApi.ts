import { apiClient } from "@/lib/apiClient";

export interface DashboardResumenDto {
  kpis?: {
    totalInmuebles?: number;
    alDia?: number;
    deudores?: number;
    morosos?: number;
  };
  accionesMes?: Array<{ clave: string; cantidad: number }>;
  distritos?: Array<Record<string, unknown>>;
  movimientos?: Array<Record<string, unknown>>;
}

export const dashboardApi = {
  getResumen: () => apiClient.get<DashboardResumenDto>("/api/v1/dashboard/resumen"),
};
