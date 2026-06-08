package pe.morosos.auth.admin.dto;

import jakarta.validation.constraints.NotNull;

public record RoleStatusRequest(@NotNull Boolean activo) {}
