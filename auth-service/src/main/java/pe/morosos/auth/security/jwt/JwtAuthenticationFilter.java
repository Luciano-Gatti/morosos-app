package pe.morosos.auth.security.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import pe.morosos.auth.exception.JwtAuthenticationException;
import pe.morosos.auth.security.AuthPrincipal;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    public static final String AUTH_ERROR_CODE_ATTRIBUTE = "auth.error.code";
    public static final String AUTH_ERROR_MESSAGE_ATTRIBUTE = "auth.error.message";

    private final JwtService jwtService;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;

    public JwtAuthenticationFilter(JwtService jwtService, JwtAuthenticationEntryPoint authenticationEntryPoint) {
        this.jwtService = jwtService;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authorization.substring(7).trim();
        try {
            AuthPrincipal principal = jwtService.validateAccessToken(token);
            var authorities = principal.permissions().stream()
                    .map(SimpleGrantedAuthority::new)
                    .toList();
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    authorities
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);
        } catch (JwtAuthenticationException exception) {
            SecurityContextHolder.clearContext();
            request.setAttribute(AUTH_ERROR_CODE_ATTRIBUTE, exception.getCode());
            request.setAttribute(AUTH_ERROR_MESSAGE_ATTRIBUTE, exception.getMessage());
            authenticationEntryPoint.commence(request, response, null);
        }
    }
}
