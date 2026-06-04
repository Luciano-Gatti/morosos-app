# Auth Changelog

## 2026-06-03 - Correcciones de configuración segura JWT/admin/audience

### Resumen

Se corrigieron los bloqueantes de configuración detectados en la auditoría general sin cambiar reglas funcionales: `morosos-service` ya no tiene fallback usable de `JWT_SECRET` ni perfil default en `application.yml`, el fallback temporal conocido solo queda permitido con perfiles activos `local` o `dev` y se rechaza con `prod` o sin perfiles activos, y `auth-service` deja el admin dev deshabilitado por defecto con password vacía.

### JWT y audience

Se unificó el audience local/test en `gestion-aosc` para que `auth-service` emita el claim estándar `aud` y `morosos-service` valide el mismo valor. HS256 compartido sigue siendo temporal para integración local; producción exige `JWT_SECRET` real por variable/gestor externo y el futuro recomendado sigue siendo RS256/JWKS. No se loggean JWT, tokens ni secrets.

### Restricciones respetadas

No se modificaron permisos funcionales de `morosos-service`, no se desactivó seguridad, no se debilitaron validaciones JWT, no se ejecutó `flyway repair`, no se borraron bases de datos y no se commitearon secretos reales.

## 2026-06-03 - Envío SMTP real para recuperación/restablecimiento de contraseña

### Resumen

Se agregó `spring-boot-starter-mail` y una implementación SMTP real de `PasswordResetEmailService` para el flujo de recuperación/restablecimiento. La configuración se toma de `spring.mail.*` y `app.mail.*` mediante variables de entorno, con `AUTH_MAIL_ENABLED=false` por defecto para local/dev. En local/dev con mail deshabilitado se mantiene el log de URL de reset para pruebas; en producción no se loguea token ni URL completa y, si el mail está habilitado, se valida configuración SMTP mínima al arrancar.

### Auditoría

Se agregan `PASSWORD_RESET_EMAIL_SENT`, `PASSWORD_RESET_EMAIL_FAILED`, `PASSWORD_RESET_FAILED_INVALID_TOKEN` y `PASSWORD_RESET_FAILED_EXPIRED_TOKEN` al flujo, manteniendo eventos seguros sin passwords, tokens planos ni hashes sensibles.

### Restricciones respetadas

No se modificó `morosos-service`, no se cambió la validación JWT, no se implementó Google login, refresh token ni endpoints admin, y no se hardcodearon credenciales SMTP.

## 2026-06-03 - Recuperación/restablecimiento funcional de contraseña

### Resumen

Se implementó el flujo backend real para solicitar recuperación y restablecer contraseñas en `auth-service`, y se conectaron las vistas existentes del frontend. El flujo usa respuesta genérica anti-enumeración, token aleatorio con `SecureRandom`, persistencia por hash SHA-256 Base64 URL-safe en `password_reset_tokens.token_hash`, TTL configurable y revocación lógica vía `used_at` porque el modelo actual no tiene `revoked_at`.

### Archivos principales creados/modificados

- `auth-service/src/main/java/pe/morosos/auth/api/AuthController.java`
- `auth-service/src/main/java/pe/morosos/auth/password/PasswordResetService.java`
- `auth-service/src/main/java/pe/morosos/auth/password/PasswordResetEmailService.java`
- `auth-service/src/main/java/pe/morosos/auth/password/SmtpPasswordResetEmailService.java`
- `auth-service/src/main/java/pe/morosos/auth/password/AppMailProperties.java`
- `auth-service/src/main/java/pe/morosos/auth/dto/ForgotPasswordRequest.java`
- `auth-service/src/main/java/pe/morosos/auth/dto/ResetPasswordRequest.java`
- `auth-service/src/main/java/pe/morosos/auth/dto/PasswordResetResponse.java`
- `auth-service/src/main/java/pe/morosos/auth/exception/PasswordResetException.java`
- `auth-service/src/main/java/pe/morosos/auth/error/GlobalExceptionHandler.java`
- `auth-service/src/main/java/pe/morosos/auth/security/SecurityConfig.java`
- `auth-service/src/main/resources/application.yml`
- `auth-service/src/test/java/pe/morosos/auth/password/PasswordResetFlowIntegrationTest.java`
- `frontend/src/services/api/authService.ts`
- `frontend/src/types/auth.ts`
- `frontend/src/pages/OlvideContrasena.tsx`
- `frontend/src/pages/RestablecerContrasena.tsx`

### Auditoría

Se registran `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_SUCCESS`, `PASSWORD_RESET_FAILED_INVALID_TOKEN`, `PASSWORD_RESET_FAILED_EXPIRED_TOKEN` y `PASSWORD_RESET_FAILED_PASSWORD_POLICY` sin persistir tokens, contraseñas, hashes de contraseña ni headers de autorización.

