# ETAPA 2 - Login local con BCrypt y JWT

## Alcance implementado

Esta etapa implementa autenticación local real para usuarios internos en `auth-service`:

- login local en `POST /api/v1/auth/login`;
- validación de password con `BCryptPasswordEncoder`;
- emisión de JWT propio firmado con HS256 mediante Nimbus JOSE JWT;
- endpoint autenticado `GET /api/v1/auth/me`;
- logout stateless en `POST /api/v1/auth/logout`;
- creación opcional de admin dev mediante initializer Java controlado por properties;
- registro de intentos de login en `login_attempts`;
- auditoría básica de `LOGIN_SUCCESS`, `LOGIN_FAILURE` y `LOGOUT` en `audit_log`.

## Dependencias

Se usa `spring-boot-starter-security` para seguridad, filtros y BCrypt, y `nimbus-jose-jwt` para firmar/validar JWT. Se mantiene `spring-boot-starter-validation` y `spring-boot-starter-data-jpa`.

No se agregó OAuth2 Client, Spring Mail ni Resource Server para `morosos-service`.

## JWT

La etapa usa HS256 para simplificar el arranque local. La arquitectura recomendada a futuro para microservicios es migrar a RS256 con JWKS para que servicios consumidores validen tokens sin compartir secretos simétricos.

Claims incluidos:

- `sub`: id del usuario;
- `userId`;
- `username`;
- `email`;
- `roles`;
- `permissions`;
- `iss`;
- `aud`;
- `iat`;
- `exp`;
- `jti`;
- `authProvider=LOCAL`.

No se incluye `passwordHash`, tokens de reset ni datos sensibles.

## Variables de entorno

| Variable | Default | Descripción |
| --- | --- | --- |
| `JWT_ISSUER` | `http://localhost:8080` | Emisor esperado y emitido en los JWT. |
| `JWT_AUDIENCE` | `morosos-app` | Audiencia esperada y emitida en los JWT. |
| `JWT_ACCESS_TOKEN_MINUTES` | `15` | Vida del access token en minutos. |
| `JWT_SECRET` | vacío | Secreto HS256 configurable por entorno. Debe tener al menos 32 bytes. En local/dev hay fallback de desarrollo; en prod no se permite vacío/inseguro. |
| `AUTH_SEED_ADMIN_ENABLED` | `false` | Habilita el initializer del admin dev. |
| `AUTH_SEED_ADMIN_USERNAME` | `admin` | Username del admin dev. |
| `AUTH_SEED_ADMIN_EMAIL` | `admin@local.test` | Email del admin dev. |
| `AUTH_SEED_ADMIN_PASSWORD` | vacío | Password inicial. Si está vacío, no se crea el usuario. |
| `AUTH_SEED_ADMIN_NOMBRE` | `Administrador` | Nombre del admin dev. |
| `AUTH_SEED_ADMIN_APELLIDO` | `Local` | Apellido del admin dev. |

Nunca se loggea el secreto JWT, el password, el hash ni los tokens.

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

## Endpoints

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

Es stateless: no hay blacklist ni refresh token. El frontend será responsable de borrar el token.

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

## Seguridad

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

Se mantiene sesión stateless, CSRF deshabilitado para API y CORS habilitado.

## Limitaciones explícitas

No se implementa todavía:

- Google login;
- forgot/reset password funcional;
- envío de correos;
- refresh token;
- blacklist de tokens;
- conexión con frontend;
- protección de `morosos-service`;
- `endpoint_permisos`;
- asociación endpoint-permiso en base de datos;
- endpoints administrativos.
