package pe.morosos.inmueble.dto;

import jakarta.validation.constraints.NotNull;

public record SeguimientoHabilitadoPatchRequest(@NotNull Boolean seguimientoHabilitado) {
}
