package pe.morosos.deuda.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CargaDeudaImportRequest(@NotNull LocalDate periodo) {}
