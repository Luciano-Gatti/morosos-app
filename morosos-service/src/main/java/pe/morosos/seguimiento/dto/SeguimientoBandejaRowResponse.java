package pe.morosos.seguimiento.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

public record SeguimientoBandejaRowResponse(UUID casoId,UUID inmuebleId,String cuenta,String titular,String direccion,String grupo,String distrito,Integer cuotasVencidas,BigDecimal montoVencido,String etapaActual,String estadoCaso,OffsetDateTime fechaUltimoMovimiento) {
    public SeguimientoBandejaRowResponse(UUID casoId,UUID inmuebleId,String cuenta,String titular,String direccion,String grupo,String distrito,Integer cuotasVencidas,BigDecimal montoVencido,String etapaActual,String estadoCaso,Instant fechaUltimoMovimiento){
        this(casoId,inmuebleId,cuenta,titular,direccion,grupo,distrito,cuotasVencidas,montoVencido,etapaActual,estadoCaso,fechaUltimoMovimiento==null?null:fechaUltimoMovimiento.atOffset(ZoneOffset.UTC));
    }
}
