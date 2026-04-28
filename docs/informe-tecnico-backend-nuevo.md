# Informe técnico definitivo — Backend Plataforma Morosos

Fecha: 2026-04-28 (UTC)  
Estado: **aprobado para iniciar desarrollo real con Codex**

---

## 1) Arquitectura general

Se mantiene la arquitectura aprobada de **2 microservicios** y el orden de implementación es obligatorio:

1. **`morosos-service` (primero)**: concentra toda la funcionalidad del negocio.
2. **`auth-service` (después)**: incorpora autenticación/autorización con JWT.

Decisiones de alcance (cerradas):
- No se agrega gateway.
- No se agrega mensajería.
- No se implementa auth primero.
- Se prioriza entrega funcional en `morosos-service` sin bloquear por seguridad.

---

## 2) Responsabilidades por microservicio

### 2.1 `morosos-service` (fase inicial obligatoria)
- Configuración base:
  - grupos
  - distritos
  - grupo_distrito_config
  - etapas
  - parámetros de seguimiento
  - motivos de cierre
- Operación:
  - inmuebles
  - importación de inmuebles
  - deuda y cargas
  - seguimiento y timeline
  - cierre de procesos
  - compromisos
  - reportes
  - historial
- Auditoría de acciones individuales y masivas.
- Preparación estructural para reemplazar actor técnico por actor JWT.

### 2.2 `auth-service` (fase posterior)
- login
- refresh
- logout
- `/me`
- roles
- permisos
- emisión/validación de JWT
- integración con `morosos-service`

---

## 3) Estrategia temporal sin autenticación

Mientras no exista `auth-service`:
- Se usa usuario técnico temporal (ejemplo: `SYSTEM_MOROSOS`).
- Se registran campos de auditoría en entidades de negocio:
  - `created_by`
  - `created_at`
  - `updated_by`
  - `updated_at`
- En auditoría central se utiliza actor técnico temporal.
- No se frena el flujo funcional por ausencia de login/JWT.
- Se mantiene contrato listo para integrar JWT sin romper APIs.

---

## 4) Modelo de dominio

Entidades principales:
1. Grupo
2. Distrito
3. GrupoDistritoConfig
4. EtapaConfig
5. ParametroSeguimiento
6. MotivoCierre
7. Inmueble
8. CargaDeuda
9. CargaDeudaDetalle
10. CargaDeudaError
11. CasoSeguimiento
12. CasoEvento
13. ProcesoCierre
14. ProcesoCierrePlanPago
15. ProcesoCierreCambioParametro
16. CompromisoPago
17. ObservacionInmueble
18. AuditLog

Relaciones claves:
- `grupo_distrito_config.seguimiento_habilitado` define habilitación general de seguimiento por combinación grupo+distrito.
- `inmueble.seguimiento_habilitado` se mantiene como **configuración particular** para excepciones (ej.: judicializado, caso especial, excepción operativa).
- `CasoSeguimiento` representa el proceso operativo de seguimiento sobre un inmueble.
- El historial/timeline se registra en `CasoEvento`.
- El cierre se modela en `ProcesoCierre` y detalles por tipo cuando corresponda.

---

## 5) Modelo de base de datos corregido

Convenciones:
- PK UUID.
- `timestamp with time zone` para fechas de auditoría/eventos.
- Campos de observación en `NULL`.

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

**Seeds de sistema obligatorios (`is_system = true`):**
- `REGULARIZACION`
- `PLAN_DE_PAGO`
- `CAMBIO_PARAMETRO`

#### `parametro_seguimiento`
- `id UUID PK`
- `codigo varchar(100) UNIQUE NOT NULL`
- `valor varchar(500) NOT NULL`
- `descripcion varchar(500) NULL`
- `created_by`, `created_at`, `updated_by`, `updated_at`

### 5.2 Operación

