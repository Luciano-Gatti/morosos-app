# ETAPA 1-C - Seeds controlados de roles y permisos

## Alcance

La ETAPA 1-C agrega seeds idempotentes de autorización para `auth-service` sin cambiar la lógica funcional de otros microservicios. El modelo sigue siendo:

```text
Usuario -> Roles -> Permisos
```

No existe tabla `endpoint_permisos` y no se asocian endpoints a permisos en base de datos. Cada microservicio consumidor declarará en su propio código qué permiso exige cada endpoint cuando se implemente la validación de autorización.

Esta etapa no implementa login, JWT, Google login, recuperación funcional de contraseña, envío de correos, endpoints administrativos, integración con frontend ni protección de `morosos-service`.

## Migraciones creadas

- `V3__seed_permissions.sql`: carga 83 permisos descriptivos y modulares.
- `V4__seed_roles.sql`: carga 5 roles base.
- `V5__seed_role_permissions.sql`: carga 193 asignaciones iniciales rol-permiso y castea explícitamente el identificador seed a UUID al insertar en `rol_permisos`.

Las migraciones usan `INSERT ... ON CONFLICT DO NOTHING`, por lo que son idempotentes y no duplican datos si se vuelven a ejecutar sobre una base ya poblada.

No se creó una migración `V6__seed_admin_dev.sql` porque Flyway SQL no es un lugar adecuado para hashear una contraseña con BCrypt de forma portable y segura ni para condicionar limpiamente la creación por variables de entorno. El usuario admin dev queda diferido para una etapa posterior de login local mediante un initializer Java controlado por properties/variables como `AUTH_SEED_ADMIN_ENABLED`, `AUTH_SEED_ADMIN_USERNAME`, `AUTH_SEED_ADMIN_EMAIL` y `AUTH_SEED_ADMIN_PASSWORD`.

## Estructura de permisos

Cada permiso cargado tiene:

| Campo | Descripción |
| --- | --- |
| `codigo` | Identificador estable usado por roles y por los microservicios consumidores. |
| `nombre` | Nombre legible para administración. |
| `descripcion` | Descripción funcional clara del alcance del permiso. |
| `modulo` | Módulo funcional de la aplicación. |
| `recurso` | Recurso funcional protegido. |
| `accion` | Acción descriptiva en texto; no es enum. |
| `activo` | Estado del permiso; los seeds lo cargan en `true`. |

## Permisos creados

### DASHBOARD

- `DASHBOARD_VER_RESUMEN`

### INMUEBLES

- `INMUEBLES_VER_LISTADO`
- `INMUEBLES_VER_DETALLE`
- `INMUEBLES_CREAR`
- `INMUEBLES_EDITAR`
- `INMUEBLES_ACTIVAR_DESACTIVAR`
- `INMUEBLES_EDITAR_SEGUIMIENTO`
- `INMUEBLES_IMPORTAR`
- `INMUEBLES_VER_IMPORTACIONES`
- `INMUEBLES_VER_ERRORES_IMPORTACION`
- `INMUEBLES_VER_HISTORIAL_DEUDA`
- `INMUEBLES_VER_OBSERVACIONES_EXPEDIENTE`

### DEUDA

- `DEUDA_VER_CARGAS`
- `DEUDA_IMPORTAR_CARGA`
- `DEUDA_VER_DETALLE_CARGA`
- `DEUDA_VER_ERRORES_CARGA`

### SEGUIMIENTO

- `SEGUIMIENTO_VER_BANDEJA`
- `SEGUIMIENTO_INICIAR_PROCESO`
- `SEGUIMIENTO_AVANZAR_ETAPA`
- `SEGUIMIENTO_ENVIAR_ETAPA`
- `SEGUIMIENTO_REPETIR_ETAPA`
- `SEGUIMIENTO_PAUSAR_PROCESO`
- `SEGUIMIENTO_REANUDAR_PROCESO`
- `SEGUIMIENTO_CERRAR_PROCESO`
- `SEGUIMIENTO_CERRAR_PROCESOS_MASIVO`
- `SEGUIMIENTO_CREAR_COMPROMISO`
- `SEGUIMIENTO_EDITAR_COMPROMISO`
- `SEGUIMIENTO_CREAR_COMPROMISO_MASIVO`
- `SEGUIMIENTO_VER_COMPROMISO_VIGENTE`
- `SEGUIMIENTO_VER_HISTORIAL_INMUEBLE`
- `SEGUIMIENTO_AGREGAR_OBSERVACION_ETAPA`

### REPORTES

- `REPORTES_VER_MOROSOS_GRUPO_DISTRITO`
- `REPORTES_VER_ESTADO_INMUEBLES`
- `REPORTES_VER_ACCIONES_FECHAS`
- `REPORTES_VER_HISTORIAL_MOVIMIENTOS`
- `REPORTES_VER_PORCENTAJES_MOROSIDAD`
- `REPORTES_VER_ACCIONES_REGULARIZACION`
- `REPORTES_EXPORTAR_EXCEL`
- `REPORTES_EXPORTAR_PDF`

### CONFIGURACION

