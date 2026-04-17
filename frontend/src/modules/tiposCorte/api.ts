import { http } from '../../services/http';
import { endpoints } from '../../services/endpoints';
import type { TipoCorte, TipoCortePayload } from './types';

export async function fetchTiposCorte(): Promise<TipoCorte[]> {
  const { data } = await http.get<TipoCorte[]>(endpoints.tiposCorte);
  return data;
}

export async function createTipoCorte(payload: TipoCortePayload): Promise<TipoCorte> {
  const { data } = await http.post<TipoCorte>(endpoints.tiposCorte, payload);
  return data;
}

export async function updateTipoCorte(id: string, payload: TipoCortePayload): Promise<TipoCorte> {
  const { data } = await http.put<TipoCorte>(`${endpoints.tiposCorte}/${id}`, payload);
  return data;
}
