package pe.morosos.auth.admin.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.auth.admin.dto.PermissionResponse;
import pe.morosos.auth.permission.repository.PermisoRepository;

@Service
public class AdminCatalogService {
    private final PermisoRepository permisoRepository;

    public AdminCatalogService(PermisoRepository permisoRepository) {
        this.permisoRepository = permisoRepository;
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> permissions() {
        return permisoRepository.findByActivoTrueOrderByCodigo().stream()
                .map(p -> new PermissionResponse(p.getId(), p.getCodigo(), p.getNombre(), p.getDescripcion(), p.getModulo(), p.getRecurso(), p.getAccion(), p.isActivo()))
                .toList();
    }
}
