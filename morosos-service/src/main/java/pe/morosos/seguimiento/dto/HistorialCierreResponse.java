package pe.morosos.seguimiento.dto;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

public record HistorialCierreResponse(UUID procesoCierreId,UUID casoId,String motivoCodigo,OffsetDateTime fechaCierre,String observacion,Object planPago,Object cambioParametro) {
    public HistorialCierreResponse(UUID procesoCierreId,UUID casoId,String motivoCodigo,Instant fechaCierre,String observacion,Object planPago,Object cambioParametro){
        this(procesoCierreId,casoId,motivoCodigo,fechaCierre==null?null:fechaCierre.atOffset(ZoneOffset.UTC),observacion,planPago,cambioParametro);
    }
}
