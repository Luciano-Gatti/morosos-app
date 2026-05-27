package pe.morosos.inmueble.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record HistorialDeudaInmuebleResponse(
        InmuebleResumen inmueble,
        ResumenDeuda resumen,
        List<ItemHistorialDeuda> items
) {
    public record InmuebleResumen(UUID id, String cuenta, String titular) {}
    public record ResumenDeuda(BigDecimal deudaActual, Integer cuotasActuales, BigDecimal mayorDeuda, OffsetDateTime ultimaActualizacion) {}
    public record ItemHistorialDeuda(LocalDate fechaCarga, String periodo, Integer cuotasAdeudadas, BigDecimal montoAdeudado, String estado, String origen) {}
}
