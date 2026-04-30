# Informe final de cobertura frontend-backend (pre-integración real)

Fecha: 2026-04-30

## Resumen ejecutivo
- El backend **ya expone** endpoints para todas las áreas funcionales solicitadas (Dashboard, Reportes, Inmuebles, Deuda, Seguimiento y Configuración).
- Con los últimos cambios aditivos, la cobertura de campos para UI mejoró en:
  - nombres visibles de grupo/distrito,
  - ids navegables en seguimiento/reportes,
  - metadatos de configuración (etapas y motivos).
- Estado global para inicio de integración real frontend:
  - **Listo con adaptaciones menores de frontend** en algunos módulos (principalmente mapeos de labels/estados y contratos polimórficos de reportes).

---

## 1) Dashboard
### Endpoint disponible
- `GET /api/v1/dashboard/resumen`

### Response esperado
- `kpis`: `totalInmuebles`, `alDia`, `deudores`, `morosos`, `porcentajeMorosidad`, `montoTotalDeuda`
- `accionesMes`: `avisosDeuda`, `avisosCorte`, `intimaciones`, `cortes`, `regularizaciones`, `planesPago`, `compromisosPago`
- `distritos`: lista con ids/nombre y métricas
- `ultimosMovimientos`: `fecha`, `tipo`, `cuenta`, `titular`, `etapa`, `actorId`, `categoria`

### ¿Cubre UI?
- **Sí, cobertura alta** para reemplazar mocks del dashboard.

### Campos faltantes (si aplica)
- Recomendable a futuro: `actorNombre` para no resolver en frontend.

### ¿Requiere adaptación frontend?
- **Sí, baja**: formateo visual (moneda/porcentaje/fechas) y mapeo de `tipo`/`categoria`.

### Prioridad
- **Alta (P1)** para conectar primero.

---

## 2) Reportes

### 2.1 morosos-grupo-distrito
- Endpoint: `GET /api/v1/reportes/morosos-grupo-distrito`
- Cobertura UI: **Alta** (agregados + detalle por grupo/distrito con ids y nombres).
- Faltantes: no críticos.
- Adaptación FE: baja (gráficos/tablas).
- Prioridad: **Alta (P1)**.

### 2.2 acciones-fechas
- Endpoint: `GET /api/v1/reportes/acciones-fechas`
- Cobertura UI: **Alta**.
- Incluye resumen, por tipo, serie diaria y detalle paginado con ids navegables + labels.
- Faltantes: no críticos para primer release.
- Adaptación FE: media-baja (filtros, orden, render de etiquetas).
- Prioridad: **Alta (P1)**.

### 2.3 acciones-regularizacion
- Endpoint: `GET /api/v1/reportes/acciones-regularizacion`
- Cobertura UI: **Alta**.
- Incluye resumen, por tipo y 3 detalles (`regularizaciones`, `planesPago`, `compromisos`) con ids/nombres y `estadoLabel`.
- Faltantes: no críticos.
- Adaptación FE: media (tabs + paginaciones independientes).
- Prioridad: **Alta (P1)**.

### 2.4 estado-inmuebles
- Endpoint: `GET /api/v1/reportes/estado-inmuebles`
- Cobertura UI: **Alta**.
- Faltantes: ninguno bloqueante.
- Adaptación FE: baja.
- Prioridad: **Media-Alta (P2)**.

### 2.5 porcentajes-morosidad
- Endpoint: `GET /api/v1/reportes/porcentajes-morosidad`
- Cobertura UI: **Alta**.
- Faltantes: ninguno bloqueante.
- Adaptación FE: baja.
- Prioridad: **Media-Alta (P2)**.

### 2.6 historial-movimientos
- Endpoint: `GET /api/v1/reportes/historial-movimientos`
- Cobertura UI: **Media-Alta** (paginado + filtros).
- Faltantes: posible `actorNombre` en lugar de solo `actorId` (si UI lo requiere en tabla principal).
- Adaptación FE: media (filtros y render diff old/new values).
- Prioridad: **Media (P2/P3)**.

---

## 3) Inmuebles
### Endpoints disponibles
- Listado: `GET /api/v1/inmuebles`
- Detalle: `GET /api/v1/inmuebles/{id}`
- Edición: `PUT /api/v1/inmuebles/{id}`
- Toggle activo: `PATCH /api/v1/inmuebles/{id}/activo`
- Toggle seguimiento: `PATCH /api/v1/inmuebles/{id}/seguimiento-habilitado`
- Importación: `POST /api/v1/inmuebles/importaciones`
- Estado importación/errores: `GET /api/v1/inmuebles/importaciones/{id}`, `GET /api/v1/inmuebles/importaciones/{id}/errores`

### Response esperado
- `InmuebleResponse` con ids/códigos/nombres de grupo y distrito + datos de contacto/auditoría.

