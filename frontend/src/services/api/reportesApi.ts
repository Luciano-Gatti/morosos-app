import { apiClient, buildQueryParams } from "@/lib/apiClient";
export const reportesApi = {
  morososGrupoDistrito: (params?: Record<string, any>) => apiClient.get(`/api/v1/reportes/morosos-grupo-distrito${buildQueryParams(params)}`),
  accionesFechas: (params?: Record<string, any>) => apiClient.get(`/api/v1/reportes/acciones-fechas${buildQueryParams(params)}`),
  accionesRegularizacion: (params?: Record<string, any>) => apiClient.get(`/api/v1/reportes/acciones-regularizacion${buildQueryParams(params)}`),
  estadoInmuebles: (params?: Record<string, any>) => apiClient.get(`/api/v1/reportes/estado-inmuebles${buildQueryParams(params)}`),
  historialMovimientos: (params?: Record<string, any>) => apiClient.get(`/api/v1/reportes/historial-movimientos${buildQueryParams(params)}`),
};
