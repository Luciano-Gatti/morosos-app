# ETAPA 1 - Modelo de permisos descriptivos

## Alcance

Esta etapa prepara el modelo persistente inicial de `auth-service` para soportar autorización por permisos descriptivos, asociables a endpoints concretos y a acciones funcionales claras.

No se modifica la lógica funcional de `morosos-service`, no se protege ningún endpoint de `morosos-service` y no se integra todavía el frontend.

## Permisos descriptivos

La tabla `permisos` deja de ser un catálogo genérico basado solo en código, descripción y módulo. Cada permiso queda preparado para representar una capacidad funcional concreta, por ejemplo ver un listado, cerrar un proceso, importar una carga o exportar un reporte.

Campos principales del permiso:

- `codigo`: identificador técnico único, por ejemplo `INMUEBLES_VER_LISTADO`.
- `nombre`: nombre legible para pantallas administrativas futuras.
- `descripcion`: explicación funcional clara del alcance del permiso.
- `modulo`: área funcional, por ejemplo `INMUEBLES`, `SEGUIMIENTO`, `REPORTES` o `CONFIGURACION`.
- `recurso`: objeto funcional protegido, por ejemplo `INMUEBLE`, `PROCESO_SEGUIMIENTO`, `ETAPA` o `PERMISO`.
- `accion`: acción soportada por el enum `PermissionAction`.
- `activo`: permite deshabilitar permisos sin eliminarlos físicamente.
- campos de auditoría técnica: `created_at`, `updated_at`, `created_by`, `updated_by`.

Los módulos y recursos se mantienen como texto para no bloquear la evolución del dominio. La acción se modela como enum Java y se persiste como texto con `@Enumerated(EnumType.STRING)`.

## Acciones soportadas

`PermissionAction` soporta acciones CRUD y acciones operativas propias del sistema de seguimiento de morosos:

- `VER`
- `CREAR`
- `EDITAR`
- `ELIMINAR`
- `IMPORTAR`
- `EXPORTAR`
- `INICIAR`
- `AVANZAR`
- `REPETIR`
- `PAUSAR`
- `REANUDAR`
- `CERRAR`
- `OBSERVAR`
- `CONFIGURAR`
- `ADMINISTRAR`
- `EJECUTAR`

## Diferencia entre permiso y endpoint_permiso

Un `Permiso` representa una capacidad funcional reusable asignable a roles. Ejemplos conceptuales futuros:

- `INMUEBLES_VER_LISTADO`
- `SEGUIMIENTO_CERRAR_PROCESO`
- `REPORTES_EXPORTAR_PDF`

Un `EndpointPermiso` representa la asociación entre un endpoint concreto y el permiso requerido para invocarlo:

- `servicio`: microservicio dueño del endpoint, por ejemplo `morosos-service`.
- `metodo_http`: método HTTP como `GET`, `POST`, `PUT` o `DELETE`.
- `path_pattern`: patrón de ruta, por ejemplo `/api/v1/inmuebles`.
- `permiso_id`: permiso funcional requerido.
- `descripcion`: detalle opcional de la asociación.
- `activo`: permite deshabilitar la asociación sin eliminarla.

El modelo conceptual queda preparado así:

```text
Usuario -> Roles -> Permisos
Endpoint -> Permiso requerido
```

El rol conserva su relación con permisos mediante `rol_permisos`. No se vinculan roles directamente contra endpoints.

## Migración Flyway

Se agrega `V1__auth_schema.sql` con las tablas iniciales:

- `permisos`
- `roles`
- `rol_permisos`
- `endpoint_permisos`

La tabla `endpoint_permisos` incluye:

- constraint único sobre `(servicio, metodo_http, path_pattern)`;
- índice por `permiso_id`;
- índice por `servicio`;
- índice por `metodo_http`.

## Fuera de alcance en esta etapa

Esta etapa todavía no crea:

- seeds de roles;
- seeds de permisos;
- seeds de usuario admin;
- registros en `endpoint_permisos`;
- controllers administrativos de permisos;
- lógica de autorización;
- login;
- JWT;
- Google login;
- forgot/reset password;
- envío de correos;
- integración con frontend;
- protección de `morosos-service`.

La carga real de permisos y asociaciones endpoint -> permiso se realizará en una etapa posterior.
