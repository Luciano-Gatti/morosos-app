import { http } from '../../services/http';
import { endpoints } from '../../services/endpoints';
import type { Moroso, MorososFilters } from './types';

export async function fetchMorosos(filters?: MorososFilters): Promise<Moroso[]> {
  const params = {
    numeroCuenta: filters?.numeroCuenta || undefined,
    propietarioNombre: filters?.propietarioNombre || undefined,
    direccionCompleta: filters?.direccionCompleta || undefined,
    distrito: filters?.distrito || undefined,
    grupo: filters?.grupo || undefined,
    cuotasAdeudadas: filters?.cuotasAdeudadas,
    montoAdeudado: filters?.montoAdeudado,
    seguimientoHabilitado: filters?.seguimientoHabilitado,
    aptoParaSeguimiento: filters?.aptoParaSeguimiento
  };

  const { data } = await http.get<Moroso[]>(`${endpoints.estadosDeuda}/morosos`, { params });
  return data;
}
