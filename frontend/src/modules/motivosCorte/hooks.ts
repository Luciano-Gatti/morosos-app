import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createMotivoCorte, deleteMotivoCorte, fetchMotivosCorte, updateMotivoCorte } from './api';
import type { MotivoCortePayload } from './types';

const motivosCorteKey = ['motivos-corte'];

export function useMotivosCorte() {
  return useQuery({
    queryKey: motivosCorteKey,
    queryFn: fetchMotivosCorte
  });
}

export function useCreateMotivoCorte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MotivoCortePayload) => createMotivoCorte(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: motivosCorteKey })
  });
}

export function useUpdateMotivoCorte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MotivoCortePayload }) =>
      updateMotivoCorte(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: motivosCorteKey })
  });
}

export function useDeleteMotivoCorte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMotivoCorte(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: motivosCorteKey })
  });
}
