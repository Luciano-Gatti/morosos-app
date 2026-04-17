import { http } from '../../services/http';
import { endpoints } from '../../services/endpoints';
import type { CrearCasosMasivoPayload, OperacionMasivaResponse } from './types';

export async function crearCasosMasivo(payload: CrearCasosMasivoPayload): Promise<OperacionMasivaResponse> {
  const { data } = await http.post<OperacionMasivaResponse>(endpoints.casosSeguimientoMasivoCrear, payload);
  return data;
}
