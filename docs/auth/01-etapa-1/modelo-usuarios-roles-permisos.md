# ETAPA 1-B - Modelo usuarios, roles, permisos, recuperación y auditoría

## Objetivo

La ETAPA 1-B completa el modelo persistente base de `auth-service` sin implementar todavía flujos funcionales de autenticación o autorización.

El enfoque de autorización se mantiene como:

```text
Usuario -> Roles -> Permisos
```

`auth-service` administra usuarios, roles y permisos. En una etapa posterior emitirá JWT con roles y permisos. Cada microservicio consumidor declarará en su propio código qué permiso exige cada endpoint.

## Migraciones Flyway

Las migraciones actuales de `auth-service` son:

- `V1__auth_schema.sql`: crea `permisos`, `roles` y `rol_permisos`.
- `V2__complete_auth_base_schema.sql`: agrega el modelo base faltante de usuarios, relaciones, recuperación, intentos de login y auditoría.

`V1__auth_schema.sql` no se modifica en esta etapa por tratarse del esquema inicial ya existente.

## Tablas actuales

### `permisos`

Tabla de capacidades funcionales reutilizables por roles. Mantiene permisos modulares y descriptivos con:

- `codigo`;
- `nombre`;
- `descripcion`;
- `modulo`;
- `recurso`;
- `accion` como texto;
- `activo`;
- campos técnicos de auditoría.

`accion` se mantiene como `String` para no acoplar el modelo a un enum Java ni obligar a redesplegar `auth-service` cada vez que un microservicio necesite una acción funcional nueva.

### `roles`

Tabla de roles administrados por `auth-service`. Los roles agrupan permisos mediante `rol_permisos`.

### `rol_permisos`

Tabla de relación entre roles y permisos.

Restricción principal:

- `UNIQUE (rol_id, permiso_id)`.

### `usuarios`

Tabla base de usuarios internos.

Campos principales:

- `username` único case-insensitive mediante índice funcional `lower(username)`;
- `email` único case-insensitive mediante índice funcional `lower(email)`;
- `password_hash` nullable para permitir usuarios con identidad externa en una etapa futura;
- `nombre` y `apellido`;
- `activo`;
- `email_verificado`;
- `provider_principal`;
- `created_at`, `updated_at`, `created_by`, `updated_by`.

No se insertan usuarios en esta etapa.

### `usuario_roles`

Tabla explícita de relación entre usuarios y roles.

Restricción principal:

- `UNIQUE (usuario_id, rol_id)`.

No se insertan relaciones en esta etapa.

### `identidades_externas`

Tabla preparada para vincular identidades externas a usuarios.

Restricciones principales:

- `UNIQUE (provider, provider_subject)`;
- `UNIQUE (usuario_id, provider)`.

La estructura queda lista para un provider como Google, pero Google login no está implementado todavía.

### `password_reset_tokens`

Tabla preparada para recuperación de contraseña.

Características:

- almacena `token_hash`, no token plano;
- define `expires_at` y `used_at`;
- vincula cada token con un usuario.

Forgot/reset password funcional no está implementado todavía y esta etapa no genera tokens.

### `login_attempts`

Tabla preparada para auditoría futura de intentos de login.

Permite registrar:

- usuario vinculado opcionalmente;
- username/email usado;
- resultado;
- IP;
- user-agent;
- fecha de creación.

Login funcional no está implementado todavía.

### `audit_log`

Tabla genérica de auditoría técnica.

Permite registrar:

- tipo e id de entidad;
- acción;
- actor textual;
- trace id;
- path de request;
- valores anteriores y nuevos en `JSONB`;
- fecha de creación.

No se implementa todavía un servicio funcional de auditoría.

## Entidades Java actuales

La etapa incluye las siguientes entidades JPA:

- `pe.morosos.auth.permission.entity.Permiso`;
- `pe.morosos.auth.role.entity.Rol`;
- `pe.morosos.auth.role.entity.RolPermiso`;
- `pe.morosos.auth.user.entity.Usuario`;
- `pe.morosos.auth.user.entity.UsuarioRol`;
- `pe.morosos.auth.identity.entity.IdentidadExterna`;
- `pe.morosos.auth.password.entity.PasswordResetToken`;
- `pe.morosos.auth.audit.entity.LoginAttempt`;
- `pe.morosos.auth.audit.entity.AuditLog`.

Relaciones modeladas:

- `RolPermiso` tiene `ManyToOne` hacia `Rol` y `Permiso`.
- `UsuarioRol` tiene `ManyToOne` hacia `Usuario` y `Rol`.
- `IdentidadExterna` tiene `ManyToOne` hacia `Usuario`.
- `PasswordResetToken` tiene `ManyToOne` hacia `Usuario`.
- `LoginAttempt` tiene `ManyToOne` nullable hacia `Usuario`.
- `AuditLog` no tiene relación obligatoria con `Usuario`; `actorId` se conserva como texto.

## Enums mínimos

Se agregan enums mínimos de modelo:

- `ExternalProvider` con `GOOGLE`.
- `LoginAttemptResult` con `SUCCESS`, `INVALID_CREDENTIALS`, `USER_DISABLED` y `ERROR`.

Estos enums solo tipan el modelo persistente Java. No implican implementación de Google login ni login funcional.

## Repositories JPA actuales

La etapa incluye repositories para:

- `UsuarioRepository`;
- `RolRepository`;
- `PermisoRepository`;
- `RolPermisoRepository`;
- `UsuarioRolRepository`;
- `IdentidadExternaRepository`;
- `PasswordResetTokenRepository`;
- `LoginAttemptRepository`;
- `AuditLogRepository`.

Los repositories exponen búsquedas y validaciones básicas por códigos, username/email case-insensitive, existencia de relaciones y token hash.

## Restricciones respetadas

Esta etapa no crea ni implementa:

- seeds de usuarios;
- seeds de roles;
- seeds de permisos;
- seed de usuario admin;
- inserts demo;
- tabla `endpoint_permisos`;
- entidad `EndpointPermiso`;
- repository `EndpointPermisoRepository`;
- asociaciones endpoint -> permiso en base de datos;
- controllers;
- servicios funcionales;
- login;
- JWT;
- Google login;
- forgot/reset password funcional;
- generación de tokens;
- envío de correos;
- conexión con frontend;
- protección de `morosos-service`.
