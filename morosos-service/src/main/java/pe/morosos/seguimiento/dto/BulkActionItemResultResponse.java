package pe.morosos.seguimiento.dto;

import java.util.UUID;

public record BulkActionItemResultResponse(UUID id, String estado, String mensaje) {
    public enum Estado { APLICADO, OMITIDO, ERROR }

    public BulkActionItemResultResponse(UUID id, Estado estado, String mensaje) {
        this(id, estado.name(), mensaje);
    }
}
