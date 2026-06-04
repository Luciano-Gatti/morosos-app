package pe.morosos.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import pe.morosos.auth.dto.AuthUserResponse;
import pe.morosos.auth.dto.GoogleAuthRequest;
import pe.morosos.auth.dto.LoginResponse;
import pe.morosos.auth.dto.MessageResponse;
import pe.morosos.auth.exception.AuthBusinessException;
import pe.morosos.auth.google.GoogleProperties;
import pe.morosos.auth.google.GoogleTokenVerificationException;
import pe.morosos.auth.google.GoogleTokenVerifier;
import pe.morosos.auth.google.GoogleUserClaims;
import pe.morosos.auth.identity.entity.IdentidadExterna;
import pe.morosos.auth.identity.model.ExternalProvider;
import pe.morosos.auth.identity.repository.IdentidadExternaRepository;
import pe.morosos.auth.security.jwt.JwtService;
import pe.morosos.auth.user.entity.EstadoUsuario;
import pe.morosos.auth.user.entity.Usuario;
import pe.morosos.auth.user.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class AuthServiceGoogleTest {

    private static final String CLIENT_ID = "492537971639-h16aabnpmu0hcrn5vcbk6bvn2evkjbgf.apps.googleusercontent.com";
    private static final String ID_TOKEN = "google-id-token-no-log";

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private IdentidadExternaRepository identidadExternaRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private UserAuthorityService userAuthorityService;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthAuditService authAuditService;
    @Mock
    private GoogleTokenVerifier googleTokenVerifier;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = service(new GoogleProperties(CLIENT_ID, true));
    }

    @Test
    void googleLoginDisabledReturnsControlledErrorWithoutVerifyingToken() {
        AuthService disabledService = service(new GoogleProperties(CLIENT_ID, false));

        assertThatThrownBy(() -> disabledService.google(new GoogleAuthRequest(ID_TOKEN), null))
                .isInstanceOf(AuthBusinessException.class)
                .extracting("code", "status")
                .containsExactly("GOOGLE_LOGIN_DISABLED", HttpStatus.SERVICE_UNAVAILABLE);

        verify(googleTokenVerifier, never()).verify(any());
        verify(jwtService, never()).generateAccessToken(any(AuthUserResponse.class));
    }

    @Test
    void googleLoginEnabledWithoutClientIdReturnsControlledError() {
        AuthService misconfiguredService = service(new GoogleProperties("", true));

        assertThatThrownBy(() -> misconfiguredService.google(new GoogleAuthRequest(ID_TOKEN), null))
                .isInstanceOf(AuthBusinessException.class)
                .extracting("code", "status")
                .containsExactly("GOOGLE_CLIENT_ID_NOT_CONFIGURED", HttpStatus.SERVICE_UNAVAILABLE);

        verify(googleTokenVerifier, never()).verify(any());
    }

    @Test
    void invalidIdTokenReturnsControlledErrorAndDoesNotIssueJwt() {
        when(googleTokenVerifier.verify(ID_TOKEN)).thenThrow(new GoogleTokenVerificationException("Token de Google inválido."));

        assertThatThrownBy(() -> authService.google(new GoogleAuthRequest(ID_TOKEN), null))
                .isInstanceOf(AuthBusinessException.class)
                .extracting("code", "status")
                .containsExactly("GOOGLE_TOKEN_INVALID", HttpStatus.UNAUTHORIZED);

        verify(jwtService, never()).generateAccessToken(any(AuthUserResponse.class));
    }

    @Test
    void unverifiedGoogleEmailReturnsControlledErrorAndDoesNotIssueJwt() {
        when(googleTokenVerifier.verify(ID_TOKEN)).thenReturn(claims(false));

        assertThatThrownBy(() -> authService.google(new GoogleAuthRequest(ID_TOKEN), null))
                .isInstanceOf(AuthBusinessException.class)
                .extracting("code", "status")
                .containsExactly("GOOGLE_EMAIL_NOT_VERIFIED", HttpStatus.FORBIDDEN);

        verify(jwtService, never()).generateAccessToken(any(AuthUserResponse.class));
    }

    @Test
    void validIdTokenForNewUserCreatesPendingUserWithoutRolesOrJwt() {
        when(googleTokenVerifier.verify(ID_TOKEN)).thenReturn(claims(true));
        when(identidadExternaRepository.findByProviderAndProviderSubject(ExternalProvider.GOOGLE, "google-sub-123"))
                .thenReturn(Optional.empty());
        when(usuarioRepository.findByEmailIgnoreCase("persona@example.com")).thenReturn(Optional.empty());

        Object response = authService.google(new GoogleAuthRequest(ID_TOKEN), null);

        assertThat(response).isInstanceOf(MessageResponse.class);
        assertThat(((MessageResponse) response).code()).isEqualTo("ACCOUNT_PENDING_APPROVAL");

        ArgumentCaptor<Usuario> usuarioCaptor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(usuarioCaptor.capture());
        Usuario usuario = usuarioCaptor.getValue();
        assertThat(usuario.getEstado()).isEqualTo(EstadoUsuario.PENDIENTE_APROBACION);
        assertThat(usuario.isActivo()).isFalse();
        assertThat(usuario.isEmailVerificado()).isTrue();

        verify(userAuthorityService, never()).toResponse(any());
        verify(jwtService, never()).generateAccessToken(any(AuthUserResponse.class));
    }

    @Test
    void pendingUserWithGoogleIdentityDoesNotReceiveJwt() {
        Usuario usuario = user(EstadoUsuario.PENDIENTE_APROBACION);
        when(googleTokenVerifier.verify(ID_TOKEN)).thenReturn(claims(true));
        when(identidadExternaRepository.findByProviderAndProviderSubject(ExternalProvider.GOOGLE, "google-sub-123"))
                .thenReturn(Optional.of(identity(usuario)));

        assertThatThrownBy(() -> authService.google(new GoogleAuthRequest(ID_TOKEN), null))
                .isInstanceOf(AuthBusinessException.class)
                .extracting("code", "status")
                .containsExactly("ACCOUNT_PENDING_APPROVAL", HttpStatus.FORBIDDEN);

        verify(jwtService, never()).generateAccessToken(any(AuthUserResponse.class));
    }

    @Test
    void activeUserWithGoogleIdentityReceivesOwnJwt() {
        Usuario usuario = user(EstadoUsuario.ACTIVO);
        AuthUserResponse userResponse = response(usuario, List.of("OPERADOR"), List.of("DASHBOARD_VER"));
        when(googleTokenVerifier.verify(ID_TOKEN)).thenReturn(claims(true));
        when(identidadExternaRepository.findByProviderAndProviderSubject(ExternalProvider.GOOGLE, "google-sub-123"))
                .thenReturn(Optional.of(identity(usuario)));
        when(userAuthorityService.toResponse(usuario)).thenReturn(userResponse);
        when(jwtService.generateAccessToken(userResponse)).thenReturn("own-auth-service-jwt");
        when(jwtService.accessTokenSeconds()).thenReturn(900L);

        Object response = authService.google(new GoogleAuthRequest(ID_TOKEN), null);

        assertThat(response).isInstanceOf(LoginResponse.class);
        LoginResponse loginResponse = (LoginResponse) response;
        assertThat(loginResponse.accessToken()).isEqualTo("own-auth-service-jwt");
        assertThat(loginResponse.user().roles()).containsExactly("OPERADOR");
        assertThat(loginResponse.user().permissions()).containsExactly("DASHBOARD_VER");
    }

    @Test
    void inactiveOrRejectedUsersDoNotReceiveJwt() {
        assertBlockedState(EstadoUsuario.INACTIVO, "ACCOUNT_DISABLED");
        assertBlockedState(EstadoUsuario.RECHAZADO, "ACCOUNT_REJECTED");
    }

    @Test
    void verifiedGoogleEmailForExistingLocalUserLinksIdentity() {
        Usuario usuario = user(EstadoUsuario.ACTIVO);
        usuario.setEmailVerificado(false);
        AuthUserResponse userResponse = response(usuario, List.of(), List.of());
        when(googleTokenVerifier.verify(ID_TOKEN)).thenReturn(claims(true));
        when(identidadExternaRepository.findByProviderAndProviderSubject(ExternalProvider.GOOGLE, "google-sub-123"))
                .thenReturn(Optional.empty());
        when(usuarioRepository.findByEmailIgnoreCase("persona@example.com")).thenReturn(Optional.of(usuario));
        when(userAuthorityService.toResponse(usuario)).thenReturn(userResponse);
        when(jwtService.generateAccessToken(userResponse)).thenReturn("own-auth-service-jwt");
        when(jwtService.accessTokenSeconds()).thenReturn(900L);

        Object response = authService.google(new GoogleAuthRequest(ID_TOKEN), null);

        assertThat(response).isInstanceOf(LoginResponse.class);
        ArgumentCaptor<IdentidadExterna> identityCaptor = ArgumentCaptor.forClass(IdentidadExterna.class);
        verify(identidadExternaRepository).save(identityCaptor.capture());
        IdentidadExterna identidad = identityCaptor.getValue();
        assertThat(identidad.getProvider()).isEqualTo(ExternalProvider.GOOGLE);
        assertThat(identidad.getProviderSubject()).isEqualTo("google-sub-123");
        assertThat(identidad.getUsuario()).isSameAs(usuario);
    }

    private void assertBlockedState(EstadoUsuario estado, String code) {
        Usuario usuario = user(estado);
        when(googleTokenVerifier.verify(ID_TOKEN)).thenReturn(claims(true));
        when(identidadExternaRepository.findByProviderAndProviderSubject(ExternalProvider.GOOGLE, "google-sub-123"))
                .thenReturn(Optional.of(identity(usuario)));

        assertThatThrownBy(() -> authService.google(new GoogleAuthRequest(ID_TOKEN), null))
                .isInstanceOf(AuthBusinessException.class)
                .extracting("code")
                .isEqualTo(code);

        verify(jwtService, never()).generateAccessToken(any(AuthUserResponse.class));
    }

    private AuthService service(GoogleProperties properties) {
        return new AuthService(
                usuarioRepository,
                identidadExternaRepository,
                passwordEncoder,
                userAuthorityService,
                jwtService,
                authAuditService,
                googleTokenVerifier,
                properties
        );
    }

    private GoogleUserClaims claims(boolean emailVerified) {
        return new GoogleUserClaims(
                "google-sub-123",
                "Persona@Example.com",
                emailVerified,
                "Persona",
                "Google",
                "Persona Google",
                "https://example.com/avatar.png"
        );
    }

    private Usuario user(EstadoUsuario estado) {
        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setUsername("persona");
        usuario.setEmail("persona@example.com");
        usuario.setNombre("Persona");
        usuario.setApellido("Google");
        usuario.setEstado(estado);
        usuario.setEmailVerificado(true);
        return usuario;
    }

    private IdentidadExterna identity(Usuario usuario) {
        IdentidadExterna identidad = new IdentidadExterna();
        identidad.setUsuario(usuario);
        identidad.setProvider(ExternalProvider.GOOGLE);
        identidad.setProviderSubject("google-sub-123");
        identidad.setEmail("persona@example.com");
        return identidad;
    }

    private AuthUserResponse response(Usuario usuario, List<String> roles, List<String> permissions) {
        return new AuthUserResponse(
                usuario.getId(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getNombre(),
                usuario.getApellido(),
                roles,
                permissions
        );
    }
}
