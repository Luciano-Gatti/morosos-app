package pe.morosos.auth.security;

import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.OPTIONS;
import static org.springframework.http.HttpMethod.POST;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import pe.morosos.auth.security.jwt.JwtAuthenticationEntryPoint;
import pe.morosos.auth.security.jwt.JwtAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint,
            RestAccessDeniedHandler restAccessDeniedHandler
    ) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> { })
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptionHandling -> exceptionHandling
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(restAccessDeniedHandler)
                )
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(OPTIONS, "/**").permitAll()
                        .requestMatchers(POST, "/api/v1/auth/login").permitAll()
                        .requestMatchers(POST, "/api/v1/auth/register").permitAll()
                        .requestMatchers(POST, "/api/v1/auth/google").permitAll()
                        .requestMatchers(POST, "/api/v1/auth/forgot-password").permitAll()
                        .requestMatchers(POST, "/api/v1/auth/reset-password").permitAll()
                        .requestMatchers(GET, "/api/v1/auth-service/health").permitAll()
                        .requestMatchers(GET, "/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers(GET, "/v3/api-docs/**").permitAll()
                        .requestMatchers(GET, "/swagger-ui", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers(GET, "/api/v1/auth/me").authenticated()
                        .requestMatchers(POST, "/api/v1/auth/logout").authenticated()
                        .requestMatchers("/api/v1/admin/**").authenticated()
                        .anyRequest().denyAll()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
