# Informe técnico corregido — Backend Morosos (Spring Boot + PostgreSQL + Microservicios)

Fecha: 2026-04-28 (UTC)
Estado: **aprobado para iniciar desarrollo real**

---

## 1) Arquitectura general corregida

Se mantiene la arquitectura de **2 microservicios**, sin gateway ni mensajería en esta etapa:

1. `morosos-service` (**primero**): núcleo funcional del negocio (inmuebles, deuda, seguimiento, cierres, reportes y configuración).
2. `auth-service` (**después**): autenticación/autorización, JWT, roles y permisos.

> Decisión clave: el desarrollo **no se bloquea** por seguridad. El `morosos-service` inicia con estrategia temporal de identidad técnica y queda preparado para integrar JWT cuando exista `auth-service`.

---

## 2) Responsabilidades por microservicio

### 2.1 `morosos-service` (prioridad inicial)
- Catálogo y configuración de:
  - Grupos
  - Distritos
  - GrupoDistritoConfig
  - Etapas
  - Motivos de cierre
  - Parámetros de seguimiento
- Gestión operativa de:
  - Inmuebles
  - Importación de inmuebles
  - Cargas de deuda y su detalle
  - Seguimiento por etapas
  - Cierre de proceso
  - Compromisos de pago
  - Observaciones
  - Historial y reportes
- Auditoría funcional (acciones individuales y masivas).
- Preparación de campos de seguridad futura (`created_by`, `updated_by`, trazabilidad de actor).

### 2.2 `auth-service` (implementación posterior)
- Login / refresh / logout.
- Identidad de usuario (`/me`).
- Gestión de roles y permisos.
- Emisión y validación de JWT.
- Exposición de claims para que `morosos-service` reemplace usuario técnico temporal por usuario autenticado.

---

## 3) Estrategia temporal sin autenticación

Mientras no exista `auth-service`, `morosos-service` operará así:

- Usuario técnico temporal configurable (ejemplo: `SYSTEM_MOROSOS_DEV`).
- Todos los agregados persistentes deben incluir:
  - `created_by`
  - `created_at`
  - `updated_by`
  - `updated_at`
- Auditoría lista para migración a claims JWT:
  - `actor_id` (temporalmente técnico)
  - `actor_type` (`TECHNICAL`/`USER`)
  - `source` (`API`, `BATCH`)
- Seguridad deshabilitada o mínima en perfil `dev`; validaciones de permisos se implementan como puntos de extensión (`PermissionEvaluator`) para activar más adelante.
- Contrato de API estable desde el inicio para evitar retrabajo al integrar autenticación.

---

## 4) Modelo de dominio completo

Entidades funcionales requeridas:

1. **Grupo**
2. **Distrito**
3. **GrupoDistritoConfig**
4. **Inmueble**
5. **CargaDeuda**
6. **CargaDeudaDetalle**
7. **CargaDeudaError**
8. **EtapaConfig**
9. **MotivoCierre**
10. **ParametroSeguimiento**
11. **CasoSeguimiento**
12. **CasoEvento**
13. **ProcesoCierre**
14. **ProcesoCierrePlanPago**
15. **ProcesoCierreCambioParametro**
16. **CompromisoPago**
17. **ObservacionInmueble**
18. **AuditLog**

Relaciones clave:
- `Inmueble` pertenece a `Grupo` y `Distrito`.
- `GrupoDistritoConfig` define si seguimiento está habilitado para combinación grupo+distrito.
- `CasoSeguimiento` representa proceso operativo sobre un inmueble.
- Un `CasoSeguimiento` puede cerrarse mediante `ProcesoCierre`.
- `ProcesoCierre` puede tener detalle único según motivo (`PlanPago` o `CambioParametro`).

---

## 5) Modelo de base de datos actualizado

> Tipos sugeridos: UUID para PK; `timestamp with time zone` para fechas/auditoría; índices por búsqueda y operación.

### 5.1 Tablas maestras

