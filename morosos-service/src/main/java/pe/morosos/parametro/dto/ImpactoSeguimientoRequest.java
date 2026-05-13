package pe.morosos.parametro.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ImpactoSeguimientoRequest(
        @NotEmpty List<@Valid ParametroCambioRequest> parametros
) {}
