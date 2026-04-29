package pe.morosos.inmueble.dto;

import java.util.UUID;

public record InmuebleFilterRequest(
        String cuenta,
        String titular,
        UUID grupoId,
        UUID distritoId,
        Boolean activo
) {
}
