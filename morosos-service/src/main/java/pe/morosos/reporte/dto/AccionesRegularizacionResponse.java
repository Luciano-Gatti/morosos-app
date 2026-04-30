package pe.morosos.reporte.dto;

import java.util.List;
import pe.morosos.common.api.PageResponse;

public record AccionesRegularizacionResponse(
        AccionesRegularizacionResumenResponse resumen,
        List<AccionesRegularizacionPorTipoResponse> porTipo,
        PageResponse<AccionesRegularizacionItemRegularizacionResponse> regularizaciones,
        PageResponse<AccionesRegularizacionItemPlanPagoResponse> planesPago,
        PageResponse<AccionesRegularizacionItemCompromisoResponse> compromisos
) {}