#### `grupo`
- `id UUID PK`
- `codigo varchar(50) UNIQUE NOT NULL`
- `nombre varchar(150) UNIQUE NOT NULL`
- `activo boolean NOT NULL default true`
- `created_by`, `created_at`, `updated_by`, `updated_at`

#### `distrito`
- `id UUID PK`
- `codigo varchar(50) UNIQUE NOT NULL`
- `nombre varchar(150) UNIQUE NOT NULL`
- `activo boolean NOT NULL default true`
- `created_by`, `created_at`, `updated_by`, `updated_at`

#### `grupo_distrito_config`
- `id UUID PK`
- `grupo_id UUID FK -> grupo(id) NOT NULL`
- `distrito_id UUID FK -> distrito(id) NOT NULL`
- `seguimiento_habilitado boolean NOT NULL`
- `created_by`, `created_at`, `updated_by`, `updated_at`
- `UNIQUE(grupo_id, distrito_id)`

#### `etapa_config`
- `id UUID PK`
- `codigo varchar(50) UNIQUE NOT NULL`
- `nombre varchar(150) NOT NULL`
- `orden int NOT NULL`
- `activo boolean NOT NULL default true`
- `es_final boolean NOT NULL default false`
- `created_by`, `created_at`, `updated_by`, `updated_at`
- `UNIQUE(orden)`

#### `motivo_cierre`
- `id UUID PK`
- `codigo varchar(50) UNIQUE NOT NULL`
- `nombre varchar(150) UNIQUE NOT NULL`
- `is_system boolean NOT NULL default false`
- `activo boolean NOT NULL default true`
- `created_by`, `created_at`, `updated_by`, `updated_at`

**Seeds obligatorios (`is_system = true`)**:
- `REGULARIZACION`
- `PLAN_DE_PAGO`
- `CAMBIO_PARAMETRO`

#### `parametro_seguimiento`
- `id UUID PK`
- `codigo varchar(100) UNIQUE NOT NULL`
- `valor varchar(500) NOT NULL`
- `descripcion varchar(500)`
- `created_by`, `created_at`, `updated_by`, `updated_at`

### 5.2 Núcleo operativo

#### `inmueble`
- `id UUID PK`
- `cuenta varchar(50) UNIQUE NOT NULL`
- `titular varchar(250) NOT NULL`
- `direccion varchar(300) NOT NULL`
- `grupo_id UUID FK -> grupo(id) NOT NULL`
- `distrito_id UUID FK -> distrito(id) NOT NULL`
- `activo boolean NOT NULL default true`
- `seguimiento_habilitado boolean NOT NULL default false`
- `telefono varchar(50)`
- `email varchar(150)`
- `observacion text NULL`
- `created_by`, `created_at`, `updated_by`, `updated_at`

#### `carga_deuda`
- `id UUID PK`
- `periodo varchar(20) NOT NULL`
- `estado varchar(30) NOT NULL`
- `archivo_nombre varchar(255)`
- `total_registros int NOT NULL`
- `procesados int NOT NULL`
- `errores int NOT NULL`
- `monto_total numeric(14,2) NOT NULL`
- `created_by`, `created_at`, `updated_by`, `updated_at`

#### `carga_deuda_detalle`
- `id UUID PK`
- `carga_deuda_id UUID FK -> carga_deuda(id) NOT NULL`
- `inmueble_id UUID FK -> inmueble(id) NOT NULL`
- `cuotas_vencidas int NOT NULL`
- `monto_vencido numeric(14,2) NOT NULL`
- `fecha_ultimo_vencimiento date`
- `created_by`, `created_at`, `updated_by`, `updated_at`
- `UNIQUE(carga_deuda_id, inmueble_id)`

#### `carga_deuda_error`
- `id UUID PK`
- `carga_deuda_id UUID FK -> carga_deuda(id) NOT NULL`
- `fila int NOT NULL`
- `cuenta varchar(50)`
- `motivo varchar(500) NOT NULL`
- `payload jsonb`
- `created_by`, `created_at`

