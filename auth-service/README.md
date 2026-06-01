# auth-service

`auth-service` es el microservicio Spring Boot independiente para la autenticación y autorización de usuarios internos del Sistema de Seguimiento de Morosos.

## Estado actual

La base técnica de **ETAPA 0**, el modelo y seeds de **ETAPA 1-C**, y el login local con JWT de **ETAPA 2** están implementados en este servicio.

Implementado actualmente:

- arranque Spring Boot independiente;
- configuración base por perfiles;
- endpoint técnico de health propio;
- actuator `health` e `info`;
- manejo uniforme de errores;
- propagación de `X-Request-Id` como `traceId`;
- CORS configurable;
- Swagger/OpenAPI básico;
- JPA, PostgreSQL y Flyway;
- modelo persistente `usuarios -> usuario_roles -> roles -> rol_permisos -> permisos`;
- seeds idempotentes de permisos, roles y matriz rol-permiso;
- login local en `POST /api/v1/auth/login`;
- validación de password con BCrypt;
- admin dev initializer controlado por properties;
- JWT firmado con HS256 mediante Nimbus JOSE JWT;
- endpoint autenticado `GET /api/v1/auth/me`;
- logout stateless en `POST /api/v1/auth/logout`;
- registro funcional de intentos de login en `login_attempts`;
- auditoría funcional básica en `audit_log` para login y logout.

No implementado todavía:

- Google login;
- forgot/reset password funcional;
- envío de correos;
- integración con frontend;
- protección de `morosos-service`;
- refresh token;
- blacklist de access tokens;
- endpoints administrativos;
- tabla `endpoint_permisos`;
- asociación endpoint-permiso en base de datos.

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

## Tests

```bash
mvn test
```

Los tests de integración de `auth-service` usan PostgreSQL real mediante Testcontainers. El perfil `test` no configura datasource propio: la URL, usuario, password y driver JDBC se registran dinámicamente desde el contenedor PostgreSQL de los tests. Flyway permanece habilitado y Hibernate valida el esquema con `ddl-auto=validate`, por lo que las migraciones `V1` a `V5` se aplican y se validan contra PostgreSQL real.

No se usa H2 en los tests porque las migraciones del servicio son específicas de PostgreSQL, incluyendo índices funcionales sobre `lower(...)`, columnas `jsonb`, UUID, casts a UUID y sentencias `ON CONFLICT`.

## Ejecutar

No se usa `spring.profiles.default=local`. Para desarrollo local, el perfil `local` debe activarse explícitamente; ejecutar sin perfil activo no habilita el fallback de `JWT_SECRET`.

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

## Ejecución local

Para desarrollo local, activar explícitamente el perfil `local` permite usar el `JWT_SECRET` default de desarrollo definido en `application-local.yml` cuando no se configura la variable de entorno. Ese valor no es un secreto real, solo existe para facilitar el arranque local y tiene más de 32 caracteres para cumplir HS256. Si se define `JWT_SECRET`, Spring usa esa variable por encima del default del perfil.

PowerShell con default local de desarrollo:

```powershell
$env:SPRING_PROFILES_ACTIVE="local"
mvn spring-boot:run
```

PowerShell con `JWT_SECRET` manual:

```powershell
$env:SPRING_PROFILES_ACTIVE="local"
$env:JWT_SECRET="mi_clave_local_segura_distinta_de_32_caracteres_123"
mvn spring-boot:run
```

NetBeans/Maven:

- Maven goal: `spring-boot:run`
- Opción recomendada: `spring-boot:run -Dspring-boot.run.profiles=local`
- Con secret manual, se puede pasar: `-Dspring-boot.run.arguments="--app.jwt.secret=mi_clave_local_segura_distinta_de_32_caracteres_123"`

Reglas de seguridad:

- No commitear secrets reales en YAML ni en documentación.
- En producción `JWT_SECRET` es obligatorio y debe venir de una variable/gestor de secretos.
- El fallback conocido de desarrollo solo se permite con perfiles activos `local` o `dev`; no se permite en `prod` ni sin perfil activo `local`/`dev`.
- Los defaults `local`, `dev` y `test` son solo de desarrollo/pruebas y no deben usarse en producción.
- No se loggea `JWT_SECRET` ni tokens.

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

## Variables de entorno

