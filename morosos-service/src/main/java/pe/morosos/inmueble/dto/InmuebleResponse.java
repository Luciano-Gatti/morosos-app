package pe.morosos.inmueble.dto;

import java.time.Instant;
import java.util.UUID;
import pe.morosos.inmueble.dto.ResumenOperativoResponse;

public record InmuebleResponse(
        UUID id,
        String cuenta,
        String titular,
        String direccion,
        UUID grupoId,
        String grupoCodigo,
        String grupoNombre,
        UUID distritoId,
        String distritoCodigo,
        String distritoNombre,
        boolean activo,
        boolean seguimientoHabilitado,
        String telefono,
        String email,
        String observacion,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt,
        ResumenOperativoResponse resumenOperativo
) {
}
