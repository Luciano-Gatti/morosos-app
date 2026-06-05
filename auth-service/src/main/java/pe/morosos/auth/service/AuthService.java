package pe.morosos.auth.service;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Locale;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import pe.morosos.auth.audit.model.LoginAttemptResult;
import pe.morosos.auth.dto.AuthUserResponse;
import pe.morosos.auth.dto.GoogleAuthRequest;
import pe.morosos.auth.dto.LoginRequest;
import pe.morosos.auth.dto.LoginResponse;
import pe.morosos.auth.dto.MessageResponse;
import pe.morosos.auth.dto.RegisterRequest;
import pe.morosos.auth.exception.AccountDisabledException;
import pe.morosos.auth.exception.AuthBusinessException;
import pe.morosos.auth.exception.InvalidCredentialsException;
import pe.morosos.auth.exception.UnauthorizedException;
import pe.morosos.auth.google.GoogleProperties;
import pe.morosos.auth.google.GoogleTokenVerificationException;
import pe.morosos.auth.google.GoogleTokenVerifier;
import pe.morosos.auth.google.GoogleUserClaims;
import pe.morosos.auth.identity.entity.IdentidadExterna;
import pe.morosos.auth.identity.model.ExternalProvider;
import pe.morosos.auth.identity.repository.IdentidadExternaRepository;
import pe.morosos.auth.security.AuthPrincipal;
import pe.morosos.auth.security.jwt.JwtService;
import pe.morosos.auth.user.entity.EstadoUsuario;
import pe.morosos.auth.user.entity.Usuario;
import pe.morosos.auth.user.repository.UsuarioRepository;

@Service
public class AuthService {

    private static final String PENDING_MESSAGE = "Tu cuenta está pendiente de aprobación por un administrador.";

    private final UsuarioRepository usuarioRepository;
    private final IdentidadExternaRepository identidadExternaRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserAuthorityService userAuthorityService;
    private final JwtService jwtService;
    private final AuthAuditService authAuditService;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final GoogleProperties googleProperties;

    public AuthService(
            UsuarioRepository usuarioRepository,
            IdentidadExternaRepository identidadExternaRepository,
            PasswordEncoder passwordEncoder,
            UserAuthorityService userAuthorityService,
            JwtService jwtService,
            AuthAuditService authAuditService,
            GoogleTokenVerifier googleTokenVerifier,
            GoogleProperties googleProperties
    ) {
        this.usuarioRepository = usuarioRepository;
        this.identidadExternaRepository = identidadExternaRepository;
        this.passwordEncoder = passwordEncoder;
        this.userAuthorityService = userAuthorityService;
        this.jwtService = jwtService;
        this.authAuditService = authAuditService;
        this.googleTokenVerifier = googleTokenVerifier;
        this.googleProperties = googleProperties;
    }

