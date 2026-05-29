package pe.morosos.auth.service;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import pe.morosos.auth.audit.model.LoginAttemptResult;
import pe.morosos.auth.dto.AuthUserResponse;
import pe.morosos.auth.dto.LoginRequest;
import pe.morosos.auth.dto.LoginResponse;
import pe.morosos.auth.exception.AccountDisabledException;
import pe.morosos.auth.exception.InvalidCredentialsException;
import pe.morosos.auth.exception.UnauthorizedException;
import pe.morosos.auth.security.AuthPrincipal;
import pe.morosos.auth.security.jwt.JwtService;
import pe.morosos.auth.user.entity.Usuario;
import pe.morosos.auth.user.repository.UsuarioRepository;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserAuthorityService userAuthorityService;
    private final JwtService jwtService;
    private final AuthAuditService authAuditService;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            UserAuthorityService userAuthorityService,
            JwtService jwtService,
            AuthAuditService authAuditService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.userAuthorityService = userAuthorityService;
        this.jwtService = jwtService;
        this.authAuditService = authAuditService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String usernameOrEmail = request.usernameOrEmail().trim();
        Usuario usuario = null;
        try {
            Optional<Usuario> usuarioOptional = findByUsernameOrEmail(usernameOrEmail);
            usuario = usuarioOptional.orElse(null);

            return authenticate(usernameOrEmail, request.password(), usuario, httpRequest);
        } catch (InvalidCredentialsException | AccountDisabledException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            authAuditService.recordLoginAttempt(usuario, usernameOrEmail, LoginAttemptResult.ERROR, httpRequest);
            authAuditService.recordAuthFailure(usuario, httpRequest, "ERROR");
            throw exception;
        }
    }

    private LoginResponse authenticate(String usernameOrEmail, String password, Usuario usuario, HttpServletRequest httpRequest) {

        if (usuario == null) {
            authAuditService.recordLoginAttempt(null, usernameOrEmail, LoginAttemptResult.INVALID_CREDENTIALS, httpRequest);
            authAuditService.recordAuthFailure(null, httpRequest, "INVALID_CREDENTIALS");
            throw new InvalidCredentialsException();
        }

        if (!usuario.isActivo()) {
            authAuditService.recordLoginAttempt(usuario, usernameOrEmail, LoginAttemptResult.USER_DISABLED, httpRequest);
            authAuditService.recordAuthFailure(usuario, httpRequest, "USER_DISABLED");
            throw new AccountDisabledException();
        }

        if (!StringUtils.hasText(usuario.getPasswordHash()) || !passwordEncoder.matches(password, usuario.getPasswordHash())) {
            authAuditService.recordLoginAttempt(usuario, usernameOrEmail, LoginAttemptResult.INVALID_CREDENTIALS, httpRequest);
            authAuditService.recordAuthFailure(usuario, httpRequest, "INVALID_CREDENTIALS");
            throw new InvalidCredentialsException();
        }

        AuthUserResponse userResponse = userAuthorityService.toResponse(usuario);
        String token = jwtService.generateAccessToken(userResponse);
        authAuditService.recordLoginAttempt(usuario, usernameOrEmail, LoginAttemptResult.SUCCESS, httpRequest);
        authAuditService.recordAuthEvent("LOGIN_SUCCESS", usuario, httpRequest, "{\"authProvider\":\"LOCAL\"}");
        return new LoginResponse(token, "Bearer", jwtService.accessTokenSeconds(), userResponse);
    }

    @Transactional(readOnly = true)
    public AuthUserResponse me() {
        AuthPrincipal principal = currentPrincipal();
        Usuario usuario = usuarioRepository.findById(principal.userId())
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));
        if (!usuario.isActivo()) {
            throw new AccountDisabledException();
        }
        return userAuthorityService.toResponse(usuario);
    }

    @Transactional(readOnly = true)
    public void logout(HttpServletRequest request) {
        AuthPrincipal principal = currentPrincipal();
        Usuario usuario = usuarioRepository.findById(principal.userId()).orElse(null);
        if (usuario != null) {
            authAuditService.recordAuthEvent("LOGOUT", usuario, request, "{\"mode\":\"STATELESS\"}");
        } else {
            authAuditService.recordAuthEvent("LOGOUT", null, request, "{\"mode\":\"STATELESS\"}");
        }
    }

    private Optional<Usuario> findByUsernameOrEmail(String usernameOrEmail) {
        if (usernameOrEmail.contains("@")) {
            return usuarioRepository.findByEmailIgnoreCase(usernameOrEmail)
                    .or(() -> usuarioRepository.findByUsernameIgnoreCase(usernameOrEmail));
        }
        return usuarioRepository.findByUsernameIgnoreCase(usernameOrEmail)
                .or(() -> usuarioRepository.findByEmailIgnoreCase(usernameOrEmail));
    }

    private AuthPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            throw new UnauthorizedException("Usuario no autenticado.");
        }
        return principal;
    }
}