### ¿Cubre UI?
- **Sí, cobertura alta** para listado/detalle/edición/toggles.

### Campos faltantes
- Ninguno bloqueante; `estadoLegible` puede derivarse en frontend.

### ¿Requiere adaptación frontend?
- **Sí, baja**: consumir `Page<T>` y mapear estado visual.

### Prioridad
- **Alta (P1)**.

---

## 4) Deuda
### Endpoints disponibles
- Cargas: `GET /api/v1/deuda/cargas`
- Importación: `POST /api/v1/deuda/cargas`
- Carga por id: `GET /api/v1/deuda/cargas/{id}`
- Detalle: `GET /api/v1/deuda/cargas/{id}/detalles`
- Errores: `GET /api/v1/deuda/cargas/{id}/errores`

### ¿Cubre UI?
- **Media-Alta**.

### Campos faltantes
- Para UX completa de tabla detalle podrían faltar `titular`/`direccion` en algunos flujos de drill-down.
- Dependiendo del frontend actual, puede requerirse separar tipos de error (ej. no encontradas) si se desea visualización dedicada.

### ¿Requiere adaptación frontend?
- **Sí, media**: mapeo de enums de estado y composición de métricas.

### Prioridad
- **Alta (P1/P2)**.

---

## 5) Seguimiento
### Endpoints disponibles
- Bandeja: `GET /api/v1/seguimiento/bandeja`
- Acciones masivas: `POST /api/v1/seguimiento/iniciar|avanzar|repetir|pausar|reabrir`
- Cierre: `POST /api/v1/seguimiento/cerrar`
- Compromiso: `POST /api/v1/seguimiento/compromisos`
- Historial por inmueble: `GET /api/v1/seguimiento/inmuebles/{inmuebleId}/historial`

### Response esperado
- Bandeja con ids navegables (`casoId`, `inmuebleId`, `grupoId`, `distritoId`, `etapaId`) + nombres visibles + acciones disponibles.

### ¿Cubre UI?
- **Alta** para bandeja/acciones/cierre/compromiso/historial.

### Campos faltantes
- En historial, hay campos `Object` (metadata/planPago/cambioParametro) que requieren parse robusto en frontend.

### ¿Requiere adaptación frontend?
- **Sí, media**: parser discriminado para objetos polimórficos y mapping de estado/acciones.

### Prioridad
- **Alta (P1)**.

---

## 6) Configuración

### 6.1 Grupos
- Endpoints: `GET/POST/PUT/DELETE/PATCH /api/v1/grupos`.
- Cobertura: **Alta**.
- Adaptación FE: baja.
- Prioridad: **P2**.

### 6.2 Distritos
- Endpoints: `GET/POST/PUT/PATCH /api/v1/distritos`.
- Cobertura: **Alta**.
- Adaptación FE: baja.
- Prioridad: **P2**.

### 6.3 Grupo-distrito-config
- Endpoints: `GET/PUT /api/v1/grupo-distrito-config`.
- Cobertura: **Alta** con `grupoNombre`/`distritoNombre` ya expuestos.
- Adaptación FE: baja.
- Prioridad: **P2**.

### 6.4 Parámetros de seguimiento
- Endpoints: `GET/PUT /api/v1/parametros-seguimiento`.
- Cobertura: **Media-Alta**.
- Faltantes opcionales: metadatos de validación (`tipoDato`, min/max) para formularios más robustos.
- Adaptación FE: media-baja.
- Prioridad: **P3**.

### 6.5 Etapas
- Endpoints: `GET/POST/PUT/DELETE /api/v1/etapas`, `POST /api/v1/etapas/reordenar`.
- Cobertura: **Alta** con `descripcion` y `procesosAsociados`.
- Adaptación FE: baja.
- Prioridad: **P2**.

### 6.6 Motivos de cierre
- Endpoints: `GET/POST/PUT/PATCH/DELETE /api/v1/motivos-cierre`.
- Cobertura: **Alta** con `descripcion` y `usos`.
- Adaptación FE: baja.
- Prioridad: **P2**.

---

## Riesgos y recomendaciones de integración
1. **Normalizar adapters frontend por dominio** (Dashboard, Reportes, Seguimiento) para centralizar mapeos de enums/labels.
2. **Mantener parseo defensivo** en historial de seguimiento por campos polimórficos.
3. **Acordar contrato de paginación por endpoint** (conviven `Page<T>` y `PageResponse<T>`), sin cambios de backend en esta fase.
4. **Checklist de integración por prioridad**:
   - P1: Dashboard + Seguimiento + Reportes clave + Inmuebles.
   - P2: Deuda + Configuración operativa.
   - P3: hardening de UX/metadatos adicionales.

---

## Conclusión
El backend está **suficientemente cubierto** para iniciar integración real del frontend en todas las vistas solicitadas, con adaptaciones frontend principalmente de presentación, mapeo de estados/labels y manejo de paginación/objetos compuestos.
