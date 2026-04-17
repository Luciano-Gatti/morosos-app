import { http } from '../../services/http';
import { endpoints } from '../../services/endpoints';
import type { MotivoCorte, MotivoCortePayload } from './types';

export async function fetchMotivosCorte(): Promise<MotivoCorte[]> {
  const { data } = await http.get<MotivoCorte[]>(endpoints.motivosCorte);
  return data;
}

export async function createMotivoCorte(payload: MotivoCortePayload): Promise<MotivoCorte> {
  const { data } = await http.post<MotivoCorte>(endpoints.motivosCorte, payload);
  return data;
}

export async function updateMotivoCorte(id: string, payload: MotivoCortePayload): Promise<MotivoCorte> {
  const { data } = await http.put<MotivoCorte>(`${endpoints.motivosCorte}/${id}`, payload);
  return data;
}

export async function deleteMotivoCorte(id: string): Promise<void> {
  await http.delete(`${endpoints.motivosCorte}/${id}`);
}
