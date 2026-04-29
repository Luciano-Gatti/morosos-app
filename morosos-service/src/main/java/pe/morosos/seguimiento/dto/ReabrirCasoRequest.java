package pe.morosos.seguimiento.dto;
import jakarta.validation.constraints.NotEmpty;import java.util.List;import java.util.UUID;
public record ReabrirCasoRequest(@NotEmpty List<UUID> casoIds, String observacion) {}
