package pe.morosos.seguimiento.dto;
import jakarta.validation.constraints.NotBlank;
public record CambioParametroCierreRequest(@NotBlank String parametro,@NotBlank String valorAnterior,@NotBlank String valorNuevo) {}
