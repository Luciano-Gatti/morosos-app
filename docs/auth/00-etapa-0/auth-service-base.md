# ETAPA 0 - Base técnica de auth-service

## Alcance

Esta etapa crea `auth-service` como proyecto Maven Spring Boot independiente dentro del repositorio, sin convertir la raíz en un parent Maven multi-módulo y sin modificar la lógica funcional de `morosos-service`.

El paquete base del nuevo servicio es `pe.morosos.auth` y la clase principal es `pe.morosos.auth.AuthServiceApplication`.

## Estructura creada

```text
auth-service/
├── pom.xml
├── README.md
└── src/
    ├── main/
    │   ├── java/pe/morosos/auth/
    │   │   ├── AuthServiceApplication.java
    │   │   ├── common/
    │   │   ├── config/
    │   │   ├── error/
    │   │   ├── health/
    │   │   ├── observability/
    │   │   └── security/
    │   └── resources/
    │       ├── application.yml
    │       ├── application-local.yml
    │       ├── application-dev.yml
    │       ├── application-test.yml
    │       └── application-prod.yml
    └── test/
        └── java/pe/morosos/auth/
```

No se crearon paquetes de dominio futuros como `user`, `role`, `permission`, `google`, `password`, `token` o `audit`.

## Dependencias

El `pom.xml` usa Java 21, Spring Boot 3.3.5 y las dependencias iniciales:

- `spring-boot-starter-web`;
- `spring-boot-starter-validation`;
- `spring-boot-starter-actuator`;
- `spring-boot-starter-security`;
- `springdoc-openapi-starter-webmvc-ui`;
- `lombok`;
- `spring-boot-starter-test`.

No se agregaron JPA, PostgreSQL, Flyway, OAuth2 Client, Resource Server, Spring Mail ni librerías JWT.

## Configuración

`application.yml` define:

- `server.port` con default `8080` mediante `AUTH_SERVICE_PORT`;
- `spring.application.name=auth-service`;
- perfil default `local`;
- exposición actuator limitada a `health,info`;
- detalles de health `when_authorized`;
- paths de Swagger UI y OpenAPI;
- CORS configurable por `app.cors.allowed-origins`.

Se crearon perfiles `local`, `dev`, `test` y `prod` sin configuración de base de datos.

## Endpoint técnico de health

Se agregó:

```http
GET /api/v1/auth-service/health
```

Respuesta:

```json
{
  "service": "auth-service",
  "status": "UP"
}
```

Este endpoint no reemplaza a actuator; solo valida el microservicio en esta etapa.

## Manejo uniforme de errores

Se agregó `ErrorResponse` con los campos:

- `timestamp`;
- `status`;
- `code`;
- `message`;
- `path`;
- `traceId`;
- `details`.

`GlobalExceptionHandler` maneja como mínimo:

- `MethodArgumentNotValidException`;
- `ConstraintViolationException`;
- `IllegalArgumentException`;
- fallback `Exception` con HTTP 500.

El formato evita devolver mapas sueltos o stacktraces.

## TraceId / RequestId

`RequestTraceFilter`:

- lee `X-Request-Id` si existe;
- genera un UUID si no existe;
- guarda el valor como `traceId` en MDC;
- devuelve `X-Request-Id` en la respuesta;
- limpia MDC al finalizar.

No se agregó logging avanzado ni logging de headers sensibles.

## CORS

`CorsConfig` permite métodos:

- `GET`;
- `POST`;
- `PUT`;
- `PATCH`;
- `DELETE`;
- `OPTIONS`.

Permite headers:

- `Authorization`;
- `Content-Type`;
- `Accept`;
- `Origin`;
- `X-Requested-With`;
- `X-Request-Id`.

En local permite:

- `http://localhost:5173`;
- `http://127.0.0.1:5173`.

Los orígenes quedan configurables por properties.

## SecurityFilterChain base

La configuración de seguridad:

- deshabilita CSRF para API;
- habilita CORS;
- usa sesiones stateless;
- permite públicamente:
  - `GET /api/v1/auth-service/health`;
  - `GET /actuator/health`;
  - `GET /actuator/info`;
  - `GET /v3/api-docs/**`;
  - `GET /swagger-ui/**`;
  - `GET /swagger-ui.html`;
  - `OPTIONS /**`.

Cualquier otro endpoint queda bloqueado con `denyAll` porque en esta etapa no existe login, JWT ni endpoints privados reales.

## Swagger/OpenAPI

Se configuró OpenAPI básico con:

- título: `Auth Service - Sistema de Seguimiento de Morosos`;
- versión: `0.1.0`;
- descripción: microservicio de autenticación y autorización para usuarios internos del sistema.

Solo se expone documentación base; no se documentan funcionalidades futuras como implementadas.

## Actuator

Actuator expone únicamente:

- `/actuator/health`;
- `/actuator/info`.
