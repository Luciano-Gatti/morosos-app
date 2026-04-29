package pe.morosos.seguimiento.dto;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

public record HistorialCasoResponse(UUID casoId,String estado,String etapaActual,OffsetDateTime fechaInicio,OffsetDateTime fechaUltimoMovimiento,String observacion) {
    public HistorialCasoResponse(UUID casoId,String estado,String etapaActual,Instant fechaInicio,Instant fechaUltimoMovimiento,String observacion){
        this(casoId,estado,etapaActual,fechaInicio==null?null:fechaInicio.atOffset(ZoneOffset.UTC),fechaUltimoMovimiento==null?null:fechaUltimoMovimiento.atOffset(ZoneOffset.UTC),observacion);
    }
}
