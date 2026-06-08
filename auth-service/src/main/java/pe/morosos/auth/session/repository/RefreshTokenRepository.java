package pe.morosos.auth.session.repository;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.morosos.auth.session.entity.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("""
            update RefreshToken token
            set token.revokedAt = :revokedAt
            where token.usuario.id = :usuarioId
              and token.revokedAt is null
            """)
    int revokeActiveTokensByUsuarioId(@Param("usuarioId") UUID usuarioId, @Param("revokedAt") OffsetDateTime revokedAt);
}
