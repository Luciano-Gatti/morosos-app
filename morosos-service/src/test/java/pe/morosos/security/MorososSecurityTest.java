package pe.morosos.security;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.morosos.dashboard.controller.DashboardController;
import pe.morosos.dashboard.dto.DashboardResumenResponse;
import pe.morosos.dashboard.service.DashboardService;

@WebMvcTest(controllers = {DashboardController.class, MorososSecurityTest.TestHealthController.class})
@Import({SecurityConfig.class, PermissionsJwtAuthenticationConverter.class, SecurityErrorResponseWriter.class})
@TestPropertySource(properties = {
        "app.security.jwt.issuer=http://localhost:8080",
        "app.security.jwt.audience=morosos-app",
        "app.security.jwt.secret=test_secret_32_bytes_minimum_value",
        "app.cors.allowed-origins=http://localhost:5173"
})
class MorososSecurityTest {
    private static final String SECRET = "test_secret_32_bytes_minimum_value";
    private static final String ISSUER = "http://localhost:8080";
    private static final String AUDIENCE = "morosos-app";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    @Test
    void protectedEndpointWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/resumen"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_UNAUTHORIZED"));
    }

    @Test
    void protectedEndpointWithValidTokenButWithoutPermissionReturns403() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/resumen")
                        .header("Authorization", "Bearer " + token(ISSUER, AUDIENCE, Instant.now().plusSeconds(3600), List.of())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTH_FORBIDDEN"));
    }

    @Test
    void protectedEndpointWithPermissionDoesNotReturn401Or403() throws Exception {
        when(dashboardService.resumen(any(), any(), any(), any()))
                .thenReturn(new DashboardResumenResponse(null, null, null, List.of(), List.of()));

        mockMvc.perform(get("/api/v1/dashboard/resumen")
                        .header("Authorization", "Bearer " + token(ISSUER, AUDIENCE, Instant.now().plusSeconds(3600), List.of(PermissionCodes.DASHBOARD_VER_RESUMEN))))
                .andExpect(status().isOk());
    }

    @Test
    void publicHealthEndpointReturns200WithoutToken() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    void tokenWithInvalidAudienceReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/resumen")
                        .header("Authorization", "Bearer " + token(ISSUER, "otra-audiencia", Instant.now().plusSeconds(3600), List.of(PermissionCodes.DASHBOARD_VER_RESUMEN))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_UNAUTHORIZED"));
    }

    @Test
    void tokenWithInvalidIssuerReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/resumen")
                        .header("Authorization", "Bearer " + token("http://issuer-invalido", AUDIENCE, Instant.now().plusSeconds(3600), List.of(PermissionCodes.DASHBOARD_VER_RESUMEN))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_UNAUTHORIZED"));
    }

    @Test
    void expiredTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/resumen")
                        .header("Authorization", "Bearer " + token(ISSUER, AUDIENCE, Instant.now().minusSeconds(60), List.of(PermissionCodes.DASHBOARD_VER_RESUMEN))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_UNAUTHORIZED"));
    }

    private String token(String issuer, String audience, Instant expiresAt, List<String> permissions) throws Exception {
        Instant issuedAt = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject("admin")
                .issuer(issuer)
                .audience(audience)
                .issueTime(Date.from(issuedAt))
                .expirationTime(Date.from(expiresAt))
                .jwtID("test-jti")
                .claim("userId", "00000000-0000-0000-0000-000000000001")
                .claim("username", "admin")
                .claim("email", "admin@example.com")
                .claim("roles", List.of("ADMIN"))
                .claim("permissions", permissions)
                .claim("authProvider", "LOCAL")
                .build();
        SignedJWT jwt = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.HS256).type(JOSEObjectType.JWT).build(),
                claims
        );
        jwt.sign(new MACSigner(SECRET.getBytes()));
        return jwt.serialize();
    }

    @RestController
    static class TestHealthController {
        @GetMapping(value = "/actuator/health", produces = MediaType.APPLICATION_JSON_VALUE)
        String health() {
            return "{\"status\":\"UP\"}";
        }
    }
}
