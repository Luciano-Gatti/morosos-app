package pe.morosos.inmueble.repository;

import java.util.Locale;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;
import pe.morosos.inmueble.entity.Inmueble;

public final class InmuebleSpecifications {

    private InmuebleSpecifications() {
    }

    public static Specification<Inmueble> search(String q, String campo) {
        return (root, query, cb) -> {
            if (q == null || q.isBlank()) {
                return null;
            }

            String like = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
            String normalizedCampo = campo == null ? "" : campo.trim().toLowerCase(Locale.ROOT);

            return switch (normalizedCampo) {
                case "cuenta" -> cb.like(cb.lower(root.get("cuenta")), like);
                case "titular" -> cb.like(cb.lower(root.get("titular")), like);
                case "direccion" -> cb.like(cb.lower(root.get("direccion")), like);
                case "", "all" -> cb.or(
                        cb.like(cb.lower(root.get("cuenta")), like),
                        cb.like(cb.lower(root.get("titular")), like),
                        cb.like(cb.lower(root.get("direccion")), like)
                );
                default -> cb.or(
                        cb.like(cb.lower(root.get("cuenta")), like),
                        cb.like(cb.lower(root.get("titular")), like),
                        cb.like(cb.lower(root.get("direccion")), like)
                );
            };
        };
    }

    public static Specification<Inmueble> grupoEquals(UUID grupoId) {
        return (root, query, cb) -> grupoId == null ? null : cb.equal(root.get("grupo").get("id"), grupoId);
    }

    public static Specification<Inmueble> distritoEquals(UUID distritoId) {
        return (root, query, cb) -> distritoId == null ? null : cb.equal(root.get("distrito").get("id"), distritoId);
    }

    public static Specification<Inmueble> activoEquals(Boolean activo) {
        return (root, query, cb) -> activo == null ? null : cb.equal(root.get("activo"), activo);
    }
}
