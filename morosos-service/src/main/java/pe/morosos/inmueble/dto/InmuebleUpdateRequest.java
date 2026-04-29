package pe.morosos.inmueble.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record InmuebleUpdateRequest(
        @NotBlank @Size(max = 50) String cuenta,
        @NotBlank @Size(max = 250) String titular,
        @NotBlank @Size(max = 300) String direccion,
        @NotNull UUID grupoId,
        @NotNull UUID distritoId,
        @NotNull Boolean activo,
        @NotNull Boolean seguimientoHabilitado,
        @Size(max = 50) String telefono,
        @Email @Size(max = 150) String email,
        String observacion
) {
}
