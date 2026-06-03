package pe.morosos.auth.password.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.morosos.auth.password.entity.PasswordResetToken;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    List<PasswordResetToken> findByUsuarioId(UUID usuarioId);

    @Modifying
    @Query("""
            update PasswordResetToken token
            set token.usedAt = :usedAt
            where token.usuario.id = :usuarioId
              and token.usedAt is null
            """)
    int markActiveTokensAsUsedByUsuarioId(@Param("usuarioId") UUID usuarioId, @Param("usedAt") OffsetDateTime usedAt);

    @Modifying
    @Query("""
            update PasswordResetToken token
            set token.usedAt = :usedAt
            where token.usuario.id = :usuarioId
              and token.id <> :tokenId
              and token.usedAt is null
            """)
    int markOtherActiveTokensAsUsed(@Param("usuarioId") UUID usuarioId, @Param("tokenId") UUID tokenId, @Param("usedAt") OffsetDateTime usedAt);
}
