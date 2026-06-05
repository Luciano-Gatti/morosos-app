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
- auditoría funcional básica en `audit_log` para login, logout y recuperación/restablecimiento de contraseña;
- recuperación de contraseña en `POST /api/v1/auth/forgot-password`;
- restablecimiento de contraseña en `POST /api/v1/auth/reset-password`;
- tokens de recuperación generados con `SecureRandom`, incluidos solo en el enlace de restablecimiento, y persistidos como hash SHA-256 Base64 URL-safe;
- invalidación de tokens activos previos usando `used_at`;
- TTL configurable de recuperación de contraseña;
- envío real de correos de restablecimiento vía Spring Mail/SMTP cuando `AUTH_MAIL_ENABLED=true`, sin credenciales hardcodeadas.

No implementado todavía:

- Google login;
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

Si el arranque falla creando `jwtService` con el mensaje `JWT_SECRET debe estar configurado con al menos 32 bytes para HS256`, el servicio se inició sin un perfil local/dev activo y sin una clave válida. Para resolverlo, usar el comando anterior, definir `SPRING_PROFILES_ACTIVE=local` en la terminal/IDE, o configurar `JWT_SECRET` con una clave de al menos 32 bytes.

## Ejecución local

Para pruebas locales de integración con `morosos-service`, activar explícitamente el perfil `local` permite usar el `JWT_SECRET` temporal definido como fallback en `application-local.yml` cuando no se configura la variable de entorno. Ese valor no es un secreto productivo ni un secreto definitivo de desarrollo: solo existe para que `auth-service` emita JWT HS256 compatibles con `morosos-service` en localhost y tiene más de 32 bytes para cumplir HS256. Si se define `JWT_SECRET`, Spring usa esa variable por encima del fallback del perfil.

PowerShell con fallback local temporal:

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
- Mientras se use HS256, `auth-service` y `morosos-service` deben compartir exactamente el mismo `JWT_SECRET`.
- El fallback local temporal solo se permite con perfiles activos `local` o `dev`; no se permite en `prod` ni sin perfil activo `local`/`dev`.
- Los defaults `local`, `dev` y `test` son solo de desarrollo/pruebas y no deben usarse en producción.
- Para cambiar la clave local, definir `JWT_SECRET` por variable de entorno en ambos servicios.
- Futuro recomendado: migrar a RS256/JWKS para que `morosos-service` valide con clave pública y no comparta secreto con `auth-service`.
- No se loggea `JWT_SECRET` ni tokens.


## Recuperación y restablecimiento de contraseña

### Solicitar recuperación

```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "usernameOrEmail": "admin@local.test"
}
```

También se acepta `email` para compatibilidad con el frontend. La respuesta siempre es genérica para evitar enumeración de usuarios o filtrado de estado activo/inactivo:

```json
{
  "message": "Si los datos corresponden a una cuenta registrada, recibirás instrucciones para restablecer la contraseña."
}
```

Si el usuario existe y está activo, el servicio genera un token aleatorio de 32 bytes con `SecureRandom`, lo codifica en Base64 URL-safe sin padding, guarda únicamente el hash SHA-256 Base64 URL-safe en `password_reset_tokens.token_hash`, define `expires_at` con el TTL configurable y marca tokens activos anteriores del usuario con `used_at`.

### Restablecer contraseña

```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "...",
  "newPassword": "NuevaClave123",
  "confirmPassword": "NuevaClave123"
}
```

Respuesta exitosa:

```json
{
  "message": "Contraseña restablecida correctamente."
}
```

La contraseña nueva se valida con la política mínima vigente: al menos 8 caracteres, al menos una letra y al menos un número. Luego se almacena con el `BCryptPasswordEncoder` existente. El token debe existir por hash, no estar expirado y no tener `used_at`. Al finalizar se marca como usado y se invalidan otros tokens activos del usuario.

### Notificación SMTP y logging

La abstracción `PasswordResetEmailService` envía correos con `JavaMailSender` cuando `AUTH_MAIL_ENABLED=true`. El correo incluye asunto claro, texto plano, HTML simple, link de restablecimiento, vencimiento del enlace e indicación para ignorar el mensaje si no fue solicitado. No incluye passwords, hashes ni datos sensibles innecesarios.

