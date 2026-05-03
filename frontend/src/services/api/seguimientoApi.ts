import { apiClient, buildQueryParams } from "@/lib/apiClient";
export const seguimientoApi = {
  getBandeja: (params: Record<string, any>) => apiClient.get(`/api/v1/seguimiento/bandeja${buildQueryParams(params)}`),
  historialInmueble: (inmuebleId: string) => apiClient.get(`/api/v1/seguimiento/inmuebles/${inmuebleId}/historial`),
  iniciar: (body: unknown) => apiClient.post("/api/v1/seguimiento/iniciar", body),
  avanzar: (body: unknown) => apiClient.post("/api/v1/seguimiento/avanzar", body),
  enviarEtapa: (body: unknown) => apiClient.post("/api/v1/seguimiento/enviar-etapa", body),
  repetir: (body: unknown) => apiClient.post("/api/v1/seguimiento/repetir", body),
  pausar: (body: unknown) => apiClient.post("/api/v1/seguimiento/pausar", body),
  reabrir: (body: unknown) => apiClient.post("/api/v1/seguimiento/reabrir", body),
  cerrar: (body: unknown) => apiClient.post("/api/v1/seguimiento/cerrar", body),
  cerrarBulk: (body: unknown) => apiClient.post("/api/v1/seguimiento/cerrar/bulk", body),
  registrarCompromiso: (body: unknown) => apiClient.post("/api/v1/seguimiento/compromisos", body),
  registrarCompromisosBulk: (body: unknown) => apiClient.post("/api/v1/seguimiento/compromisos/bulk", body),
};