    @Transactional
    public MessageResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        validatePasswordPolicy(request.password(), request.confirmPassword());
        String username = request.username().trim();
        String email = normalizeEmail(request.email());
        ensureUniqueUsernameAndEmail(username, email);

        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setEmail(email);
        usuario.setNombre(request.nombre().trim());
        usuario.setApellido(request.apellido().trim());
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setEmailVerificado(false);
        usuario.setEstado(EstadoUsuario.PENDIENTE_APROBACION);
        usuario.setCreatedBy("self-register");
        usuario.setUpdatedBy("self-register");
        usuarioRepository.save(usuario);
        authAuditService.recordAuthEvent("USER_REGISTERED_PENDING", usuario, httpRequest, "{\"provider\":\"LOCAL\"}");
        return new MessageResponse("USER_REGISTERED_PENDING", "Registro recibido. Un administrador debe aprobar tu cuenta antes de poder ingresar.");
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String usernameOrEmail = request.usernameOrEmail().trim();
        Usuario usuario = null;
        try {
            Optional<Usuario> usuarioOptional = findByUsernameOrEmail(usernameOrEmail);
            usuario = usuarioOptional.orElse(null);
            return authenticate(usernameOrEmail, request.password(), usuario, httpRequest);
        } catch (InvalidCredentialsException | AuthBusinessException | AccountDisabledException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            authAuditService.recordLoginAttempt(usuario, usernameOrEmail, LoginAttemptResult.ERROR, httpRequest);
            authAuditService.recordAuthFailure(usuario, httpRequest, "ERROR");
            throw exception;
        }
    }

    @Transactional
    public Object google(GoogleAuthRequest request, HttpServletRequest httpRequest) {
        if (!googleProperties.enabled()) {
            throw new AuthBusinessException(HttpStatus.SERVICE_UNAVAILABLE, "GOOGLE_LOGIN_DISABLED", "El inicio de sesión con Google está deshabilitado.");
        }
        if (!StringUtils.hasText(googleProperties.clientId())) {
            throw new AuthBusinessException(HttpStatus.SERVICE_UNAVAILABLE, "GOOGLE_CLIENT_ID_NOT_CONFIGURED", "Google login no tiene GOOGLE_CLIENT_ID configurado.");
        }
        GoogleUserClaims claims;
        try {
            claims = googleTokenVerifier.verify(request.idToken());
        } catch (GoogleTokenVerificationException exception) {
            throw new AuthBusinessException(HttpStatus.UNAUTHORIZED, "GOOGLE_TOKEN_INVALID", exception.getMessage());
        }
        if (!claims.emailVerified()) {
            throw new AuthBusinessException(HttpStatus.FORBIDDEN, "GOOGLE_EMAIL_NOT_VERIFIED", "Google no informó el email como verificado.");
        }
        if (!StringUtils.hasText(claims.subject()) || !StringUtils.hasText(claims.email())) {
            throw new AuthBusinessException(HttpStatus.UNAUTHORIZED, "GOOGLE_TOKEN_INVALID", "El token de Google no contiene identidad suficiente.");
        }

        IdentidadExterna identidad = identidadExternaRepository
                .findByProviderAndProviderSubject(ExternalProvider.GOOGLE, claims.subject())
                .orElse(null);
        if (identidad != null) {
            Usuario usuario = identidad.getUsuario();
            return finishExternalLogin(usuario, httpRequest, false, false);
        }

        String email = normalizeEmail(claims.email());
        Usuario existingUser = usuarioRepository.findByEmailIgnoreCase(email).orElse(null);
        if (existingUser != null) {
            linkGoogleIdentity(existingUser, claims);
            authAuditService.recordAuthEvent("GOOGLE_IDENTITY_LINKED", existingUser, httpRequest, "{\"provider\":\"GOOGLE\"}");
            return finishExternalLogin(existingUser, httpRequest, true, false);
        }

        Usuario usuario = new Usuario();
        usuario.setUsername(generateGoogleUsername(email));
        usuario.setEmail(email);
        usuario.setNombre(resolveNombre(claims));
        usuario.setApellido(StringUtils.hasText(claims.familyName()) ? claims.familyName().trim() : "-");
        usuario.setEmailVerificado(true);
        usuario.setEstado(EstadoUsuario.PENDIENTE_APROBACION);
        usuario.setProviderPrincipal("GOOGLE");
        usuario.setCreatedBy("google-register");
        usuario.setUpdatedBy("google-register");
        usuarioRepository.save(usuario);
        linkGoogleIdentity(usuario, claims);
        authAuditService.recordAuthEvent("GOOGLE_REGISTERED_PENDING", usuario, httpRequest, "{\"provider\":\"GOOGLE\"}");
        return new MessageResponse("ACCOUNT_PENDING_APPROVAL", "Tu cuenta fue registrada con Google y está pendiente de aprobación por un administrador.");
    }

    @Transactional(readOnly = true)
    public AuthUserResponse me() {
        AuthPrincipal principal = currentPrincipal();
        Usuario usuario = usuarioRepository.findById(principal.userId())
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));
        ensureLoginAllowed(usuario, null, null);
        return userAuthorityService.toResponse(usuario);
    }

    @Transactional(readOnly = true)
    public void logout(HttpServletRequest request) {
        AuthPrincipal principal = currentPrincipal();
        Usuario usuario = usuarioRepository.findById(principal.userId()).orElse(null);
        authAuditService.recordAuthEvent("LOGOUT", usuario, request, "{\"mode\":\"STATELESS\"}");
    }

    private LoginResponse authenticate(String usernameOrEmail, String password, Usuario usuario, HttpServletRequest httpRequest) {
        if (usuario == null || !StringUtils.hasText(usuario.getPasswordHash()) || !passwordEncoder.matches(password, usuario.getPasswordHash())) {
            authAuditService.recordLoginAttempt(usuario, usernameOrEmail, LoginAttemptResult.INVALID_CREDENTIALS, httpRequest);
            authAuditService.recordAuthFailure(usuario, httpRequest, "INVALID_CREDENTIALS");
            throw new InvalidCredentialsException();
        }
        ensureLoginAllowed(usuario, usernameOrEmail, httpRequest);
        AuthUserResponse userResponse = userAuthorityService.toResponse(usuario);
        String token = jwtService.generateAccessToken(userResponse);
        authAuditService.recordLoginAttempt(usuario, usernameOrEmail, LoginAttemptResult.SUCCESS, httpRequest);
        authAuditService.recordAuthEvent("LOGIN_SUCCESS", usuario, httpRequest, "{\"authProvider\":\"LOCAL\"}");
        return new LoginResponse(token, "Bearer", jwtService.accessTokenSeconds(), userResponse);
    }

    private Object finishExternalLogin(Usuario usuario, HttpServletRequest request, boolean linked, boolean created) {
        if (usuario.getEstado() == EstadoUsuario.PENDIENTE_APROBACION) {
            authAuditService.recordAuthEvent("GOOGLE_LOGIN_PENDING", usuario, request, "{\"provider\":\"GOOGLE\"}");
            throw new AuthBusinessException(HttpStatus.FORBIDDEN, "ACCOUNT_PENDING_APPROVAL", PENDING_MESSAGE);
        }
        ensureLoginAllowed(usuario, usuario.getEmail(), request);
        AuthUserResponse userResponse = userAuthorityService.toResponse(usuario);
        String token = jwtService.generateAccessToken(userResponse);
        authAuditService.recordAuthEvent("GOOGLE_LOGIN_SUCCESS", usuario, request, "{\"provider\":\"GOOGLE\"}");
        return new LoginResponse(token, "Bearer", jwtService.accessTokenSeconds(), userResponse);
    }

    private void ensureLoginAllowed(Usuario usuario, String usernameOrEmail, HttpServletRequest request) {
        if (usuario.getEstado() == EstadoUsuario.PENDIENTE_APROBACION) {
            if (request != null) authAuditService.recordLoginAttempt(usuario, usernameOrEmail, LoginAttemptResult.USER_DISABLED, request);
            throw new AuthBusinessException(HttpStatus.FORBIDDEN, "ACCOUNT_PENDING_APPROVAL", PENDING_MESSAGE);
        }
        if (usuario.getEstado() == EstadoUsuario.RECHAZADO) {
            throw new AuthBusinessException(HttpStatus.FORBIDDEN, "ACCOUNT_REJECTED", "Tu cuenta fue rechazada por un administrador.");
        }
        if (usuario.getEstado() == EstadoUsuario.INACTIVO || !usuario.isActivo()) {
            if (request != null) authAuditService.recordLoginAttempt(usuario, usernameOrEmail, LoginAttemptResult.USER_DISABLED, request);
            throw new AuthBusinessException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "Tu cuenta se encuentra inactiva.");
        }
    }

    private void linkGoogleIdentity(Usuario usuario, GoogleUserClaims claims) {
        IdentidadExterna identidad = new IdentidadExterna();
        identidad.setUsuario(usuario);
        identidad.setProvider(ExternalProvider.GOOGLE);
        identidad.setProviderSubject(claims.subject());
        identidad.setEmail(normalizeEmail(claims.email()));
        identidadExternaRepository.save(identidad);
    }

    private void validatePasswordPolicy(String password, String confirmPassword) {
        if (!password.equals(confirmPassword)) {
            throw new AuthBusinessException(HttpStatus.BAD_REQUEST, "PASSWORD_CONFIRMATION_MISMATCH", "La contraseña y su confirmación no coinciden.");
        }
        boolean valid = password.length() >= 8
                && password.chars().anyMatch(Character::isUpperCase)
                && password.chars().anyMatch(Character::isLowerCase)
                && password.chars().anyMatch(Character::isDigit);
        if (!valid) {
            throw new AuthBusinessException(HttpStatus.BAD_REQUEST, "WEAK_PASSWORD", "La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula y número.");
        }
    }

    public void ensureUniqueUsernameAndEmail(String username, String email) {
        if (usuarioRepository.existsByUsernameIgnoreCase(username)) {
            throw new AuthBusinessException(HttpStatus.CONFLICT, "USERNAME_ALREADY_EXISTS", "El username ya está registrado.");
        }
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new AuthBusinessException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "El email ya está registrado.");
        }
    }

    private String generateGoogleUsername(String email) {
        String base = email.substring(0, email.indexOf('@')).replaceAll("[^A-Za-z0-9._-]", "");
        if (!StringUtils.hasText(base)) base = "google";
        String candidate = base;
        int suffix = 1;
        while (usuarioRepository.existsByUsernameIgnoreCase(candidate)) {
            candidate = base + suffix++;
        }
        return candidate;
    }

    private String resolveNombre(GoogleUserClaims claims) {
        if (StringUtils.hasText(claims.givenName())) return claims.givenName().trim();
        if (StringUtils.hasText(claims.name())) return claims.name().trim();
        return claims.email().substring(0, claims.email().indexOf('@'));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
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
