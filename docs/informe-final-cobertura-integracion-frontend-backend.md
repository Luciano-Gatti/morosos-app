# Informe final de cobertura frontend-backend (pre-integración real)

Fecha: 2026-04-30

## Resultado ejecutivo
- **Conclusión general:** el backend está **listo para conectar el frontend real** en las 15 vistas revisadas.
- **Cobertura por vista:** 10 en **OK**, 5 en **Parcial**, 0 en **Falta**.
- **Brechas restantes:** son de contrato/presentación (mapeo de labels, parseo de objetos compuestos, normalización de paginación y filtros), sin cambios estructurales ni de auth.

## Criterios de revisión aplicados
- Endpoint disponible y filtros relevantes.
- Response actual usable por UI real.
- Disponibilidad de IDs técnicos + nombres visibles.
- Cobertura de estados/enums para render UX.
- Paginación y consistencia de contratos.
- Errores retornables para reemplazar mocks.

---

## Matriz final por vista

### 1) Dashboard
- **Endpoint disponible:** `GET /api/v1/dashboard/resumen`.
- **Response actual:** `kpis`, `accionesMes`, `distritos`, `ultimosMovimientos`.
- **Campos necesarios por UI:** KPIs, métricas por distrito, últimos movimientos para tabla/timeline.
- **Campos faltantes:** opcional `actorNombre` (hoy se trabaja con `actorId`).
- **Cobertura pantalla:** **OK**.
- **¿Requiere adaptación frontend?:** Sí, baja (formatos moneda/fecha y labels de tipo/categoría).
- **¿Requiere ajuste backend?:** No bloqueante.
- **Prioridad:** **P1**.

### 2) Inmuebles
- **Endpoint disponible:** `GET /api/v1/inmuebles`, `GET /api/v1/inmuebles/{id}`, `PUT /api/v1/inmuebles/{id}`, `PATCH` toggles.
- **Response actual:** `InmuebleResponse` con IDs, códigos/nombres relacionados, estado y datos de contacto.
- **Campos necesarios por UI:** identidad de inmueble + grupo/distrito + estado + soporte de edición.
- **Campos faltantes:** no bloqueantes.
- **Cobertura pantalla:** **OK**.
- **¿Requiere adaptación frontend?:** Sí, baja (consumo de paginación Spring y render de estado).
- **¿Requiere ajuste backend?:** No.
- **Prioridad:** **P1**.

### 3) Gestión de deuda
- **Endpoint disponible:** `GET/POST /api/v1/deuda/cargas`, `GET /api/v1/deuda/cargas/{id}`, `GET /detalles`, `GET /errores`.
- **Response actual:** resumen de carga + detalle + errores por importación.
- **Campos necesarios por UI:** estado de carga, métricas, detalle y errores para drill-down.
- **Campos faltantes:** en algunos flujos UI, `titular/direccion` en detalle fino y separación visual de tipos de error.
- **Cobertura pantalla:** **Parcial**.
- **¿Requiere adaptación frontend?:** Sí, media (mapa de enums y composición de KPIs).
- **¿Requiere ajuste backend?:** Opcional aditivo (solo si UX exige esos campos extra).
- **Prioridad:** **P1/P2**.

### 4) Seguimiento de deuda
- **Endpoint disponible:** `GET /api/v1/seguimiento/bandeja` + POST de acciones (`iniciar/avanzar/repetir/pausar/reabrir/cerrar/compromisos`).
- **Response actual:** fila de bandeja con IDs navegables, nombres visibles, estado, deuda y acciones disponibles.
- **Campos necesarios por UI:** filtros por grupo/distrito/etapa/estado y ejecución de acciones operativas.
- **Campos faltantes:** no bloqueantes.
- **Cobertura pantalla:** **OK**.
- **¿Requiere adaptación frontend?:** Sí, media-baja (adaptador de acciones y estados).
- **¿Requiere ajuste backend?:** No.
- **Prioridad:** **P1**.

