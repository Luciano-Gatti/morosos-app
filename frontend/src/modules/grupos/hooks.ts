import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGrupo, fetchGrupos, updateGrupo } from './api';
import type { GrupoPayload } from './types';

const gruposKey = ['grupos'];

export function useGrupos() {
  return useQuery({
    queryKey: gruposKey,
    queryFn: fetchGrupos
  });
}

export function useCreateGrupo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GrupoPayload) => createGrupo(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gruposKey })
  });
}

export function useUpdateGrupo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GrupoPayload }) => updateGrupo(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gruposKey })
  });
}
