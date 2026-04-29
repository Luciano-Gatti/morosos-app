package pe.morosos.importacion.dto;

import java.time.Instant;
import java.util.UUID;
import pe.morosos.importacion.entity.ImportacionEstado;

public record ImportacionInmuebleResponse(UUID id, String archivoNombre, Integer totalRegistros, Integer procesados,
                                          Integer creados, Integer actualizados, Integer errores,
                                          ImportacionEstado estado, String createdBy, Instant createdAt,
                                          String updatedBy, Instant updatedAt) {}