### 5) Historial por inmueble
- **Endpoint disponible:** `GET /api/v1/seguimiento/inmuebles/{inmuebleId}/historial`.
- **Response actual:** agregado con inmueble, casos, eventos, cierres y compromisos.
- **Campos necesarios por UI:** timeline/tabla histórica, cierres, compromisos y metadata de acciones.
- **Campos faltantes:** no faltan campos críticos, pero hay objetos polimórficos (`metadata/planPago/cambioParametro`) que requieren parseo defensivo en FE.
- **Cobertura pantalla:** **Parcial**.
- **¿Requiere adaptación frontend?:** Sí, media (type guards y render condicional por tipo de evento).
- **¿Requiere ajuste backend?:** No bloqueante.
- **Prioridad:** **P2**.

### 6) Configuración grupos/distritos
- **Endpoint disponible:** `grupos`, `distritos`, `grupo-distrito-config` (CRUD/listado según módulo).
- **Response actual:** IDs + códigos/nombres + activo + habilitación de seguimiento en relación grupo/distrito.
- **Campos necesarios por UI:** catálogos con nombre visible y edición de estado/habilitación.
- **Campos faltantes:** no bloqueantes.
- **Cobertura pantalla:** **OK**.
- **¿Requiere adaptación frontend?:** Sí, baja.
- **¿Requiere ajuste backend?:** No.
- **Prioridad:** **P2**.

### 7) Configuración seguimiento
- **Endpoint disponible:** `GET /api/v1/parametros-seguimiento`, `PUT /api/v1/parametros-seguimiento/{codigo}`.
- **Response actual:** `codigo`, `valor`, `descripcion`.
- **Campos necesarios por UI:** edición de parámetros y texto explicativo.
- **Campos faltantes:** metadatos opcionales de validación (`tipoDato`, min/max) para UX más guiada.
- **Cobertura pantalla:** **Parcial**.
- **¿Requiere adaptación frontend?:** Sí, media-baja.
- **¿Requiere ajuste backend?:** Opcional aditivo.
- **Prioridad:** **P3**.

### 8) Configuración etapas
- **Endpoint disponible:** `GET/POST/PUT/DELETE /api/v1/etapas`, `POST /api/v1/etapas/reordenar`.
- **Response actual:** etapa con orden, estado y metadatos operativos.
- **Campos necesarios por UI:** mantenimiento completo y reorder.
- **Campos faltantes:** no bloqueantes para operación estándar.
- **Cobertura pantalla:** **OK**.
- **¿Requiere adaptación frontend?:** Sí, baja.
- **¿Requiere ajuste backend?:** No.
- **Prioridad:** **P2**.

### 9) Configuración motivos cierre
- **Endpoint disponible:** `GET/POST/PUT/PATCH/DELETE /api/v1/motivos-cierre`.
- **Response actual:** catálogo de motivos con estado y metadatos.
- **Campos necesarios por UI:** alta/edición/activación y selección en cierre de caso.
- **Campos faltantes:** no bloqueantes.
- **Cobertura pantalla:** **OK**.
- **¿Requiere adaptación frontend?:** Sí, baja.
- **¿Requiere ajuste backend?:** No.
- **Prioridad:** **P2**.

### 10) Reporte morosos
- **Endpoint disponible:** `GET /api/v1/reportes/morosos-grupo-distrito`.
- **Response actual:** agregados por grupo/distrito con totales y desglose.
- **Campos necesarios por UI:** datos para tabla y gráficos de morosidad territorial.
- **Campos faltantes:** no bloqueantes.
- **Cobertura pantalla:** **OK**.
- **¿Requiere adaptación frontend?:** Sí, baja.
- **¿Requiere ajuste backend?:** No.
- **Prioridad:** **P1**.

### 11) Reporte acciones entre fechas
- **Endpoint disponible:** `GET /api/v1/reportes/acciones-fechas`.
- **Response actual:** resumen, por tipo, serie diaria y detalle paginado.
- **Campos necesarios por UI:** filtros por fecha + tabla detalle + gráficos evolutivos.
- **Campos faltantes:** no bloqueantes.
- **Cobertura pantalla:** **OK**.
- **¿Requiere adaptación frontend?:** Sí, media-baja (tabs/series/paginación).
- **¿Requiere ajuste backend?:** No.
- **Prioridad:** **P1**.