#### `inmueble`
- `id UUID PK`
- `cuenta varchar(50) UNIQUE NOT NULL`
- `titular varchar(250) NOT NULL`
- `direccion varchar(300) NOT NULL`
- `grupo_id UUID FK -> grupo(id) NOT NULL`
- `distrito_id UUID FK -> distrito(id) NOT NULL`
- `activo boolean NOT NULL default true`
- `seguimiento_habilitado boolean NOT NULL default true`
- `telefono varchar(50) NULL`
- `email varchar(150) NULL`
- `observacion text NULL`
- `created_by`, `created_at`, `updated_by`, `updated_at`

Interpretación obligatoria:
- `grupo_distrito_config.seguimiento_habilitado` = regla general.
- `inmueble.seguimiento_habilitado` = override particular para desactivar casos excepcionales.

#### `carga_deuda`
- `id UUID PK`
- `periodo date NOT NULL`
- `estado varchar(30) NOT NULL`
- `archivo_nombre varchar(255) NULL`
- `total_registros int NOT NULL`
- `procesados int NOT NULL`
- `errores int NOT NULL`
- `monto_total numeric(14,2) NOT NULL`
- `created_by`, `created_at`, `updated_by`, `updated_at`

Regla de período:
- El período representa el mes de la carga.
- Se guarda como el primer día del mes.
- Ejemplo: abril 2026 = `2026-04-01`.

#### `carga_deuda_detalle`
- `id UUID PK`
- `carga_deuda_id UUID FK -> carga_deuda(id) NOT NULL`
- `inmueble_id UUID FK -> inmueble(id) NOT NULL`
- `cuotas_vencidas int NOT NULL`
- `monto_vencido numeric(14,2) NOT NULL`
- `fecha_ultimo_vencimiento date NULL`
- `created_by`, `created_at`, `updated_by`, `updated_at`
- `UNIQUE(carga_deuda_id, inmueble_id)`

#### `carga_deuda_error`
- `id UUID PK`
- `carga_deuda_id UUID FK -> carga_deuda(id) NOT NULL`
- `fila int NOT NULL`
- `cuenta varchar(50) NULL`
- `motivo varchar(500) NOT NULL`
- `payload jsonb NULL`
- `created_by`, `created_at`

#### `caso_seguimiento`
- `id UUID PK`
- `inmueble_id UUID FK -> inmueble(id) NOT NULL`
- `etapa_actual_id UUID FK -> etapa_config(id) NOT NULL`
- `estado varchar(20) NOT NULL`
- `fecha_inicio timestamp with time zone NOT NULL`
- `fecha_ultimo_movimiento timestamp with time zone NOT NULL`
- `observacion text NULL`
- `created_by`, `created_at`, `updated_by`, `updated_at`

Constraints obligatorios:
```sql
CHECK (estado IN ('ABIERTO', 'PAUSADO', 'CERRADO'))
```

```sql
CREATE UNIQUE INDEX ux_caso_abierto_por_inmueble
ON caso_seguimiento(inmueble_id)
WHERE estado = 'ABIERTO';
```

#### `caso_evento`
- `id UUID PK`
- `caso_seguimiento_id UUID FK -> caso_seguimiento(id) NOT NULL`
- `tipo_evento varchar(50) NOT NULL`
- `etapa_origen_id UUID FK -> etapa_config(id) NULL`
- `etapa_destino_id UUID FK -> etapa_config(id) NULL`
- `fecha_evento timestamp with time zone NOT NULL`
- `observacion text NULL`
- `metadata jsonb NULL`
- `created_by`, `created_at`

`tipo_evento` es un catálogo/enum funcional del historial/timeline del caso.  
Valores iniciales:
- `INICIO_PROCESO`
- `AVANCE_ETAPA`
- `REPETICION_ETAPA`
- `CIERRE_PROCESO`
- `COMPROMISO_REGISTRADO`
- `COMPROMISO_INCUMPLIDO`
- `CAMBIO_PARAMETRO`
- `OBSERVACION`

### 5.3 Cierre de proceso

