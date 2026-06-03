package pe.morosos.auth.admin.dto;

import jakarta.validation.constraints.NotNull;
import pe.morosos.auth.user.entity.EstadoUsuario;

public record UserStatusRequest(@NotNull EstadoUsuario estado) {}
