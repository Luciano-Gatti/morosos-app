package pe.morosos.common.dto;

import jakarta.validation.constraints.NotNull;

public record ToggleActivoRequest(@NotNull Boolean activo) {
}
