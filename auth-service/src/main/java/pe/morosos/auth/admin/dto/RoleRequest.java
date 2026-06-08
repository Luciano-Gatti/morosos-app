package pe.morosos.auth.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record RoleRequest(
        @NotBlank @Size(max = 80) String codigo,
        @NotBlank @Size(max = 160) String nombre,
        @Size(max = 500) String descripcion,
        List<String> permissions
) {}
