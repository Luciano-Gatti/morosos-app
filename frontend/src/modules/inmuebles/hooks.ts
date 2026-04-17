import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createInmueble,
  fetchInmuebleById,
  fetchInmuebles,
  importInmueblesExcel,
  updateInmueble
} from './api';
import type { InmuebleFilters, InmueblePayload } from './types';

const inmueblesKey = ['inmuebles'];

export function useInmuebles(filters: InmuebleFilters) {
  return useQuery({
    queryKey: [...inmueblesKey, filters],
    queryFn: () => fetchInmuebles(filters)
  });
}

export function useCreateInmueble() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InmueblePayload) => createInmueble(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inmueblesKey })
  });
}

export function useUpdateInmueble() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: InmueblePayload }) => updateInmueble(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inmueblesKey })
  });
}

export function useImportInmueblesExcel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => importInmueblesExcel(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inmueblesKey })
  });
}

export function useInmueble(id: string) {
  return useQuery({
    queryKey: [...inmueblesKey, 'detail', id],
    queryFn: () => fetchInmuebleById(id),
    enabled: Boolean(id)
  });
}
