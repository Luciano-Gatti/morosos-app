ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS estado VARCHAR(40) NOT NULL DEFAULT 'ACTIVO';

UPDATE usuarios
SET estado = CASE WHEN activo = TRUE THEN 'ACTIVO' ELSE 'INACTIVO' END
WHERE estado IS NULL OR estado = '';

CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios (estado);

CREATE TABLE IF NOT EXISTS usuario_permisos (
    id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    permiso_id UUID NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(120),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_by VARCHAR(120),
    CONSTRAINT pk_usuario_permisos PRIMARY KEY (id),
    CONSTRAINT fk_usuario_permisos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    CONSTRAINT fk_usuario_permisos_permiso FOREIGN KEY (permiso_id) REFERENCES permisos (id),
    CONSTRAINT uk_usuario_permisos_usuario_permiso UNIQUE (usuario_id, permiso_id)
);

CREATE INDEX IF NOT EXISTS idx_usuario_permisos_usuario_id ON usuario_permisos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_permisos_permiso_id ON usuario_permisos (permiso_id);
CREATE INDEX IF NOT EXISTS idx_usuario_permisos_activo ON usuario_permisos (activo);

WITH nuevos_permisos (id, codigo, nombre, descripcion, modulo, recurso, accion) AS (
    VALUES
        ('d4d32301-1e64-5f19-9a1c-4b582f190001', 'USUARIOS_VER_LISTADO', 'Ver listado de usuarios', 'Permite listar usuarios administrativos.', 'AUTH', 'USUARIOS', 'VER_LISTADO'),
        ('d4d32301-1e64-5f19-9a1c-4b582f190002', 'USUARIOS_VER_DETALLE', 'Ver detalle de usuario', 'Permite ver el detalle de un usuario.', 'AUTH', 'USUARIOS', 'VER_DETALLE'),
        ('d4d32301-1e64-5f19-9a1c-4b582f190003', 'USUARIOS_CREAR', 'Crear usuarios', 'Permite crear usuarios manualmente.', 'AUTH', 'USUARIOS', 'CREAR'),
        ('d4d32301-1e64-5f19-9a1c-4b582f190004', 'USUARIOS_EDITAR', 'Editar usuarios', 'Permite editar datos y asignaciones de usuarios.', 'AUTH', 'USUARIOS', 'EDITAR'),
        ('d4d32301-1e64-5f19-9a1c-4b582f190005', 'USUARIOS_ACTIVAR_DESACTIVAR', 'Activar o desactivar usuarios', 'Permite cambiar el estado operativo de usuarios.', 'AUTH', 'USUARIOS', 'ACTIVAR_DESACTIVAR'),
        ('d4d32301-1e64-5f19-9a1c-4b582f190006', 'USUARIOS_APROBAR', 'Aprobar usuarios', 'Permite aprobar usuarios pendientes.', 'AUTH', 'USUARIOS', 'APROBAR'),
        ('d4d32301-1e64-5f19-9a1c-4b582f190007', 'USUARIOS_RECHAZAR', 'Rechazar usuarios', 'Permite rechazar usuarios pendientes.', 'AUTH', 'USUARIOS', 'RECHAZAR'),
        ('d4d32301-1e64-5f19-9a1c-4b582f190008', 'USUARIOS_ASIGNAR_ROLES', 'Asignar roles', 'Permite asignar roles administrativos a usuarios.', 'AUTH', 'USUARIOS', 'ASIGNAR_ROLES'),
        ('d4d32301-1e64-5f19-9a1c-4b582f190009', 'USUARIOS_ASIGNAR_PERMISOS', 'Asignar permisos directos', 'Permite asignar permisos directos a usuarios.', 'AUTH', 'USUARIOS', 'ASIGNAR_PERMISOS'),
        ('d4d32301-1e64-5f19-9a1c-4b582f190010', 'ROLES_VER_LISTADO', 'Ver listado de roles', 'Permite listar roles activos.', 'AUTH', 'ROLES', 'VER_LISTADO'),
        ('d4d32301-1e64-5f19-9a1c-4b582f190011', 'PERMISOS_VER_LISTADO', 'Ver listado de permisos', 'Permite listar permisos activos.', 'AUTH', 'PERMISOS', 'VER_LISTADO')
)
INSERT INTO permisos (id, codigo, nombre, descripcion, modulo, recurso, accion, activo, created_at, updated_at, created_by, updated_by)
SELECT id::uuid, codigo, nombre, descripcion, modulo, recurso, accion, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'auth-seed', 'auth-seed'
FROM nuevos_permisos
ON CONFLICT (codigo) DO NOTHING;

WITH asignaciones (id, rol_codigo, permiso_codigo) AS (
    VALUES
        ('e9ee9802-b7be-5f28-9011-4e3cf6e10001', 'ADMIN', 'USUARIOS_VER_LISTADO'),
        ('e9ee9802-b7be-5f28-9011-4e3cf6e10002', 'ADMIN', 'USUARIOS_VER_DETALLE'),
        ('e9ee9802-b7be-5f28-9011-4e3cf6e10003', 'ADMIN', 'USUARIOS_CREAR'),
        ('e9ee9802-b7be-5f28-9011-4e3cf6e10004', 'ADMIN', 'USUARIOS_EDITAR'),
        ('e9ee9802-b7be-5f28-9011-4e3cf6e10005', 'ADMIN', 'USUARIOS_ACTIVAR_DESACTIVAR'),
        ('e9ee9802-b7be-5f28-9011-4e3cf6e10006', 'ADMIN', 'USUARIOS_APROBAR'),
        ('e9ee9802-b7be-5f28-9011-4e3cf6e10007', 'ADMIN', 'USUARIOS_RECHAZAR'),
        ('e9ee9802-b7be-5f28-9011-4e3cf6e10008', 'ADMIN', 'USUARIOS_ASIGNAR_ROLES'),
        ('e9ee9802-b7be-5f28-9011-4e3cf6e10009', 'ADMIN', 'USUARIOS_ASIGNAR_PERMISOS'),
        ('e9ee9802-b7be-5f28-9011-4e3cf6e10010', 'ADMIN', 'ROLES_VER_LISTADO'),
        ('e9ee9802-b7be-5f28-9011-4e3cf6e10011', 'ADMIN', 'PERMISOS_VER_LISTADO'),
        ('e9ee9802-b7be-5f28-9011-4e3cf6e10012', 'SUPERVISOR', 'USUARIOS_VER_LISTADO'),
        ('e9ee9802-b7be-5f28-9011-4e3cf6e10013', 'SUPERVISOR', 'USUARIOS_VER_DETALLE'),
        ('e9ee9802-b7be-5f28-9011-4e3cf6e10014', 'SUPERVISOR', 'ROLES_VER_LISTADO'),
        ('e9ee9802-b7be-5f28-9011-4e3cf6e10015', 'SUPERVISOR', 'PERMISOS_VER_LISTADO')
)
INSERT INTO rol_permisos (id, rol_id, permiso_id, created_at)
SELECT asignaciones.id::uuid, roles.id, permisos.id, CURRENT_TIMESTAMP
FROM asignaciones
JOIN roles ON roles.codigo = asignaciones.rol_codigo
JOIN permisos ON permisos.codigo = asignaciones.permiso_codigo
ON CONFLICT (rol_id, permiso_id) DO NOTHING;
