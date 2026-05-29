package pe.morosos.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "usernameOrEmail es requerido")
        String usernameOrEmail,
        @NotBlank(message = "password es requerido")
        String password
) {
}