#### `caso_seguimiento`
- `id UUID PK`
- `inmueble_id UUID FK -> inmueble(id) NOT NULL`
- `etapa_actual_id UUID FK -> etapa_config(id) NOT NULL`
- `estado varchar(30) NOT NULL`  -- ACTIVO/CERRADO
- `fecha_inicio timestamp with time zone NOT NULL`
- `fecha_ultimo_movimiento timestamp with time zone NOT NULL`
- `observacion text NULL`
- `created_by`, `created_at`, `updated_by`, `updated_at`

**Regla de unicidad de proceso activo por inmueble**:
- Índice único parcial recomendado (PostgreSQL):
  - `CREATE UNIQUE INDEX ux_caso_seguimiento_activo_inmueble ON caso_seguimiento(inmueble_id) WHERE estado = 'ACTIVO';`

#### `caso_evento`
- `id UUID PK`
- `caso_seguimiento_id UUID FK -> caso_seguimiento(id) NOT NULL`
- `tipo_evento varchar(50) NOT NULL` -- INICIO, AVANCE_ETAPA, REPETICION_ETAPA, CIERRE, COMPROMISO, OBSERVACION
- `etapa_origen_id UUID FK -> etapa_config(id)`
- `etapa_destino_id UUID FK -> etapa_config(id)`
- `fecha_evento timestamp with time zone NOT NULL`
- `observacion text NULL`
- `metadata jsonb`
- `created_by`, `created_at`

### 5.3 Modelo de cierre (obligatorio)

#### `proceso_cierre`
- `id UUID PK`
- `caso_seguimiento_id UUID FK -> caso_seguimiento(id) NOT NULL`
- `motivo_cierre_id UUID FK -> motivo_cierre(id) NOT NULL`
- `fecha_cierre timestamp with time zone NOT NULL`
- `observacion text NULL`
- `created_by`
- `created_at`

#### `proceso_cierre_plan_pago`
- `id UUID PK`
- `proceso_cierre_id UUID FK -> proceso_cierre(id) NOT NULL`
- `cantidad_cuotas int NOT NULL`
- `fecha_vencimiento_primera_cuota date NOT NULL`
- `UNIQUE(proceso_cierre_id)`

#### `proceso_cierre_cambio_parametro`
- `id UUID PK`
- `proceso_cierre_id UUID FK -> proceso_cierre(id) NOT NULL`
- `parametro varchar(150) NOT NULL`
- `valor_anterior varchar(500) NOT NULL`
- `valor_nuevo varchar(500) NOT NULL`
- `UNIQUE(proceso_cierre_id)`

> `REGULARIZACION` no tiene tabla adicional.

### 5.4 Complementarias

#### `compromiso_pago`
- `id UUID PK`
- `caso_seguimiento_id UUID FK -> caso_seguimiento(id) NOT NULL`
- `fecha_desde date NOT NULL`
- `fecha_hasta date NOT NULL`
- `monto_comprometido numeric(14,2)`
- `estado varchar(30) NOT NULL`
- `observacion text NULL`
- `created_by`, `created_at`, `updated_by`, `updated_at`

#### `observacion_inmueble`
- `id UUID PK`
- `inmueble_id UUID FK -> inmueble(id) NOT NULL`
- `caso_seguimiento_id UUID FK -> caso_seguimiento(id)`
- `observacion text NULL`
- `created_by`, `created_at`

#### `audit_log`
- `id UUID PK`
- `entity_type varchar(80) NOT NULL`
- `entity_id UUID NOT NULL`
- `action varchar(50) NOT NULL`
- `actor_id varchar(120) NOT NULL`
- `actor_type varchar(20) NOT NULL`
- `trace_id varchar(120)`
- `request_path varchar(255)`
- `old_values jsonb`
- `new_values jsonb`
- `created_at timestamp with time zone NOT NULL`

---

## 6) Reglas de negocio consolidadas

