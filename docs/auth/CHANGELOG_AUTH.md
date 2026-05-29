# Changelog Auth Service

## 2026-05-29 - ETAPA 1-C - Seeds controlados de roles y permisos

### Resumen

Se agregaron seeds idempotentes para permisos descriptivos y modulares, roles base y matriz inicial rol-permiso. No se creó usuario admin dev porque no hay hashing BCrypt seguro y portable desde migraciones SQL; queda diferido para un initializer Java controlado por properties en la etapa de login local.

### Archivos principales creados/modificados

- `auth-service/src/main/resources/db/migration/V3__seed_permissions.sql`
- `auth-service/src/main/resources/db/migration/V4__seed_roles.sql`
- `auth-service/src/main/resources/db/migration/V5__seed_role_permissions.sql`
- `auth-service/README.md`
- `docs/auth/01-etapa-1/seeds-roles-permisos.md`

### Restricciones respetadas

No se creó `endpoint_permisos`, no se asociaron endpoints a permisos en base de datos, no se implementó login, JWT, Google login, forgot/reset password funcional, generación de tokens, envío de correos, integración con frontend ni protección de `morosos-service`.

## 2026-05-28 - ETAPA 1-B - Modelo base de usuarios, relaciones, recuperación y auditoría

### Resumen

Se completó el modelo persistente base de `auth-service` manteniendo la estrategia `Usuario -> Roles -> Permisos`. Se agregó una migración incremental para usuarios, relación usuario-rol, identidades externas, tokens de recuperación de contraseña, intentos de login y auditoría técnica, junto con entidades y repositories JPA.

### Archivos principales creados/modificados

- `auth-service/src/main/resources/db/migration/V2__complete_auth_base_schema.sql`
- `auth-service/src/main/java/pe/morosos/auth/user/entity/Usuario.java`
- `auth-service/src/main/java/pe/morosos/auth/user/entity/UsuarioRol.java`
- `auth-service/src/main/java/pe/morosos/auth/identity/entity/IdentidadExterna.java`
- `auth-service/src/main/java/pe/morosos/auth/password/entity/PasswordResetToken.java`
- `auth-service/src/main/java/pe/morosos/auth/audit/entity/LoginAttempt.java`
- `auth-service/src/main/java/pe/morosos/auth/audit/entity/AuditLog.java`
- `auth-service/src/main/java/pe/morosos/auth/**/repository/*.java`
- `auth-service/README.md`
- `docs/auth/01-etapa-1/auth-service-permisos-descriptivos.md`
- `docs/auth/01-etapa-1/modelo-usuarios-roles-permisos.md`

### Restricciones respetadas

No se agregaron seeds, no se creó `endpoint_permisos`, no se creó `EndpointPermiso`, no se implementó login, JWT, Google login, forgot/reset password funcional, generación de tokens, envío de correos, integración con frontend ni protección de `morosos-service`.

## 2026-05-28 - ETAPA 1 - Permisos modulares y descriptivos

### Resumen

Se ajustó `auth-service` para preparar el modelo persistente de autorización con permisos modulares y descriptivos por módulo, recurso y acción, sin almacenar asociaciones endpoint -> permiso. Cada microservicio declarará en su propio código qué permiso requiere cada endpoint y `auth-service` quedará enfocado en administrar usuarios, roles y permisos.

### Archivos principales creados/modificados

- `auth-service/src/main/java/pe/morosos/auth/permission/entity/Permiso.java`
- `auth-service/src/main/java/pe/morosos/auth/role/entity/Rol.java`
- `auth-service/src/main/java/pe/morosos/auth/role/entity/RolPermiso.java`
- `auth-service/src/main/resources/db/migration/V1__auth_schema.sql`
- `auth-service/README.md`
- `docs/auth/01-etapa-1/auth-service-permisos-descriptivos.md`

### Restricciones respetadas

No se agregaron seeds, no se creó `endpoint_permisos`, no se asociaron endpoints a permisos en base de datos, no se crearon controllers administrativos, no se implementó login, JWT, Google login, reset de contraseña, envío de correos, integración con frontend ni protección de `morosos-service`.

## 2026-05-28 - ETAPA 0 - Base técnica

### Resumen

Se creó `auth-service` como proyecto Maven Spring Boot independiente para alojar la base técnica del futuro microservicio de autenticación y autorización, sin implementar login, JWT, Google login, reset de contraseña, usuarios, roles, permisos ni persistencia.

### Archivos principales creados

- `auth-service/pom.xml`
- `auth-service/README.md`
- `auth-service/src/main/java/pe/morosos/auth/AuthServiceApplication.java`
- `auth-service/src/main/java/pe/morosos/auth/common/HttpHeadersConstants.java`
- `auth-service/src/main/java/pe/morosos/auth/config/CorsConfig.java`
- `auth-service/src/main/java/pe/morosos/auth/config/CorsProperties.java`
- `auth-service/src/main/java/pe/morosos/auth/config/OpenApiConfig.java`
- `auth-service/src/main/java/pe/morosos/auth/error/ErrorResponse.java`
- `auth-service/src/main/java/pe/morosos/auth/error/GlobalExceptionHandler.java`
- `auth-service/src/main/java/pe/morosos/auth/health/HealthController.java`
- `auth-service/src/main/java/pe/morosos/auth/health/HealthResponse.java`
- `auth-service/src/main/java/pe/morosos/auth/observability/RequestTraceFilter.java`
- `auth-service/src/main/java/pe/morosos/auth/security/SecurityConfig.java`
- `auth-service/src/main/resources/application.yml`
- `auth-service/src/main/resources/application-local.yml`
- `auth-service/src/main/resources/application-dev.yml`
- `auth-service/src/main/resources/application-test.yml`
- `auth-service/src/main/resources/application-prod.yml`
- `docs/auth/00-etapa-0/auth-service-base.md`
