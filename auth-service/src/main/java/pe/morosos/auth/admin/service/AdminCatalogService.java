package pe.morosos.auth.admin.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.auth.admin.dto.PermissionResponse;
import pe.morosos.auth.admin.dto.RoleResponse;
import pe.morosos.auth.permission.repository.PermisoRepository;
import pe.morosos.auth.role.repository.RolRepository;

@Service
public class AdminCatalogService {
    private final RolRepository rolRepository;
    private final PermisoRepository permisoRepository;

    public AdminCatalogService(RolRepository rolRepository, PermisoRepository permisoRepository) {
        this.rolRepository = rolRepository;
        this.permisoRepository = permisoRepository;
    }

    @Transactional(readOnly = true)
    public List<RoleResponse> roles() {
        return rolRepository.findByActivoTrueOrderByCodigo().stream()
                .map(r -> new RoleResponse(r.getId(), r.getCodigo(), r.getNombre(), r.getDescripcion(), r.isActivo()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> permissions() {
        return permisoRepository.findByActivoTrueOrderByCodigo().stream()
                .map(p -> new PermissionResponse(p.getId(), p.getCodigo(), p.getNombre(), p.getDescripcion(), p.getModulo(), p.getRecurso(), p.getAccion(), p.isActivo()))
                .toList();
    }
}
