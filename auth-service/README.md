# auth-service

`auth-service` es el microservicio Spring Boot independiente reservado para la autenticación y autorización de usuarios internos del Sistema de Seguimiento de Morosos.

## Estado de esta etapa

Esta **ETAPA 0** crea únicamente la base técnica mínima del servicio:

- arranque Spring Boot independiente;
- configuración base por perfiles;
- endpoint técnico de health propio;
- actuator `health` e `info`;
- manejo uniforme de errores;
- propagación de `X-Request-Id` como `traceId`;
- CORS configurable;
- seguridad base sin login real;
- Swagger/OpenAPI básico.

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
| `FRONTEND_URL` | `http://localhost:5173` | Origen principal permitido para CORS. |

En local también se permite `http://127.0.0.1:5173`.

## Seguridad en ETAPA 0

La configuración base usa sesiones stateless, CSRF deshabilitado para API y CORS habilitado. Se permiten públicamente health, actuator health/info, Swagger/OpenAPI y solicitudes `OPTIONS`. Cualquier otro endpoint se bloquea con `denyAll` porque todavía no existen endpoints privados reales ni mecanismo de autenticación.

## No implementado todavía

Esta etapa **no** implementa:

- login;
- JWT;
- Google login;
- recuperación o reseteo de contraseña;
- usuarios, roles o permisos;
- persistencia JPA;
- PostgreSQL;
- Flyway;
- envío de correos;
- integración con frontend;
- protección de `morosos-service`.
