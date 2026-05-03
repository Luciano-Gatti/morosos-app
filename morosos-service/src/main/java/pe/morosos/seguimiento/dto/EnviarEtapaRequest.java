package pe.morosos.seguimiento.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record EnviarEtapaRequest(
        @NotEmpty List<UUID> casoIds,
        @NotNull UUID etapaDestinoId,
        String observacion,
        LocalDate fechaProgramada,
        boolean repetirMismaEtapa
) {}
