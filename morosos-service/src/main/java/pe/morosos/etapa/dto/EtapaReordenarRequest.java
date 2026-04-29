package pe.morosos.etapa.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;
import java.util.UUID;

public record EtapaReordenarRequest(
        @NotEmpty List<@Valid Item> etapas
) {
    public record Item(@NotNull UUID id, @NotNull @Positive Integer orden) {
    }
}
