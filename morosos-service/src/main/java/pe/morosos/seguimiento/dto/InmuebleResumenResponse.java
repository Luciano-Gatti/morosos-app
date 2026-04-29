package pe.morosos.seguimiento.dto;
import java.util.UUID;
public record InmuebleResumenResponse(UUID inmuebleId,String cuenta,String titular,String direccion,String grupo,String distrito) {}
