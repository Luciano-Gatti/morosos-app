# Informe técnico: backend para frontend de Morosos (Spring Boot + PostgreSQL + microservicios)

Fecha de análisis: 2026-04-28 (UTC)

---

## 1. Resumen general del frontend

### Módulos detectados
- Dashboard operativo.
- Inmuebles (listado, importación y detalle/configuración).
- Gestión de deuda (cargas y detalle de carga con errores).
- Gestión de etapas (bandeja operativa con acciones masivas).
- Historial de seguimiento por inmueble.
- Reportes (7 reportes con exportación PDF/XLSX).
- Configuración:
  - Grupos.
  - Parámetros de seguimiento.
  - Etapas.
  - Motivos de cierre.
- Vistas placeholder o incompletas:
  - `/configuracion` (placeholder).
  - `ConfiguracionMotivos.tsx` (existe como pantalla, pero no está enrutable en `App.tsx`).

### Objetivo funcional del sistema
Aplicación administrativa para:
1. gestionar padrón de inmuebles,
2. importar y auditar deuda,
3. identificar morosos según umbral configurable,
4. operar un flujo de seguimiento por etapas (avances, repetición, cierre, compromisos),
5. consultar historial y reportes operativos.

### Nivel de madurez del frontend
- **UI/UX avanzada**: tablas, filtros, paginados, estados visuales y modales de confirmación bien definidos.
- **Integración backend baja**: predomina uso de mocks y estado local; no hay capa real de servicios HTTP activa.
- **Conclusión**: el frontend es un prototipo funcional de negocio listo para “contract-first” de API, pero no aún para producción integrada.

---

## 2. Inventario de pantallas

> Nota: en varias vistas hay acciones visuales que hoy no persisten (mock/local state). Se marca como **[pendiente backend]**.

### 2.1 Dashboard
- **Ruta**: `/`
- **Propósito**: tablero ejecutivo/operativo (morosidad, actividad del mes, análisis por distrito, últimos movimientos).
- **Acciones**:
  - Navegar a “Historial de movimientos” (CTA “Ver más”).
- **Datos mostrados**:
  - Total padrón, al día, deudores, morosos.
  - KPIs de acciones mensuales.
  - Tarjetas por distrito.
  - Tabla de últimos movimientos.
- **Filtros**: no.
- **Formularios/modales**: no.
- **Eventos relevantes**: click de navegación a reportes.

### 2.2 Inmuebles (listado)
- **Ruta**: `/inmuebles`
- **Propósito**: consulta y navegación al detalle del inmueble; disparo de importación.
- **Acciones**:
  - Buscar por cuenta/titular/dirección.
  - Filtrar por grupo, distrito, estado.
  - Ordenar columnas.
  - Paginación.
  - Abrir modal de importación.
  - Ver detalle del inmueble.
- **Datos mostrados**:
  - cuenta, titular, dirección, grupo, distrito, estado.
- **Filtros**: campo+query, grupo, distrito, estado.
- **Formularios/modales**:
  - `ImportarInmueblesDialog`.
- **Eventos relevantes**:
  - `Importar`: validación de extensión y simulación de resultado con errores CSV.

### 2.3 Importar inmuebles (modal)
- **Ruta lógica**: modal en `/inmuebles`
- **Propósito**: cargar padrón masivo (xlsx/xls/csv).
- **Acciones**:
  - seleccionar archivo (click/drag&drop), procesar, descargar CSV de errores.
- **Datos mostrados**:
  - resumen de procesados/creados/actualizados/errores/no encontradas.
  - detalle de errores por fila/cuenta/motivo.
- **Validaciones visibles**:
  - extensión válida.
  - columnas requeridas (texto instruccional): cuenta, titular, dirección, grupo, distrito.

### 2.4 Inmueble detalle
- **Ruta**: `/inmuebles/:id`
- **Propósito**: ver datos y editar configuración operativa del inmueble.
- **Acciones**:
  - editar/cancelar/guardar.
  - cambiar distrito/grupo (con validación contextual).
  - activar/inactivar inmueble.
  - activar/desactivar seguimiento según elegibilidad.
  - navegar a accesos relacionados.
