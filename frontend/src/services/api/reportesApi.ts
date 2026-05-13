import { apiClient, buildQueryParams } from "@/lib/apiClient";
export const reportesApi = {
  morososGrupoDistrito: async (params?: Record<string, any>) => {
    const path = `/api/v1/reportes/morosos-grupo-distrito${buildQueryParams(params)}`;
    console.debug("[reportesApi] morososGrupoDistrito:start", { path, params });
    try {
      const response = await apiClient.get(path);
      console.debug("[reportesApi] morososGrupoDistrito:success", { path, response });
      return response;
    } catch (error) {
      console.error("[reportesApi] morososGrupoDistrito:error", { path, error });
      throw error;
    }
  },
  accionesFechas: (params?: Record<string, any>) => apiClient.get(`/api/v1/reportes/acciones-fechas${buildQueryParams(params)}`),
  accionesRegularizacion: (params?: Record<string, any>) => apiClient.get(`/api/v1/reportes/acciones-regularizacion${buildQueryParams(params)}`),
  estadoInmuebles: (params?: Record<string, any>) => apiClient.get(`/api/v1/reportes/estado-inmuebles${buildQueryParams(params)}`),
  historialMovimientos: (params?: Record<string, any>) => apiClient.get(`/api/v1/reportes/historial-movimientos${buildQueryParams(params)}`),
};