Cuando `AUTH_MAIL_ENABLED=false`, no se intenta SMTP. En perfiles `local` o `dev` se loguea la URL completa de reset únicamente para pruebas manuales; en `prod` y otros perfiles no se loguea el token ni la URL completa. Cuando `AUTH_MAIL_ENABLED=true` y falla SMTP, la respuesta HTTP sigue siendo genérica, se registra un error interno sin token y se audita `PASSWORD_RESET_EMAIL_FAILED`.

Variables principales:

```bash
AUTH_MAIL_ENABLED=false
FRONTEND_RESET_PASSWORD_URL=http://localhost:5173/reset-password
```

Ejemplo SMTP sin credenciales reales:

```bash
AUTH_MAIL_ENABLED=true
AUTH_MAIL_HOST=smtp.example.com
AUTH_MAIL_PORT=587
AUTH_MAIL_USERNAME=usuario-smtp
AUTH_MAIL_PASSWORD=clave-smtp
AUTH_MAIL_FROM=no-reply@example.com
AUTH_MAIL_FROM_NAME=Sistema de Morosidad
AUTH_MAIL_SMTP_AUTH=true
AUTH_MAIL_SMTP_STARTTLS=true
AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES=30
FRONTEND_RESET_PASSWORD_URL=https://app.example.com/reset-password
```

En perfil `prod`, si `AUTH_MAIL_ENABLED=true`, el arranque exige host, puerto, remitente y, cuando `AUTH_MAIL_SMTP_AUTH=true`, usuario/password SMTP configurados por entorno.

Eventos de auditoría agregados en `audit_log`:

- `PASSWORD_RESET_REQUESTED` cuando el usuario existe y está activo.
- `PASSWORD_RESET_EMAIL_SENT`.
- `PASSWORD_RESET_EMAIL_FAILED`.
- `PASSWORD_RESET_SUCCESS`.
- `PASSWORD_RESET_FAILED_INVALID_TOKEN`.
- `PASSWORD_RESET_FAILED_EXPIRED_TOKEN`.
- `PASSWORD_RESET_FAILED_PASSWORD_POLICY`.

Google login, refresh tokens y endpoints admin siguen fuera del alcance.

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
| `AUTH_MAIL_ENABLED` | `false` | Habilita envío SMTP real para recuperación de contraseña. |
| `AUTH_MAIL_HOST` | vacío | Host SMTP. Obligatorio en producción si `AUTH_MAIL_ENABLED=true`. |
| `AUTH_MAIL_PORT` | `587` | Puerto SMTP. |
| `AUTH_MAIL_USERNAME` | vacío | Usuario SMTP; obligatorio en producción si SMTP auth está habilitado. |
| `AUTH_MAIL_PASSWORD` | vacío | Password SMTP; obligatorio en producción si SMTP auth está habilitado. |
| `AUTH_MAIL_FROM` | `no-reply@localhost` | Remitente usado en correos de restablecimiento. |
| `AUTH_MAIL_FROM_NAME` | `Sistema de Morosidad` | Nombre visible del remitente. |
| `AUTH_MAIL_SMTP_AUTH` | `true` | Configura `mail.smtp.auth`. |
| `AUTH_MAIL_SMTP_STARTTLS` | `true` | Configura `mail.smtp.starttls.enable`. |
| `FRONTEND_RESET_PASSWORD_URL` | `http://localhost:5173/reset-password` | URL base del frontend para armar el link `?token=...`. |
| `AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES` | `30` | TTL del token de recuperación. |
| `JWT_ISSUER` | `http://localhost:8080` | Claim `iss` esperado y emitido. |
| `JWT_AUDIENCE` | `gestion-aosc` en base/local/test | Claim estándar `aud` esperado y emitido; debe coincidir con `morosos-service` y puede sobreescribirse por entorno. |
| `JWT_ACCESS_TOKEN_MINUTES` | `15` | Duración del access token en minutos. |
| `AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES` | `30` | TTL de tokens de recuperación de contraseña. |
| `FRONTEND_RESET_PASSWORD_URL` | `http://localhost:5173/reset-password` | URL base usada para construir enlaces de restablecimiento. |
| `JWT_SECRET` | vacío en base/prod; fallback temporal no real en `local`/`dev`; valor no real separado en `test` | Secreto HS256. Debe tener al menos 32 bytes. En `application.yml` y `prod` no hay secret usable por default; con perfil `local` se usa una clave temporal de integración local con `morosos-service` solo si no se define la variable. En `prod` o sin perfiles activos debe configurarse explícitamente y no puede ser el fallback conocido. |
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

