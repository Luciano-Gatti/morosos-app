import { normalizePageResponse, normalizeSpringPage } from "@/adapters/pagination";
import { apiClient, buildQueryParams } from "@/lib/apiClient";
import type { PageResponse, SpringPage } from "@/types/pagination";

export const auditoriaApi = {
  list: (params?: Record<string, any>) => apiClient.get(`/api/v1/auditoria${buildQueryParams(params)}`),
  async movimientos(params?: Record<string, any>) {
    const data = await apiClient.get<PageResponse<any> | SpringPage<any>>(`/api/v1/auditoria/movimientos${buildQueryParams(params)}`);
    return "number" in data ? normalizeSpringPage(data) : normalizePageResponse(data);
  },
};