- **Datos mostrados**:
  - identificatorios + contacto + flags operativos + resumen operativo.
- **Filtros**: no.
- **Formularios/modales**: edición inline.
- **Eventos relevantes**:
  - grupo depende de distrito.
  - seguimiento depende de activo + configuración grupo/distrito.

### 2.5 Historial de seguimiento
- **Ruta**: `/inmuebles/:id/seguimiento`
- **Propósito**: trazabilidad completa por procesos y actuaciones.
- **Acciones**:
  - alternar vista línea de tiempo / tabla.
  - volver a inmueble.
- **Datos mostrados**:
  - datos del inmueble, proceso actual, etapa/estado, procesos históricos, compromisos, cierres, observaciones libres.
- **Filtros**: no.
- **Formularios/modales**: no.

### 2.6 Gestión de deuda
- **Ruta**: `/deuda`
- **Propósito**: administración de cargas de deuda.
- **Acciones**:
  - buscar por nombre/operador.
  - filtrar por período y estado.
  - ordenar por fecha/carga/morosos/monto.
  - paginar.
  - ver detalle de carga.
  - CTA “Plantilla” y “Cargar deuda” (**[pendiente backend/flujo real]**).
- **Datos mostrados**:
  - carga, fecha/hora, estado, morosos, monto, métricas de importación.

### 2.7 Detalle de carga
- **Ruta**: `/deuda/:id`
- **Propósito**: inspección de inmuebles incluidos y errores de importación.
- **Acciones**:
  - filtros por query, cuotas mín., monto mín.
  - orden/paginación.
  - abrir modal de errores.
  - exportar detalle (**[pendiente backend]**).
- **Datos mostrados**:
  - resumen de la carga + tabla de inmuebles + lista de errores.

### 2.8 Gestión de etapas
- **Ruta**: `/etapas`
- **Propósito**: operación masiva del flujo de seguimiento.
- **Acciones**:
  - filtros múltiples + selección masiva por página.
  - acciones masivas:
    - enviar a etapa específica,
    - enviar a siguiente,
    - repetir etapa,
    - iniciar proceso,
    - cerrar proceso,
    - registrar compromiso de pago.
- **Datos mostrados**:
  - datos del inmueble, deuda, etapa actual, fecha programada, estado.
- **Formularios/modales**:
  - mover etapa,
  - confirmar avanzar/repetir,
  - cerrar proceso (motivo + datos dinámicos),
  - compromiso de pago (desde/hasta/observación).
- **Eventos relevantes**:
  - no retroceso de etapas.
  - reglas de omitidos según estado/etapa.

### 2.9 Reportes (catálogo y detalle)
- **Ruta**:
  - `/reportes` (catálogo)
  - `/reportes/:reporteId` (detalle)
- **Propósito**: reporting operativo + exportación.
- **Reportes detectados**:
  1. morosos por grupo y distrito
  2. avisos/intimaciones/cortes
  3. regularizaciones y planes
  4. estado de inmuebles
  5. acciones entre fechas
  6. porcentajes de morosidad
  7. historial de movimientos
- **Acciones**:
  - filtros de período (presets + desde/hasta) cuando aplica.
  - paginación en tablas.
  - exportar PDF/XLSX.

### 2.10 Configuración - Grupos
- **Ruta**: `/configuracion/grupos`
- **Propósito**: CRUD de grupos y configuración grupo↔distrito↔seguimiento.
- **Acciones**:
  - buscar, crear, editar, eliminar (con restricciones), configurar distritos.
  - activar/desactivar seguimiento por distrito dentro del grupo.
- **Reglas visibles**:
  - no eliminar grupo con inmuebles asociados.
  - no quitar distrito si tiene inmuebles.

### 2.11 Configuración - Seguimiento
- **Ruta**: `/configuracion/seguimiento`
- **Propósito**: parámetros globales del motor de seguimiento.
- **Acciones**:
  - cambiar umbral de cuotas moroso, días entre etapas, modo operación, toggles automáticos.
  - guardar con modal de impacto.
