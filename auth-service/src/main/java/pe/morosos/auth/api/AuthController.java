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
import pe.morosos.auth.dto.GoogleAuthRequest;
import pe.morosos.auth.dto.GoogleCodeAuthRequest;
import pe.morosos.auth.dto.LoginRequest;
import pe.morosos.auth.dto.LoginResponse;
import pe.morosos.auth.dto.LogoutResponse;
import pe.morosos.auth.dto.MessageResponse;
import pe.morosos.auth.dto.PasswordResetResponse;
import pe.morosos.auth.dto.RefreshTokenRequest;
import pe.morosos.auth.dto.RegisterRequest;
import pe.morosos.auth.dto.ResetPasswordRequest;
import pe.morosos.auth.password.PasswordResetService;
import pe.morosos.auth.service.AuthService;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "Autenticacion local, refresh token y recuperacion de credenciales")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/login")
    @Operation(summary = "Login local", description = "Valida credenciales locales y emite access token mas refresh token.")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(request, httpRequest));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh token", description = "Rota el refresh token y devuelve un nuevo par de tokens.")
    public ResponseEntity<LoginResponse> refresh(@Valid @RequestBody RefreshTokenRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.refresh(request, httpRequest));
    }

    @PostMapping("/register")
    @Operation(summary = "Registro publico", description = "Crea una cuenta local pendiente de aprobacion administrativa.")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.register(request, httpRequest));
    }

    @PostMapping("/google")
    @Operation(summary = "Login o registro con Google", description = "Verifica un Google ID token y aplica aprobacion interna.")
    public ResponseEntity<?> google(@Valid @RequestBody GoogleAuthRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.google(request, httpRequest));
    }

    @PostMapping("/google/code")
    @Operation(summary = "Login o registro con codigo OAuth de Google", description = "Intercambia un authorization code por un Google ID token.")
    public ResponseEntity<?> googleCode(@Valid @RequestBody GoogleCodeAuthRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.googleCode(request, httpRequest));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Solicitar recuperacion de contrasena", description = "Genera instrucciones con respuesta generica para evitar enumeracion.")
    public ResponseEntity<PasswordResetResponse> forgotPassword(@RequestBody(required = false) ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(passwordResetService.requestPasswordReset(request, httpRequest));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Restablecer contrasena", description = "Valida un token de recuperacion y actualiza la contrasena local.")
    public ResponseEntity<PasswordResetResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(passwordResetService.resetPassword(request, httpRequest));
    }

    @GetMapping("/me")
    @Operation(summary = "Usuario autenticado", description = "Devuelve el usuario vigente desde base.", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<AuthUserResponse> me() {
        return ResponseEntity.ok(authService.me());
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout con revocacion", description = "Revoca refresh tokens activos y registra auditoria.", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<LogoutResponse> logout(@RequestBody(required = false) RefreshTokenRequest refreshTokenRequest, HttpServletRequest request) {
        authService.logout(refreshTokenRequest, request);
        return ResponseEntity.ok(new LogoutResponse("Sesion cerrada correctamente.", true));
    }
}
