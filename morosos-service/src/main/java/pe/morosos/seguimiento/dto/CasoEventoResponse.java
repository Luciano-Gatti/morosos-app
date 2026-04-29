package pe.morosos.seguimiento.dto;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

public record CasoEventoResponse(UUID eventoId,UUID casoId,String tipoEvento,String etapaOrigen,String etapaDestino,OffsetDateTime fechaEvento,String observacion,Object metadata) {
    public CasoEventoResponse(UUID eventoId,UUID casoId,String tipoEvento,String etapaOrigen,String etapaDestino,Instant fechaEvento,String observacion,Object metadata){
        this(eventoId,casoId,tipoEvento,etapaOrigen,etapaDestino,fechaEvento==null?null:fechaEvento.atOffset(ZoneOffset.UTC),observacion,metadata);
    }
}
