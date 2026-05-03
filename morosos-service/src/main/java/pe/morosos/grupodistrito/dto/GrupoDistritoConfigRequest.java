package pe.morosos.grupodistrito.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record GrupoDistritoConfigRequest(
        @NotNull UUID grupoId,
        @NotNull UUID distritoId,
        Boolean seguimientoHabilitado
) {
}
