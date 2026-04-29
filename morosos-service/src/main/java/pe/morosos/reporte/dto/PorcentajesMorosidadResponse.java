package pe.morosos.reporte.dto;

import java.math.BigDecimal;
import java.util.List;

public record PorcentajesMorosidadResponse(long totalActivos, long totalConDeuda, long totalMorosos, long totalAlDia,
                                           double porcentajeConDeuda, double porcentajeMorosos, double porcentajeAlDia,
                                           BigDecimal montoTotalDeuda,
                                           List<PorcentajesMorosidadDetalleResponse> porGrupo,
                                           List<PorcentajesMorosidadDetalleResponse> porDistrito) {}
