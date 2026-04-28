# Propuesta inicial de backend
## Spring Boot + PostgreSQL (2 microservicios)

Fecha: 2026-04-28

## 1) Arquitectura general

### Objetivo
Diseñar un backend **simple pero sólido**, desacoplando autenticación del negocio, con base en lo que hoy exige la UI administrativa de morosos.

### Alcance V1
- `auth-service`: identidad, autenticación JWT, autorización básica por roles/permisos.
- `morosos-service`: dominio de negocio (inmuebles, deuda, seguimiento, configuración, reportes).

### Decisiones de arquitectura
- Estilo: REST + JSON.
- Persistencia: PostgreSQL por microservicio (BD separadas).
- Migraciones: Flyway en cada servicio.
- IDs: UUID (`gen_random_uuid()`) en entidades principales; claves de negocio cuando aplique (`numero_cuenta`).
- Paginación/orden/filtros: convenciones uniformes en listados.
- Auditoría mínima: usuario, timestamps, evento de negocio principal.
- Seguridad: JWT firmado por `auth-service`; validación local en `morosos-service`.

### Diagrama lógico simplificado
- Frontend -> `auth-service` (login/refresh/me).
- Frontend -> `morosos-service` (módulos funcionales) con `Authorization: Bearer`.
- `morosos-service` valida JWT por clave pública/secret compartido (según estrategia elegida).

> Se evita, en V1, introducir API Gateway obligatorio, mensajería o event sourcing. Quedan como evolución.

---

## 2) Responsabilidades por microservicio

## auth-service
Responsable de:
1. gestión de usuarios internos;
2. login (usuario+password);
3. emisión/renovación/revocación de tokens;
4. roles y permisos;
5. endpoint `me` para contexto del usuario autenticado.

No responsable de:
- reglas de negocio de morosos;
- datos de inmuebles/deuda/seguimiento.

## morosos-service
Responsable de:
1. padrón de inmuebles;
2. cargas de deuda y errores de importación;
3. flujo de seguimiento por etapas (acciones masivas incluidas);
4. configuración funcional (grupos, etapas, motivos de cierre, parámetros);
5. historial y trazabilidad operativa;
6. reportes operativos.

No responsable de:
- almacenar credenciales de usuario;
- autenticación primaria.

---

## 3) Comunicación entre servicios

### V1 recomendada (simple)
- Comunicación síncrona mínima.
- `morosos-service` **no llama** a `auth-service` por request para validar token.
- Validación JWT local en `morosos-service` (firma + expiración + claims).

### Claims esperados en JWT
- `sub` (userId UUID)
- `preferred_username`
- `roles` (array)
- `permissions` (array)
- `iat`, `exp`, `iss`

### Evolución (opcional, posterior)
- introspección de token;
- publicación de eventos de auditoría cruzada;
- gateway BFF.

---

## 4) Estrategia de autenticación JWT

### Flujo
1. `POST /auth/login` -> devuelve `access_token` (corto) + `refresh_token` (más largo).
2. Frontend usa `access_token` en cada request.
3. Al expirar, usa `POST /auth/refresh`.
4. `POST /auth/logout` revoca refresh token activo.

### Recomendaciones de seguridad
- Access token: 10-20 min.
- Refresh token: 7-30 días.
- Rotación de refresh token en cada refresh.
- Guardar hash del refresh token en BD.
- Passwords con BCrypt (cost razonable).
- TLS obligatorio fuera de local.

### Autorización
- `@PreAuthorize` por permisos en endpoints sensibles.
- Roles base sugeridos:
  - `ADMIN_CONFIG`
  - `OPERADOR_DEUDA`
  - `OPERADOR_SEGUIMIENTO`
  - `LECTOR_REPORTES`

---

## 5) Modelo de base de datos por servicio

## auth-service (PostgreSQL)
Tablas iniciales:
1. `users`
2. `roles`
3. `permissions`
4. `user_roles`
5. `role_permissions`
6. `refresh_tokens`

Campos clave (resumen):
- `users(id uuid pk, username unique, email unique, password_hash, display_name, active, created_at, updated_at)`
- `refresh_tokens(id uuid pk, user_id, token_hash, expires_at, revoked_at, created_at, created_ip)`

Índices:
- `users(username)`, `users(email)` únicos.
- `refresh_tokens(user_id, revoked_at)`.

## morosos-service (PostgreSQL)
Esquema inicial (foco UI):
1. `grupos`
2. `distritos`
3. `grupo_distrito_config`
4. `inmuebles`
5. `cargas_deuda`
6. `cargas_deuda_detalle`
7. `cargas_deuda_error`
8. `etapas_config`
9. `motivos_cierre`
10. `parametros_seguimiento`
11. `casos_seguimiento`
12. `caso_eventos` (historial de actuaciones)
13. `compromisos_pago`
14. `observaciones_inmueble`
15. `audit_log` (mínimo)