#### `proceso_cierre`
- `id UUID PK`
- `caso_seguimiento_id UUID FK -> caso_seguimiento(id) NOT NULL`
- `motivo_cierre_id UUID FK -> motivo_cierre(id) NOT NULL`
- `fecha_cierre timestamp with time zone NOT NULL`
- `observacion text NULL`
- `created_by`
- `created_at`
- `UNIQUE(caso_seguimiento_id)`

Regla:
- Un caso de seguimiento solo puede tener un cierre.

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

Para `REGULARIZACION` no existe tabla adicional.

### 5.4 Complementarias

#### `compromiso_pago`
- `id UUID PK`
- `caso_seguimiento_id UUID FK -> caso_seguimiento(id) NOT NULL`
- `fecha_desde date NOT NULL`
- `fecha_hasta date NOT NULL`
- `monto_comprometido numeric(14,2) NULL`
- `estado varchar(30) NOT NULL`
- `observacion text NULL`
- `created_by`, `created_at`, `updated_by`, `updated_at`

#### `observacion_inmueble`
- `id UUID PK`
- `inmueble_id UUID FK -> inmueble(id) NOT NULL`
- `caso_seguimiento_id UUID FK -> caso_seguimiento(id) NULL`
- `observacion text NULL`
- `created_by`, `created_at`

#### `audit_log`
- `id UUID PK`
- `entity_type varchar(80) NOT NULL`
- `entity_id UUID NOT NULL`
- `action varchar(50) NOT NULL`
- `actor_id UUID NULL`
- `trace_id varchar(120) NULL`
- `request_path varchar(255) NULL`
- `old_values jsonb NULL`
- `new_values jsonb NULL`
- `created_at timestamp with time zone NOT NULL`

---

## 6) Reglas de negocio consolidadas

1. Se desarrolla primero `morosos-service`, luego `auth-service`.
2. `seguimiento_habilitado` en inmueble **se mantiene** y funciona como excepción particular sobre la regla general grupo+distrito.
3. Observaciones: siempre opcionales (`NULL`), no bloquean acciones, cambios de etapa ni cierres.
4. Estados válidos de proceso: `ABIERTO`, `PAUSADO`, `CERRADO`.
5. No permitir cerrar un proceso ya cerrado.
6. No permitir acciones operativas sobre procesos cerrados.
7. Un inmueble solo puede tener un proceso `ABIERTO` a la vez.
8. Motivos de sistema (`isSystem=true`) no editables, no eliminables, sí activables/desactivables.
9. Motivos configurables (`isSystem=false`):
   - se pueden crear
   - se pueden editar
   - se pueden activar/desactivar
   - se pueden eliminar solo si no tienen usos
   - si tienen usos, solo se pueden desactivar
10. No eliminar grupos con inmuebles asociados.
11. No eliminar etapas con procesos asociados.
12. No eliminar motivos con uso > 0.
13. Acciones masivas: transaccionales y auditables.
14. Cierre por motivo:
    - `PLAN_DE_PAGO` requiere detalle en `proceso_cierre_plan_pago`.
    - `CAMBIO_PARAMETRO` requiere detalle en `proceso_cierre_cambio_parametro`.
    - `REGULARIZACION` no admite detalle.

---

## 7) Endpoints REST (morosos primero)

### Configuración
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

- `GET /api/v1/parametros-seguimiento`
- `PUT /api/v1/parametros-seguimiento/{codigo}`

- `GET /api/v1/motivos-cierre`
- `POST /api/v1/motivos-cierre`
- `PUT /api/v1/motivos-cierre/{id}`
- `PATCH /api/v1/motivos-cierre/{id}/activo`
- `DELETE /api/v1/motivos-cierre/{id}`

### Inmuebles
- `GET /api/v1/inmuebles` (filtros + paginación)
- `GET /api/v1/inmuebles/{id}`
- `PUT /api/v1/inmuebles/{id}`
- `PATCH /api/v1/inmuebles/{id}/activo`
- `PATCH /api/v1/inmuebles/{id}/seguimiento-habilitado`

