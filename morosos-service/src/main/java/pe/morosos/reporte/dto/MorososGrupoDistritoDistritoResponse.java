package pe.morosos.reporte.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record MorososGrupoDistritoDistritoResponse(UUID distritoId, String distritoNombre, long padron, long deudores,
                                                   long morosos, long alDia, double porcentajeMorosidad,
                                                   BigDecimal montoTotalDeuda) {}
