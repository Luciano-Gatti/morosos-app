package pe.morosos.parametro.dto;

public record ImpactoSeguimientoResponse(
        boolean hayImpacto,
        boolean impactoCalculable,
        long totalProcesosAbiertos,
        long procesosAfectados,
        double porcentajeImpacto,
        String mensaje
) {}
