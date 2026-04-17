import { http } from '../../services/http';
import { endpoints } from '../../services/endpoints';
import type { EstadoDeuda, EstadoDeudaPayload } from './types';

export async function fetchEstadoDeudaByInmueble(inmuebleId: string): Promise<EstadoDeuda> {
  const { data } = await http.get<EstadoDeuda>(endpoints.estadosDeuda, { params: { inmuebleId } });
  return data;
}

export async function createEstadoDeuda(payload: EstadoDeudaPayload): Promise<EstadoDeuda> {
  const { data } = await http.post<EstadoDeuda>(endpoints.estadosDeuda, payload);
  return data;
}

export async function updateEstadoDeuda(id: string, payload: EstadoDeudaPayload): Promise<EstadoDeuda> {
  const { data } = await http.put<EstadoDeuda>(`${endpoints.estadosDeuda}/${id}`, payload);
  return data;
}
