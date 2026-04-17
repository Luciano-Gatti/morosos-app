import { useMutation } from '@tanstack/react-query';
import { crearCasosMasivo } from './api';
import type { CrearCasosMasivoPayload } from './types';

export function useCrearCasosMasivo() {
  return useMutation({
    mutationFn: (payload: CrearCasosMasivoPayload) => crearCasosMasivo(payload)
  });
}
