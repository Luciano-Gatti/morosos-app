# V1 microservicio de control de morosos (análisis y diseño)

> Alcance: propuesta técnica para una V1 funcional, orientada a CRUD + lógica de negocio.
> No incluye seguridad/autenticación, auditoría, ni frontend.

## 1) Propuesta de nombre técnico del microservicio

**Nombre sugerido:** `morosos-control-service`

Alternativas válidas:
- `debt-collection-service` (más neutro al dominio internacional)
- `inmueble-seguimiento-service` (más explícito al lenguaje del negocio local)

Recomendación para V1: **`morosos-control-service`** (balance entre claridad funcional y naming técnico simple para ecosistema de microservicios).

---

## 2) Propuesta de paquetes (Spring Boot)

Base package sugerido: `com.tuorg.morososcontrol`

```text
com.tuorg.morososcontrol
├─ config
│  ├─ JacksonConfig
│  ├─ OpenApiConfig
│  └─ ClockConfig
├─ inmueble
│  ├─ api
│  │  ├─ InmuebleController
│  │  └─ dto
│  ├─ application
│  │  ├─ InmuebleService
│  │  └─ InmuebleQueryService
│  ├─ domain
│  │  ├─ Inmueble
│  │  ├─ Grupo
│  │  └─ EstadoDeuda
│  └─ infrastructure
│     ├─ InmuebleRepository
│     ├─ GrupoRepository
│     └─ EstadoDeudaRepository
├─ seguimiento
│  ├─ api
│  │  ├─ CasoMorosidadController
│  │  ├─ EtapaController
│  │  ├─ CompromisoPagoController
│  │  └─ dto
│  ├─ application
│  │  ├─ CasoMorosidadService
│  │  ├─ TransicionEtapaService
│  │  └─ CompromisoPagoService
│  ├─ domain
│  │  ├─ CasoMorosidad
│  │  ├─ EtapaCaso
│  │  ├─ EventoEtapa
│  │  ├─ CompromisoPago
│  │  └─ CorteServicio
│  └─ infrastructure
│     ├─ CasoMorosidadRepository
│     ├─ EtapaCasoRepository
│     ├─ CompromisoPagoRepository
│     └─ CorteServicioRepository
├─ catalogo
│  ├─ api
│  │  ├─ MotivoCorteController
│  │  └─ dto
│  ├─ application
│  │  └─ MotivoCorteService
│  ├─ domain
│  │  └─ MotivoCorte
│  └─ infrastructure
│     └─ MotivoCorteRepository
├─ regla
│  ├─ api
│  │  └─ ParametroGlobalController
│  ├─ application
│  │  └─ ReglaSeguimientoService
│  ├─ domain
│  │  └─ ParametroGlobal
│  └─ infrastructure
│     └─ ParametroGlobalRepository
├─ shared
│  ├─ exception
│  ├─ validation
│  └─ pagination
└─ MorososControlApplication
```

### Nota de diseño
- Separar por **módulo de dominio** (`inmueble`, `seguimiento`, `catalogo`, `regla`) evita mezclar autenticación futura con negocio.
- En V1 podés simplificar a 3 capas (`api`, `application`, `infrastructure`) dejando entidades en `domain`.

---

## 3) Entidades principales

## Núcleo de inmuebles

### `Inmueble`
- `id` (UUID)
- `numeroCuenta` (String, único)
- `propietarioNombre` (String)
- `distrito` (String)
- `direccionCompleta` (String)
- `activo` (boolean)
- `grupo` (ManyToOne)
- `createdAt`, `updatedAt` (técnicos)

### `Grupo`
- `id` (UUID)
- `codigo` o `nombre` (String, único) ← corresponde a “Segmento” del Excel
- `seguimientoHabilitado` (boolean)
- `activo` (boolean)

### `EstadoDeuda`
- `id` (UUID)
- `inmueble` (OneToOne o ManyToOne con vigencia)
- `cantidadCuotasAdeudadas` (int)
- `montoAdeudado` (BigDecimal)
- `fechaEstado` (LocalDate)

> Para V1 simple: 1 registro vigente por inmueble (OneToOne lógico).

