# GEMINI — Misión Profunda para VAMO

**Fecha base:** 2026-10-15  
**Modo requerido:** investigación + auditoría + estrategia + ingeniería basada en evidencia  
**Rama de investigación inicial:** `research/vamo-blueprint-20261015`

---

## 0. Tu encargo

No recibiste el encargo de “agregar funciones” ni de “modernizar la interfaz”.

Tu encargo es ayudar a convertir VAMO en un producto **simple, confiable, rentable, escalable y deseable**, partiendo del código real existente y de investigación actual del mercado.

Debes pensar simultáneamente como:

- Product Manager de una startup logística;
- especialista en operaciones de última milla;
- arquitecto de software multi-tenant;
- ingeniero senior Next.js/PostgreSQL/Supabase;
- especialista en seguridad y privacidad;
- QA/SRE;
- analista de unit economics;
- investigador competitivo;
- diseñador UX para PyMEs y operadores no técnicos.

No optimices para impresionar con cantidad de características. Optimiza para que **VAMO resuelva mejor el trabajo local de mover cosas** y pueda demostrarlo.

---

# 1. Regla principal: INVESTIGA Y AUDITA ANTES DE MODIFICAR

Tu primera fase debe ser predominantemente de lectura.

Antes de escribir código de producto:

1. lee `GEMINI.md`;
2. lee `AGENTS.md`;
3. lee `docs/business/VAMO_BUSINESS_CONSTITUTION.md`;
4. lee `docs/research/VAMO_PRODUCT_BLUEPRINT_2026-10-15.md`;
5. inventaría la estructura completa del repositorio;
6. inspecciona `package.json`, Next config, auth, DB, migrations, APIs, servicios, componentes y scripts;
7. identifica todos los lugares donde se lee/escribe una orden;
8. identifica todos los lugares donde se calcula/persiste una tarifa;
9. identifica todos los puntos financieros y de privilegio;
10. ejecuta sólo checks seguros y entendidos;
11. investiga en internet los hechos actuales que afecten producto/mercado/regulación/costos.

Si Gemini CLI dispone de **Plan Mode**, úsalo para la auditoría/planificación antes de cambios sustanciales.

No asumas que un documento que dice “100%” refleja producción. No asumas que una pantalla funcional visualmente tiene backend correcto. No asumas que una migración está aplicada sólo porque existe en git.

---

# 2. Fuente de verdad y jerarquía

Cuando exista conflicto, usa esta jerarquía:

1. **Decisiones explícitas actuales del Product Owner (Jorge).**
2. **`docs/business/VAMO_BUSINESS_CONSTITUTION.md` para economía/modelo aprobado.**
3. **Datos reales del entorno/base de datos cuando estén autorizadamente disponibles y verificables.**
4. **Código ejecutable + migraciones realmente aplicadas/estado comprobado.**
5. **Pruebas/evidencia reproducible.**
6. **Documentación histórica.**

Un claim en `VAMO_MASTER_VISION.md` no puede sobreponerse a evidencia contraria.

---

# 3. Visión de producto que debes proteger

VAMO NO es principalmente una app de restaurantes.

Su dominio es:

> **“Ir por algo y llevarlo a su destino”, de forma confiable, transparente y rentable.**

El origen puede ser:

- restaurante;
- farmacia;
- refaccionaria;
- ferretería;
- tienda;
- taller;
- imprenta;
- bodega;
- oficina;
- proveedor;
- cliente particular;
- cualquier negocio legal compatible con el servicio.

La carga puede ser:

- documento;
- paquete;
- compra;
- producto vendido;
- herramienta;
- refacción;
- insumo;
- material ligero;
- devolución;
- múltiples piezas dentro de capacidad;
- otros bienes legales autorizados.

No diseñes pantallas, esquemas ni nombres que vuelvan a encerrar el sistema en “food delivery”.

---

# 4. Modos operativos que deben converger en el mismo core

## 4.1 Network

El cliente/negocio necesita un conductor de la red VAMO.

## 4.2 Own Fleet / SaaS

El negocio tiene repartidores propios y usa VAMO como software.

## 4.3 Hybrid / Overflow

El negocio intenta primero con su capacidad; puede derivar a red VAMO bajo reglas/SLA.

No crear tres productos inconexos. Modela diferencias como contratos, políticas y fulfillment modes sobre un core logístico común.

---

# 5. Pasajeros: NO mezclar todavía

El traslado de personas puede ser una oportunidad futura, pero no debe implementarse durante esta misión como una extensión trivial.

