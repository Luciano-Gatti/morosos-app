# ETAPA 1 - Auth service: permisos modulares y descriptivos

## Objetivo

La ETAPA 1 define el modelo persistente de autorización de `auth-service` con permisos funcionales, descriptivos y reutilizables por roles.

No se modifica la lógica funcional de `morosos-service`, no se protege ningún endpoint de `morosos-service` y no se integra todavía el frontend.

## Responsabilidad entre microservicios

`auth-service` administra usuarios, roles y permisos. En etapas posteriores emitirá JWT que incluyan roles y permisos para que cada microservicio consumidor pueda validar el token y exigir permisos en su propio código.

Cada microservicio será responsable de declarar qué permiso requiere cada endpoint mediante `@PreAuthorize`, `SecurityFilterChain` o un mecanismo equivalente. Por esta razón, esta etapa no crea una tabla `endpoint_permisos` ni guarda asociaciones endpoint -> permiso en base de datos.

El modelo conceptual queda preparado así:

```text
Usuario -> Roles -> Permisos
Microservicio -> Endpoint protegido en código -> Permiso requerido
```

## Permisos modulares y descriptivos

`Permiso` representa una capacidad funcional concreta y reusable asignable a roles. Ejemplos conceptuales futuros:

- `INMUEBLES_VER_LISTADO`
- `INMUEBLES_VER_DETALLE`
- `INMUEBLES_CREAR`
- `INMUEBLES_EDITAR`
- `INMUEBLES_ELIMINAR`
- `SEGUIMIENTO_INICIAR_PROCESO`
- `SEGUIMIENTO_AVANZAR_ETAPA`
- `SEGUIMIENTO_CERRAR_PROCESO`
- `REPORTES_EXPORTAR_PDF`

Campos principales del permiso:

- `id`: identificador UUID.
- `codigo`: identificador técnico único, por ejemplo `INMUEBLES_VER_LISTADO`.
- `nombre`: nombre legible para pantallas administrativas futuras, por ejemplo `Ver listado de inmuebles`.
- `descripcion`: explicación funcional clara del alcance del permiso.
- `modulo`: área funcional, por ejemplo `INMUEBLES`, `SEGUIMIENTO`, `REPORTES` o `CONFIGURACION`.
- `recurso`: objeto funcional protegido, por ejemplo `INMUEBLE`, `PROCESO_SEGUIMIENTO`, `REPORTE` o `PERMISO`.
- `accion`: acción funcional en texto, por ejemplo `VER_LISTADO`, `VER_DETALLE`, `CREAR`, `AVANZAR_ETAPA` o `EXPORTAR_PDF`.
- `activo`: permite deshabilitar permisos sin eliminarlos físicamente.
- campos de auditoría técnica: `created_at`, `updated_at`, `created_by`, `updated_by`.

`modulo`, `recurso` y `accion` se mantienen como texto para no bloquear la evolución del dominio ni obligar a desplegar `auth-service` cada vez que un microservicio necesite una acción funcional nueva.

No se vuelve a un enum `PermissionAction`.

## Usuarios, roles y permisos

El rol conserva su relación con permisos mediante `rol_permisos` y la ETAPA 1-B agrega usuarios con roles mediante `usuario_roles`:

```text
usuarios -> usuario_roles -> roles -> rol_permisos -> permisos
```

No se vinculan roles directamente contra endpoints.

El detalle del modelo agregado en ETAPA 1-B está documentado en `docs/auth/01-etapa-1/modelo-usuarios-roles-permisos.md`.

## Migraciones Flyway

Las migraciones actuales son:

- `V1__auth_schema.sql`: crea `permisos`, `roles` y `rol_permisos`.
- `V2__complete_auth_base_schema.sql`: crea `usuarios`, `usuario_roles`, `identidades_externas`, `password_reset_tokens`, `login_attempts` y `audit_log`.

Las migraciones no crean `endpoint_permisos` y no insertan datos iniciales.

## Fuera de alcance en esta etapa

Esta etapa todavía no crea ni implementa:

- seeds de permisos;
- seeds de roles;
- seeds de usuarios;
- usuario admin;
- tabla `endpoint_permisos`;
- asociaciones endpoint -> permiso en base de datos;
- controllers administrativos de permisos;
- protección de `morosos-service`;
- lógica de autorización en otros microservicios;
- login;
- JWT;
- Google login;
- forgot/reset password funcional;
- generación de tokens de recuperación;
- envío de correos;
- integración con frontend.
