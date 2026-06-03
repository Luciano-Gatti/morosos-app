package pe.morosos.auth.google;

public record GoogleUserClaims(
        String subject,
        String email,
        boolean emailVerified,
        String givenName,
        String familyName,
        String name,
        String picture
) {}
