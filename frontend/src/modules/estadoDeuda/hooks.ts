import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createEstadoDeuda, fetchEstadoDeudaByInmueble, updateEstadoDeuda } from './api';
import type { EstadoDeudaPayload } from './types';

const estadosDeudaKey = ['estados-deuda'];

export function useEstadoDeudaByInmueble(inmuebleId: string) {
  return useQuery({
    queryKey: [...estadosDeudaKey, inmuebleId],
    queryFn: () => fetchEstadoDeudaByInmueble(inmuebleId),
    enabled: Boolean(inmuebleId)
  });
}

export function useCreateEstadoDeuda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EstadoDeudaPayload) => createEstadoDeuda(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: estadosDeudaKey })
  });
}

export function useUpdateEstadoDeuda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EstadoDeudaPayload }) =>
      updateEstadoDeuda(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: estadosDeudaKey })
  });
}
