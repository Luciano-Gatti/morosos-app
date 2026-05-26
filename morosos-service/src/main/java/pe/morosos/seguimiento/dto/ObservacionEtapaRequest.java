package pe.morosos.seguimiento.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ObservacionEtapaRequest(
        @NotNull UUID casoSeguimientoId,
        @NotBlank String observacion
) {}
