# VAMO — Product & Market Blueprint

**Fecha de corte:** 2026-10-15  
**Estado:** Research baseline / propuesta estratégica, no sustituye decisiones canónicas del Product Owner  
**Repositorio evaluado:** `BranantoniomdmiX/VAMO`  
**Product Owner:** Jorge

---

## 1. Tesis ejecutiva

VAMO tiene una oportunidad mayor si deja de pensarse como una app centrada en comida y se define como una **infraestructura logística hiperlocal**:

> **VAMO permite mover cualquier cosa legal de un punto a otro, usando tu propia flota, la red VAMO o ambas.**

La unidad fundamental del producto no debe ser el restaurante ni el platillo. Debe ser el **trabajo logístico**: recoger algo, trasladarlo, entregarlo, comprobarlo y liquidarlo correctamente.

Eso permite servir simultáneamente a:

- una persona que necesita mandar llaves, documentos, medicinas, una compra o un paquete;
- un comercio que necesita entregar pedidos recibidos por WhatsApp, teléfono, web o mostrador;
- una ferretería, farmacia, refaccionaria, taller, imprenta, tienda, proveedor o distribuidor;
- un negocio que realiza rutas recurrentes de recolección o reparto;
- un pequeño equipo de mensajeros/motociclistas que necesita tecnología de despacho;
- una empresa que ya tiene repartidores propios y sólo necesita software, tracking, evidencia y control;
- una flota que requiere capacidad adicional en picos de demanda.

La comida es una categoría importante, **no la definición del producto**.

---

## 2. Qué debe ser VAMO

### 2.1 Tres modos con un solo núcleo

#### A. Red VAMO

El solicitante necesita capacidad logística. VAMO encuentra un conductor elegible, cotiza, asigna, rastrea, confirma y registra la entrega.

#### B. Flota Propia / SaaS

La empresa ya tiene repartidores. VAMO funciona como sistema operativo de última milla:

- entrada de pedidos;
- despacho manual/automático;
- asignación a choferes propios;
- mapas, ETA y tracking;
- prueba de entrega;
- incidencias;
- tarifas internas;
- métricas;
- clientes empresariales;
- facturación/conciliación cuando corresponda.

VAMO debe aportar valor aunque ningún conductor de la red VAMO participe.

#### C. Híbrido / Overflow

La empresa usa sus repartidores primero. Si no tiene capacidad, se incumplirá un SLA o la distancia/carga lo justifica, puede enviar el trabajo a la red VAMO bajo reglas transparentes.

Este modo puede convertirse en una ventaja diferencial importante porque une un SaaS de despacho con una red local de capacidad.

---

## 3. Qué NO debe ser VAMO

- No debe ser solamente una copia de Uber Eats, DiDi Food o Rappi.
- No debe exigir catálogo para poder pedir un servicio logístico.
- No debe obligar a instalar una app antes del primer pedido útil.
- No debe obligar a un negocio a abandonar sus canales existentes de WhatsApp, teléfono, web o mostrador.
- No debe cobrar porcentajes agresivos sólo porque el negocio vende más, salvo que el Product Owner cambie expresamente el modelo canónico.
- No debe depender de una sola clase de vehículo.
- No debe confundir una pantalla terminada con una capacidad verificada.
- No debe incorporar transporte de pasajeros como una simple opción adicional del mismo flujo. Pasajeros implica regulación, seguros, onboarding, seguridad y operación diferentes.

---

## 4. Primitivas de servicio recomendadas

La interfaz puede mostrar nombres sencillos; internamente deben modelarse como primitivas logísticas composables.

### 4.1 Envío A → B

Recoger un objeto legal en un punto y entregarlo en otro.

Ejemplos: documentos, llaves, paquete, refacción, medicamento, herramienta, producto vendido por WhatsApp.

### 4.2 Compra y trae

El conductor recoge o compra algo por encargo y lo lleva al destino. Deben existir reglas claras para anticipos, comprobantes, límites y artículos prohibidos.

### 4.3 Ruta multipunto

Una recolección con varios destinos, varias recolecciones con un destino o una secuencia mixta.

