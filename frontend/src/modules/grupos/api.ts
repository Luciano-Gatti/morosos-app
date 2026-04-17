import { http } from '../../services/http';
import { endpoints } from '../../services/endpoints';
import type { Grupo, GrupoPayload } from './types';

export async function fetchGrupos(): Promise<Grupo[]> {
  const { data } = await http.get<Grupo[]>(endpoints.grupos);
  return data;
}

export async function createGrupo(payload: GrupoPayload): Promise<Grupo> {
  const { data } = await http.post<Grupo>(endpoints.grupos, payload);
  return data;
}

export async function updateGrupo(id: string, payload: GrupoPayload): Promise<Grupo> {
  const { data } = await http.put<Grupo>(`${endpoints.grupos}/${id}`, payload);
  return data;
}