- **Reglas visibles**:
  - validaciones numéricas (rangos).
  - cálculo de impacto de cambio de umbral.

### 2.12 Configuración - Etapas
- **Ruta**: `/configuracion/etapas`
- **Propósito**: CRUD + ordenamiento del flujo de etapas.
- **Acciones**:
  - crear/editar/eliminar/reordenar (drag & drop / flechas).
  - guardar o descartar reordenamiento.
- **Reglas visibles**:
  - no eliminar etapa con procesos asociados.

### 2.13 Configuración - Motivos de cierre
- **Ruta**: `/configuracion/motivos-cierre`
- **Propósito**: catálogo de motivos para cierre de proceso.
- **Acciones**:
  - buscar/filtrar, crear, editar, activar/desactivar, eliminar.
- **Reglas visibles**:
  - motivos de sistema no editables/eliminables.
  - no eliminar motivos con usos > 0.
  - nombre único.

### 2.14 Pantallas no conectadas o placeholder
- **Ruta**: `/configuracion` (placeholder).
- **Pantalla existente pero no enrutable**: `ConfiguracionMotivos.tsx` (motivos del proceso por etapa), potencialmente desfasada con `Motivos de cierre`.
- **Rutas sugeridas desde UI sin implementación en router**:
  - `/inmuebles/:id/deuda`
  - `/inmuebles/:id/observaciones`

---

## 3. Modelo de dominio inferido

> Entidades candidatas para backend. Si algo no es inequívoco se marca **[supuesto]**.

1. **Usuario**
   - Campos: id, username, nombre, apellido, email, activo, rol(es).
   - Relaciones: 1..N con movimientos/auditoría; 1..N con cargas.
   - Observaciones: UI muestra operador logueado y responsable de acciones.

2. **Rol / Permiso**
   - Campos: id, código, nombre, permisos[].
   - Relaciones: N..N con Usuario.

3. **Grupo**
   - Campos: id, nombre, descripción, actualizado.
   - Relaciones: 1..N con GrupoDistrito; 1..N con Inmueble.

4. **Distrito**
   - Campos: id, nombre, activo.
   - Relaciones: N..N con Grupo (vía GrupoDistrito); 1..N con Inmueble.

5. **GrupoDistrito** (tabla puente con atributos)
   - Campos: grupoId, distritoId, seguimientoHabilitado.
   - Relaciones: N..1 Grupo, N..1 Distrito.

6. **Inmueble**
   - Campos: id, numeroCuenta, titular, dirección, grupoId, distritoId, activo, teléfono, email, seguimientoHabilitado, observacionesInternas.
   - Relaciones: N..1 Grupo, N..1 Distrito, 1..N EstadoDeuda, 1..N ProcesoSeguimiento.

7. **CargaDeuda**
   - Campos: id, nombre, fechaHora, usuarioId, estado, procesados, creados, actualizados, errores, noEncontradas, morosos, montoTotal.
   - Relaciones: 1..N CargaDeudaDetalle, 1..N ErrorImportacion.

8. **CargaDeudaDetalle**
   - Campos: id, cargaId, inmuebleId [o cuenta], cuotasAdeudadas, montoAdeudado.
   - Relaciones: N..1 CargaDeuda; N..1 Inmueble.

9. **ErrorImportacion**
   - Campos: id, cargaId, fila, cuenta, motivo.
   - Relaciones: N..1 CargaDeuda.

10. **EstadoDeuda (snapshot operativo por inmueble)**
   - Campos: id, inmuebleId, cuotasAdeudadas, montoAdeudado, fechaActualizacion.
   - Relaciones: 1..1 o 1..N histórico con Inmueble. **[pendiente definición: histórico vs estado actual]**

11. **EtapaSeguimientoConfig**
   - Campos: id, nombre, descripción, orden, activo.
   - Relaciones: usada por ProcesoSeguimientoRegistro.

12. **MotivoCierre**
   - Campos: id, código, nombre, descripción, activo, isSystem, usos.
   - Relaciones: 1..N con cierre de procesos.