Casos: distribución local, muestras, insumos, rutas de talleres, farmacias, tiendas, oficinas y proveedores.

### 4.4 Programado

Servicio para fecha/hora o ventana acordada. Fundamental para B2B y demanda recurrente.

### 4.5 Retorno / cambio / logística inversa

Recoger devolución, cambio, reparación, envase, documento firmado u otro objeto y regresarlo a origen/tercero.

### 4.6 Recurrente B2B

Plantilla repetible: mismos puntos, días, ventanas y reglas. Puede crear demanda estable y mejorar utilización de conductores.

### 4.7 Flota propia

El trabajo entra al mismo núcleo de órdenes, pero su `fulfillment_mode` indica que será realizado por la propia organización.

### 4.8 Overflow de red

Una orden de flota propia puede cambiar de modalidad mediante una transición auditable cuando se active una regla de capacidad/SLA y exista autorización comercial.

---

## 5. Vehículos como capacidad, no como identidad

VAMO no debe quedar encerrado en “motos”. Modelar capacidad permite crecer sin rehacer el dominio.

Cada tipo de vehículo puede declarar:

- peso máximo;
- dimensiones/volumen;
- número de piezas;
- distancia/radio recomendado;
- restricciones de clima/horario;
- equipamiento (caja, parrilla, hielera, etc.);
- tipos de carga permitidos;
- costo/tarifa aplicable.

Inicio sugerido: bicicleta/moto/auto según disponibilidad real. Más adelante: pickup/van u otros vehículos donde el mercado y la regulación lo justifiquen.

---

## 6. Benchmark competitivo: qué aprender, no qué copiar

### Uber Direct

Uber Direct demuestra una necesidad clave: los negocios quieren logística para pedidos que **ya reciben por sus propios canales** (web, WhatsApp, teléfono), sin convertir cada venta en una venta de marketplace. Uber presentó su modelo de autoservicio para PyMEs en México en 2023 y en 2026 anunció integración con EnvíaTodo para entregas locales aceleradas.

**Lección VAMO:** aceptar pedidos externos debe ser una función central, no secundaria.

Fuentes:
- https://www.uber.com/mx/es/newsroom/uber-direct/
- https://www.uber.com/mx/en/newsroom/alianza-uberdirect-enviatodo/

### Lalamove

Su API en México ofrece cotización, órdenes inmediatas/programadas, ubicación del conductor, estado en tiempo real, webhooks y hasta 20 paradas.

**Lección VAMO:** multipunto, programación, API/webhooks y logística fuera de un marketplace son expectativas reales del segmento B2B.

Fuente:
- https://www.lalamove.com/es-mx/api

### DiDi Entrega

DiDi comercializa envíos personales y empresariales, ofrece moto/auto, tracking y una modalidad Business; su producto para repartidores usa código de entrega.

**Lección VAMO:** la demanda de “envía cosas” es una categoría propia. La diferenciación no puede depender sólo de tener un flujo A→B.

Fuentes:
- https://web.didiglobal.com/mx/entrega/
- https://www.didi-food.com/es-MX/entrega-business/
- https://web.didiglobal.com/mx/food/repartidores/entrega/

### Onfleet

Onfleet representa el extremo SaaS profesional: despacho, optimización, POD, tracking de marca, API/webhooks y herramientas de courier. En octubre de 2026 su precio público comienza en USD 619/mes para Launch, y su Courier Suite es un add-on adicional.

**Lección VAMO:** existe disposición a pagar por software de última milla, pero hay espacio para una solución mucho más accesible y localizada para micro/pequeñas flotas latinoamericanas si VAMO controla bien sus costos.

Fuentes:
- https://onfleet.com/pricing
- https://support.onfleet.com/hc/en-us/articles/33882160362772-Managing-Rate-Tables

### Rappi

En México, registrar un restaurante no tiene costo inicial según su portal, pero Rappi cobra una comisión porcentual sobre los pedidos realizados mediante la plataforma y la tarifa exacta depende de variables comerciales.

