package pe.morosos.parametro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ParametroSeguimientoRequest(
        @NotBlank @Size(max = 500) String valor,
        @Size(max = 500) String descripcion
) {
}