### Restricciones respetadas

No se modificó `morosos-service`. No se cambió la seguridad JWT existente salvo permitir los dos endpoints públicos nuevos. No se implementó Google login, refresh token ni endpoints admin.

## 2026-06-02 - JWT compartido temporal para integración local

### Resumen

Se alineó el fallback temporal de `JWT_SECRET` de `auth-service` y `morosos-service` para pruebas locales de integración con JWT HS256. La clave local es no productiva, no definitiva, reemplazable por variable de entorno y queda prohibida en `application-prod.yml`.

### Archivos principales modificados

- `auth-service/src/main/resources/application.yml`
- `auth-service/src/main/resources/application-local.yml`
- `auth-service/src/main/resources/application-test.yml`
- `auth-service/src/main/resources/application-prod.yml`
- `morosos-service/src/main/resources/application-local.yml`
- `morosos-service/src/main/resources/application-prod.yml`
- `auth-service/src/main/java/pe/morosos/auth/security/jwt/JwtService.java`
- `morosos-service/README.md`

### Restricciones respetadas

`application.yml` base sigue sin secret usable por default, `application-prod.yml` exige `JWT_SECRET` real por entorno o gestor de secretos, no se loggean secretos ni tokens, no se cambian permisos ni endpoints protegidos, y se mantienen las validaciones de longitud mínima, firma, expiración, issuer, audience y algoritmo HS256. A futuro se recomienda migrar a RS256/JWKS para evitar compartir secretos simétricos.

## 2026-06-01 - Perfil local explícito para fallback JWT

### Resumen

Se quitó `spring.profiles.default=local` de `auth-service` para eliminar la ambigüedad entre perfil default y perfil activo. El fallback conocido de `JWT_SECRET` sigue permitido solo con perfiles activos `local` o `dev`; sin perfil activo, con `prod` activo o fuera de `local`/`dev`, el arranque falla si se usa el fallback conocido o si falta un secreto válido.

### Archivos principales modificados

- `auth-service/src/main/resources/application.yml`
- `auth-service/src/test/java/pe/morosos/auth/security/jwt/JwtServiceTest.java`
- `auth-service/README.md`
- `docs/auth/02-etapa-2/login-local-jwt.md`

### Restricciones respetadas

No se modificó `morosos-service`, no se modificó frontend, no se loggean secretos ni tokens, no se hardcodearon secrets reales, no se debilitó `JwtService`, no se usa `environment.getDefaultProfiles()` para autorizar fallback y producción sigue requiriendo `JWT_SECRET` por variable/gestor de secretos.

## 2026-06-01 - Defaults JWT solo para perfiles local/dev/test

### Resumen

Se configuró un `JWT_SECRET` default no real únicamente en los perfiles `local` y `dev`, y un default de test para evitar que el `ApplicationContext` falle por falta de secret durante pruebas. `application.yml` y `application-prod.yml` siguen sin incluir un secret usable por default, por lo que producción requiere un `JWT_SECRET` real por entorno.

### Archivos principales modificados

- `auth-service/src/main/resources/application-local.yml`
- `auth-service/src/main/resources/application-dev.yml`
- `auth-service/src/main/resources/application-test.yml`
- `auth-service/README.md`
- `docs/auth/02-etapa-2/login-local-jwt.md`

### Restricciones respetadas

No se modificó `morosos-service`, no se modificó frontend, no se loggean secretos ni tokens, no se hardcodearon secrets reales, no se debilitó `JwtService` y producción sigue rechazando `JWT_SECRET` vacío o el fallback conocido de desarrollo.

## 2026-06-01 - Tests de auth-service con PostgreSQL/Testcontainers

### Resumen

Se corrigió la configuración de tests de `auth-service` para dejar de usar H2 y ejecutar los tests de integración contra PostgreSQL real mediante Testcontainers. El perfil `test` mantiene Flyway habilitado y `ddl-auto=validate`; el datasource se inyecta desde `PostgresIntegrationTest` con `@DynamicPropertySource`, permitiendo validar las migraciones `V1` a `V5` contra PostgreSQL.

### Archivos principales creados/modificados

- `auth-service/pom.xml`
- `auth-service/src/main/resources/application-test.yml`
- `auth-service/src/test/java/pe/morosos/auth/PostgresIntegrationTest.java`
- `auth-service/src/test/java/pe/morosos/auth/AuthServiceApplicationTests.java`
- `auth-service/README.md`
- `docs/auth/02-etapa-2/login-local-jwt.md`

### Restricciones respetadas

No se modificó `morosos-service`, no se modificó frontend, no se cambió la lógica funcional de login/JWT, no se desactivó Flyway globalmente, no se eliminaron migraciones, no se adaptaron migraciones productivas a H2 y no se documentó H2 como alternativa de tests.