**Lección VAMO:** el modelo canónico de cuota fija/0% comisión sobre venta puede ser un mensaje comercial diferenciador, siempre expresado con total transparencia sobre las cuotas que sí existan.

Fuente:
- https://merchants.rappi.com/es-mx/que-costo-tiene-registrar-mi-negocio-en-rappi

---

## 7. Oportunidad de mercado

AMVO reporta para 2025 un mercado de ventas online retail en México de aproximadamente **$941 mil millones MXN**, crecimiento anual de **19.2%** y **77.2 millones** de compradores digitales en su Estudio de Venta Online 2026.

VAMO no necesita capturar el comercio electrónico completo. Su oportunidad es resolver el último tramo local de ventas que ya ocurren en:

- WhatsApp;
- redes sociales;
- teléfono;
- tiendas físicas;
- e-commerce propio;
- marketplaces;
- ERP/POS;
- pedidos B2B recurrentes.

Fuentes:
- https://amvo.org.mx/descarga-evo-2026
- https://amvo.org.mx/libroblanco-marketplaces-2026

---

## 8. Propuesta de valor por actor

### Cliente / solicitante

- pedir en pocos pasos;
- saber cuánto costará antes de confirmar;
- rastrear sin instalar obligatoriamente otra app;
- recibir evidencia/confirmación;
- repetir mandados frecuentes;
- tener soporte claro si algo sale mal.

### Comercio / PyME

- mantener el canal de venta que ya funciona;
- mandar un pedido desde WhatsApp/teléfono/web/mostrador;
- usar sus repartidores o pedir red VAMO;
- tracking profesional para su cliente;
- conocer costo por entrega;
- no ceder un porcentaje de la venta bajo el modelo canónico vigente;
- integrar API/webhooks cuando crezca.

### Pequeña flota / base de repartidores

- alta rápida de equipo;
- despacho y estados;
- mapa operativo;
- asignación justa y transparente;
- tarifas por cliente/servicio/zona;
- evidencia y cadena de custodia;
- métricas y conciliación;
- portal/link para recibir trabajos de sus clientes.

### Repartidor

- ver trabajo, distancia, condiciones y ganancia antes de aceptar cuando legal/operativamente corresponda;
- navegación y estados simples;
- evidencia de entrega;
- menos tiempo muerto;
- acceso a demanda B2B/consumidor;
- reglas transparentes y soporte.

### Socio Comercial

- operar una red real con herramientas de onboarding, calidad, soporte y ventas;
- monetización vinculada a actividad económica real conforme a la constitución canónica;
- indicadores por zona y cohortes;
- cero incentivo de downline/MLM.

---

## 9. La experiencia debe sentirse mucho más simple que la arquitectura

Una arquitectura compleja no justifica una UX compleja.

### Pedido universal

La primera pantalla debe responder sólo:

1. ¿Qué quieres hacer? (`Enviar`, `Comprar y traer`, `Ruta`, `Programar`)
2. ¿Dónde se recoge?
3. ¿Dónde se entrega? / ¿qué paradas hay?
4. ¿Qué se mueve? (categoría, tamaño/peso aproximado, valor/restricciones)
5. ¿Cuándo?
6. Cotización y forma de cumplimiento.

Los campos adicionales aparecen sólo cuando son necesarios.

### Primer uso sin fricción

Explorar una modalidad de pedido y recibir una cotización no debería exigir un onboarding largo. Para ejecutar una operación sí se debe obtener la identidad/contacto mínimo y el consentimiento necesario.

### Tracking compartible

El receptor puede abrir un enlace seguro y limitado para ver el estado/ETA de su entrega sin tener una cuenta completa.

### VAMO Link / QR

Cada negocio o flota puede tener un enlace/QR compartible para que sus clientes soliciten, coticen o sigan una entrega bajo sus reglas. Nombre de trabajo; no es aún una marca canónica.

### WhatsApp como canal, no como base de datos

Permitir iniciar/recibir solicitudes desde WhatsApp o compartir enlaces y estados. El sistema autoritativo sigue siendo VAMO; no se debe construir lógica crítica que sólo exista en un chat.

---