Notas:
- UUID en entidades principales.
- `numero_cuenta` único en `inmuebles`.
- `etapas_config.orden` único lógico (validar en aplicación + índice único).

---

## 6) Entidades principales (resumen)

## auth-service
- `User`
- `Role`
- `Permission`
- `RefreshToken`

## morosos-service
- `Inmueble`
- `Grupo`
- `Distrito`
- `GrupoDistritoConfig`
- `CargaDeuda`
- `CargaDeudaDetalle`
- `CargaDeudaError`
- `EtapaConfig`
- `MotivoCierre`
- `ParametroSeguimiento`
- `CasoSeguimiento`
- `CasoEvento` (timeline)
- `CompromisoPago`
- `ObservacionInmueble`
- `AuditLog`

Campos recomendados transversales:
- `id UUID`
- `created_at`, `updated_at`
- `created_by`, `updated_by` (UUID de usuario, desde JWT)

---

## 7) Endpoints REST iniciales

## auth-service

### Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### IAM básico
- `GET /api/v1/roles`
- `GET /api/v1/permissions`
- `GET /api/v1/users` (opcional V1.1)

## morosos-service

### Inmuebles
- `GET /api/v1/inmuebles`
- `GET /api/v1/inmuebles/{id}`
- `PUT /api/v1/inmuebles/{id}`
- `POST /api/v1/inmuebles/importaciones` (multipart)
- `GET /api/v1/inmuebles/importaciones/{id}`
- `GET /api/v1/inmuebles/importaciones/{id}/errores`

### Deuda
- `GET /api/v1/deuda/cargas`
- `POST /api/v1/deuda/cargas` (multipart)
- `GET /api/v1/deuda/cargas/{id}`
- `GET /api/v1/deuda/cargas/{id}/inmuebles`
- `GET /api/v1/deuda/cargas/{id}/errores`

### Gestión de etapas
- `GET /api/v1/seguimiento/bandeja`
- `POST /api/v1/seguimiento/acciones/mover-etapa`
- `POST /api/v1/seguimiento/acciones/siguiente`
- `POST /api/v1/seguimiento/acciones/repetir`
- `POST /api/v1/seguimiento/acciones/iniciar`
- `POST /api/v1/seguimiento/acciones/cerrar`
- `POST /api/v1/seguimiento/acciones/compromiso`

### Historial y observaciones
- `GET /api/v1/inmuebles/{id}/seguimiento/historial`
- `GET /api/v1/inmuebles/{id}/observaciones`
- `POST /api/v1/inmuebles/{id}/observaciones`

### Configuración
- `GET/POST/PUT/DELETE /api/v1/config/grupos`
- `PUT /api/v1/config/grupos/{id}/distritos`
- `GET/POST/PUT/DELETE /api/v1/config/etapas`
- `POST /api/v1/config/etapas/reordenar`
- `GET/POST/PUT/DELETE /api/v1/config/motivos-cierre`
- `PATCH /api/v1/config/motivos-cierre/{id}/activo`
- `GET/PUT /api/v1/config/seguimiento`

### Reportes
- `GET /api/v1/reportes/morosos-grupo-distrito`
- `GET /api/v1/reportes/acciones`
- `GET /api/v1/reportes/estado-inmuebles`
- `GET /api/v1/reportes/porcentajes-morosidad`
- `GET /api/v1/reportes/historial-movimientos`
- `GET /api/v1/reportes/{id}/export?format=pdf|xlsx`

---

## 8) DTOs iniciales