1. **Orden de implementación**: primero `morosos-service`, luego `auth-service`.
2. **No bloqueo por autenticación**: usar usuario técnico temporal al inicio.
3. **Observaciones**: todos los campos de observación son opcionales (`nullable`), no bloquean acciones ni cambios de etapa ni cierres.
4. **Un solo proceso activo por inmueble**: máximo 1 `CasoSeguimiento` ACTIVO por inmueble.
5. **Motivos de cierre de sistema (`isSystem=true`)**:
   - NO editables.
   - NO eliminables.
   - SÍ activables/desactivables.
6. **Motivos de sistema obligatorios**: `REGULARIZACION`, `PLAN_DE_PAGO`, `CAMBIO_PARAMETRO`.
7. **Motivos configurables (`isSystem=false`)**:
   - eliminables solo si uso = 0.
   - si uso > 0, solo desactivables.
8. **No eliminar grupo con inmuebles asociados**.
9. **No eliminar etapa con procesos asociados**.
10. **No eliminar motivo con uso > 0**.
11. **Seguimiento habilitado** depende de `grupo + distrito` (`grupo_distrito_config`).
12. **Acciones masivas**: transaccionales, auditables, con resultado detallado (procesados/omitidos/error).
13. **No retroceder etapa** salvo operación explícita de repetición definida por regla.
14. **Cierre de proceso** requiere consistencia motivo↔detalle (ver validaciones).

---

## 7) Endpoints REST de `morosos-service`

### 7.1 Configuración
- `GET /api/v1/grupos`
- `POST /api/v1/grupos`
- `PUT /api/v1/grupos/{id}`
- `DELETE /api/v1/grupos/{id}`
- `PATCH /api/v1/grupos/{id}/activo`
- `GET /api/v1/distritos`
- `POST /api/v1/distritos`
- `PUT /api/v1/distritos/{id}`
- `PATCH /api/v1/distritos/{id}/activo`
- `GET /api/v1/grupo-distrito-config`
- `PUT /api/v1/grupo-distrito-config/{id}`
- `GET /api/v1/etapas`
- `POST /api/v1/etapas`
- `PUT /api/v1/etapas/{id}`
- `POST /api/v1/etapas/reordenar`
- `DELETE /api/v1/etapas/{id}`
- `GET /api/v1/motivos-cierre`
- `POST /api/v1/motivos-cierre`
- `PUT /api/v1/motivos-cierre/{id}`
- `PATCH /api/v1/motivos-cierre/{id}/activo`
- `DELETE /api/v1/motivos-cierre/{id}`
- `GET /api/v1/parametros-seguimiento`
- `PUT /api/v1/parametros-seguimiento/{codigo}`

### 7.2 Inmuebles e importación
- `GET /api/v1/inmuebles` (paginado + filtros)
- `GET /api/v1/inmuebles/{id}`
- `PUT /api/v1/inmuebles/{id}`
- `PATCH /api/v1/inmuebles/{id}/activo`
- `PATCH /api/v1/inmuebles/{id}/seguimiento-habilitado`
- `POST /api/v1/inmuebles/importaciones`
- `GET /api/v1/inmuebles/importaciones/{id}`
- `GET /api/v1/inmuebles/importaciones/{id}/errores`

### 7.3 Deuda
- `GET /api/v1/deuda/cargas`
- `POST /api/v1/deuda/cargas`
- `GET /api/v1/deuda/cargas/{id}`
- `GET /api/v1/deuda/cargas/{id}/detalles`
- `GET /api/v1/deuda/cargas/{id}/errores`

### 7.4 Seguimiento operativo
- `GET /api/v1/seguimiento/bandeja`
- `POST /api/v1/seguimiento/iniciar`
- `POST /api/v1/seguimiento/avanzar`
- `POST /api/v1/seguimiento/repetir`
- `POST /api/v1/seguimiento/cerrar`
- `POST /api/v1/seguimiento/compromisos`
- `GET /api/v1/seguimiento/inmuebles/{inmuebleId}/historial`

### 7.5 Reportes y auditoría
- `GET /api/v1/reportes/{reporteId}`
- `GET /api/v1/reportes/{reporteId}/export?formato=pdf|xlsx`
- `GET /api/v1/auditoria/movimientos`

---

