package pe.morosos.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String username,
        @NotBlank @Email String email,
        @NotBlank String nombre,
        @NotBlank String apellido,
        @NotBlank @Size(min = 8) String password,
        @NotBlank String confirmPassword
) {}