## 10. Growth: diseñar distribución natural, no prometer “viralidad”

Ninguna función garantiza viralidad. Sí se pueden diseñar loops donde usar el producto lo distribuya naturalmente.

### Loop de tracking

Negocio crea envío → destinatario recibe enlace VAMO → destinatario conoce experiencia → puede crear su propio envío.

### Loop de comercio

Comercio publica “Entrega con VAMO” mediante enlace/QR → sus clientes usan el flujo → VAMO adquiere demanda sin pagar todo el CAC.

### Loop de flota

Pequeña flota usa portal de tracking de marca → sus clientes empresariales ven operación profesional → pueden adoptar VAMO directamente o recomendarla.

### Referidos sanos

Bonificar sólo por actividad legítima completada/verificada, no por reclutamiento puro. Esto evita convertir crecimiento en una estructura tipo MLM.

### Reordenamiento/repetición

Direcciones, rutas y pedidos frecuentes deben poder repetirse rápidamente.

---

## 11. Modelo económico: medir antes de escalar

La Constitución de Negocio vigente define actualmente:

- conductor: **$100 MXN/semana**, 50/50 Socio Comercial y VAMO Master;
- 0% comisión porcentual por viaje al conductor;
- comercio: suscripción fija, monto final aún pendiente de decisión;
- 0% comisión sobre venta del comercio;
- tarifa final al cliente aún pendiente de homologación.

Estos parámetros se respetan como canon actual, pero el software debe permitir **simular y observar unit economics antes de congelar tarifas**.

### Costos reales a modelar

Por ciudad/cohorte:

- infraestructura y base de datos;
- mapas/routing/geocoding/tiles;
- push/SMS/WhatsApp/telefonía;
- pagos, contracargos y dispersión;
- soporte;
- promociones y adquisición;
- incidencias/fraude/reembolsos;
- seguros/coberturas cuando correspondan;
- obligaciones laborales y de seguridad social que resulten aplicables;
- impuestos/contabilidad;
- programa de beneficios/protección cuando se formalice.

### Métricas que deben gobernar una plaza

- trabajos completados/día;
- trabajos por conductor activo/día;
- distancia promedio conductor→pickup y pickup→dropoff;
- tiempo hasta asignación;
- pickup ETA y entrega ETA;
- % entregas a tiempo;
- cancelación por causa;
- aceptación cuando legalmente sea relevante;
- tasa de reintento/fallo de entrega;
- margen de contribución por tipo de servicio;
- costo de soporte por 100 órdenes;
- ingresos recurrentes SaaS;
- retención de comercios/flotas;
- repetición del cliente;
- CAC y LTV por canal;
- utilización/capacidad ociosa de flota;
- incidencias, fraude y pérdidas.

La expansión debe basarse en densidad y economía demostradas, no solamente en registros.

---

## 12. Arquitectura de producto objetivo

### 12.1 `Order` como contrato logístico central

Debe existir un modelo canónico de orden/trabajo que capture:

- solicitante/organización;
- origen y paradas;
- carga y restricciones;
- ventana/fecha;
- modo de fulfillment (`OWN_FLEET`, `VAMO_NETWORK`, `HYBRID`);
- vehículo/capacidad requerida;
- precio cotizado y versión de tarifa;
- responsable asignado;
- estado y timestamps;
- POD/evidencia;
- incidencias;
- liquidación/ledger referenciado.

### 12.2 Una única autoridad transaccional

La Constitución ya marca `ORDER_SPLIT_BRAIN = CONFIRMED` y establece PostgreSQL/Dokploy `public.orders` como autoridad transaccional vigente.

Prioridad P0: eliminar escrituras competidoras que creen realidades distintas entre `public.orders`, `services`, `service_orders`, `customer_orders` u otras representaciones. Si se mantienen modelos derivados, deben ser proyecciones/read models/event consumers con reconciliación observable.

### 12.3 Máquina de estados explícita

Evitar estados arbitrarios dispersos por UI. Deben definirse transiciones válidas, permisos y efectos laterales.

Ejemplo conceptual:

`DRAFT → QUOTED → CONFIRMED → OFFERED/ASSIGNED → PICKUP_EN_ROUTE → PICKED_UP → DELIVERY_EN_ROUTE → DELIVERED`

Estados laterales pueden incluir `CANCELLED`, `FAILED`, `RETURN_REQUIRED`, `RETURNING`, `RETURNED`, etc. La lista final debe derivarse de los flujos reales.

### 12.4 Pricing Engine versionado

La Constitución confirma `PRICING_PERSISTENCE_GAP` en `/owner/rates` y `/admin/plans`.

Diseñar reglas versionadas y server-side, por ejemplo:

- base;
- distancia;
- paradas;
- servicio;
- vehículo/capacidad;
- zona;
- horario;
- espera;
- carga/volumen/peso;
- cliente/contrato B2B;
- clima/evento sólo si está permitido y es transparente.

Cada quote debe guardar versión/inputs suficientes para auditar por qué costó lo que costó.

### 12.5 Dispatch Engine

Conservar el buen patrón ya presente de asignación atómica en PostgreSQL. Evolucionar a criterios medibles:

- elegibilidad;
- capacidad;
- proximidad/ETA;
- carga de trabajo;
- tenant/zona;
- COD/riesgo;
- SLA;
- reglas de propia flota vs red;
- fairness y transparencia algorítmica requeridas legalmente.

Evitar reglas mágicas no documentadas.

### 12.6 POD / cadena de custodia

Según riesgo/tipo de servicio:

- PIN/OTP seguro;
- foto;
- firma;
- código/barcode;
- nombre receptor;
- geolocalización con tolerancia justificable;
- timestamps;
- excepciones cuando GPS no sea confiable.

### 12.7 Event/Outbox + proyecciones

Para tracking, notificaciones, analítica y Supabase Realtime, preferir eventos derivados de una transición transaccional confirmada. Evitar que notificación y estado puedan divergir silenciosamente.

---

## 13. Auditoría inicial del repositorio actual

### Fortalezas observadas

- Next.js 16 / React 19 y TypeScript.
- Rutas API reales; no es sólo un prototipo visual.
- PostgreSQL + Supabase con migraciones sustanciales.
- Función de asignación atómica y endpoint con verificación de rol/tenant/anti-impersonación.
- Context resolver que deriva rol/franquicia del servidor/PostgreSQL bajo RLS y falla cerrado.
- Migraciones de hardening RLS, settlement, POD, KDS, push y RBAC/passkeys.
- Scripts de auditoría de DB/secretos, migraciones y backup.
- Cabeceras HTTP de seguridad en Next config.
- MapLibre y routing/open mapping ya alineados con una estrategia de costo controlable.

### Brechas y riesgos inmediatos

#### P0 — realidad del producto

`docs/VAMO_MASTER_VISION.md` declara muchas áreas en 100%, mientras `README.md` sigue siendo el README genérico de `create-next-app`. Antes de marketing/lanzamiento debe existir un inventario verificable de capacidades.

#### P0 — split brain de órdenes

Ya reconocido canónicamente. Debe corregirse antes de escalar tráfico real.

#### P0 — pricing no persistente

Ya reconocido canónicamente. Una tarifa mostrada por UI que no es autoridad server-side es un riesgo financiero.

#### P0 — pruebas/CI

`package.json` sólo expone `dev`, `build`, `start` y `lint`; no existe un script de tests declarado. Tampoco se observó un workflow `.github/workflows` en la raíz evaluada. Se requiere establecer una pirámide de pruebas y CI antes de afirmar readiness de producción.

#### P0/P1 — PIN y códigos

`vamoDispatchEngine` genera PIN con `Math.random()` y códigos usando un sufijo de `Date.now()`. Para valores de seguridad y IDs operativos se debe migrar a random criptográfico e identificadores robustos/únicos.

#### P0 — privilegio/configuración

`vamoDispatchEngine` crea un cliente admin con `SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey`. Debe revisarse para que una ruta que exige privilegio falle cerrado cuando falte una credencial requerida, en vez de degradar silenciosamente a otra identidad. También debe revisarse la coexistencia de escrituras admin Supabase con el Postgres autoritativo.

