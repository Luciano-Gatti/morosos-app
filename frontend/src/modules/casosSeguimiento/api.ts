import { http } from '../../services/http';
import { endpoints } from '../../services/endpoints';
import type {
  CasoSeguimiento,
  CerrarCasoPayload,
  CompromisoPago,
  CompromisoPagoPayload,
  EstadoSeguimiento,
  OperacionCasosPayload,
  OperacionCasosResultado,
  RegistroCorte,
  RegistroCortePayload
} from './types';

export async function fetchCasosSeguimiento(estadoSeguimiento?: EstadoSeguimiento): Promise<CasoSeguimiento[]> {
  const params = {
    estadoSeguimiento: estadoSeguimiento || undefined
  };

  const { data } = await http.get<CasoSeguimiento[]>(endpoints.casosSeguimiento, { params });
  return data;
}

export async function fetchCasoSeguimientoById(casoId: string): Promise<CasoSeguimiento> {
  const { data } = await http.get<CasoSeguimiento>(`${endpoints.casosSeguimiento}/${casoId}`);
  return data;
}

export async function avanzarCaso(casoId: string): Promise<CasoSeguimiento> {
  const { data } = await http.post<CasoSeguimiento>(`${endpoints.casosSeguimiento}/${casoId}/avanzar-etapa`);
  return data;
}

export async function repetirCaso(casoId: string): Promise<CasoSeguimiento> {
  const { data } = await http.post<CasoSeguimiento>(`${endpoints.casosSeguimiento}/${casoId}/repetir-etapa`);
  return data;
}

export async function cerrarCaso(casoId: string, payload: CerrarCasoPayload): Promise<CasoSeguimiento> {
  const { data } = await http.post<CasoSeguimiento>(`${endpoints.casosSeguimiento}/${casoId}/cerrar`, payload);
  return data;
}

export async function fetchCompromisosCaso(casoId: string): Promise<CompromisoPago[]> {
  const { data } = await http.get<CompromisoPago[]>(`${endpoints.casosSeguimiento}/${casoId}/compromisos-pago`);
  return data;
}

export async function crearCompromisoCaso(
  casoId: string,
  payload: CompromisoPagoPayload
): Promise<CompromisoPago> {
  const { data } = await http.post<CompromisoPago>(`${endpoints.casosSeguimiento}/${casoId}/compromisos-pago`, payload);
  return data;
}



export async function marcarCompromisoIncumplido(compromisoId: string): Promise<CompromisoPago> {
  const { data } = await http.post<CompromisoPago>(`/compromisos-pago/${compromisoId}/incumplir`);
  return data;
}

export async function fetchRegistrosCorteCaso(casoId: string): Promise<RegistroCorte[]> {
  const { data } = await http.get<RegistroCorte[]>(`${endpoints.casosSeguimiento}/${casoId}/registros-corte`);
  return data;
}

export async function crearRegistroCorteCaso(
  casoId: string,
  payload: RegistroCortePayload
): Promise<RegistroCorte> {
  const { data } = await http.post<RegistroCorte>(`${endpoints.casosSeguimiento}/${casoId}/registros-corte`, payload);
  return data;
}

export async function avanzarEtapaCasos(payload: OperacionCasosPayload): Promise<OperacionCasosResultado> {
  const { data } = await http.post<OperacionCasosResultado>(endpoints.casosSeguimientoMasivoAvanzar, payload);
  return data;
}

export async function repetirEtapaCasos(payload: OperacionCasosPayload): Promise<OperacionCasosResultado> {
  const { data } = await http.post<OperacionCasosResultado>(endpoints.casosSeguimientoMasivoRepetir, payload);
  return data;
}