## 8) Endpoints REST futuros de `auth-service`

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/roles`
- `POST /api/v1/auth/roles`
- `PUT /api/v1/auth/roles/{id}`
- `GET /api/v1/auth/permisos`

Integración posterior en `morosos-service`:
- Validación de JWT.
- Resolución de `subject`, `roles`, `permissions` desde claims.
- Reemplazo de actor técnico por usuario autenticado en auditoría.

---

## 9) DTOs

### 9.1 Convenciones
- `Request` para entrada.
- `Response` para salida.
- `PageResponse<T>` para listados paginados.
- `BulkActionResultResponse` para acciones masivas.

### 9.2 DTOs principales
- `GrupoRequest`, `GrupoResponse`
- `DistritoRequest`, `DistritoResponse`
- `GrupoDistritoConfigRequest`, `GrupoDistritoConfigResponse`
- `EtapaConfigRequest`, `EtapaConfigResponse`, `EtapaReordenarRequest`
- `MotivoCierreRequest`, `MotivoCierreResponse`
- `ParametroSeguimientoResponse`, `ParametroSeguimientoUpdateRequest`
- `InmuebleFilterRequest`, `InmuebleUpdateRequest`, `InmuebleResponse`
- `ImportacionInmuebleRequest`, `ImportacionResultadoResponse`, `ImportacionErrorResponse`
- `CargaDeudaRequest`, `CargaDeudaResponse`, `CargaDeudaDetalleResponse`, `CargaDeudaErrorResponse`
- `IniciarSeguimientoRequest`, `AvanzarEtapaRequest`, `RepetirEtapaRequest`
- `CerrarProcesoRequest`:
  - `casoSeguimientoId`
  - `motivoCodigo`
  - `observacion?`
  - `planPago? { cantidadCuotas, fechaVencimientoPrimeraCuota }`
  - `cambioParametro? { parametro, valorAnterior, valorNuevo }`
- `CompromisoPagoRequest`, `CompromisoPagoResponse`
- `HistorialSeguimientoResponse`, `CasoEventoResponse`
- `ErrorResponse` (estándar)
- `AuditLogResponse`

---

## 10) Validaciones

### 10.1 Cierre por motivo (obligatorias)
1. Si `motivo = PLAN_DE_PAGO` → requiere `planPago`.
2. Si `motivo = CAMBIO_PARAMETRO` → requiere `cambioParametro`.
3. Si `motivo = REGULARIZACION` → no se permite detalle adicional.

### 10.2 Configuración y catálogos
- `codigo` y `nombre` únicos según entidad.
- `motivo_cierre.is_system=true` no editable/eliminable.
- Eliminación de motivo solo si uso = 0.

### 10.3 Seguimiento
- No iniciar proceso si inmueble inactivo o seguimiento no habilitado por grupo+distrito.
- Bloquear inicio si ya existe proceso ACTIVO para el inmueble.
- Validar transición de etapa según reglas del motor.

### 10.4 Importaciones/cargas
- Validación de columnas requeridas.
- Consolidación de errores por fila.
- Persistencia transaccional por lote (con estrategia definida: fail-fast o partial con reporte).

---

## 11) Manejo de errores

Formato estándar sugerido:

```json
{
  "timestamp": "2026-04-28T10:00:00Z",
  "status": 422,
  "code": "VALIDATION_ERROR",
  "message": "Error de validación",
  "details": [
    {"field":"motivoCodigo","error":"PLAN_DE_PAGO requiere planPago"}
  ],
  "traceId": "..."
}
```

Códigos recomendados:
- `400` request inválido.
- `404` recurso inexistente.
- `409` conflicto de negocio (ej. proceso activo existente).
- `422` validación de regla.
- `500` error inesperado.

Excepciones de dominio explícitas:
- `BusinessRuleException`
- `ResourceNotFoundException`
- `ConflictException`
- `ValidationException`

---

## 12) Auditoría

### 12.1 Qué auditar
- Altas, ediciones, bajas lógicas/físicas permitidas.
- Acciones de seguimiento (inicio, avance, repetición, cierre).
- Acciones masivas (input, resultado, omitidos, errores).
- Cambios de configuración sensible (etapas, parámetros, motivos).

### 12.2 Requisitos
- Registro en `audit_log` por operación.
- Captura de `old_values` y `new_values` cuando aplique.
- `trace_id` para correlación.
- Actor técnico temporal mientras no exista auth.
- Diseño listo para actor real via JWT posteriormente.

---

## 13) Estructura de paquetes (propuesta Spring Boot)

```text
pe.morosos
  ├─ config
  ├─ common
  │   ├─ exception
  │   ├─ api
  │   └─ util
  ├─ security        (modo temporal dev + futura integración JWT)
  ├─ audit
  ├─ grupo
  ├─ distrito
  ├─ grupodistrito
  ├─ inmueble
  ├─ importacion
  ├─ deuda
  ├─ etapa
  ├─ motivocierre
  ├─ parametro
  ├─ seguimiento
  │   ├─ caso
  │   ├─ evento
  │   ├─ cierre
  │   └─ compromiso
  ├─ observacion
  └─ reporte
