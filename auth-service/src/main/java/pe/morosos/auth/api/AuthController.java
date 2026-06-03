package pe.morosos.auth.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.morosos.auth.dto.AuthUserResponse;
import pe.morosos.auth.dto.ForgotPasswordRequest;
import pe.morosos.auth.dto.LoginRequest;
import pe.morosos.auth.dto.LoginResponse;
import pe.morosos.auth.dto.LogoutResponse;
import pe.morosos.auth.dto.PasswordResetResponse;
import pe.morosos.auth.dto.ResetPasswordRequest;
import pe.morosos.auth.password.PasswordResetService;
import pe.morosos.auth.service.AuthService;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "Autenticación local y sesión stateless")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/login")
    @Operation(summary = "Login local", description = "Valida credenciales locales con BCrypt y emite un JWT HS256.")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(authService.login(request, httpRequest));
    }

    @PostMapping("/forgot-password")
    @Operation(
            summary = "Solicitar recuperación de contraseña",
            description = "Genera instrucciones de restablecimiento con respuesta genérica para evitar enumeración de usuarios."
    )
    public ResponseEntity<PasswordResetResponse> forgotPassword(
            @RequestBody(required = false) ForgotPasswordRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(passwordResetService.requestPasswordReset(request, httpRequest));
    }

    @PostMapping("/reset-password")
    @Operation(
            summary = "Restablecer contraseña",
            description = "Valida un token de recuperación y actualiza la contraseña local con BCrypt."
    )
    public ResponseEntity<PasswordResetResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(passwordResetService.resetPassword(request, httpRequest));
    }

    @GetMapping("/me")
    @Operation(
            summary = "Usuario autenticado",
            description = "Devuelve datos actuales del usuario autenticado y sus roles/permisos vigentes desde base.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<AuthUserResponse> me() {
        return ResponseEntity.ok(authService.me());
    }

    @PostMapping("/logout")
    @Operation(
            summary = "Logout stateless",
            description = "Registra auditoría de logout. El cliente debe descartar el token.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<LogoutResponse> logout(HttpServletRequest request) {
        authService.logout(request);
        return ResponseEntity.ok(new LogoutResponse("Sesión cerrada correctamente."));
    }
}
