package pe.morosos.auth.admin.dto;

import java.util.UUID;

public record PermissionResponse(UUID id, String codigo, String nombre, String descripcion, String modulo, String recurso, String accion, boolean activo) {}