## 2026-05-29 - ETAPA 2 - Login local con BCrypt y JWT

### Resumen

Se implementó autenticación local real en `auth-service`: admin dev opcional por initializer Java, validación BCrypt, emisión de JWT HS256 con Nimbus JOSE JWT, endpoints `POST /api/v1/auth/login`, `GET /api/v1/auth/me` y `POST /api/v1/auth/logout`, registro de intentos de login y auditoría básica de login/logout.

### Archivos principales creados/modificados

- `auth-service/pom.xml`
- `auth-service/src/main/java/pe/morosos/auth/api/AuthController.java`
- `auth-service/src/main/java/pe/morosos/auth/dto/*.java`
- `auth-service/src/main/java/pe/morosos/auth/security/**/*.java`
- `auth-service/src/main/java/pe/morosos/auth/service/*.java`
- `auth-service/src/main/java/pe/morosos/auth/seed/*.java`
- `auth-service/src/main/resources/application.yml`
- `auth-service/README.md`
- `docs/auth/02-etapa-2/login-local-jwt.md`

### Restricciones respetadas

No se implementó Google login, forgot/reset password funcional, envío de correos, conexión con frontend, protección de `morosos-service`, `endpoint_permisos`, asociaciones endpoint-permiso en base de datos ni endpoints administrativos.

# Changelog Auth Service

## 2026-05-29 - ETAPA 1-C - Correcciones de auditoría de seeds

### Resumen

Se corrigió el riesgo de casteo de UUID en `V5__seed_role_permissions.sql`, se agregaron permisos faltantes para los reportes de porcentajes de morosidad y acciones de regularización, y se actualizaron conteos/documentación de seeds. Los conteos finales son 83 permisos, 5 roles y 193 asignaciones rol-permiso. `OPERADOR` no recibe permisos de reportes porque la matriz vigente no le asigna lectura del módulo `REPORTES`.

### Restricciones respetadas

No se creó `endpoint_permisos`, no se asociaron endpoints a permisos en base de datos, no se implementó login, JWT, Google login, forgot/reset password funcional, generación de tokens, envío de correos, integración con frontend ni protección de `morosos-service`.

## 2026-05-29 - ETAPA 1-C - Seeds controlados de roles y permisos

### Resumen

Se agregaron seeds idempotentes para permisos descriptivos y modulares, roles base y matriz inicial rol-permiso (actualizados a 83 permisos, 5 roles y 193 asignaciones tras las correcciones de auditoría). No se creó usuario admin dev porque no hay hashing BCrypt seguro y portable desde migraciones SQL; queda diferido para un initializer Java controlado por properties en la etapa de login local.

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

En ETAPA 1-B no se agregaron seeds; a partir de ETAPA 1-C sí existen seeds idempotentes de roles, permisos y `rol_permisos`. No se creó `endpoint_permisos`, no se creó `EndpointPermiso`, no se implementó login, JWT, Google login, forgot/reset password funcional, generación de tokens, envío de correos, integración con frontend ni protección de `morosos-service`.

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

En ETAPA 1 no se agregaron seeds; a partir de ETAPA 1-C sí existen seeds idempotentes de roles, permisos y `rol_permisos`. No se creó `endpoint_permisos`, no se asociaron endpoints a permisos en base de datos, no se crearon controllers administrativos, no se implementó login, JWT, Google login, reset de contraseña, envío de correos, integración con frontend ni protección de `morosos-service`.

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

## 2026-06-03 - Registro controlado, Google y administración de usuarios

- Se agrega registro público local en `POST /api/v1/auth/register`; el alta queda en `PENDIENTE_APROBACION`, sin JWT, roles ni permisos.
- Se agrega autenticación/registro con Google en `POST /api/v1/auth/google`; el backend verifica el ID token contra el `GOOGLE_CLIENT_ID` configurado, exige email verificado y no asigna acceso funcional automáticamente.
- Se agrega `estado` de usuario (`PENDIENTE_APROBACION`, `ACTIVO`, `INACTIVO`, `RECHAZADO`) manteniendo `activo` para compatibilidad.
- Se agrega `usuario_permisos` para permisos directos activos. Los permisos efectivos son la unión sin duplicados de permisos por roles activos y permisos directos activos.
- Se agregan endpoints administrativos bajo `/api/v1/admin/users`, `/api/v1/admin/roles` y `/api/v1/admin/permissions` protegidos con `@PreAuthorize(hasAuthority(...))`.
- Se agregan permisos administrativos de usuarios, roles y permisos; `ADMIN` recibe todos y `SUPERVISOR` solo permisos de lectura.
- Se auditan eventos de registro pendiente, vinculación/login Google y cambios administrativos sin registrar passwords, ID tokens, JWT ni hashes.
