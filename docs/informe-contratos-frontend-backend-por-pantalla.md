# Informe accionable: DTOs y contratos Frontend-Backend por pantalla

## Hallazgos transversales
- El frontend actual consume datos mock (`frontend/src/data/*`) y aún no integra clientes HTTP; por lo tanto, el “endpoint usado” hoy es **ninguno en runtime** y aquí se propone endpoint objetivo por pantalla.
- En backend hay mezcla de `Page<T>` y `PageResponse<T>`; se respeta la restricción de **no cambiar ahora**.
- En varios DTOs backend hay `codigo` pero no siempre `nombre visible` relacionado (ej. `grupoCodigo` sin `grupoNombre` en `InmuebleResponse`).
- Para tablas operativas conviene conservar valores crudos (UUID, enums, montos, fechas ISO) y sumar campos legibles derivados sin quitar los crudos.

---

## 1) Dashboard
1. **Endpoint usado/recomendado**: `GET /api/v1/dashboard/resumen`.
2. **DTO backend actual**: `DashboardResumenResponse` con `kpis`, `accionesMes`, `distritos`, `ultimosMovimientos`.
3. **Campos actuales**: cubre KPIs, acciones mensuales, desagregado por distrito, y últimos movimientos con `fecha`, `tipo`, `cuenta`, `titular`, `etapa`, `actorId`, `categoria`.
4. **Campos faltantes para UI**:
   - `actorNombre` (hoy solo `actorId`).
   - `inmuebleId` en movimientos para link directo.
5. **Campos que sobran**: ninguno crítico.
6. **¿Necesita id + nombre visible?** Sí, sobre todo en distritos (ya tiene `distritoId` + `distritoNombre`).
7. **¿PageResponse o Page?** No aplica (objeto agregado).
8. **Riesgo de romper contrato**: bajo si se agregan campos opcionales; medio si se renombra `tipo/categoria`.
9. **Recomendación**: **cambiar ahora (aditivo)** para sumar `actorNombre` e `inmuebleId`.

## 2) Inmuebles
1. **Endpoint recomendado**: `GET /api/v1/inmuebles` y `GET /api/v1/inmuebles/{id}`.
2. **DTO backend actual**: `InmuebleResponse`.
3. **Campos actuales**: `id`, `cuenta`, `titular`, `direccion`, `grupoId`, `grupoCodigo`, `distritoId`, `distritoCodigo`, `activo`, `seguimientoHabilitado`, contacto y auditoría.
4. **Campos faltantes para UI**:
   - `grupoNombre`, `distritoNombre` (frontend muestra nombre visible, no código).
   - `estadoLegible` (opcional; hoy se infiere de `activo`).
5. **Campos que sobran**: auditoría en listado (`createdBy/At`, `updatedBy/At`) puede sobrar para tabla principal, pero útil en detalle.
6. **¿Necesita id + nombre visible?** Sí (grupo/distrito).
7. **¿PageResponse o Page?** Actualmente `Page<InmuebleResponse>`; **mantener**.
8. **Riesgo de romper contrato**: medio si se reemplaza `grupoCodigo`/`distritoCodigo`; bajo si solo se agregan nombres.
9. **Recomendación**: **cambiar ahora (aditivo)** agregando `grupoNombre` y `distritoNombre`.

## 3) Gestión de deuda
1. **Endpoint recomendado**: `GET /api/v1/deuda/cargas`, `GET /api/v1/deuda/cargas/{id}`, `GET /api/v1/deuda/cargas/{id}/detalles`, `GET /api/v1/deuda/cargas/{id}/errores`.
2. **DTO backend actual**: `CargaDeudaResponse`, `CargaDeudaDetalleResponse`, `CargaDeudaErrorResponse`.
3. **Campos actuales**: id, período, estado enum, nombre archivo, totales/procesados/errores, monto, cuenta/cuotas/monto vencido en detalle.
4. **Campos faltantes para UI**:
   - En lista de cargas: `estadoLegible` (o catálogo de traducción en FE).
   - En detalle: `titular` y/o `direccion` (si se quiere trazabilidad completa por fila).
   - `noEncontradas` separado (el FE mock distingue errores vs no encontradas).