#### P1 — documentación

Actualizar README a la realidad: arquitectura, setup, variables, DB, migraciones, ejecución local, pruebas, seguridad, despliegue y límites conocidos.

---

## 14. Estrategia tecnológica de costo controlado

### Mapas

Mantener MapLibre es razonable: es una librería abierta para mapas vectoriales WebGL y evita quedar atado desde el UI a un proveedor propietario.

Fuente:
- https://maplibre.org/maplibre-gl-js/docs

### Routing

OSRM es open source, trabaja con OpenStreetMap y soporta perfiles auto/bici/caminata. Es adecuado como base de routing inicial si se opera correctamente y se monitorea calidad/capacidad.

Fuente:
- https://project-osrm.org/

No confundir “open source” con “costo cero”: servidor, actualizaciones OSM, geocoding, tráfico, matrices grandes, optimización y observabilidad generan costos. Diseñar adaptadores para poder usar servicios premium donde generen ROI.

---

## 15. Pagos y ledger

El ledger interno debe representar obligaciones/movimientos; no debe convertir a VAMO accidentalmente en custodio regulado de saldos sin revisión jurídica.

Opciones que merecen evaluación formal:

### Conekta

El repo ya incluye Conekta. Conekta documenta dispersiones a terceros de fondos provenientes de cobros procesados por su plataforma; requiere disponibilidad/elegibilidad comercial y tiene reglas específicas.

Fuentes:
- https://developers.conekta.com/docs/gestion-de-beneficiarios
- https://developers.conekta.com/docs/tipos-de-dispersion
- https://developers.conekta.com/v2.2.0/docs/generar-una-dispersi%C3%B3n-a-terceros-con-direct-api

### Mercado Pago

Split Payments 1:1 está disponible en México y usa OAuth de cada vendedor para dividir automáticamente pagos entre seller y marketplace.

Fuente:
- https://www.mercadopago.com.mx/developers/es/docs/split-payments/split-1-1/overview

### Stripe Connect

Stripe Connect en México está diseñado para plataformas/marketplaces, onboarding/KYC y pagos/transferencias a proveedores.

Fuente:
- https://stripe.com/mx/connect/marketplaces

**Decisión:** comparar costos, contratos, capacidad de split/payout, KYC, conciliación, contracargos, tiempos de dispersión, cobertura de métodos de pago y responsabilidades regulatorias antes de consolidar proveedor.

---

## 16. Compliance: gates obligatorios de lanzamiento

> Esta sección es investigación de producto, no asesoría jurídica. Antes de operar comercialmente, validar con abogado/contador especialistas en México y, para expansión, en cada jurisdicción.

### 16.1 Trabajo en plataformas digitales

México implementó una reforma específica para trabajo en plataformas digitales. La STPS indica que incluye reparto, transporte, compras de supermercado, paquetería, mensajería y otras tareas presenciales mediadas por plataforma. En 2026 la autoridad ha reportado implementación activa, seguridad social y obligaciones específicas.

El modelo comercial “0% comisión por viaje + cuota semanal” **no elimina por sí mismo** las obligaciones laborales que pudieran derivarse de la relación real con el conductor.

VAMO debe diseñar cumplimiento, no evasión:

- contratos adecuados;
- registro y cálculo de ingresos cuando aplique;
- IMSS/Infonavit/riesgos de trabajo según corresponda;
- transparencia algorítmica;
- reglas documentadas de asignación/exclusión;
- registros auditables;
- libertad de conexión dentro del marco vigente.

Fuentes oficiales:
- https://www.gob.mx/stps/documentos/preguntas-frecuentes-sobre-la-reforma-en-materia-de-trabajo-en-plataformas-digitales
- https://www.gob.mx/stps/prensa/reforma-laboral-en-plataformas-digitales-consolida-un-nuevo-piso-de-derechos-para-las-personas-trabajadoras

### 16.2 Datos personales

México expidió una nueva Ley Federal de Protección de Datos Personales en Posesión de los Particulares el 20 de marzo de 2025; el texto consultado tiene reforma al 14 de noviembre de 2025.