13. **ProcesoSeguimiento (caso)**
   - Campos: id, inmuebleId, estado (abierto/cerrado), fechaInicio, fechaFin, motivoApertura, motivoCierreId/texto.
   - Relaciones: 1..N RegistroSeguimiento; 1..N CompromisoPago; 1..N RegistroCorte.

14. **RegistroSeguimiento (actuación/evento)**
   - Campos: id, procesoId, fechaHora, etapaId, estado, motivo, observaciones, responsableId.
   - Relaciones: N..1 ProcesoSeguimiento.

15. **CompromisoPago**
   - Campos: id, procesoId, fechaDesde, fechaHasta, observación, estado.
   - Relaciones: N..1 ProcesoSeguimiento.

16. **PlanPago**
   - Campos: id, inmuebleId/procesoId, fechaAlta, cuotas, montoTotal, proximoVencimiento, vencimientoFinal, estado.
   - Observación: en UI aparece como entidad de reporte; en gestión se aclara que hoy se guarda solo histórico.

17. **Movimiento / Auditoría**
   - Campos: id, fechaHora, tipo, acción, usuarioId, cuenta/inmuebleId, etapa, metadata.
   - Relaciones: N..1 Usuario; opcional N..1 Inmueble/Proceso.

18. **ParametroSeguimiento**
   - Campos: cuotasParaMoroso, diasEntreEtapas, modoOperacion, reanudacionPorIncumplimiento, notificarCambiosEtapa.
   - Relaciones: configuración global.

---

## 4. Reglas de negocio inferidas

1. Un inmueble entra en gestión de etapas si cumple umbral de cuotas para moroso.
2. El umbral es configurable globalmente.
3. El seguimiento puede estar deshabilitado por combinación grupo+distrito.
4. Si inmueble está inactivo, no debería generar nuevas gestiones.
5. El flujo de etapas no permite retroceso.
6. Al enviar a etapa destino, se omiten casos en etapa posterior.
7. “Enviar siguiente” inicia proceso en primera etapa si no tenía etapa.
8. “Enviar siguiente” omite los que están en última etapa.
9. “Repetir etapa” aplica solo a casos con etapa asignada.
10. Cerrar proceso requiere motivo; campos adicionales dependen del motivo.
11. Compromiso de pago requiere fecha desde/hasta válidas y pausa proceso.
12. Motivos de cierre del sistema son inmutables (salvo activación en UI actual; **[pendiente definición]**).
13. Motivos configurables no se eliminan si tuvieron usos.
14. Etapas con procesos asociados no se pueden eliminar.
15. Grupos con inmuebles no se pueden eliminar.
16. No se puede quitar distrito de grupo si tiene inmuebles asociados.
17. Importación de inmuebles actualiza existentes y crea nuevos.
18. Importación de deuda produce resumen + detalle de errores por fila.
19. Reportes con fechas soportan rango desde/hasta y presets.
20. Exportaciones PDF/XLSX deben reflejar filtros activos.

---

## 5. API backend necesaria

## auth-service

### Endpoints sugeridos
1. `POST /api/v1/auth/login`
2. `POST /api/v1/auth/refresh`
3. `POST /api/v1/auth/logout`
4. `GET /api/v1/auth/me`
5. `GET /api/v1/roles`
6. `GET /api/v1/permisos` **[supuesto]**

### Request/response esperados (resumen)
- `login.request`: `{ username|email, password }`
- `login.response`: `{ accessToken, refreshToken, expiresIn, tokenType, user:{id,nombre,apellido,rol,permisos} }`
- `me.response`: perfil + permisos efectivos.

### Roles/permisos inferibles
- `ADMIN_CONFIG`: alta/edición/eliminación en catálogos y parámetros.
- `OPERADOR_SEGUIMIENTO`: gestión de etapas y compromisos/cierres.
- `OPERADOR_DEUDA`: cargas de deuda/importaciones.
- `LECTOR_REPORTES`: lectura y exportación de reportes.

### Observaciones
- UI no implementa login todavía; integrar sin romper rutas actuales.
- Recomendada autorización por claim de permisos + reglas por endpoint.

## morosos-service

### Endpoints sugeridos