### 12) Reporte regularizaciones/planes
- **Endpoint disponible:** `GET /api/v1/reportes/acciones-regularizacion`.
- **Response actual:** resumen + detalle separado de regularizaciones, planes y compromisos.
- **Campos necesarios por UI:** comparativa por tipo y drill-down por registro.
- **Campos faltantes:** no bloqueantes.
- **Cobertura pantalla:** **OK**.
- **¿Requiere adaptación frontend?:** Sí, media (manejo de pestañas/paginaciones independientes).
- **¿Requiere ajuste backend?:** No.
- **Prioridad:** **P1**.

### 13) Reporte estado inmuebles
- **Endpoint disponible:** `GET /api/v1/reportes/estado-inmuebles`.
- **Response actual:** distribución por estado, grupo y distrito.
- **Campos necesarios por UI:** visualización de estado y segmentación territorial.
- **Campos faltantes:** no bloqueantes.
- **Cobertura pantalla:** **OK**.
- **¿Requiere adaptación frontend?:** Sí, baja.
- **¿Requiere ajuste backend?:** No.
- **Prioridad:** **P2**.

### 14) Reporte porcentajes morosidad
- **Endpoint disponible:** `GET /api/v1/reportes/porcentajes-morosidad`.
- **Response actual:** porcentaje global + detalle por corte/categoría.
- **Campos necesarios por UI:** KPIs y desagregado para panel comparativo.
- **Campos faltantes:** no bloqueantes.
- **Cobertura pantalla:** **OK**.
- **¿Requiere adaptación frontend?:** Sí, baja.
- **¿Requiere ajuste backend?:** No.
- **Prioridad:** **P2**.

### 15) Historial de movimientos
- **Endpoint disponible:** `GET /api/v1/reportes/historial-movimientos`.
- **Response actual:** listado paginado con filtros por fecha/acción/entidad/actor.
- **Campos necesarios por UI:** auditoría navegable con filtros y detalle de cambios.
- **Campos faltantes:** en algunas vistas puede requerirse `actorNombre` además de `actorId`.
- **Cobertura pantalla:** **Parcial**.
- **¿Requiere adaptación frontend?:** Sí, media.
- **¿Requiere ajuste backend?:** Opcional aditivo (`actorNombre`).
- **Prioridad:** **P2/P3**.

---

## Revisión transversal solicitada

### Nombres de campos
- Se valida disponibilidad de IDs técnicos y nombres visibles en los módulos críticos de navegación.
- Aún conviene centralizar adapters FE para normalizar etiquetas (`estadoLabel`, `tipoAccionLabel`) sin romper contratos.

### IDs y nombres visibles
- Cobertura suficiente para navegación y filtros en Dashboard/Seguimiento/Reportes/Configuraciones.
- Sin bloqueos funcionales para desactivar mocks en vistas principales.

### Estados / enums
- Backend cubre estados operativos; el frontend debe mapear labels amigables de forma centralizada para evitar lógica duplicada.

### Paginación
- Conviven respuestas `Page<T>` y `PageResponse<T>`; no bloquea integración, pero requiere capa adaptadora FE por endpoint.

### Filtros
- Hay filtros útiles por fecha, entidad territorial, actor y estado según vista.
- Recomendación: consolidar contrato de query params en helpers FE para disminuir errores de integración.

### Errores
- Existe manejo global de errores y validaciones de negocio suficiente para reemplazar mocks de error UI.
- Pendiente de FE: mapear códigos HTTP/mensajes a toasts y estados de formulario.

### Mocks que ya se pueden reemplazar
- Dashboard completo.
- Inmuebles (listado/detalle/edición).
- Seguimiento de deuda (bandeja y acciones).
- Configuración (grupos, distritos, etapas, motivos).
- Reportes: morosos, acciones entre fechas, regularizaciones/planes, estado inmuebles, porcentajes.
- Reemplazo parcial recomendado: gestión de deuda, historial por inmueble e historial de movimientos.

---

## Veredicto final
- **Backend listo para conectar frontend real:** **SÍ**.
- **Estrategia recomendada:** integración por prioridad (P1 → P2 → P3) con foco en adaptadores frontend y sin cambios de arquitectura.
- **Bloqueadores técnicos backend:** **ninguno crítico** para arrancar la integración real.