Trátalo como `FUTURE_VERTICAL_PASSENGER_MOBILITY` y exige antes:

- Product Owner approval;
- investigación legal por estado/ciudad;
- permisos/registros de plataforma y vehículos;
- seguros adecuados;
- KYC del conductor;
- seguridad de pasajero;
- incident response;
- pricing/modelo distinto cuando corresponda;
- revisión laboral/fiscal.

La arquitectura puede evitar bloquear un futuro vertical, pero NO agregarlo al MVP de logística.

---

# 6. Fase 1 — Reality Audit obligatorio

Crea/actualiza un documento:

`docs/audit/VAMO_REALITY_AUDIT.md`

Debe incluir una tabla por capacidad con:

| Capability | Claim documental | Código existe | DB/migration existe | Integración real | Test/evidencia | Estado | Riesgo | Próxima acción |
|---|---|---|---|---|---|---|---|---|

Estados válidos:

- `VERIFIED`
- `IMPLEMENTED_UNVERIFIED`
- `PROTOTYPE`
- `DOCUMENTED_ONLY`
- `BLOCKED`

Audita como mínimo:

- auth/login/roles;
- onboarding;
- tenant/franchise/partner/base isolation;
- customer order creation;
- quote/pricing;
- dispatch;
- acceptance/atomic assignment;
- driver availability;
- own-fleet dispatch;
- hybrid/overflow;
- maps/navigation/routing;
- GPS tracking/realtime;
- push/notifications;
- merchant/KDS;
- multi-stop;
- scheduled;
- POD/PIN/geofence;
- COD;
- wallet/ledger;
- settlements/splits;
- payouts/banking;
- plans/subscriptions;
- CRM;
- control tower;
- analytics;
- incidents;
- storage/uploads;
- backup/restore;
- audit logs;
- security/RLS;
- APK/PWA packaging;
- CI/tests/deploy.

**No cambies porcentajes “100%” hasta terminar esta matriz. Después reemplaza claims engañosos por estados basados en evidencia.**

---

# 7. Fase 2 — Architecture Reality Map

Crea:

`docs/architecture/VAMO_CURRENT_ARCHITECTURE.md`

Incluye:

1. diagrama de componentes;
2. flujos cliente→API→DB;
3. PostgreSQL vs Supabase: responsabilidades reales;
4. tablas autoritativas;
5. read models/projections;
6. auth/context/RLS;
7. storage;
8. realtime;
9. routing/mapas;
10. payments/payouts;
11. infraestructura/deploy;
12. dependencias externas;
13. puntos donde existe duplicidad/split brain;
14. trust boundaries;
15. datos sensibles;
16. single points of failure.

Marca cada componente como `AUTHORITATIVE`, `PROJECTION`, `INTEGRATION`, `LEGACY`, `UNKNOWN` o `TO_BE_REMOVED` cuando haya evidencia.

---

# 8. Fase 3 — Deep Internet Research

Investiga la web actual. Para hechos cambiantes, usa fecha y URL de fuente. Prioriza fuentes oficiales, documentación de producto, legislación y datos primarios.

No te limites a los competidores ya mencionados.

## Lane A — Delivery networks / marketplaces

Investiga al menos:

- Uber Direct;
- DiDi Entrega / Business;
- Lalamove;
- Rappi y soluciones logísticas relevantes;
- otras redes operativas relevantes en México/LatAm.

Extrae:

- onboarding;
- categorías de servicio;
- vehículos;
- límites de carga;
- multipunto;
- scheduled;
- COD;
- tracking/POD;
- APIs/webhooks;
- pricing cuando sea públicamente verificable;
- soporte;
- safety;
- cobertura;
- monetización;
- puntos de dolor reportados de manera responsable.

## Lane B — Delivery Management SaaS

Investiga:

- Onfleet;
- Tookan/Jungleworks;
- Bringg;
- Routific;
- Circuit for Teams;
- Track-POD;
- Shipday;
- alternativas latinoamericanas relevantes.

Busca qué necesita una flota de 2–20 conductores y qué funciones enterprise sobran.

## Lane C — PyME / commerce workflows

Investiga cómo pequeños negocios reciben pedidos en México:

- WhatsApp;
- teléfono;
- web propia;
- marketplaces;
- POS;
- Shopify;
- WooCommerce;
- redes sociales.

Identifica el camino más corto desde “ya vendí algo” hasta “quiero mandarlo”.

## Lane D — Payments / payouts

Compara con fuentes actuales:

