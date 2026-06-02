package pe.morosos.security;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class PermissionsJwtAuthenticationConverter implements Converter<Jwt, JwtAuthenticationToken> {
    private static final String PERMISSIONS_CLAIM = "permissions";

    @Override
    public JwtAuthenticationToken convert(Jwt jwt) {
        return new JwtAuthenticationToken(jwt, extractAuthorities(jwt), jwt.getSubject());
    }

    Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        Set<GrantedAuthority> authorities = new LinkedHashSet<>();
        List<String> permissions = jwt.getClaimAsStringList(PERMISSIONS_CLAIM);
        if (permissions == null) {
            return authorities;
        }

        permissions.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(SimpleGrantedAuthority::new)
                .forEach(authorities::add);
        return authorities;
    }
}