#### Inmuebles
- `GET /api/v1/inmuebles` (filtros: query, campo, grupo, distrito, estado, page, size, sort)
- `GET /api/v1/inmuebles/{id}`
- `PUT /api/v1/inmuebles/{id}`
- `POST /api/v1/inmuebles/importaciones` (multipart)
- `GET /api/v1/inmuebles/importaciones/{id}`
- `GET /api/v1/inmuebles/importaciones/{id}/errores`
- `GET /api/v1/inmuebles/importaciones/{id}/errores.csv`

#### Deuda
- `GET /api/v1/deuda/cargas`
- `POST /api/v1/deuda/cargas` (archivo + metadatos)
- `GET /api/v1/deuda/cargas/{id}`
- `GET /api/v1/deuda/cargas/{id}/inmuebles`
- `GET /api/v1/deuda/cargas/{id}/errores`
- `GET /api/v1/deuda/cargas/{id}/export`

#### Seguimiento operativo
- `GET /api/v1/seguimiento/inmuebles` (bandeja gestión etapas)
- `POST /api/v1/seguimiento/acciones/mover-etapa`
- `POST /api/v1/seguimiento/acciones/siguiente`
- `POST /api/v1/seguimiento/acciones/repetir`
- `POST /api/v1/seguimiento/acciones/iniciar`
- `POST /api/v1/seguimiento/acciones/cerrar`
- `POST /api/v1/seguimiento/acciones/compromiso`

#### Historial
- `GET /api/v1/inmuebles/{id}/seguimiento/historial`
- `GET /api/v1/inmuebles/{id}/observaciones`
- `POST /api/v1/inmuebles/{id}/observaciones` **[supuesto]**

#### Configuración
- `GET/POST/PUT/DELETE /api/v1/config/grupos`
- `PUT /api/v1/config/grupos/{id}/distritos`
- `GET/POST/PUT/DELETE /api/v1/config/etapas`
- `POST /api/v1/config/etapas/reordenar`
- `GET/POST/PUT/DELETE /api/v1/config/motivos-cierre`
- `PATCH /api/v1/config/motivos-cierre/{id}/activo`
- `GET/PUT /api/v1/config/seguimiento`

#### Reportes
- `GET /api/v1/reportes/morosos-grupo-distrito`
- `GET /api/v1/reportes/acciones` (params: desde, hasta, tipos[])
- `GET /api/v1/reportes/planes-pago`
- `GET /api/v1/reportes/estado-inmuebles`
- `GET /api/v1/reportes/porcentajes-morosidad`
- `GET /api/v1/reportes/historial-movimientos`
- `GET /api/v1/reportes/{id}/export?format=pdf|xlsx&...`

### Filtros y parámetros
- Soportar en listados: `page,size,sort`.
- Soportar `query` textual por campos múltiples.
- Rango temporal uniforme: `desde,hasta` en ISO date.
- Filtros multivalor: `tipo[]=...`.

### Operaciones especiales
- Importación masiva (inmuebles/deuda) con resultado asincrónico recomendado.
- Acciones masivas de seguimiento con resultado parcial:
  - aplicados,
  - omitidos,
  - motivos de omisión.

### Observaciones
- Devolver metadatos list-friendly: `totalElements,totalPages,page,size,sort`.
- Para tablas, considerar DTO “row” optimizado.

---

## 6. DTOs sugeridos

## Requests
- `InmuebleUpdateRequest`
- `ImportInmueblesRequest` (multipart)
- `CargaDeudaCreateRequest` (multipart + período + origen)
- `AccionMasivaMoverEtapaRequest { inmuebleIds[], etapaDestinoId, fechaProgramada?, observacion? }`
- `AccionMasivaSiguienteRequest { inmuebleIds[], fechaProgramada?, observacion? }`
- `AccionMasivaRepetirRequest { inmuebleIds[], fechaProgramada?, observacion? }`
- `AccionMasivaCerrarRequest { inmuebleIds[], motivoCierreId|motivoLibre, fechaRegularizacion?, planPago?, observacion? }`
- `AccionMasivaCompromisoRequest { inmuebleIds[], fechaDesde, fechaHasta, observacion? }`
- `GrupoRequest`, `GrupoDistritosUpdateRequest`
- `EtapaRequest`, `EtapaReorderRequest`
- `MotivoCierreRequest`
- `ParametroSeguimientoUpdateRequest`