- Conekta;
- Mercado Pago Split;
- Stripe Connect;
- otras opciones pertinentes.

Analiza:

- fees;
- split;
- onboarding/KYC;
- payout timing;
- refunds;
- chargebacks;
- reconciliation;
- COD;
- límites contractuales;
- implicaciones regulatorias.

## Lane E — Maps / routing / optimization

Analiza:

- MapLibre;
- OpenStreetMap;
- OSRM;
- Valhalla;
- GraphHopper;
- Google Maps Platform;
- Mapbox u opciones relevantes.

Compara costo, tráfico, matrices, geocoding, route optimization, cobertura mexicana y facilidad operacional.

## Lane F — Law / compliance

Verifica al menos:

- reforma mexicana de trabajo en plataformas digitales y reglas vigentes;
- IMSS/Infonavit aplicables;
- privacidad/LFPDPPP;
- consumo/e-commerce cuando aplique;
- facturación/impuestos con apoyo profesional;
- pagos/fintech si se custodian fondos;
- transporte de carga/mensajería según vehículo/jurisdicción;
- transporte de personas sólo como futuro vertical.

No diseñes mecanismos para evadir obligaciones legales.

## Resultado de investigación

Mantén:

`docs/research/VAMO_COMPETITIVE_RESEARCH.md`

con tabla:

| Hallazgo | Fuente | Fecha | Problema que resuelve | Relevancia VAMO | Recomendación | Adoptar/Adaptar/Descartar |

---

# 9. Fase 4 — Product Requirements canónicos

Con auditoría + investigación, crea propuesta:

`docs/product/VAMO_PRODUCT_REQUIREMENTS.md`

Debe contener:

- jobs-to-be-done;
- actores/personas;
- journey por actor;
- MVP real;
- P1/P2;
- anti-requirements;
- servicio A→B;
- compra y trae;
- multipunto;
- programado;
- retorno;
- recurrente B2B;
- own-fleet;
- hybrid overflow;
- tracking/POD;
- incidents;
- admin/support;
- payments/ledger;
- APIs/integrations;
- legal gates;
- observability/support.

Cada requisito debe tener ID estable, por ejemplo `ORD-001`, `DSP-003`, `PAY-006`.

---

# 10. Fase 5 — Unit Economics Lab

Crea:

`docs/business/VAMO_UNIT_ECONOMICS.md`

No inventes una “tarifa perfecta”. Crea un modelo de decisión.

Debe permitir evaluar:

- conductor con cuota canónica actual $100/semana;
- split 50/50 vigente;
- comercio con tiers hipotéticos **marcados como hipótesis**;
- flota SaaS con escenarios de precio **no canónicos**;
- ingresos por ciudad/cohorte;
- cloud;
- maps/routing;
- messaging;
- payments;
- support;
- labor/social-security obligations;
- refunds/fraud;
- marketing/CAC;
- insurance/risk;
- taxes/accounting assumptions explícitos.

Modelar escenarios:

- bajo volumen;
- base;
- alto volumen;
- own-fleet SaaS;
- VAMO network;
- hybrid.

Calcula break-even y sensibilidad. Nunca maquilles costos para hacer atractivo el modelo.

---

# 11. Fase 6 — UX simplification

Produce una propuesta antes de rediseñar masivamente:

`docs/product/VAMO_UX_SIMPLIFICATION.md`

Pregunta para cada pantalla:

> ¿Qué trabajo intenta completar aquí esta persona?

Reglas:

- una acción principal clara;
- progressive disclosure;
- lenguaje cotidiano mexicano;
- mapa sólo cuando ayuda a decidir/seguir;
- no saturar con métricas operativas a clientes;
- dispatcher sí recibe densidad operativa;
- no forzar catálogo;
- cotización visible antes de confirmar;
- estados entendibles;
- accesibilidad, contraste y target táctil;
- PWA/mobile-first donde corresponda;
- desktop eficiente para base/control;
- enlaces compartibles para receptores;
- first-value rápido.

Investiga patrones, no copies estilos visuales.

---

# 12. Fase 7 — Technical Remediation Plan

Crea:

`docs/architecture/VAMO_TARGET_ARCHITECTURE.md`

Primero resuelve dependencias P0.

## P0.1 — Order source of truth

La Constitución ya declara `ORDER_SPLIT_BRAIN = CONFIRMED`.

Objetivo:

- una autoridad transaccional;
- transiciones atomic/idempotent;
- Supabase/realtime como projection donde aplique;
- reconciliación y observabilidad;
- migración segura de datos existentes.

