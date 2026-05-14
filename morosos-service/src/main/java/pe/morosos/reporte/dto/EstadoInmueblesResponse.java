package pe.morosos.reporte.dto;

import java.math.BigDecimal;
import java.util.List;

public record EstadoInmueblesResponse(
        int parametroCuotasMoroso,
        EstadoInmueblesTotalesResponse totales,
        List<EstadoInmueblesDistribucionResponse> distribucion,
        List<EstadoInmueblesItemResponse> inmuebles
) {
    public record EstadoInmueblesTotalesResponse(
            long totalInmuebles,
            long alDia,
            long deudores,
            long morosos,
            BigDecimal deudaTotal
    ) {}

    public record EstadoInmueblesDistribucionResponse(
            String estado,
            long cantidad,
            double porcentaje
    ) {}

    public record EstadoInmueblesItemResponse(
            String cuenta,
            String titular,
            String grupo,
            String distrito,
            String estado,
            String etapa,
            int cuotasAdeudadas,
            BigDecimal deudaTotal
    ) {}
}
