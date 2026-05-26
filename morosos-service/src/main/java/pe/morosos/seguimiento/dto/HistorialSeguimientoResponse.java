package pe.morosos.seguimiento.dto;

import java.util.List;

public record HistorialSeguimientoResponse(
        InmuebleResumenResponse inmueble,
        List<HistorialCasoResponse> casos,
        List<CasoEventoResponse> eventos,
        List<CasoEventoResponse> eventosPrincipales,
        List<CasoEventoResponse> observacionesEtapa,
        List<HistorialCierreResponse> cierres,
        List<HistorialCompromisoResponse> compromisos
) {}