## Núcleo de operación de morosos

### `CasoMorosidad`
- `id` (UUID)
- `inmueble` (OneToOne activo por inmueble)
- `estadoCaso` (ACTIVO, PAUSADO, CERRADO)
- `etapaActual` (enum)
- `fechaIngresoSeguimiento` (LocalDate)
- `motivoCierre` (String opcional)
- `fechaCierre` (LocalDate opcional)

### `EventoEtapa` (historial de cambios de etapa)
- `id` (UUID)
- `casoMorosidad` (ManyToOne)
- `tipoEvento` (ASIGNACION_INICIAL, AVANCE, REPETICION)
- `etapa` (enum)
- `fechaEntregaEfectiva` (LocalDate) **(fecha oficial de etapa)**
- `observacion` (String opcional)

### `CompromisoPago`
- `id` (UUID)
- `casoMorosidad` (ManyToOne)
- `fechaDesde` (LocalDate, obligatoria)
- `fechaHasta` (LocalDate, opcional)
- `estado` (VIGENTE, VENCIDO, CUMPLIDO, ANULADO)

### `CorteServicio`
- `id` (UUID)
- `casoMorosidad` (ManyToOne)
- `fecha` (LocalDate)
- `tipoCorte` (enum)
- `motivoCorte` (ManyToOne)
- `observacion` (String opcional)

## Catálogo

### `MotivoCorte`
- `id` (UUID)
- `nombre` (String, único)
- `activo` (boolean)

## Reglas globales

### `ParametroGlobal`
- `id` (UUID)
- `clave` (String único) — ejemplo: `MIN_CUOTAS_SEGUIMIENTO`
- `valor` (String)

---

## 4) Relaciones entre entidades

- `Grupo (1) ── (N) Inmueble`
- `Inmueble (1) ── (1) EstadoDeuda vigente`
- `Inmueble (1) ── (0..1) CasoMorosidad activo`
- `CasoMorosidad (1) ── (N) EventoEtapa`
- `CasoMorosidad (1) ── (N) CompromisoPago`
- `CasoMorosidad (1) ── (N) CorteServicio`
- `MotivoCorte (1) ── (N) CorteServicio`

Reglas clave:
1. No crear caso si `grupo.seguimientoHabilitado = false`.
2. No crear caso si `cantidadCuotasAdeudadas < MIN_CUOTAS_SEGUIMIENTO`.
3. No permitir “retroceso” de etapa en flujo normal.
4. En etapa `CORTE`, permitir múltiples `CorteServicio`.
5. No eliminar `MotivoCorte` si está referenciado por algún `CorteServicio`.

---

## 5) Enums mínimos

### `EtapaMora`
- `AVISO_DEUDA`
- `INTIMACION`
- `AVISO_CORTE`
- `CORTE`

### `EstadoCaso`
- `ACTIVO`
- `PAUSADO`
- `CERRADO`

### `TipoEventoEtapa`
- `ASIGNACION_INICIAL`
- `AVANCE`
- `REPETICION`

### `TipoCorte`
- `PARCIAL`
- `TOTAL`
- *(si el negocio aún no define tipos, arrancar con catálogo o enum mínimo extensible)*

### `EstadoCompromisoPago`
- `VIGENTE`
- `VENCIDO`
- `CUMPLIDO`
- `ANULADO`

---

## 6) Diseño de endpoints REST (V1)

Base path sugerido: `/api/v1`

## Inmuebles / grupos / deuda

- `POST /inmuebles` (alta manual)
- `GET /inmuebles/{id}`
- `GET /inmuebles?numeroCuenta=&grupo=&activo=&page=&size=`
- `PUT /inmuebles/{id}`

- `POST /grupos`
- `GET /grupos`
- `PUT /grupos/{id}`

- `PUT /inmuebles/{id}/estado-deuda` (upsert de deuda vigente)
- `GET /inmuebles/{id}/estado-deuda`

## Entrada a seguimiento y lista general

- `POST /casos`  
  Crea caso para inmueble si cumple reglas (grupo habilitado + mínimo cuotas).
