# auth-service

`auth-service` es el microservicio Spring Boot independiente reservado para la autenticación y autorización de usuarios internos del Sistema de Seguimiento de Morosos.

## Estado de esta etapa

La base técnica de **ETAPA 0** se mantiene y la **ETAPA 1-C** agrega seeds controlados sobre el modelo persistente base para usuarios, roles, permisos, identidades externas, recuperación de contraseña, intentos de login y auditoría técnica.

Esta etapa incluye:

- arranque Spring Boot independiente;
- configuración base por perfiles;
- endpoint técnico de health propio;
- actuator `health` e `info`;
- manejo uniforme de errores;
- propagación de `X-Request-Id` como `traceId`;
- CORS configurable;
- seguridad base sin login real;
- Swagger/OpenAPI básico;
- JPA, PostgreSQL y Flyway;
- permisos modulares y descriptivos por módulo, recurso y acción;
- roles vinculados a permisos mediante `rol_permisos`;
- usuarios vinculados a roles mediante `usuario_roles`;
- estructura persistente para identidades externas;
- estructura persistente para tokens de recuperación de contraseña;
- estructura persistente para intentos de login;
- estructura persistente para auditoría técnica;
- seeds idempotentes de permisos, roles y matriz rol-permiso.

## Puerto

El puerto por defecto es `8080`.

Puede cambiarse con la variable:

```bash
AUTH_SERVICE_PORT=8081
```

## Compilar

```bash
mvn clean compile
```

## Ejecutar

```bash
mvn spring-boot:run
```

## Health checks

Endpoint técnico del microservicio:

```http
GET http://localhost:8080/api/v1/auth-service/health
```

Respuesta esperada:

```json
{
  "service": "auth-service",
  "status": "UP"
}
```

Actuator:

```http
GET http://localhost:8080/actuator/health
GET http://localhost:8080/actuator/info
```

## Swagger/OpenAPI

- Swagger UI: `http://localhost:8080/swagger-ui`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Variables de entorno iniciales

| Variable | Default | Uso |
| --- | --- | --- |
| `AUTH_SERVICE_PORT` | `8080` | Puerto HTTP del servicio. |
| `AUTH_DB_URL` | `jdbc:postgresql://localhost:5432/auth_db` | URL JDBC de PostgreSQL para `auth-service`. |
| `AUTH_DB_USERNAME` | `postgres` | Usuario de base de datos. |
| `AUTH_DB_PASSWORD` | `postgres` | Password de base de datos. |
| `FRONTEND_URL` | `http://localhost:5173` | Origen principal permitido para CORS. |

En local también se permite `http://127.0.0.1:5173`.

## Seguridad en ETAPA 1-B

La configuración base usa sesiones stateless, CSRF deshabilitado para API y CORS habilitado. Se permiten públicamente health, actuator health/info, Swagger/OpenAPI y solicitudes `OPTIONS`. Cualquier otro endpoint se bloquea con `denyAll` porque todavía no existen endpoints privados reales ni mecanismo de autenticación.

La etapa deja preparado el modelo `Usuario -> Roles -> Permisos`. Cada microservicio declarará en su propio código qué permiso requiere cada endpoint, pero todavía no se implementa validación de autorización, login ni JWT.

## Modelo persistente

Las migraciones Flyway actuales son:

- `V1__auth_schema.sql`: crea `permisos`, `roles` y `rol_permisos`.
- `V2__complete_auth_base_schema.sql`: crea `usuarios`, `usuario_roles`, `identidades_externas`, `password_reset_tokens`, `login_attempts` y `audit_log`.
- `V3__seed_permissions.sql`: carga 83 permisos descriptivos y modulares.
- `V4__seed_roles.sql`: carga roles base (`ADMIN`, `SUPERVISOR`, `OPERADOR`, `CONSULTA`, `AUDITOR`).
- `V5__seed_role_permissions.sql`: carga 193 asignaciones iniciales rol-permiso.

Conteos actuales de seeds: 83 permisos, 5 roles, 193 asignaciones rol-permiso y 0 usuarios creados por seed.

### Usuarios, roles y permisos

El modelo principal es:

```text
usuarios -> usuario_roles -> roles -> rol_permisos -> permisos
```

`Permiso` representa una capacidad funcional asignable a roles y reusable por los microservicios. Incluye `id`, `codigo`, `nombre`, `descripcion`, `modulo`, `recurso`, `accion`, `activo` y auditoría técnica (`created_at`, `updated_at`, `created_by`, `updated_by`).

`modulo`, `recurso` y `accion` se modelan como texto para permitir permisos descriptivos como `VER_LISTADO`, `VER_DETALLE`, `AVANZAR_ETAPA` o `EXPORTAR_PDF` sin cambiar código Java por cada acción nueva.

Diferencia de responsabilidades:

```text
auth-service: Usuario -> Roles -> Permisos
microservicio consumidor: endpoint protegido en código -> permiso requerido
```

Los roles siguen vinculándose a permisos por `rol_permisos`. Los usuarios se vinculan a roles por `usuario_roles`. No se vinculan roles directamente a endpoints y no existe tabla `endpoint_permisos`.

### Estructuras preparadas pero no funcionales

La etapa deja tablas y entidades para:

- `identidades_externas`: vinculación futura de providers externos, inicialmente con enum `GOOGLE` disponible en el modelo Java, sin implementar Google login.
- `password_reset_tokens`: almacenamiento futuro de hashes de tokens de recuperación, sin generar tokens ni implementar forgot/reset password.
- `login_attempts`: auditoría futura de intentos de login, sin implementar login.
- `audit_log`: bitácora técnica genérica con `old_values` y `new_values` en `JSONB`, sin servicio funcional de auditoría todavía.

## Repositories JPA

La etapa incluye repositories JPA para `Usuario`, `Rol`, `Permiso`, `RolPermiso`, `UsuarioRol`, `IdentidadExterna`, `PasswordResetToken`, `LoginAttempt` y `AuditLog`.

## Seeds de ETAPA 1-C

Los seeds de ETAPA 1-C cargan permisos con `codigo`, `nombre`, `descripcion`, `modulo`, `recurso`, `accion` y `activo`, junto con roles base y asignaciones iniciales. Las migraciones son idempotentes mediante `ON CONFLICT DO NOTHING`.

No se crea usuario admin dev en SQL porque no hay una forma limpia y segura de generar BCrypt condicionado por variables de entorno desde las migraciones. Ese usuario queda diferido para un initializer Java de la etapa de login local.

La documentación detallada está en `docs/auth/01-etapa-1/seeds-roles-permisos.md`.

## No implementado todavía

Esta etapa **no** implementa:

- login;
- JWT;
- Google login;
- recuperación o reseteo funcional de contraseña;
- generación de tokens de recuperación;
- envío de correos;
- endpoints administrativos de usuarios, roles o permisos;
- seeds de usuarios;
- seed de usuario admin;
- tabla `endpoint_permisos`;
- asociaciones endpoint -> permiso en base de datos;
- integración con frontend;
- protección de `morosos-service`.
