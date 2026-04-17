import { http } from '../../services/http';
import { endpoints } from '../../services/endpoints';
import type { ConfiguracionGeneral, ConfiguracionGeneralPayload } from './types';

export async function fetchConfiguracionesGenerales(): Promise<ConfiguracionGeneral[]> {
  const { data } = await http.get<ConfiguracionGeneral[]>(endpoints.configuracionesGenerales);
  return data;
}

export async function createConfiguracionGeneral(
  payload: ConfiguracionGeneralPayload
): Promise<ConfiguracionGeneral> {
  const { data } = await http.post<ConfiguracionGeneral>(endpoints.configuracionesGenerales, payload);
  return data;
}

export async function updateConfiguracionGeneral(
  id: string,
  payload: ConfiguracionGeneralPayload
): Promise<ConfiguracionGeneral> {
  const { data } = await http.put<ConfiguracionGeneral>(`${endpoints.configuracionesGenerales}/${id}`, payload);
  return data;
}