### Convenciones
- Requests/Responses separados.
- DTO de tabla (row) diferente a DTO de detalle.
- Estructura paginada estándar:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0,
  "sort": ["field,asc"]
}
```

### auth-service
- `LoginRequest {usernameOrEmail, password}`
- `TokenResponse {accessToken, refreshToken, expiresIn, tokenType}`
- `MeResponse {id, username, displayName, roles[], permissions[]}`

### morosos-service (ejemplos clave)
- `InmuebleRowResponse`
- `InmuebleDetailResponse`
- `InmuebleUpdateRequest`
- `CargaDeudaRowResponse`
- `CargaDeudaDetailResponse`
- `ErrorImportacionRowResponse`
- `SeguimientoBandejaRowResponse`
- `AccionMasiva*Request`
- `AccionMasivaResultResponse {totalSolicitados, aplicados, omitidos, omisiones[]}`
- `CasoHistorialResponse`
- `GrupoRequest/Response`
- `EtapaRequest/Response`
- `MotivoCierreRequest/Response`
- `ParametroSeguimientoResponse/UpdateRequest`

---

## 9) Validaciones

### Técnicas (Bean Validation)
- `@NotBlank`, `@Size`, `@Email`, `@Min`, `@Max`, `@Pattern`.
- Fechas: `fechaHasta >= fechaDesde` en compromisos.
- UUIDs válidos en path/body.

### Negocio (servicio)
- No retroceso de etapa.
- No eliminar etapa con casos asociados.
- No eliminar grupo con inmuebles asociados.
- No eliminar motivo de cierre con usos > 0.
- No editar/eliminar motivos `isSystem=true` (excepto decisión explícita de negocio).
- Umbral de moroso dentro de rango configurado.

### Listados
- límite de `size` (ej. max 100).
- sort whitelist para evitar campos no indexados/privados.

---

## 10) Manejo de errores

### Estructura estándar
`application/problem+json` (RFC 7807) o equivalente consistente:

```json
{
  "timestamp": "2026-04-28T12:00:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Datos inválidos",
  "details": [
    {"field": "nombre", "error": "must not be blank"}
  ],
  "path": "/api/v1/config/grupos"
}
```

### Mapeo recomendado
- 400: validación.
- 401: no autenticado.
- 403: sin permisos.
- 404: recurso inexistente.
- 409: conflicto de negocio (duplicado, transición inválida).
- 422: regla de dominio no cumplida.
- 500: error inesperado.

Implementación:
- `@RestControllerAdvice` global por microservicio.
- códigos de error estables (`BUSINESS_RULE_VIOLATION`, `RESOURCE_IN_USE`, etc.).

---

## 11) Auditoría mínima

## Objetivo V1
Trazabilidad suficiente para la UI (historial/movimientos) y soporte operativo.

### Qué registrar
- actor (`user_id`, `username`)
- acción (`entity`, `action`)
- fecha/hora
- recurso afectado (`entity_id`)
- resumen de cambios (jsonb acotado)
- ip/origen opcional

### Dónde
- `audit_log` (morosos-service)
- eventos de proceso en `caso_eventos` para timeline funcional

### Eventos mínimos a auditar
- importación de inmuebles/deuda
- cambios de etapa
- cierre de proceso
- compromiso de pago
- cambios de configuración

---

## 12) Estructura de paquetes (sugerida)

Convención hexagonal ligera (sin sobreingeniería):

```text
auth-service
  com.tuorg.auth
    api
      controller
      dto
    application
      service
    domain
      model
      repository
    infrastructure
      persistence (jpa)
      security (jwt, password)
    config

morosos-service
  com.tuorg.morosos
    api
      controller
      dto
    application
      service
      usecase
    domain
      model
      repository
      rules
    infrastructure
      persistence (jpa)
      reporting
    shared
      error
      pagination
      security
      audit
    config
```

Notas:
- Mantener módulos por funcionalidad (`inmuebles`, `deuda`, `seguimiento`, `configuracion`, `reportes`) dentro de esas capas.
- Evitar micro-módulos prematuros.

---

## 13) Roadmap de implementación por etapas

## Etapa 0 - Base técnica
- bootstrap de ambos servicios
- conexión PostgreSQL
- Flyway inicial
- healthchecks + OpenAPI

## Etapa 1 - Seguridad funcional
- auth login/refresh/me/logout
- roles/permisos básicos
- validación JWT en morosos-service

## Etapa 2 - Catálogos y padrón
- grupos/distritos/config
- inmuebles listado/detalle/edición
- importación de inmuebles

## Etapa 3 - Deuda
- carga de deuda
- detalle de carga y errores
- filtros/paginación/sort

## Etapa 4 - Seguimiento operativo
- bandeja gestión de etapas
- acciones masivas (mover/siguiente/repetir/iniciar/cerrar/compromiso)
- historial por inmueble

## Etapa 5 - Reportes
- endpoints de reportes principales
- exportaciones PDF/XLSX (mínimas)

## Etapa 6 - Endurecimiento
- auditoría ampliada
- métricas/observabilidad
- performance e índices
- hardening de seguridad

---

## Criterios de “simple pero preparado para crecer”

1. Dos microservicios claros, sin gateway obligatorio en V1.
2. JWT stateless + refresh token persistido.
3. BD separada por servicio desde el inicio.
4. Contratos REST estables y paginación uniforme.
5. Historial funcional mínimo desde V1 (no postergarlo).
6. Dejar integraciones/eventos para V2 cuando exista necesidad real.