| Variable | Default | Uso |
| --- | --- | --- |
| `AUTH_SERVICE_PORT` | `8080` | Puerto HTTP del servicio. |
| `AUTH_DB_URL` | `jdbc:postgresql://localhost:5432/auth_db` | URL JDBC de PostgreSQL para `auth-service`. |
| `AUTH_DB_USERNAME` | `postgres` | Usuario de base de datos. |
| `AUTH_DB_PASSWORD` | `postgres` | Password de base de datos. |
| `FRONTEND_URL` | `http://localhost:5173` | Origen principal permitido para CORS. |
| `JWT_ISSUER` | `http://localhost:8080` | Claim `iss` esperado y emitido. |
| `JWT_AUDIENCE` | sin default en base; `morosos-app` en `test` | Claim `aud` esperado y emitido. Debe configurarse por entorno fuera de tests. |
| `JWT_ACCESS_TOKEN_MINUTES` | `15` | Duración del access token en minutos. |
| `JWT_SECRET` | vacío en base/prod; default no real en `local`, `dev` y `test` | Secreto HS256. Debe tener al menos 32 bytes. En `application.yml` y `prod` no hay secret usable por default; con perfiles `local`/`dev` se usa un default de desarrollo solo si no se define la variable. En `prod` o sin perfiles activos debe configurarse explícitamente y no puede ser el fallback conocido. |
| `AUTH_SEED_ADMIN_ENABLED` | `false` | Habilita creación/verificación del admin dev. |
| `AUTH_SEED_ADMIN_USERNAME` | `admin` | Username del admin dev. |
| `AUTH_SEED_ADMIN_EMAIL` | `admin@local.test` | Email del admin dev. |
| `AUTH_SEED_ADMIN_PASSWORD` | vacío | Password inicial; si está vacío, no se crea el usuario. |
| `AUTH_SEED_ADMIN_NOMBRE` | `Administrador` | Nombre del admin dev. |
| `AUTH_SEED_ADMIN_APELLIDO` | `Local` | Apellido del admin dev. |

En local también se permite `http://127.0.0.1:5173` para CORS.

Nunca se loggea el secreto JWT, passwords, hashes ni tokens.

## Modelo persistente

Las migraciones Flyway actuales son:

- `V1__auth_schema.sql`: crea `permisos`, `roles` y `rol_permisos`.
- `V2__complete_auth_base_schema.sql`: crea `usuarios`, `usuario_roles`, `identidades_externas`, `password_reset_tokens`, `login_attempts` y `audit_log`.
- `V3__seed_permissions.sql`: carga 83 permisos descriptivos y modulares.
- `V4__seed_roles.sql`: carga roles base (`ADMIN`, `SUPERVISOR`, `OPERADOR`, `CONSULTA`, `AUDITOR`).
- `V5__seed_role_permissions.sql`: carga 193 asignaciones iniciales rol-permiso.

Conteos actuales de seeds: 83 permisos, 5 roles, 193 asignaciones rol-permiso y 0 usuarios creados por seed SQL.

### Usuarios, roles y permisos

El modelo principal es:

```text
usuarios -> usuario_roles -> roles -> rol_permisos -> permisos
```

`Permiso` representa una capacidad funcional asignable a roles y reusable por los microservicios. Incluye `id`, `codigo`, `nombre`, `descripcion`, `modulo`, `recurso`, `accion`, `activo` y auditoría técnica (`created_at`, `updated_at`, `created_by`, `updated_by`).

Diferencia de responsabilidades:

```text
auth-service: Usuario -> Roles -> Permisos
microservicio consumidor: endpoint protegido en código -> permiso requerido
```

Los roles siguen vinculándose a permisos por `rol_permisos`. Los usuarios se vinculan a roles por `usuario_roles`. No se vinculan roles directamente a endpoints y no existe tabla `endpoint_permisos`.

### Decisión de authorities

Las authorities reales de Spring Security se construyen desde `permissions`, no desde `roles`.

Los endpoints de microservicios deben protegerse con permisos específicos, por ejemplo:

```java
@PreAuthorize("hasAuthority('INMUEBLES_VER_LISTADO')")
@PreAuthorize("hasAuthority('SEGUIMIENTO_CERRAR_PROCESO')")
@PreAuthorize("hasAuthority('REPORTES_EXPORTAR_PDF')")
```

