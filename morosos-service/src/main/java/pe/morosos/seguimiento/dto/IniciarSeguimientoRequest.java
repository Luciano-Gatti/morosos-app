package pe.morosos.seguimiento.dto;
import jakarta.validation.constraints.NotEmpty;import java.util.List;import java.util.UUID;
public record IniciarSeguimientoRequest(@NotEmpty List<UUID> inmuebleIds, String observacion) {}
