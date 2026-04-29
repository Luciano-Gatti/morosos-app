package pe.morosos.reporte.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PorcentajesMorosidadDetalleResponse(UUID id, String nombre, long totalActivos, long totalConDeuda,
                                                  long totalMorosos, long totalAlDia, double porcentajeConDeuda,
                                                  double porcentajeMorosos, double porcentajeAlDia,
                                                  BigDecimal montoTotalDeuda) {}