No se agregan authorities `ROLE_ADMIN`, `ROLE_OPERADOR`, etc. en esta etapa, y no se debe depender de `hasRole()` para autorización directa de endpoints. Los roles permanecen en base de datos, en el JWT y en `/me` como agrupadores administrativos de permisos e información útil para UI/administración.

### Estructuras preparadas pero no funcionales

La etapa mantiene tablas y entidades para funcionalidades futuras:

- `identidades_externas`: vinculación futura de providers externos, inicialmente con enum `GOOGLE` disponible en el modelo Java, sin implementar Google login.
- `password_reset_tokens`: almacenamiento futuro de hashes de tokens de recuperación, sin generar tokens ni implementar forgot/reset password.

## Seguridad y JWT

La configuración usa sesiones stateless, CSRF deshabilitado para API y CORS habilitado.

Públicos:

- `POST /api/v1/auth/login`;
- `GET /api/v1/auth-service/health`;
- `GET /actuator/health`;
- `GET /actuator/info`;
- `GET /v3/api-docs/**`;
- `GET /swagger-ui/**`;
- `GET /swagger-ui.html`;
- `OPTIONS /**`.

Protegidos:

- `GET /api/v1/auth/me`;
- `POST /api/v1/auth/logout`.

El JWT incluye `sub`, `userId`, `username`, `email`, `roles`, `permissions`, `iss`, `aud`, `iat`, `exp`, `jti` y `authProvider=LOCAL`. No incluye password hash, tokens de reset ni información sensible.

Al validar JWT se exige explícitamente `alg=HS256`; no se aceptan `none`, `HS384`, `HS512` ni otros algoritmos. El filtro JWT no sobrescribe el `SecurityContext` cuando ya existe una autenticación previa.

## Admin dev initializer

El initializer Java solo actúa si `AUTH_SEED_ADMIN_ENABLED=true`.

Reglas principales:

1. Si está deshabilitado, no hace nada.
2. Si el password está vacío, no crea usuario y emite una advertencia segura.
3. Si ya existe usuario por username o email, no duplica.
4. Si crea usuario nuevo, lo crea activo y con email verificado.
5. Guarda `passwordHash` con BCrypt.
6. Asigna el rol `ADMIN` existente.
7. No crea roles ni permisos; deben venir por Flyway.

Ejemplo local:

```bash
AUTH_SEED_ADMIN_ENABLED=true \
AUTH_SEED_ADMIN_PASSWORD=unaClaveSeguraLocal \
JWT_SECRET=local-secret-with-at-least-32-bytes \
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

## Endpoints de autenticación

### POST `/api/v1/auth/login`

Request:

```json
{
  "usernameOrEmail": "admin",
  "password": "unaClaveSeguraLocal"
}
```

Response exitosa:

```json
{
  "accessToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@local.test",
    "nombre": "Administrador",
    "apellido": "Local",
    "roles": ["ADMIN"],
    "permissions": ["..."]
  }
}
```

Credenciales inválidas devuelven `401` con `AUTH_INVALID_CREDENTIALS` y el mensaje genérico `Credenciales inválidas.`.

### GET `/api/v1/auth/me`

Requiere `Authorization: Bearer <token>`.

Valida el JWT, obtiene el usuario autenticado del `SecurityContext` y vuelve a consultar base para devolver datos actuales y roles/permisos vigentes. Si los permisos cambian en base, `/me` refleja el cambio sin depender de los claims anteriores del token.

### POST `/api/v1/auth/logout`

Requiere JWT válido. Registra `LOGOUT` si es posible y responde:

```json
{
  "message": "Sesión cerrada correctamente."
}
```

Es stateless: no hay blacklist ni refresh token. El frontend será responsable de borrar el token cuando se integre.

## Login attempts y auditoría

Cada login registra un intento en `login_attempts` con usuario resuelto si aplica, username/email usado, resultado, IP, user-agent y fecha.

Resultados usados:

- `SUCCESS`;
- `INVALID_CREDENTIALS`;
- `USER_DISABLED`;
- `ERROR` reservado para errores controlados inesperados.

La auditoría en `audit_log` registra eventos básicos:

- `LOGIN_SUCCESS`;
- `LOGIN_FAILURE`;
- `LOGOUT`.

Los JSON guardados son seguros y no incluyen passwords, hashes ni tokens.

## Documentación relacionada

- `docs/auth/01-etapa-1/seeds-roles-permisos.md`
- `docs/auth/02-etapa-2/login-local-jwt.md`