- `GET /casos/morosos?etapa=&estadoCaso=&grupo=&distrito=&minCuotas=&sort=`
  Lista operativa general (ordenar/filtrar/seleccionar).

## Gestión de casos

- `GET /casos/{id}`
- `POST /casos/{id}/asignar-etapa`  
  (para asignación inicial manual desde lista general)
- `POST /casos/{id}/avanzar`
- `POST /casos/{id}/repetir-etapa`
- `POST /casos/{id}/pausar`
- `POST /casos/{id}/reanudar`
- `POST /casos/{id}/cerrar`

## Compromiso de pago

- `POST /casos/{id}/compromisos-pago`
- `GET /casos/{id}/compromisos-pago`
- `POST /compromisos-pago/{compromisoId}/cumplir`

Regla: si vence (`fechaHasta`) sin cumplimiento, el caso pasa a `ACTIVO` automáticamente (job programado diario o validación lazy en lectura/operación).

## Cortes (solo etapa CORTE)

- `POST /casos/{id}/cortes`
- `GET /casos/{id}/cortes`

## Catálogo motivos de corte

- `POST /motivos-corte`
- `GET /motivos-corte?activo=`
- `PUT /motivos-corte/{id}`
- `DELETE /motivos-corte/{id}` (soft-delete lógico o rechazo por uso)

## Parámetros globales

- `GET /parametros-globales`
- `PUT /parametros-globales/MIN_CUOTAS_SEGUIMIENTO`

---

## 7) Orden recomendado de implementación

1. **Bootstrap técnico**
   - Spring Boot + Maven + módulos base + manejo de errores estándar.
2. **Catálogos y datos base**
   - `Grupo`, `MotivoCorte`, `ParametroGlobal`.
3. **Inmuebles + importación inicial Excel (si aplica en V1)**
   - CRUD `Inmueble` + mapeo `Segmento -> Grupo`.
4. **Estado de deuda**
   - endpoint upsert y validaciones numéricas.
5. **Regla de elegibilidad y creación de caso**
   - validación grupo habilitado + mínimo cuotas.
6. **Flujo de etapas del caso**
   - asignación inicial, avance, repetición, no retroceso.
7. **Pausa / reanudación / cierre**
   - con reglas de estado consistentes.
8. **Compromisos de pago**
   - creación, vencimiento y reactivación de caso.
9. **Cortes en etapa CORTE**
   - múltiples registros por caso.
10. **Consultas operativas**
   - lista general de morosos con filtros y ordenación.
11. **Pruebas**
   - unitarias de reglas + integración API.

---

## 8) Riesgos y decisiones a cerrar antes de codificar

1. **Estrategia de importación Excel V1**
   - endpoint síncrono simple vs proceso batch asíncrono.
2. **Definición exacta de “cantidad mínima de cuotas”**
   - ¿`>=`? (recomendado) y si aplica por distrito/grupo en el futuro.
3. **Unicidad de caso activo por inmueble**
   - recomendable: solo 1 caso activo a la vez.
4. **Estados y transiciones permitidas (máquina de estados)**
   - documentar tabla explícita para evitar ambigüedad.
5. **Automatismo de vencimiento de compromiso**
   - job diario (recomendado) o cálculo “on-demand”.
6. **Borrado de motivos de corte**
   - hard-delete bloqueado por FK vs soft-delete con `activo=false`.
7. **Modelo de deuda histórico**
   - solo snapshot vigente (V1) vs historial completo (V2).
8. **Paginación/orden para lista de morosos**
   - definir campos de sort soportados desde el inicio.
9. **Idempotencia en operaciones sensibles**
   - crear caso, avanzar etapa, registrar corte.
10. **Preparación para AuthService futuro**
   - dejar capa de seguridad desacoplada: sin referencias a `User` en dominio.

---

## Criterios de simplicidad para V1

- CRUD primero + reglas de negocio mínimas críticas.
- Nada de seguridad propia en este servicio.
- Nada de auditoría de negocio en V1.
- Dominio centrado en `Inmueble` y `CasoMorosidad`.
- Flujo de etapas explícito y validado en backend.