5. **Campos que sobran**: payload completo de error puede ser pesado para tabla (mantener para detalle expandible).
6. **¿Necesita id + nombre visible?** Sí para carga (`id` + `archivoNombre`) y eventualmente inmueble (`inmuebleId` + `cuenta/titular`).
7. **¿PageResponse o Page?** Actualmente `Page`; **mantener**.
8. **Riesgo de romper contrato**: medio por interpretación de estado y contadores.
9. **Recomendación**: **adaptar en frontend** primero (mapear enum), y **cambiar ahora (aditivo)** para `noEncontradas` y campos de detalle si UX los requiere.

## 4) Seguimiento / bandeja
1. **Endpoint recomendado**: `GET /api/v1/seguimiento/bandeja` + acciones POST (`iniciar/avanzar/repetir/pausar/reabrir/cerrar/compromisos`).
2. **DTO backend actual**: `PageResponse<SeguimientoBandejaRowResponse>`.
3. **Campos actuales**: ids caso/inmueble, cuenta/titular/dirección, grupo/distrito, cuotas/monto, etapa, estado, fecha y días desde movimiento, acciones disponibles.
4. **Campos faltantes para UI**:
   - `grupoId`, `distritoId`, `etapaId` para filtros robustos y navegación.
   - `estadoLegible` (si FE no quiere diccionario local).
5. **Campos que sobran**: ninguno evidente.
6. **¿Necesita id + nombre visible?** Sí (caso, inmueble, etapa, grupo/distrito).
7. **¿PageResponse o Page?** Ya usa `PageResponse`; **mantener**.
8. **Riesgo de romper contrato**: bajo si se agregan IDs; alto si cambia estructura de `accionesDisponibles`.
9. **Recomendación**: **cambiar ahora (aditivo)** para IDs de catálogos y etapa.

## 5) Historial por inmueble
1. **Endpoint recomendado**: `GET /api/v1/seguimiento/inmuebles/{inmuebleId}/historial`.
2. **DTO backend actual**: `HistorialSeguimientoResponse` (`inmueble`, `casos`, `eventos`, `cierres`, `compromisos`).
3. **Campos actuales**: bastante completos para timeline/tablas.
4. **Campos faltantes para UI**:
   - En cierres/eventos hay `Object` (`planPago`, `cambioParametro`, `metadata`) sin contrato fuerte.
   - `motivoNombre` además de `motivoCodigo` para lectura directa.
5. **Campos que sobran**: ninguno; más bien falta tipado.
6. **¿Necesita id + nombre visible?** Sí (motivo, etapa, actor).
7. **¿PageResponse o Page?** No aplica (objeto compuesto).
8. **Riesgo de romper contrato**: alto si se tipa reemplazando `Object` ahora.
9. **Recomendación**: **dejar para versión posterior** el tipado fuerte de `Object`; **adaptar en frontend** con guards de tipo.

## 6) Configuración grupos/distritos
1. **Endpoints recomendados**:
   - `GET/POST/PUT/DELETE/PATCH /api/v1/grupos`
   - `GET/POST/PUT/PATCH /api/v1/distritos`
   - `GET/PUT /api/v1/grupo-distrito-config`
2. **DTO backend actual**: `GrupoResponse`, `DistritoResponse`, `GrupoDistritoConfigResponse`.
3. **Campos actuales**: ids, código/nombre (grupo y distrito), activo, relación grupo-distrito con `seguimientoHabilitado`.
4. **Campos faltantes para UI**:
   - En `GrupoDistritoConfigResponse`: `grupoNombre`, `distritoNombre` (solo hay códigos).
   - Contadores para tabla (`inmueblesAsignados`, `casosActivos`) si se quiere evitar N+1 consultas.
5. **Campos que sobran**: auditoría en listados puede ser secundaria.
6. **¿Necesita id + nombre visible?** Sí, en todas las listas.
7. **¿PageResponse o Page?** Son listas; no obligatorio paginar ahora.
8. **Riesgo de romper contrato**: bajo si se agregan nombres; medio si se reemplazan códigos.
9. **Recomendación**: **cambiar ahora (aditivo)** agregando nombres visibles en config grupo-distrito.

## 7) Configuración seguimiento
1. **Endpoint recomendado**: `GET /api/v1/parametros-seguimiento` + `PUT /api/v1/parametros-seguimiento/{codigo}`.
2. **DTO backend actual**: `ParametroSeguimientoResponse` (`codigo`, `valor`, `descripcion`).
3. **Campos actuales**: suficientes para key-value configurable.
4. **Campos faltantes para UI**:
   - `tipoDato` (`number|boolean|string`) para validación UI.
   - `valorMin`, `valorMax`, `unidad`, `editable` para formularios seguros.
