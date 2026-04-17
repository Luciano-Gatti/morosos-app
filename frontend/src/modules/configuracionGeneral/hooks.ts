import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createConfiguracionGeneral,
  fetchConfiguracionesGenerales,
  updateConfiguracionGeneral
} from './api';
import type { ConfiguracionGeneralPayload } from './types';

const configuracionesKey = ['configuraciones-generales'];

export function useConfiguracionesGenerales() {
  return useQuery({
    queryKey: configuracionesKey,
    queryFn: fetchConfiguracionesGenerales
  });
}

export function useCreateConfiguracionGeneral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConfiguracionGeneralPayload) => createConfiguracionGeneral(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: configuracionesKey })
  });
}

export function useUpdateConfiguracionGeneral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ConfiguracionGeneralPayload }) =>
      updateConfiguracionGeneral(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: configuracionesKey })
  });
}
