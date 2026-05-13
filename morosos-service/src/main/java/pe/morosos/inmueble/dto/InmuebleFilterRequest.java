package pe.morosos.inmueble.dto;

import java.util.UUID;

public record InmuebleFilterRequest(
        String q,
        String campo,
        UUID grupoId,
        UUID distritoId,
        Boolean activo
) {
}
