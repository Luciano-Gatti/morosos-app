package pe.morosos.etapa.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record EtapaConfigRequest(
        @NotBlank @Size(max = 50) String codigo,
        @NotBlank @Size(max = 150) String nombre,
        @NotNull @Positive Integer orden,
        @NotNull Boolean activo,
        @NotNull Boolean esFinal
) {
}