- `CONFIG_VER_GRUPOS`
- `CONFIG_CREAR_GRUPO`
- `CONFIG_EDITAR_GRUPO`
- `CONFIG_ACTIVAR_DESACTIVAR_GRUPO`
- `CONFIG_ELIMINAR_GRUPO`
- `CONFIG_VER_DISTRITOS`
- `CONFIG_CREAR_DISTRITO`
- `CONFIG_EDITAR_DISTRITO`
- `CONFIG_ACTIVAR_DESACTIVAR_DISTRITO`
- `CONFIG_VER_ETAPAS`
- `CONFIG_CREAR_ETAPA`
- `CONFIG_EDITAR_ETAPA`
- `CONFIG_REORDENAR_ETAPAS`
- `CONFIG_ELIMINAR_ETAPA`
- `CONFIG_VER_MOTIVOS_CIERRE`
- `CONFIG_CREAR_MOTIVO_CIERRE`
- `CONFIG_EDITAR_MOTIVO_CIERRE`
- `CONFIG_ACTIVAR_DESACTIVAR_MOTIVO_CIERRE`
- `CONFIG_ELIMINAR_MOTIVO_CIERRE`
- `CONFIG_VER_PARAMETROS_SEGUIMIENTO`
- `CONFIG_EDITAR_PARAMETROS_SEGUIMIENTO`
- `CONFIG_CALCULAR_IMPACTO_PARAMETROS`
- `CONFIG_VER_GRUPO_DISTRITO`
- `CONFIG_CREAR_GRUPO_DISTRITO`
- `CONFIG_EDITAR_GRUPO_DISTRITO`
- `CONFIG_ELIMINAR_GRUPO_DISTRITO`

### AUDITORIA

- `AUDITORIA_VER_MOVIMIENTOS`

### USUARIOS

- `USUARIOS_VER_LISTADO`
- `USUARIOS_VER_DETALLE`
- `USUARIOS_CREAR`
- `USUARIOS_EDITAR`
- `USUARIOS_ACTIVAR_DESACTIVAR`
- `USUARIOS_ASIGNAR_ROLES`

### ROLES_PERMISOS

- `ROLES_VER_LISTADO`
- `ROLES_VER_DETALLE`
- `ROLES_CREAR`
- `ROLES_EDITAR`
- `ROLES_ACTIVAR_DESACTIVAR`
- `ROLES_ASIGNAR_PERMISOS`
- `PERMISOS_VER_LISTADO`
- `PERMISOS_VER_DETALLE`

### AUTH

- `AUTH_VER_MI_SESION`
- `AUTH_EDITAR_MI_SESION`
- `AUTH_CAMBIAR_MI_PASSWORD`

## Roles creados

| Rol | Nombre | Descripción |
| --- | --- | --- |
| `ADMIN` | Administrador del sistema | Rol con acceso completo a permisos del sistema. |
| `SUPERVISOR` | Supervisor operativo | Rol para supervisar la operación, seguimiento, reportes, auditoría y configuración de lectura. |
| `OPERADOR` | Operador de seguimiento | Rol para ejecutar tareas operativas de seguimiento sin administración ni cierres reservados. |
| `CONSULTA` | Usuario de consulta | Rol de solo lectura para consultar información operativa y reportes sin exportación. |
| `AUDITOR` | Auditor de movimientos y reportes | Rol de solo lectura orientado a auditoría, reportes y exportaciones. |

## Matriz rol-permiso inicial

| Rol | Cantidad | Criterio |
| --- | ---: | --- |
| `ADMIN` | 83 | Todos los permisos. |
| `SUPERVISOR` | 47 | Dashboard, inmuebles operativos, deuda completa, seguimiento completo, reportes con exportación, lectura de configuración, cálculo de impacto y auditoría. |
| `OPERADOR` | 22 | Dashboard, lectura de inmuebles, lectura de deuda y gestión operativa de seguimiento sin cierres, sin operaciones masivas y sin configuración. |
| `CONSULTA` | 19 | Dashboard, lectura de inmuebles, deuda, seguimiento y reportes visibles, sin exportar ni modificar. |
| `AUDITOR` | 22 | Dashboard, lectura operativa, reportes con exportación y auditoría, sin modificar datos. |

Decisiones explícitas:

- El cierre de procesos (`SEGUIMIENTO_CERRAR_PROCESO` y `SEGUIMIENTO_CERRAR_PROCESOS_MASIVO`) queda reservado para `ADMIN` y `SUPERVISOR`.
- `CONSULTA` puede ver reportes, pero no exportarlos.
- `AUDITOR` puede exportar reportes para auditoría, pero no tiene permisos de modificación.
- `OPERADOR` no recibe permisos de reportes porque la matriz actual no le asigna lectura de `REPORTES`; se mantiene enfocado en operación de seguimiento sin cierres, operaciones masivas ni configuración.
- La lectura de configuración para `SUPERVISOR` incluye permisos `CONFIG_VER_*` y `CONFIG_CALCULAR_IMPACTO_PARAMETROS`; no incluye creación, edición, eliminación ni activación/desactivación.

## Admin dev

No se creó usuario admin dev en esta etapa. La tabla `usuarios` queda sin datos creados por seed.

Motivo: no se debe guardar password plano ni hardcodear una contraseña productiva, y una migración SQL no ofrece en este proyecto una forma limpia, portable y segura de calcular BCrypt condicionado por variables de entorno. El admin dev se implementará más adelante, junto con login local, mediante un initializer Java controlado por properties y sin loggear contraseñas.
