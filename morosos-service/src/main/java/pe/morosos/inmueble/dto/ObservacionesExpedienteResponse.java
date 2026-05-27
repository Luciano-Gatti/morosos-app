package pe.morosos.inmueble.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ObservacionesExpedienteResponse(
        InmuebleResumen inmueble,
        Integer totalObservaciones,
        List<ProcesoObservaciones> procesos
) {
    public record InmuebleResumen(UUID id, String cuenta, String titular) {}
    public record ProcesoObservaciones(UUID procesoId, String estado, OffsetDateTime fechaInicio, OffsetDateTime fechaCierre, UUID etapaActualId, List<EtapaObservaciones> etapas) {}
    public record EtapaObservaciones(UUID etapaId, String etapaNombre, List<ObservacionItem> observaciones) {}
    public record ObservacionItem(UUID id, OffsetDateTime fecha, String responsable, String texto) {}
}
