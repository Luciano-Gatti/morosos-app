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

Se usa `spring-boot-starter-security` para seguridad, filtros y BCrypt, y `nimbus-jose-jwt` para firmar/validar JWT. Se mantiene `spring-boot-starter-validation` y `spring-boot-starter-data-jpa`. Para tests de integración, `auth-service` usa Testcontainers con PostgreSQL y valida Flyway contra una base PostgreSQL real; no se usa H2 porque las migraciones son específicas de PostgreSQL.

No se agregó OAuth2 Client, Spring Mail ni Resource Server para `morosos-service`.

## JWT

La etapa usa HS256 para simplificar el arranque local. Al leer tokens se valida explícitamente que el header JOSE declare `alg=HS256` antes de aceptar claims o construir el principal autenticado. Se rechazan `none`, `HS384`, `HS512` y cualquier otro algoritmo.

La arquitectura recomendada a futuro para microservicios es migrar a RS256 con JWKS para que servicios consumidores validen tokens sin compartir secretos simétricos, pero RS256/JWKS no está implementado en esta etapa.

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
| `JWT_AUDIENCE` | sin default en base; `morosos-app` en `test` | Audiencia esperada y emitida en los JWT. Debe configurarse por entorno fuera de tests. |
| `JWT_ACCESS_TOKEN_MINUTES` | `15` | Vida del access token en minutos. |
| `JWT_SECRET` | vacío en base/prod; default no real en `local`, `dev` y `test` | Secreto HS256 configurable por entorno. Debe tener al menos 32 bytes. `application-local.yml` y `application-dev.yml` definen un default de desarrollo si no se pasa la variable; `application-test.yml` define un default de test. En `prod`, sin perfiles activos o fuera de `local`/`dev`, el secreto debe configurarse explícitamente y no puede coincidir con el fallback conocido de desarrollo. |
| `AUTH_SEED_ADMIN_ENABLED` | `false` | Habilita el initializer del admin dev. |
| `AUTH_SEED_ADMIN_USERNAME` | `admin` | Username del admin dev. |
| `AUTH_SEED_ADMIN_EMAIL` | `admin@local.test` | Email del admin dev. |
| `AUTH_SEED_ADMIN_PASSWORD` | vacío | Password inicial. Si está vacío, no se crea el usuario. |
| `AUTH_SEED_ADMIN_NOMBRE` | `Administrador` | Nombre del admin dev. |
| `AUTH_SEED_ADMIN_APELLIDO` | `Local` | Apellido del admin dev. |

Nunca se loggea el secreto JWT, el password, el hash ni los tokens.

### Ejecución local con JWT

Ya no se usa `spring.profiles.default=local`. Para levantar `auth-service` localmente sin pasar siempre `JWT_SECRET`, activar explícitamente el perfil `local`:

```powershell
$env:SPRING_PROFILES_ACTIVE="local"
mvn spring-boot:run
```

También puede pasarse el perfil por Maven:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Con ese perfil, `application-local.yml` usa un default de desarrollo de al menos 32 caracteres si `JWT_SECRET` no existe. Si se prefiere usar un valor manual:

```powershell
$env:SPRING_PROFILES_ACTIVE="local"
$env:JWT_SECRET="mi_clave_local_segura_distinta_de_32_caracteres_123"
mvn spring-boot:run
```

En NetBeans se recomienda usar el goal Maven `spring-boot:run` con `-Dspring-boot.run.profiles=local`. Para pasar un secret manual desde argumentos del run:

```text
-Dspring-boot.run.arguments="--app.jwt.secret=mi_clave_local_segura_distinta_de_32_caracteres_123"
```

No commitear secrets reales en YAML. En producción `JWT_SECRET` es obligatorio y los defaults de `local`, `dev` y `test` no deben usarse.

### Reglas de fallback de `JWT_SECRET`

El fallback local/dev de `JWT_SECRET` solo se usa cuando `environment.getActiveProfiles()` contiene `local` o `dev`. No se consulta `environment.getDefaultProfiles()` para habilitar fallback y `application.yml` ya no declara `spring.profiles.default=local`.

Reglas vigentes:

- si `prod` está activo, nunca se permite fallback;
- si no hay perfiles activos, no se permite fallback;
- si `JWT_SECRET` está vacío fuera de perfiles activos `local`/`dev`, el arranque falla;
- si `JWT_SECRET` coincide con el fallback conocido de desarrollo fuera de perfiles activos `local`/`dev`, el arranque falla;
- el secreto debe tener al menos 32 bytes para HS256.

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

Se mantiene sesión stateless, CSRF deshabilitado para API y CORS habilitado. El filtro JWT construye authorities desde `permissions` y no sobrescribe el `SecurityContext` si ya existe una autenticación previa en la request.

## Authorities y roles

La autorización real se basa en permisos. Las authorities de Spring Security se construyen desde el claim/listado `permissions`; los roles no se agregan como authorities `ROLE_*` y no son requisito para proteger endpoints con `hasRole()`.

Ejemplos esperados para microservicios consumidores:

```java
@PreAuthorize("hasAuthority('INMUEBLES_VER_LISTADO')")
@PreAuthorize("hasAuthority('SEGUIMIENTO_CERRAR_PROCESO')")
@PreAuthorize("hasAuthority('REPORTES_EXPORTAR_PDF')")
```

Los roles siguen existiendo en base de datos, siguen incluidos en el JWT y siguen devolviéndose en `/me`, pero funcionan como agrupadores administrativos de permisos e información útil para UI/administración.

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
