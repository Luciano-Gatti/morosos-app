package pe.morosos.parametro.dto;

import jakarta.validation.constraints.NotBlank;

public record ParametroCambioRequest(
        @NotBlank String clave,
        Object valorAnterior,
        Object valorNuevo
) {}