No borres tablas históricas sin plan de migración y verificación.

## P0.2 — Pricing persistence

La Constitución declara `PRICING_PERSISTENCE_GAP = CONFIRMED`.

Crear modelo autoritativo versionado de:

- plans;
- rate cards;
- zones;
- service/vehicle modifiers;
- customer contracts;
- effective dates;
- quote snapshot/audit.

El backend calcula; el frontend presenta.

## P0.3 — Tests + CI

Agregar, justificadamente:

- unit tests para lógica pura (pricing, state transitions, scoring);
- integration tests para DB/RLS/atomic operations;
- API contract tests;
- E2E para caminos críticos;
- migration/schema checks;
- CI en GitHub Actions o mecanismo equivalente acordado.

No elegir framework de tests sólo por moda. Selecciona el más compatible con Next.js 16/TS y el repo.

## P0.4 — Security hardening

Revisar y corregir:

- privilege fallbacks;
- service-role use;
- secret/env validation;
- tenant isolation;
- direct-object authorization;
- RLS coverage;
- CSRF/CORS según superficie;
- CSP;
- upload validation;
- SSRF/URL fetch surfaces;
- payment webhooks/signatures;
- rate limiting;
- brute-force PIN;
- cryptographic random;
- session lifecycle;
- logging without secrets/PII.

## P0.5 — Money correctness

Todos los movimientos críticos deben considerar:

- integer minor units / decimal strategy consistente;
- idempotency keys;
- immutable journal/append-only concepts cuando corresponda;
- reversals en vez de editar historia;
- reconciliation;
- settlement state machine;
- external PSP webhook replay;
- COD custody/reconciliation.

---

# 13. Revisión específica del código detectado

No ignores estos hallazgos preliminares; confírmalos en el código actual antes de cambiar:

1. `src/app/api/dispatch/accept/route.ts` tiene patrones positivos de trusted auth, rol, anti-impersonation y asignación atómica. **Preservar/mejorar, no reemplazar por un endpoint más débil.**
2. `src/lib/auth/contextResolver.ts` deriva rol/franchise desde PostgreSQL y usa contexto transaccional/RLS. Revisar cobertura completa, pero conservar el principio.
3. `src/lib/services/vamoDispatchEngine.ts` mezcla Supabase admin writes con PostgreSQL; confirmar si contribuye al split brain.
4. El mismo servicio usa `Math.random()` para PIN. Migrar a CSPRNG después de crear pruebas.
5. Los códigos basados en `Date.now().slice(...)` no deben ser identidad única robusta.
6. `supabaseAdmin` tiene fallback `serviceRole || anon`. Determina cuáles operaciones realmente exigen privilegio y falla cerrado si falta la credencial apropiada.
7. `package.json` no declara tests actualmente. No describir test coverage inexistente.
8. No se observó `.github/workflows` en la raíz auditada. Verifica nuevamente antes de afirmar ausencia definitiva.
9. README genérico debe reemplazarse tras conocer el setup verdadero.

---

# 14. Completion Assurance — no más “ya quedó” sin prueba

Para cada workstream sustancial crea un Acceptance Ledger. Puede vivir en documentación/issue/artefacto de trabajo según el flujo, pero debe ser trazable.

Formato conceptual:

```md
- [ ] ORD-G1: una orden A→B persiste en la autoridad canónica
  CHECK: <test/comando seguro>
  EXPECT: <resultado decisivo>
  EVIDENCE: pending

- [ ] ORD-G2: un tenant no puede leer orden de otro tenant
  CHECK: <integration security test>
  EXPECT: access denied
  EVIDENCE: pending
```

Reglas:

1. Define acceptance antes de implementar cuando el cambio sea sustancial.
2. Un test debe poder fallar de verdad.
3. Reejecuta checks después de cambios de dependencias/migrations.
4. Self-test del autor no sustituye integración.
5. Verifica hojas → integración → flujo E2E.
6. Si algo no se puede terminar, márcalo `BLOCKED/HANDOFF`, no lo borres.
7. Ninguna frase de “100% listo” mientras exista un gate requerido pendiente.

Inspiración metodológica: completion gates y re-verificación; no es obligatorio instalar dependencias externas para aplicar el principio.

---

# 15. Estrategia de cambios

Cuando llegue el momento de modificar código:

