package pe.morosos.inmueble.repository;

import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;
import pe.morosos.inmueble.entity.Inmueble;

public final class InmuebleSpecifications {

    private InmuebleSpecifications() {
    }

    public static Specification<Inmueble> cuentaLike(String cuenta) {
        return (root, query, cb) -> cuenta == null || cuenta.isBlank()
                ? null
                : cb.like(cb.lower(root.get("cuenta")), "%" + cuenta.trim().toLowerCase() + "%");
    }

    public static Specification<Inmueble> titularLike(String titular) {
        return (root, query, cb) -> titular == null || titular.isBlank()
                ? null
                : cb.like(cb.lower(root.get("titular")), "%" + titular.trim().toLowerCase() + "%");
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
