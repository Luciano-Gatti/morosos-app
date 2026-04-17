import { http } from '../../services/http';
import { endpoints } from '../../services/endpoints';
import type { Inmueble, InmuebleFilters, InmuebleImportResult, InmueblePayload } from './types';

export async function fetchInmuebles(filters?: InmuebleFilters): Promise<Inmueble[]> {
  const params = {
    numeroCuenta: filters?.numeroCuenta || undefined,
    propietarioNombre: filters?.propietarioNombre || undefined,
    direccionCompleta: filters?.direccionCompleta || undefined,
    distrito: filters?.distrito || undefined
  };

  const { data } = await http.get<Inmueble[]>(endpoints.inmuebles, { params });
  return data;
}

export async function createInmueble(payload: InmueblePayload): Promise<Inmueble> {
  const { data } = await http.post<Inmueble>(endpoints.inmuebles, payload);
  return data;
}

export async function updateInmueble(id: string, payload: InmueblePayload): Promise<Inmueble> {
  const { data } = await http.put<Inmueble>(`${endpoints.inmuebles}/${id}`, payload);
  return data;
}

export async function importInmueblesExcel(file: File): Promise<InmuebleImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await http.post<InmuebleImportResult>(`${endpoints.inmuebles}/importacion/excel`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return data;
}


export async function fetchInmuebleById(id: string): Promise<Inmueble> {
  const { data } = await http.get<Inmueble>(`${endpoints.inmuebles}/${id}`);
  return data;
}
