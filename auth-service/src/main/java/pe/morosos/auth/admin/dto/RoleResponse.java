package pe.morosos.auth.admin.dto;

import java.util.List;
import java.util.UUID;

public record RoleResponse(UUID id, String codigo, String nombre, String descripcion, boolean activo, boolean systemRole, List<String> permissions) {}