5. **Campos que sobran**: ninguno.
6. **¿Necesita id + nombre visible?** Sí (`codigo` + `descripcion` ya cubre parcialmente).
7. **¿PageResponse o Page?** No, lista simple.
8. **Riesgo de romper contrato**: bajo con campos aditivos.
9. **Recomendación**: **cambiar ahora (aditivo)** metadatos de validación.

## 8) Configuración etapas
1. **Endpoint recomendado**: `GET/POST/PUT/DELETE /api/v1/etapas`, `POST /api/v1/etapas/reordenar`.
2. **DTO backend actual**: `EtapaConfigResponse`.
3. **Campos actuales**: id/código/nombre/orden/activo/esFinal + auditoría.
4. **Campos faltantes para UI**:
   - `descripcion` (frontend la gestiona).
   - `procesosAsociados` para bloquear eliminación con feedback claro.
5. **Campos que sobran**: ninguno.
6. **¿Necesita id + nombre visible?** Sí (ya está).
7. **¿PageResponse o Page?** No, lista ordenada.
8. **Riesgo de romper contrato**: medio si cambia semántica de orden.
9. **Recomendación**: **cambiar ahora (aditivo)** para `descripcion` y contador de uso.

## 9) Configuración motivos de cierre
1. **Endpoint recomendado**: `GET/POST/PUT/PATCH/DELETE /api/v1/motivos-cierre`.
2. **DTO backend actual**: `MotivoCierreResponse`.
3. **Campos actuales**: id/código/nombre/isSystem/activo + auditoría.
4. **Campos faltantes para UI**:
   - `descripcion`.
   - `usos` (conteo de referencias) para reglas de eliminación/desactivación.
5. **Campos que sobran**: ninguno.
6. **¿Necesita id + nombre visible?** Sí (ya está).
7. **¿PageResponse o Page?** No, lista simple.
8. **Riesgo de romper contrato**: bajo si aditivo.
9. **Recomendación**: **cambiar ahora (aditivo)** para `descripcion` y `usos`.

## 10) Reportes
1. **Endpoint recomendado**: `GET /api/v1/reportes/{reporteId}`.
2. **DTO backend actual**: retorno `Object` con varios DTO específicos según `reporteId`.
3. **Campos actuales**: en general buenos para tablas/gráficos (incluyen ids, nombres, métricas, series y detalle paginado en algunos reportes).
4. **Campos faltantes para UI**:
   - Estandarizar `label` legible de tipos de acción/evento (hoy `tipoAccion` técnico).
   - En algunos detalles, garantizar siempre `id` de entidad navegable.
5. **Campos que sobran**: ninguno claro.
6. **¿Necesita id + nombre visible?** Sí, para drill-down y filtros; en la mayoría ya está.
7. **¿PageResponse o Page?** Mantener heterogéneo actual; **no tocar `Object` ahora**.
8. **Riesgo de romper contrato**: alto si se intenta tipar globalmente en este ciclo.
9. **Recomendación**: **dejar para versión posterior** la unificación de contrato; **adaptar frontend** con discriminación por `reporteId`.

---

## Priorización sugerida (sin romper restricciones actuales)
### Sprint inmediato (aditivo, bajo riesgo)
- Inmuebles: agregar `grupoNombre`, `distritoNombre`.
- GrupoDistritoConfig: agregar `grupoNombre`, `distritoNombre`.
- Etapas: agregar `descripcion`, `procesosAsociados`.
- Motivos de cierre: agregar `descripcion`, `usos`.
- Seguimiento bandeja: agregar `grupoId`, `distritoId`, `etapaId`.

### Adaptación frontend primero
- Mapeo de enums/estados legibles (`estadoLegible`) en deuda y seguimiento.
- Normalización de filtros con ids y nombres coexistiendo.

### Versión posterior
- Tipar `Object` en historial (`metadata`, `planPago`, `cambioParametro`).
- Unificar estrategia de paginación (`Page` vs `PageResponse`) cuando se haga corte de contrato.
- Revisar contrato polimórfico de reportes (`Object`) con esquema discriminado.
