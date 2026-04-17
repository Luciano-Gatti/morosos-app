import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  avanzarCaso,
  avanzarEtapaCasos,
  cerrarCaso,
  crearCompromisoCaso,
  crearRegistroCorteCaso,
  fetchCasoSeguimientoById,
  fetchCasosSeguimiento,
  fetchCompromisosCaso,
  fetchRegistrosCorteCaso,
  marcarCompromisoIncumplido,
  repetirCaso,
  repetirEtapaCasos
} from './api';
import type {
  CerrarCasoPayload,
  CompromisoPagoPayload,
  EstadoSeguimiento,
  OperacionCasosPayload,
  RegistroCortePayload
} from './types';

const casosKey = ['casos-seguimiento'];

export function useCasosSeguimiento(estadoSeguimiento?: EstadoSeguimiento) {
  return useQuery({
    queryKey: [...casosKey, estadoSeguimiento],
    queryFn: () => fetchCasosSeguimiento(estadoSeguimiento)
  });
}

export function useCasoSeguimiento(casoId: string) {
  return useQuery({
    queryKey: [...casosKey, casoId],
    queryFn: () => fetchCasoSeguimientoById(casoId),
    enabled: Boolean(casoId)
  });
}

export function useCompromisosCaso(casoId: string) {
  return useQuery({
    queryKey: [...casosKey, casoId, 'compromisos'],
    queryFn: () => fetchCompromisosCaso(casoId),
    enabled: Boolean(casoId)
  });
}

export function useRegistrosCorteCaso(casoId: string) {
  return useQuery({
    queryKey: [...casosKey, casoId, 'registros-corte'],
    queryFn: () => fetchRegistrosCorteCaso(casoId),
    enabled: Boolean(casoId)
  });
}

export function useAvanzarCaso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (casoId: string) => avanzarCaso(casoId),
    onSuccess: (_data, casoId) => {
      queryClient.invalidateQueries({ queryKey: casosKey });
      queryClient.invalidateQueries({ queryKey: [...casosKey, casoId] });
    }
  });
}

export function useRepetirCaso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (casoId: string) => repetirCaso(casoId),
    onSuccess: (_data, casoId) => {
      queryClient.invalidateQueries({ queryKey: casosKey });
      queryClient.invalidateQueries({ queryKey: [...casosKey, casoId] });
    }
  });
}

export function useCerrarCaso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ casoId, payload }: { casoId: string; payload: CerrarCasoPayload }) =>
      cerrarCaso(casoId, payload),
    onSuccess: (_data, { casoId }) => {
      queryClient.invalidateQueries({ queryKey: casosKey });
      queryClient.invalidateQueries({ queryKey: [...casosKey, casoId] });
    }
  });
}

export function useCrearCompromisoCaso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ casoId, payload }: { casoId: string; payload: CompromisoPagoPayload }) =>
      crearCompromisoCaso(casoId, payload),
    onSuccess: (_data, { casoId }) => {
      queryClient.invalidateQueries({ queryKey: casosKey });
      queryClient.invalidateQueries({ queryKey: [...casosKey, casoId] });
      queryClient.invalidateQueries({ queryKey: [...casosKey, casoId, 'compromisos'] });
    }
  });
}

export function useCrearRegistroCorteCaso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ casoId, payload }: { casoId: string; payload: RegistroCortePayload }) =>
      crearRegistroCorteCaso(casoId, payload),
    onSuccess: (_data, { casoId }) => {
      queryClient.invalidateQueries({ queryKey: casosKey });
      queryClient.invalidateQueries({ queryKey: [...casosKey, casoId] });
      queryClient.invalidateQueries({ queryKey: [...casosKey, casoId, 'registros-corte'] });
    }
  });
}

export function useAvanzarEtapaCasos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OperacionCasosPayload) => avanzarEtapaCasos(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: casosKey })
  });
}

export function useRepetirEtapaCasos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OperacionCasosPayload) => repetirEtapaCasos(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: casosKey })
  });
}


export function useMarcarCompromisoIncumplido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (compromisoId: string) => marcarCompromisoIncumplido(compromisoId),
    onSuccess: (data) => {
      const casoId = data.casoSeguimientoId;
      queryClient.invalidateQueries({ queryKey: casosKey });
      queryClient.invalidateQueries({ queryKey: [...casosKey, casoId] });
      queryClient.invalidateQueries({ queryKey: [...casosKey, casoId, 'compromisos'] });
    }
  });
}
