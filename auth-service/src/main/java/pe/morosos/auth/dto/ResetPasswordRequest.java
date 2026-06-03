package pe.morosos.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record ResetPasswordRequest(
        @NotBlank(message = "token es requerido")
        String token,
        @NotBlank(message = "newPassword es requerida")
        String newPassword,
        @NotBlank(message = "confirmPassword es requerida")
        String confirmPassword
) {
}
