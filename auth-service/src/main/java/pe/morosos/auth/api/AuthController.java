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
import pe.morosos.auth.dto.LoginRequest;
import pe.morosos.auth.dto.LoginResponse;
import pe.morosos.auth.dto.LogoutResponse;
import pe.morosos.auth.service.AuthService;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "Autenticación local y sesión stateless")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Login local", description = "Valida credenciales locales con BCrypt y emite un JWT HS256.")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(authService.login(request, httpRequest));
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
