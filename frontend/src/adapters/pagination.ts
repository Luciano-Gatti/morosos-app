import type { FrontendPage, PageResponse, SpringPage } from "@/types/pagination";

export function normalizePageResponse<T>(data: PageResponse<T>): FrontendPage<T> {
  return {
    content: data.content ?? [],
    page: data.page ?? 0,
    size: data.size ?? 0,
    totalElements: data.totalElements ?? 0,
    totalPages: data.totalPages ?? 0,
    sort: data.sort ?? [],
  };
}

export function normalizeSpringPage<T>(data: SpringPage<T>): FrontendPage<T> {
  return {
    content: data.content ?? [],
    page: data.number ?? 0,
    size: data.size ?? 0,
    totalElements: data.totalElements ?? 0,
    totalPages: data.totalPages ?? 0,
    sort: data.sort?.sorted ? ["sorted"] : [],
  };
}