## Responses
- `PageResponse<T> { content[], page,size,totalElements,totalPages,sort }`
- `InmuebleRowResponse`
- `InmuebleDetailResponse`
- `CargaDeudaRowResponse`
- `CargaDeudaDetailResponse`
- `ErrorImportacionRowResponse`
- `SeguimientoBandejaRowResponse`
- `AccionMasivaResultResponse { totalSolicitados, aplicados, omitidos, detalleOmisiones[] }`
- `HistorialInmuebleResponse { inmueble, procesos[], observaciones[] }`
- `GrupoResponse`, `EtapaResponse`, `MotivoCierreResponse`, `ParametroSeguimientoResponse`
- `Reporte*Response` por cada reporte.

## Estructuras para tablas/detalle/formularios/reportes
- Tabla: filas planas y tipadas, con campos listos para UI.
- Detalle: entidades compuestas (cabecera + colecciones).
- Formularios: payloads mínimos, sin campos derivados.
- Reportes: payload analítico + endpoint export directo.

---

## 7. Prioridad de implementación backend

1. **Auth base + /me + permisos** (habilita integración segura).
2. **Inmuebles listado/detalle/edición** (pantallas core de navegación).
3. **Configuración mínima**: grupos, grupo-distrito, parámetros seguimiento, etapas, motivos cierre.
4. **Gestión de deuda**: cargas + detalle + errores.
5. **Bandeja de gestión de etapas + acciones masivas**.
6. **Historial de seguimiento por inmueble**.
7. **Reportes de lectura**.
8. **Exportaciones PDF/XLSX server-side** (o mixto).

Estrategia sugerida: API contract-first (OpenAPI), mocks de backend transitorios y reemplazo incremental por pantalla.

---

## 8. Riesgos y definiciones pendientes

### Ambigüedades del frontend
1. Existe `ConfiguracionMotivos.tsx` no conectada al router (duplicidad conceptual con motivos de cierre).
2. Rutas de accesos relacionados en detalle inmueble (`/deuda`, `/observaciones`) no implementadas.
3. En textos de motivos de cierre: se indica que motivos de sistema “no pueden modificarse”, pero UI permite activar/desactivar (contradicción).
4. “Plan de pago” se usa como cierre y como entidad de reporte; falta definir modelo fuente único.
5. Fechas programadas en gestión de etapas son informativas en UI; backend debe decidir si son obligatorias/operativas.

### Decisiones de negocio faltantes
1. ¿Un inmueble puede tener múltiples procesos abiertos simultáneos?
2. ¿Cierre de proceso es reversible?
3. ¿Estados de compromiso de pago y vencimiento automático por job?
4. ¿Versionado/historización de parámetros de seguimiento?
5. ¿Qué hacer al subir umbral de moroso con procesos activos (auto-cierre, pendiente, soft-flag)?
6. ¿Manejo de deduplicación para importaciones repetidas?
7. ¿Diccionario oficial de tipos de acción para reportes y auditoría?

### Cosas a confirmar antes de codificar backend
1. Catálogo maestro de etapas (nombres actuales vs configurables).
2. Estrategia de IDs (UUID recomendado) y claves de negocio (`numeroCuenta`).
3. Convención de timezone/fechas (UTC persistencia + localización en frontend).
4. Política de borrado (lógico/físico) para catálogos usados.
5. Criterios de performance para listados y reportes (índices PostgreSQL).
6. Reglas de autorización por endpoint/acción masiva.
7. Contrato de errores de importación y tamaño máximo de archivo.

---

## Hallazgos técnicos adicionales (frontend)

1. No se detecta capa HTTP real en páginas analizadas; la app está basada en mocks locales.
2. `QueryClientProvider` está presente pero sin `useQuery/useMutation` reales en módulos de negocio.
3. Se detectan duplicaciones menores de JSX/texto (no bloqueantes para backend), pero conviene saneo previo a integración para evitar inconsistencias visuales.