```

Patrón por módulo:
- `controller`
- `service`
- `domain` / `entity`
- `repository`
- `dto`
- `mapper`
- `validator`

---

## 14) Roadmap completo

1. Construir `morosos-service` end-to-end (funcionalidad primero).
2. Dejar hooks de seguridad/auditoría preparados desde el día 1.
3. Cerrar operación funcional completa (inmuebles + deuda + seguimiento + cierres + reportes).
4. Implementar `auth-service` en etapa posterior.
5. Integrar JWT y reemplazar usuario técnico temporal.

---

## Plan de inicio de desarrollo con Codex

### Etapa 0 — Base técnica de morosos-service
- Crear proyecto Spring Boot.
- Configurar PostgreSQL.
- Configurar Flyway.
- Configurar perfiles `dev` y `test`.
- Agregar healthcheck.
- Agregar OpenAPI/Swagger.
- Crear estructura de paquetes.
- Agregar manejo global de errores.
- Agregar auditoría base con usuario técnico temporal.

### Etapa 1 — Configuración base
- Grupos.
- Distritos.
- GrupoDistritoConfig.
- Etapas.
- Parámetros de seguimiento.
- Motivos de cierre.
- Seed inicial:
  - `REGULARIZACION`
  - `PLAN_DE_PAGO`
  - `CAMBIO_PARAMETRO`

### Etapa 2 — Inmuebles
- Listado paginado.
- Filtros.
- Detalle.
- Edición.
- Validación de grupo+distrito.
- Seguimiento habilitado según grupo+distrito.

### Etapa 3 — Importación de inmuebles
- Upload archivo.
- Validación de columnas.
- Creación/actualización.
- Resultado de importación.
- Errores por fila.

### Etapa 4 — Gestión de deuda
- Cargas de deuda.
- Detalle de carga.
- Errores.
- Estado de deuda por inmueble.
- Actualización de cuotas y monto.

### Etapa 5 — Seguimiento operativo
- Bandeja de seguimiento.
- Inicio de proceso.
- Avance de etapa.
- Repetición de etapa.
- Cierre de proceso.
- Compromiso de pago.
- Motor de reglas.
- Auditoría de acciones masivas.

### Etapa 6 — Historial y reportes
- Historial por inmueble.
- Movimientos/auditoría.
- Reportes principales.
- Exportaciones básicas.

### Etapa 7 — Auth-service
- Crear microservicio de autenticación.
- Login.
- Refresh.
- Logout.
- `/me`.
- Roles y permisos.
- JWT.
- Integración de claims JWT con `morosos-service`.
- Reemplazar usuario técnico temporal por usuario autenticado.

---

## Cierre ejecutivo

Este informe deja el backend **listo para ejecución inmediata**, con foco en negocio real de `morosos-service`, reglas cerradas de seguimiento/cierre, base de datos consistente y camino de integración futura con `auth-service` sin frenar entregables funcionales.