### Importación
- `POST /api/v1/inmuebles/importaciones`
- `GET /api/v1/inmuebles/importaciones/{id}`
- `GET /api/v1/inmuebles/importaciones/{id}/errores`

### Deuda
- `GET /api/v1/deuda/cargas`
- `POST /api/v1/deuda/cargas`
- `GET /api/v1/deuda/cargas/{id}`
- `GET /api/v1/deuda/cargas/{id}/detalles`
- `GET /api/v1/deuda/cargas/{id}/errores`

### Seguimiento
- `GET /api/v1/seguimiento/bandeja`
- `POST /api/v1/seguimiento/iniciar`
- `POST /api/v1/seguimiento/avanzar`
- `POST /api/v1/seguimiento/repetir`
- `POST /api/v1/seguimiento/pausar`
- `POST /api/v1/seguimiento/reabrir`
- `POST /api/v1/seguimiento/cerrar`
- `POST /api/v1/seguimiento/compromisos`
- `GET /api/v1/seguimiento/inmuebles/{inmuebleId}/historial`

### Reportes y auditoría
- `GET /api/v1/reportes/{reporteId}`
- `GET /api/v1/reportes/{reporteId}/export?formato=pdf|xlsx`
- `GET /api/v1/auditoria/movimientos`

### Endpoints futuros de `auth-service`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/roles`
- `POST /api/v1/auth/roles`
- `PUT /api/v1/auth/roles/{id}`
- `GET /api/v1/auth/permisos`

---

## 8) DTOs

Convenciones:
- `*Request` entrada.
- `*Response` salida.
- `PageResponse<T>` para paginación.
- `BulkActionResultResponse` para masivos.

DTOs principales:
- `GrupoRequest/Response`, `DistritoRequest/Response`, `GrupoDistritoConfigRequest/Response`.
- `EtapaConfigRequest/Response`, `EtapaReordenarRequest`.
- `MotivoCierreRequest/Response`.
- `ParametroSeguimientoRequest/Response`.
- `InmuebleFilterRequest`, `InmuebleUpdateRequest`, `InmuebleResponse`.
- `ImportacionInmuebleRequest`, `ImportacionResultadoResponse`, `ImportacionErrorResponse`.
- `CargaDeudaRequest`, `CargaDeudaResponse`, `CargaDeudaDetalleResponse`, `CargaDeudaErrorResponse`.
- `IniciarSeguimientoRequest`, `AvanzarEtapaRequest`, `RepetirEtapaRequest`, `PausarCasoRequest`, `ReabrirCasoRequest`.
- `CerrarProcesoRequest`:
  - `casoSeguimientoId`
  - `motivoCodigo`
  - `observacion?`
  - `planPago? { cantidadCuotas, fechaVencimientoPrimeraCuota }`
  - `cambioParametro? { parametro, valorAnterior, valorNuevo }`
- `CompromisoPagoRequest/Response`.
- `CasoEventoResponse`, `HistorialSeguimientoResponse`.
- `ErrorResponse`.

---

## 9) Validaciones

1. `CHECK (estado IN ('ABIERTO', 'PAUSADO', 'CERRADO'))`.
2. Único caso `ABIERTO` por inmueble (índice parcial).
3. `UNIQUE(caso_seguimiento_id)` en `proceso_cierre`.
4. FK y `UNIQUE(proceso_cierre_id)` en tablas detalle de cierre.
5. No cerrar procesos ya cerrados.
6. No permitir acciones sobre procesos cerrados.
7. Validación motivo/detalle:
   - `PLAN_DE_PAGO` requiere detalle.
   - `CAMBIO_PARAMETRO` requiere detalle.
   - `REGULARIZACION` no admite detalle.
