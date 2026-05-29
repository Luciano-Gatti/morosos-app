-- Seeds controlados e idempotentes de roles base.
INSERT INTO roles (id, codigo, nombre, descripcion, activo, created_at, updated_at, created_by, updated_by)
VALUES
    ('b0d2abe9-73cf-5a10-b50c-ffa72edfc725', 'ADMIN', 'Administrador del sistema', 'Rol con acceso completo a permisos del sistema.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'flyway_seed', 'flyway_seed'),
    ('293462d8-89c1-58fd-a769-2aff591e6ab8', 'SUPERVISOR', 'Supervisor operativo', 'Rol para supervisar la operación, seguimiento, reportes, auditoría y configuración de lectura.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'flyway_seed', 'flyway_seed'),
    ('f8ca6b2d-5f0e-523b-bb61-f6b42510f3a7', 'OPERADOR', 'Operador de seguimiento', 'Rol para ejecutar tareas operativas de seguimiento sin administración ni cierres reservados.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'flyway_seed', 'flyway_seed'),
    ('67ce37af-7504-5747-b8c3-9ae6eda494d9', 'CONSULTA', 'Usuario de consulta', 'Rol de solo lectura para consultar información operativa y reportes sin exportación.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'flyway_seed', 'flyway_seed'),
    ('e5b3d979-0823-58a8-bb83-b4f844ba08b2', 'AUDITOR', 'Auditor de movimientos y reportes', 'Rol de solo lectura orientado a auditoría, reportes y exportaciones.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'flyway_seed', 'flyway_seed')
ON CONFLICT (codigo) DO NOTHING;
