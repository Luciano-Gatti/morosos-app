package pe.morosos.auth.dto;

public record ForgotPasswordRequest(
        String usernameOrEmail,
        String email
) {
}
