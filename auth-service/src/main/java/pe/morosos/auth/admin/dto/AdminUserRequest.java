package pe.morosos.auth.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import pe.morosos.auth.user.entity.EstadoUsuario;

public record AdminUserRequest(
        @NotBlank String username,
        @NotBlank @Email String email,
        @NotBlank String nombre,
        @NotBlank String apellido,
        EstadoUsuario estado,
        List<String> roles,
        List<String> permissions
) {}
