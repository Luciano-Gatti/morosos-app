package pe.morosos.reporte.dto;

public record AccionesFechasResumenResponse(
        long totalAcciones,
        long diasConActividad,
        long actoresDistintos,
        String tipoMasFrecuente
) {}
