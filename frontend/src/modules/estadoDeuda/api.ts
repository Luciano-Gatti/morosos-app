import { http } from '../../services/http';
import { endpoints } from '../../services/endpoints';
import type {
  CargaDeuda,
  CargaDeudaDetalleItem,
  EstadoDeuda,
  EstadoDeudaImportResult,
  InmuebleHistorialDeudaItem,
  ReporteMorososPorCargaItem,
  EstadoDeudaPayload
} from './types';

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

export async function importEstadoDeudaExcel(file: File, observacion?: string): Promise<EstadoDeudaImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  if (observacion?.trim()) {
    formData.append('observacion', observacion.trim());
  }

  const { data } = await http.post<EstadoDeudaImportResult>(
    `${endpoints.estadosDeuda}/importacion/excel`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );

  return data;
}

export async function fetchCargasDeuda(): Promise<CargaDeuda[]> {
  const { data } = await http.get<CargaDeuda[]>(`${endpoints.estadosDeuda}/cargas`);
  return data;
}

export async function fetchCargaDeudaDetalle(cargaId: string): Promise<CargaDeudaDetalleItem[]> {
  const { data } = await http.get<CargaDeudaDetalleItem[]>(`${endpoints.estadosDeuda}/cargas/${cargaId}`);
  return data;
}

export async function fetchHistorialDeudaByInmueble(inmuebleId: string): Promise<InmuebleHistorialDeudaItem[]> {
  const { data } = await http.get<InmuebleHistorialDeudaItem[]>(`${endpoints.estadosDeuda}/inmuebles/${inmuebleId}/historico`);
  return data;
}

export async function fetchReporteMorososPorCarga(): Promise<ReporteMorososPorCargaItem[]> {
  const { data } = await http.get<ReporteMorososPorCargaItem[]>(`${endpoints.estadosDeuda}/reportes/morosos-por-carga`);
  return data;
}