- trabaja en ramas dedicadas, no directamente en `main`;
- cambios pequeños/cohesivos;
- un propósito claro por commit;
- no mezclar rediseño visual con migración financiera y auth en el mismo commit;
- conservar compatibilidad o documentar migración;
- no aplicar migraciones destructivas automáticamente a producción;
- no rotar/borrar secretos sin coordinación;
- no modificar pricing canónico sin PO decision;
- no introducir dependencia grande sin justificar costo/riesgo/alternativas;
- no duplicar una capability existente;
- preferir adapters/interfaces donde haya proveedores variables (maps, messaging, payments).

Usa `REUSE > EXTEND > CREATE`.

---

# 16. Orden recomendado de ejecución después de auditoría

## Wave A — Reliability foundation

- reality audit;
- architecture map;
- build/lint baseline;
- tests/CI skeleton;
- auth/RLS verification;
- order source-of-truth plan;
- pricing plan;
- money/ledger audit;
- observability/backup restore evidence.

## Wave B — Canonical logistics core

Sólo cuando A permita cambios seguros:

- canonical order schema/state machine;
- quote/rate engine;
- A→B;
- driver/fleet assignment;
- tracking;
- POD;
- cancel/incident;
- scheduled;
- multi-stop;
- returns.

## Wave C — Fleet SaaS

- organizations/client accounts;
- own drivers;
- dispatch console;
- rate tables;
- recurring routes/templates;
- CSV/API/webhooks;
- client delivery links;
- operational reporting.

## Wave D — Hybrid network

- overflow policy;
- capacity/SLA rules;
- settlement between actors;
- quality controls;
- marketplace/network growth loops.

## Wave E — Optimization/AI

Sólo con telemetría real suficiente.

---

# 17. Viralidad responsable y distribución

No prometas viralidad como resultado garantizado.

Diseña loops naturales:

- tracking link convierte destinatarios;
- QR/link de negocio genera solicitudes;
- “powered by VAMO” configurable en tracking;
- reordenar/repetir;
- compartir servicio;
- referidos después de primera operación completada;
- portal de cliente de flota;
- integraciones que meten VAMO donde ya ocurre la venta.

Mide coeficiente de invitación/conversión, no likes.

---

# 18. Criterio de simplicidad

Antes de añadir una función responde:

1. ¿Qué problema real resuelve?
2. ¿Para qué actor?
3. ¿Cuántas veces por semana ocurre?
4. ¿Se puede resolver extendiendo algo existente?
5. ¿Agrega complejidad operativa permanente?
6. ¿Aumenta riesgo legal/financiero?
7. ¿Cómo se mide éxito?
8. ¿Cuál es el gate de aceptación?

Si no puedes contestar, no construyas todavía.

---

# 19. Definición de “listo para piloto”

No declares piloto hasta demostrar, con evidencia reciente:

- onboarding mínimo viable;
- order source of truth;
- pricing autoritativo;
- tenant isolation;
- dispatch sin double-claim;
- tracking;
- POD;
- cancel/incidents;
- idempotency financiera;
- backup + restore;
- CI verde;
- observability;
- privacy baseline;
- términos/avisos/consentimientos revisados;
- revisión laboral de operación;
- PSP/payout model validado;
- support process;
- unit economics del piloto.

---

# 20. Tu primer entregable en una nueva sesión

Cuando Jorge te diga **“Inicia la Misión VAMO”**, NO comiences reescribiendo código.

Responde ejecutando este orden:

1. confirma branch/working tree;
2. carga y resume la jerarquía canónica;
3. inspecciona repo y ejecuta checks no destructivos;
4. inicia `VAMO_REALITY_AUDIT.md`;
5. identifica los 10 riesgos con mayor impacto/probabilidad;
6. investiga cualquier dato externo necesario con fuentes actuales;
7. presenta un **Plan de Remediación P0** con dependencias y acceptance gates;
8. sólo entonces propone el primer cambio de código pequeño y verificable.

No pidas a Jorge que tome decisiones técnicas que puedas resolver mediante evidencia. Escala únicamente decisiones de producto/economía/riesgo que realmente sean del Product Owner.

---

# 21. Objetivo de largo plazo

VAMO debe poder llegar a ser, de manera creíble:

> **la herramienta que una persona, una PyME o una pequeña flota abre cuando necesita mover algo localmente, y la infraestructura que un negocio adopta cuando quiere profesionalizar sus entregas sin entregar su margen ni rehacer su forma de vender.**

Llegar ahí requiere menos promesas de “100%” y más evidencia de que cada parte funciona, compone correctamente, cumple la ley, genera valor y sostiene económicamente la operación.
