package pe.morosos.reporte.dto;

import java.util.List;
import pe.morosos.common.api.PageResponse;

public record AccionesFechasResponse(
        AccionesFechasResumenResponse resumen,
        List<AccionesFechasPorTipoResponse> porTipo,
        List<AccionesFechasSerieDiariaResponse> serieDiaria,
        PageResponse<AccionesFechasDetalleResponse> detalle
) {}