8. Validar regla general (`grupo_distrito_config`) + excepción particular (`inmueble.seguimiento_habilitado`) para habilitar seguimiento.
9. En acciones masivas: validación previa, ejecución transaccional y auditoría obligatoria.

---

## 10) Manejo de errores

Formato estándar:

```json
{
  "timestamp": "2026-04-28T12:00:00Z",
  "status": 409,
  "code": "BUSINESS_RULE_CONFLICT",
  "message": "No se permite cerrar un caso ya cerrado",
  "details": [
    {"field": "casoSeguimientoId", "error": "Estado actual CERRADO"}
  ],
  "traceId": "4f1c9e8b"
}
```

HTTP sugeridos:
- `400` request inválido
- `404` no encontrado
- `409` conflicto de negocio
- `422` validación funcional
- `500` error inesperado

Excepciones de dominio:
- `ValidationException`
- `BusinessRuleException`
- `ConflictException`
- `ResourceNotFoundException`

---

## 11) Auditoría

- Toda acción relevante registra evento en `audit_log`.
- `actor_id UUID NULL` (sin `actor_username` por ahora).
- Mientras no exista `auth-service`, se usa actor técnico temporal.
- Al integrar JWT, `actor_id` será el identificador del usuario autenticado.
- Se registran: acción, entidad, cambios old/new, `trace_id`, path y timestamp.

---

## 12) Estructura de paquetes (Spring Boot)

```text
pe.morosos
  ├─ config
  ├─ common
  │   ├─ api
  │   ├─ exception
  │   └─ util
  ├─ security        (modo temporal + futura integración JWT)
  ├─ audit
  ├─ grupo
  ├─ distrito
  ├─ grupodistrito
  ├─ etapa
  ├─ parametro
  ├─ motivocierre
  ├─ inmueble
  ├─ importacion
  ├─ deuda
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
- `repository`
- `entity` / `domain`
- `dto`
- `mapper`
- `validator`

---

## 13) Roadmap

1. Implementar `morosos-service` end-to-end.
2. Completar configuración + inmuebles + importación + deuda.
3. Completar seguimiento + cierre + compromisos + historial.
4. Consolidar reportes y auditoría.
5. Implementar `auth-service`.
6. Integrar JWT en `morosos-service`.

---

## 14) Plan de inicio con Codex

### Etapa 0 — Base técnica (morosos-service)
- Spring Boot
- PostgreSQL
- Flyway
- perfiles `dev/test`
- OpenAPI
- manejo global de errores
- auditoría base con usuario técnico

### Etapa 1 — Configuración base
- grupos
- distritos
- grupo_distrito_config
- etapas
- parámetros
- motivos de cierre

Seed obligatorio:
- `REGULARIZACION`
- `PLAN_DE_PAGO`
- `CAMBIO_PARAMETRO`

### Etapa 2 — Inmuebles
- listado
- filtros
- paginación
- detalle
- edición
- validación de grupo+distrito
- soporte de excepción por `inmueble.seguimiento_habilitado`

### Etapa 3 — Importación de inmuebles
- carga de archivo
- validación de estructura
- procesamiento
- errores por fila

### Etapa 4 — Deuda
- cargas
- detalle
- errores
- consultas por período (`DATE`, primer día del mes)

### Etapa 5 — Seguimiento
- bandeja
- iniciar proceso
- avanzar etapa
- repetir etapa
- pausar/reabrir
- cerrar proceso
- compromiso
- motor de reglas
- timeline por `tipo_evento`

### Etapa 6 — Historial y reportes
- historial por inmueble
- auditoría consultable
- reportes y exportaciones

### Etapa 7 — auth-service
- login
- refresh
- logout
- me
- roles
- permisos
- JWT
- integración con morosos-service

---

## Cierre ejecutivo

Este informe deja una especificación única, consistente y accionable para iniciar desarrollo real, respetando la prioridad de `morosos-service`, manteniendo simplicidad arquitectónica y asegurando compatibilidad futura con `auth-service`.
