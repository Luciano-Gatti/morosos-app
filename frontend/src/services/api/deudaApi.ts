import { normalizePageResponse, normalizeSpringPage } from "@/adapters/pagination";
import { apiClient, buildQueryParams } from "@/lib/apiClient";
import type { FrontendPage, PageResponse, SpringPage } from "@/types/pagination";

export const deudaApi = {
  async listCargas(params: Record<string, string | number | boolean | null | undefined>): Promise<FrontendPage<any>> {
    const data = await apiClient.get<PageResponse<any> | SpringPage<any>>(`/api/v1/deuda/cargas${buildQueryParams(params)}`);
    return "number" in data ? normalizeSpringPage(data) : normalizePageResponse(data);
  },
  createCarga: (payload: FormData) => apiClient.post("/api/v1/deuda/cargas", payload),
  getCarga: (id: string) => apiClient.get(`/api/v1/deuda/cargas/${id}`),
  getDetalles: (id: string, params: Record<string, any>) => apiClient.get(`/api/v1/deuda/cargas/${id}/detalles${buildQueryParams(params)}`),
  getErrores: (id: string, params: Record<string, any>) => apiClient.get(`/api/v1/deuda/cargas/${id}/errores${buildQueryParams(params)}`),
};
