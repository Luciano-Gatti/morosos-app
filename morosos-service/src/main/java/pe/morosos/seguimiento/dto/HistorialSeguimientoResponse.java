package pe.morosos.seguimiento.dto;
import java.util.List;
public record HistorialSeguimientoResponse(InmuebleResumenResponse inmueble,List<HistorialCasoResponse> casos,List<CasoEventoResponse> eventos,List<HistorialCierreResponse> cierres,List<HistorialCompromisoResponse> compromisos) {}
