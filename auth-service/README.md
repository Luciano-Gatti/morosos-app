# auth-service

`auth-service` es el microservicio Spring Boot independiente reservado para la autenticación y autorización de usuarios internos del Sistema de Seguimiento de Morosos.

## Estado de esta etapa

La base técnica de **ETAPA 0** se mantiene y la **ETAPA 1** agrega el modelo persistente inicial para permisos descriptivos:

- arranque Spring Boot independiente;
- configuración base por perfiles;
- endpoint técnico de health propio;
- actuator `health` e `info`;
- manejo uniforme de errores;
- propagación de `X-Request-Id` como `traceId`;
- CORS configurable;
- seguridad base sin login real;
- Swagger/OpenAPI básico;
- JPA, PostgreSQL y Flyway para el esquema inicial de autorización;
- permisos descriptivos por módulo, recurso y acción;
- asociación futura endpoint -> permiso mediante `endpoint_permisos`.

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

## Seguridad en ETAPA 1

La configuración base usa sesiones stateless, CSRF deshabilitado para API y CORS habilitado. Se permiten públicamente health, actuator health/info, Swagger/OpenAPI y solicitudes `OPTIONS`. Cualquier otro endpoint se bloquea con `denyAll` porque todavía no existen endpoints privados reales ni mecanismo de autenticación.

La etapa deja preparado el modelo `Usuario -> Roles -> Permisos` y `Endpoint -> Permiso requerido`, pero todavía no implementa validación de autorización, login ni JWT.


## Modelo de permisos descriptivos

`Permiso` representa una capacidad funcional asignable a roles. Incluye `codigo`, `nombre`, `descripcion`, `modulo`, `recurso`, `accion`, `activo` y auditoría técnica (`created_at`, `updated_at`, `created_by`, `updated_by`). La acción se modela con el enum `PermissionAction` y se persiste como texto.

Acciones soportadas:

- `VER`, `CREAR`, `EDITAR`, `ELIMINAR`;
- `IMPORTAR`, `EXPORTAR`, `INICIAR`, `AVANZAR`, `REPETIR`;
- `PAUSAR`, `REANUDAR`, `CERRAR`, `OBSERVAR`;
- `CONFIGURAR`, `ADMINISTRAR`, `EJECUTAR`.

`EndpointPermiso` representa la asociación futura entre un endpoint concreto y el permiso requerido. Incluye `servicio`, `metodo_http`, `path_pattern`, `permiso_id`, `descripcion`, `activo`, `created_at` y `updated_at`.

Diferencia conceptual:

```text
Usuario -> Roles -> Permisos
Endpoint -> Permiso requerido
```

Los roles siguen vinculándose a permisos por `rol_permisos`. No se vinculan roles directamente a endpoints.

La migración `V1__auth_schema.sql` crea las tablas `permisos`, `roles`, `rol_permisos` y `endpoint_permisos`, pero no inserta datos iniciales.

## No implementado todavía

Esta etapa **no** implementa:

- login;
- JWT;
- Google login;
- recuperación o reseteo de contraseña;
- endpoints administrativos de usuarios, roles o permisos;
- seeds de roles;
- seeds de permisos;
- seed de usuario admin;
- registros en `endpoint_permisos`;
- envío de correos;
- integración con frontend;
- protección de `morosos-service`.