VAMO procesa potencialmente ubicación precisa, direcciones, identidad/KYC, teléfonos, cuentas bancarias y rutas. Implementar privacidad desde diseño:

- minimización;
- finalidades y avisos;
- consentimiento cuando sea requerido;
- controles por rol/tenant;
- retención y eliminación;
- derechos ARCO y flujo operativo;
- logs de acceso;
- enlaces de tracking con alcance/expiración limitados;
- no exponer ubicación histórica innecesaria.

Fuente oficial:
- https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf

### 16.3 Pagos / fondos electrónicos

Si VAMO evoluciona de un ledger contable hacia custodia real de fondos/saldos transferibles, revisar la Ley para Regular las Instituciones de Tecnología Financiera y el modelo contractual/operativo del PSP antes de construir una “billetera” regulatoriamente ambigua.

Fuente oficial:
- https://www.diputados.gob.mx/LeyesBiblio/pdf/LRITF.pdf

### 16.4 Pasajeros

En Guanajuato existe regulación específica del **Servicio de Transporte Privado mediante Plataforma Tecnológica**, incorporada a la Ley de Movilidad y vigente dentro de un cuerpo normativo reformado hasta 2026. Incluye registro de vehículos y requisitos particulares.

Por ello, pasajeros debe ser un proyecto/vertical separado con gate legal, seguros, vehículo, conductor, seguridad y autorización de plaza.

Fuentes:
- https://portal.congresogto.gob.mx/leyes/ley-de-movilidad-del-estado-de-guanajuato-y-sus-municipios
- https://www.congresogto.gob.mx/leyes/ley-de-movilidad-del-estado-de-guanajuato-y-sus-municipios

---

## 17. Roadmap recomendado

No asignar fechas antes de auditar capacidad real. Ordenar por dependencia.

### Fase A — Truth & Safety (P0)

1. Inventario real de capacidades vs documentación.
2. Build/lint reproducible y baseline técnico.
3. Test framework + integración + E2E para flujos críticos.
4. CI.
5. Unificar autoridad de órdenes.
6. Persistir pricing/rate plans.
7. Revisar auth/RLS/tenant boundaries.
8. Corregir randomness/IDs/config fail-closed.
9. Reconciliar ledger/settlement con modelo canónico.
10. Observabilidad, backups y restore drill.

**No llamar producción a VAMO antes de pasar gates de esta fase.**

### Fase B — Core Logistics MVP

1. Pedido universal A→B.
2. Compra y trae.
3. Multipunto.
4. Programado.
5. Estados canónicos.
6. Cotización server-side.
7. Driver offer/assignment.
8. Tracking seguro.
9. POD.
10. Incidencias y cancelación.
11. Historial/repetición.

### Fase C — Fleet SaaS

1. Organización/tenant simple.
2. Alta de choferes propios.
3. Entrada manual rápida.
4. Cliente/direcciones.
5. Dispatch board.
6. Rate tables/contratos B2B.
7. Link/portal para cliente.
8. CSV/import inicial.
9. API/webhooks.
10. Reportes operativos y facturación/conciliación según modelo.

### Fase D — Hybrid Network & Distribution

1. Own-fleet first / overflow.
2. Reglas SLA/capacidad.
3. Supply marketplace local.
4. QR / delivery links.
5. Integraciones e-commerce/POS prioritarias por demanda.
6. Referidos ligados a actividad real.
7. Radar/comercio opcional donde aporte adquisición.

### Fase E — Optimization & AI

Sólo después de datos reales suficientes:

- predicción de demanda;
- batching;
- optimización de rutas;
- staffing/capacity recommendations;
- detección de anomalías/fraude;
- ETA calibration;
- soporte asistido por IA;
- copiloto de despacho.

Evitar “IA decorativa” antes de tener datos, métricas y procesos confiables.

---

## 18. Acceptance Gates de producto

Una versión candidata a piloto debe demostrar al menos:

