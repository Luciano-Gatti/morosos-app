import { normalizePageResponse, normalizeSpringPage } from "@/adapters/pagination";
import { apiClient, buildQueryParams } from "@/lib/apiClient";
import type { FrontendPage, PageResponse, SpringPage } from "@/types/pagination";

export interface InmuebleDto { id: string; cuenta: string; titular: string; direccion: string; grupo: string; distrito: string; activo: boolean; }

export const inmueblesApi = {
  async list(params: Record<string, string | number | boolean | null | undefined>): Promise<FrontendPage<InmuebleDto>> {
    const data = await apiClient.get<PageResponse<InmuebleDto> | SpringPage<InmuebleDto>>(`/api/v1/inmuebles${buildQueryParams(params)}`);
    return "number" in data ? normalizeSpringPage(data) : normalizePageResponse(data);
  },
  getById: (id: string) => apiClient.get<InmuebleDto>(`/api/v1/inmuebles/${id}`),
  update: (id: string, body: Partial<InmuebleDto>) => apiClient.put<InmuebleDto>(`/api/v1/inmuebles/${id}`, body),
  toggleActivo: (id: string, activo: boolean) => apiClient.patch(`/api/v1/inmuebles/${id}/activo`, { activo }),
  toggleSeguimiento: (id: string, seguimientoHabilitado: boolean) => apiClient.patch(`/api/v1/inmuebles/${id}/seguimiento-habilitado`, { seguimientoHabilitado }),
};
