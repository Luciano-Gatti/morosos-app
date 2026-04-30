import { apiClient, buildQueryParams } from "@/lib/apiClient";

export const configuracionApi = {
  grupos: (params?: Record<string, any>) => apiClient.get(`/api/v1/grupos${buildQueryParams(params)}`),
  crearGrupo: (body: unknown) => apiClient.post(`/api/v1/grupos`, body),
  actualizarGrupo: (id: string, body: unknown) => apiClient.put(`/api/v1/grupos/${id}`, body),
  toggleGrupoActivo: (id: string, activo: boolean) => apiClient.patch(`/api/v1/grupos/${id}/activo`, { activo }),
  eliminarGrupo: (id: string) => apiClient.delete?.(`/api/v1/grupos/${id}`) ?? apiClient.post(`/api/v1/grupos/${id}`, { _method: "DELETE" }),

  distritos: (params?: Record<string, any>) => apiClient.get(`/api/v1/distritos${buildQueryParams(params)}`),
  crearDistrito: (body: unknown) => apiClient.post(`/api/v1/distritos`, body),
  actualizarDistrito: (id: string, body: unknown) => apiClient.put(`/api/v1/distritos/${id}`, body),
  toggleDistritoActivo: (id: string, activo: boolean) => apiClient.patch(`/api/v1/distritos/${id}/activo`, { activo }),

  grupoDistritoConfig: (params?: Record<string, any>) => apiClient.get(`/api/v1/grupo-distrito-config${buildQueryParams(params)}`),
  actualizarGrupoDistritoConfig: (id: string, body: unknown) => apiClient.put(`/api/v1/grupo-distrito-config/${id}`, body),

  etapas: (params?: Record<string, any>) => apiClient.get(`/api/v1/etapas${buildQueryParams(params)}`),
  crearEtapa: (body: unknown) => apiClient.post(`/api/v1/etapas`, body),
  actualizarEtapa: (id: string, body: unknown) => apiClient.put(`/api/v1/etapas/${id}`, body),
  eliminarEtapa: (id: string) => apiClient.delete?.(`/api/v1/etapas/${id}`) ?? apiClient.post(`/api/v1/etapas/${id}`, { _method: "DELETE" }),
  reordenarEtapas: (body: unknown) => apiClient.post(`/api/v1/etapas/reordenar`, body),

  motivosCierre: (params?: Record<string, any>) => apiClient.get(`/api/v1/motivos-cierre${buildQueryParams(params)}`),
  crearMotivoCierre: (body: unknown) => apiClient.post(`/api/v1/motivos-cierre`, body),
  actualizarMotivoCierre: (id: string, body: unknown) => apiClient.put(`/api/v1/motivos-cierre/${id}`, body),
  toggleMotivoCierreActivo: (id: string, activo: boolean) => apiClient.patch(`/api/v1/motivos-cierre/${id}/activo`, { activo }),
  eliminarMotivoCierre: (id: string) => apiClient.delete?.(`/api/v1/motivos-cierre/${id}`) ?? apiClient.post(`/api/v1/motivos-cierre/${id}`, { _method: "DELETE" }),
};
