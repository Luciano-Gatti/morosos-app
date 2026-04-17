import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEstadoDeuda,
  fetchCargaDeudaDetalle,
  fetchCargasDeuda,
  fetchEstadoDeudaByInmueble,
  fetchHistorialDeudaByInmueble,
  fetchReporteMorososPorCarga,
  importEstadoDeudaExcel,
  updateEstadoDeuda
} from './api';
import type { EstadoDeudaPayload } from './types';

const estadosDeudaKey = ['estados-deuda'];
const morososKey = ['morosos'];

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estadosDeudaKey });
      queryClient.invalidateQueries({ queryKey: morososKey });
    }
  });
}

export function useUpdateEstadoDeuda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EstadoDeudaPayload }) =>
      updateEstadoDeuda(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estadosDeudaKey });
      queryClient.invalidateQueries({ queryKey: morososKey });
    }
  });
}

export function useImportEstadoDeudaExcel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, observacion }: { file: File; observacion?: string }) =>
      importEstadoDeudaExcel(file, observacion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estadosDeudaKey });
      queryClient.invalidateQueries({ queryKey: morososKey });
    }
  });
}

export function useCargasDeuda() {
  return useQuery({
    queryKey: [...estadosDeudaKey, 'cargas'],
    queryFn: () => fetchCargasDeuda()
  });
}

export function useCargaDeudaDetalle(cargaId: string) {
  return useQuery({
    queryKey: [...estadosDeudaKey, 'cargas', cargaId],
    queryFn: () => fetchCargaDeudaDetalle(cargaId),
    enabled: Boolean(cargaId)
  });
}

export function useHistorialDeudaByInmueble(inmuebleId: string) {
  return useQuery({
    queryKey: [...estadosDeudaKey, 'inmuebles', inmuebleId, 'historico'],
    queryFn: () => fetchHistorialDeudaByInmueble(inmuebleId),
    enabled: Boolean(inmuebleId)
  });
}

export function useReporteMorososPorCarga() {
  return useQuery({
    queryKey: [...estadosDeudaKey, 'reportes', 'morosos-por-carga'],
    queryFn: () => fetchReporteMorososPorCarga()
  });
}