## Registro controlado, Google y aprobación administrativa

### Variables nuevas

```yaml
app:
  google:
    client-id: ${GOOGLE_CLIENT_ID:}
    client-secret: ${GOOGLE_CLIENT_SECRET:}
    enabled: ${GOOGLE_LOGIN_ENABLED:true}
```

- `GOOGLE_LOGIN_ENABLED=false` deshabilita `POST /api/v1/auth/google` con error controlado `GOOGLE_LOGIN_DISABLED`.
- `GOOGLE_CLIENT_ID` debe coincidir con el OAuth Client ID de Google Identity Services. Para local puede usarse el Client ID web público `492537971639-h16aabnpmu0hcrn5vcbk6bvn2evkjbgf.apps.googleusercontent.com`; en producción debe inyectarse por entorno.
- `GOOGLE_CLIENT_SECRET` es obligatorio para el flujo de botón personalizado: `POST /api/v1/auth/google/code` intercambia el authorization code por tokens de Google en el backend.
- Si Google está habilitado pero `GOOGLE_CLIENT_ID` está vacío, el endpoint responde `GOOGLE_CLIENT_ID_NOT_CONFIGURED`.
- Si el flujo por code está habilitado pero `GOOGLE_CLIENT_SECRET` está vacío, el endpoint responde `GOOGLE_CLIENT_SECRET_NOT_CONFIGURED`.

### Estados de usuario

Los usuarios tienen `estado`:

- `PENDIENTE_APROBACION`: puede existir por registro local o Google, pero no recibe JWT funcional.
- `ACTIVO`: puede iniciar sesión y recibe JWT con roles activos y permisos efectivos.
- `INACTIVO`: login bloqueado con `ACCOUNT_DISABLED`.
- `RECHAZADO`: login bloqueado con `ACCOUNT_REJECTED`.

### Endpoints públicos

- `POST /api/v1/auth/register`: crea cuenta local pendiente con contraseña BCrypt. No devuelve token.
- `POST /api/v1/auth/google`: verifica el ID token con Google, identifica por `provider=GOOGLE` + `provider_subject=sub`, vincula usuarios existentes por email verificado o crea cuenta pendiente. Google solo autentica identidad; la aprobación administrativa y la asignación de roles/permisos siguen siendo internas.
- `POST /api/v1/auth/google/code`: recibe el authorization code del frontend, lo intercambia con Google usando `GOOGLE_CLIENT_SECRET` y reutiliza la misma lógica de login/registro Google. En popup mode, el `redirectUri` del request debe ser el origin del frontend, por ejemplo `http://localhost:5173`.

### Endpoints administrativos

- `GET /api/v1/admin/users` (`USUARIOS_VER_LISTADO`)
- `GET /api/v1/admin/users/{id}` (`USUARIOS_VER_DETALLE`)
- `POST /api/v1/admin/users` (`USUARIOS_CREAR`)
- `PUT /api/v1/admin/users/{id}` (`USUARIOS_EDITAR`)
- `PATCH /api/v1/admin/users/{id}/status` (`USUARIOS_ACTIVAR_DESACTIVAR`)
- `POST /api/v1/admin/users/{id}/approve` (`USUARIOS_APROBAR`)
- `POST /api/v1/admin/users/{id}/reject` (`USUARIOS_RECHAZAR`)
- `GET /api/v1/admin/roles` (`ROLES_VER_LISTADO`)
- `GET /api/v1/admin/permissions` (`PERMISOS_VER_LISTADO`)

Los roles siguen siendo agrupadores administrativos. La autorización efectiva se realiza con authorities/permissions, no con roles.

### Permisos efectivos

`permissions efectivos = permisos de roles activos + permisos directos activos del usuario`, ordenados y sin duplicados. `/api/v1/auth/me` y la emisión del JWT usan esa misma resolución.

### Seguridad de secretos

No se guardan contraseñas en texto plano, no se devuelve `password_hash`, y los flujos no registran passwords, Google ID tokens ni JWT en auditoría o logs. El frontend debe conservar únicamente el JWT propio emitido por `auth-service`, nunca el Google ID token.