1. Un negocio puede registrarse/configurarse sin intervención técnica excesiva.
2. Puede crear una entrega real A→B.
3. El precio utilizado por backend coincide con la configuración autoritativa/versionada.
4. Dos conductores no pueden ganar la misma orden por carrera de concurrencia.
5. Un conductor/tenant no puede leer o modificar órdenes ajenas.
6. El cliente puede seguir el trabajo sin obtener acceso a información de más.
7. POD confirma entrega de forma segura y auditable.
8. Reintentos de APIs/webhooks no duplican cargos, liquidaciones ni transiciones críticas.
9. Cancelaciones/reembolsos/incidencias dejan trazabilidad.
10. Backup y restore han sido ensayados.
11. Build, lint, tests unitarios/integración/E2E y migraciones pasan en CI.
12. Existe observabilidad de errores, latencia y salud de dependencias.
13. Unit economics del piloto incluyen los costos reales relevantes.
14. Gate legal/laboral/privacidad/pagos de la jurisdicción del piloto ha sido revisado por profesionales competentes.

---

## 19. North Star y KPIs sugeridos

No usar `usuarios registrados` como métrica principal.

**North Star candidata:** `Entregas/trabajos útiles completados y verificados por semana`, segmentados por modo (`OWN_FLEET`, `VAMO_NETWORK`, `HYBRID`).

Acompañarla con:

- organizaciones con ≥N trabajos semanales;
- retención 4/8/12 semanas;
- repetición cliente;
- conductores activos y utilización;
- puntualidad;
- distancia improductiva hasta pickup;
- costo por trabajo;
- margen de contribución;
- NPS/CSAT por actor;
- incidencias por 1,000 trabajos;
- porcentaje de trabajos que entran por links/QR/referidos/integraciones;
- porcentaje de overflow resuelto dentro de SLA.

---

## 20. Preguntas que Gemini debe investigar antes de proponer cambios grandes

1. ¿Qué flujos del repo son realmente E2E y cuáles sólo UI?
2. ¿Qué tablas escriben el estado de orden y desde dónde?
3. ¿Qué dependencias existen entre Supabase y PostgreSQL/Dokploy?
4. ¿Cuál es el contrato de estados real hoy?
5. ¿Cómo se calcula cada tarifa hoy y qué pantallas pueden divergir?
6. ¿Qué endpoints usan privilegio admin/service-role y por qué?
7. ¿Qué RLS policies protegen cada actor/tenant?
8. ¿Qué rutas financieras son idempotentes y cuáles no?
9. ¿Qué secretos/variables son obligatorias y cuáles tienen fallbacks peligrosos?
10. ¿Qué features del `MASTER_VISION` pueden demostrarse con pruebas?
11. ¿Cuánto cuesta realmente una orden por infraestructura/mensajería/maps/pagos?
12. ¿Qué integraciones ofrecen mayor adquisición B2B en México: WhatsApp, WooCommerce, Shopify, POS, API/CSV?
13. ¿Qué tamaño/peso/vehículo y artículos prohibidos deben definirse por servicio?
14. ¿Qué obligaciones laborales exactas aplican al modelo operativo final?
15. ¿Qué PSP/payout model reduce complejidad regulatoria y de conciliación?
16. ¿Qué funcionalidades generan adopción para una flota de 2–20 conductores sin volver el producto empresarialmente pesado?
17. ¿Qué onboarding puede llevar a una PyME desde registro hasta primera entrega en menos de 10 minutos?
18. ¿Qué datos mínimos necesita VAMO para optimizar sin violar privacidad/minimización?

---

## 21. Principio final

La ventaja de VAMO no debe ser “tener más botones”. Debe ser:

- más fácil de adoptar;
- más justo y transparente;
- más flexible para diferentes negocios;
- útil con flota propia o red externa;
- confiable y comprobable;
- económicamente sostenible;
- adaptado a ciudades y PyMEs donde una solución enterprise internacional resulta excesiva;
- extensible sin convertir cada ciudad/categoría en una aplicación diferente.

**La meta no es parecer una plataforma gigante. La meta es resolver mejor el trabajo local de mover cosas y hacer que todos los actores tengan una razón económica real para quedarse.**
