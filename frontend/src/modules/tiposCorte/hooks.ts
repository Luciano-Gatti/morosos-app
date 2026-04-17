import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTipoCorte, fetchTiposCorte, updateTipoCorte } from './api';
import type { TipoCortePayload } from './types';

const tiposCorteKey = ['tipos-corte'];

export function useTiposCorte() {
  return useQuery({
    queryKey: tiposCorteKey,
    queryFn: fetchTiposCorte
  });
}

export function useCreateTipoCorte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TipoCortePayload) => createTipoCorte(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tiposCorteKey })
  });
}

export function useUpdateTipoCorte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TipoCortePayload }) =>
      updateTipoCorte(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tiposCorteKey })
  });
}
