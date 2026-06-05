package pe.morosos.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleCodeAuthRequest(
        @NotBlank String code,
        @NotBlank String redirectUri
) {}
