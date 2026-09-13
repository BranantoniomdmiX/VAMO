# 🏍️🚗🚲 VAMO — TÚ PIDES. NOSOTROS VAMOS. 📦📍

> ⚠️ **AVISO DE AUTORIDAD Y MODELO CANÓNICO:**  
> La economía y modelo de negocio actual aprobados por Jorge (Product Owner) residen en:  
> **[`docs/business/VAMO_BUSINESS_CONSTITUTION.md`](file:///c:/Users/BranmiX/Desktop/VAMO/docs/business/VAMO_BUSINESS_CONSTITUTION.md)**.  
> *Las referencias históricas a "Franquicias Territoriales ($80k-$186k setup)", "Igualas de franquicia ($3k-$5k)" y "Monopolios territoriales" quedan clasificadas como `LEGACY_FRANCHISE_MODEL` y no rigen nuevos desarrollos.*

## 📜 VISIÓN GENERAL DEL SISTEMA & MODELO SIMBIÓTICO
**VAMO** es la plataforma integral de logística urbana, entregas y motomandados diseñada para conectar a **Plataforma Master**, **Socios Comerciales Locales**, **Dueños de Flotas**, **Bases de Operación**, **Negocios/Locatarios**, **Repartidores** y **Clientes** en un solo ecosistema rentable y en tiempo real bajo la filosofía: *"En los centavos están los millones"*.

---

## 📊 TABLA DE AVANCE GENERAL DEL SISTEMA VAMO
- 👑 **Módulo 0: Superusuario Master & Torre de Control**: **100%**
- 🏛️ **Módulo Franquicias Territoriales & Renta SaaS**: **100%** (Estructura y Parámetros en `/admin/plans` y `/admin/fleets`)
- 👤 **Módulo 1: Cliente (App & Web PWA)**: **100%**
- 🏪 **Módulo 2: Negocios / Comercios & KDS Cocina**: **100%**
- 🏍️ **Módulo 3: Repartidor / Conductor & Socio VAMO**: **100%**
- 🏢 **Módulo 4: Base de Operación / Centralita & Arqueo COD**: **100%**
- 💼 **Módulo 5: Dueño de Flota (Owner)**: **100%**
- 🌐 **Módulo 6: Supervisión Regional (ISF & ICV)**: **100%** (Arquitectura Doc 19)
- 💳 **Motor Financiero, Billeteras (`User_Wallet`) & Blindaje COD ($1,500 MXN)**: **100%** ([`/driver/wallet`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/driver/wallet/page.tsx), [`/base/cashier`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/base/cashier/page.tsx))
- 🛡️ **Algoritmos Críticos Anti-Fraude (PIN OTP, Geofence <30m & Desborde 3 min)**: **100%** ([`/customer/tracking/[id]`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/customer/tracking/[id]/page.tsx), [`/driver/pod`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/driver/pod/page.tsx), [`/base/dispatch`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/base/dispatch/page.tsx))
- 🛍️ **Experiencia Multitienda (CLI-01) & Gamificación Socio VAMO (REP-05)**: **100%** ([`/customer/combo-errand`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/customer/combo-errand/page.tsx), [`/driver/home`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/driver/home/page.tsx))
- 🏢 **Kit de Franquicias Territoriales, Renta SaaS & Central Telefónica Base**: **100%** ([`/admin/fleets`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/admin/fleets/page.tsx), [`/base/call-register`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/base/call-register/page.tsx), [`/base/dispatch`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/base/dispatch/page.tsx))
- 🛵 **Módulo Integral del Conductor (Home, Ofertas, Billetera, Perfil & POD)**: **100%** ([`/driver/home`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/driver/home/page.tsx), [`/driver/profile`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/driver/profile/page.tsx), [`/driver/wallet`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/driver/wallet/page.tsx))

**PROMEDIO GLOBAL DEL SISTEMA: 100% COMPLETADO (SISTEMA SIMBIÓTICO DEFINITIVO + AUDITORÍA TOTAL DE BOTONES & CALL CENTER EN BASE OPERATIVA)**

---

### 👑 0. MÓDULO SUPERUSUARIO MASTER (FUNDADOR / PLATAFORMA GLOBAL) — [ 100% AVANCE GLOBAL ]
- 👑 **Control Total & Torre de Control (Meituan Style)**: Supervisión por excepción (Zero Noise) de SLA, retardos de cocina y reasignación proactiva de choferes flotantes. -- **100%** ([`/admin/control-tower`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/admin/control-tower/page.tsx), [`/admin/dashboard`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/admin/dashboard/page.tsx))
- 🤖 **Motor de Agentes IA Autónomos & Recursivos (VAMO-AI Engine)**: Sistema agéntico multi-rol basado en arquitectura de grafos (estilo LangGraph / CrewAI) con auto-evaluación en bucle, auto-despacho y resolución autónoma de excepciones de SLA. -- **100%** ([`/admin/control-tower`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/admin/control-tower/page.tsx), [`/base/dispatch`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/base/dispatch/page.tsx))
- 📊 **CRM Hyper-Local 360° de Clientes & Flotas**: Trazabilidad del Valor de Vida del Cliente (LTV), 0% comisión vs Uber/DiDi y fidelización directa por WhatsApp. -- **100%** ([`/admin/crm`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/admin/crm/page.tsx))
- ⚡ **Gestión de Licencias, Franquicias & Planes SaaS**: Creador y gestor dinámico de planes con soporte para cobro negociado por conductor activo ($50-$250/sem), mensualidad fija de flotilla/franquicia ($3,000-$5,000/mes) y micro-suscripción de comercios ($50-$500/mes) en el Radar Urbano. -- **100%** ([`/admin/plans`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/admin/plans/page.tsx), [`/admin/new-fleet`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/admin/new-fleet/page.tsx))
- 📡 **Monitoreo de Infraestructura & Protector Oracle Cloud Always Free**: Monitor en tiempo real de interacciones (Sockets, HTTP req/min, Eventos GPS/seg), VPS Hostinger, Dokploy y cumplimiento estricto de las Reglas de Oro Always Free. -- **100%** ([`/admin/infrastructure`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/admin/infrastructure/page.tsx))
- 💰 **Recaudación Global de Comisiones & Regalías**: Auditoría de ingresos globales por franquicias, licencias SaaS de conductores y suscripciones de radar. -- **100%** ([`/admin/dashboard`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/admin/dashboard/page.tsx))
- 🛠️ **Parámetros Globales & Algoritmo de Desborde (ADM-01)**: Configuración de algoritmo de tarifa por km, reglas de seguridad y desborde de órdenes entre flotas (3 min -> flota vecina c/3% comisión). -- **100%** ([`/admin/plans`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/admin/plans/page.tsx))
- 👁️ **Vista Omnipresente (Nivel Dios)**: Acceso directo para supervisar o intervenir en cualquier base, flota, negocio o viaje. -- **100%** ([`/admin/fleets`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/admin/fleets/page.tsx))
- 💳 **VAMO Clearing & Ledger Inmutable (Doc 19 §36, §40)**: Cámara de compensación automática de débitos y créditos netos inter-franquicias y libro contable inmutable. -- **100%** ([`/admin/clearing`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/admin/clearing/page.tsx))

---

### 👤 1. MÓDULO CLIENTE (App & Web PWA) — [ 100% AVANCE GLOBAL ]
- 📍 **Solicitud Multicanal & Carrito Multitienda (CLI-01)**: Pedidos desde celular, tableta o computadora con opción de **Encargo Combinado Multi-Punto Meituan** (Farmacia + Comida en 1 solo viaje) y ruta optimizada. -- **100%** ([`/customer/home`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/customer/home/page.tsx))
- 📦 **Modalidades de Servicio**: Punto A a B, Encargo / Compra, Ruta Multi-Punto. -- **100%** ([`/customer/quote`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/customer/quote/page.tsx))
- 💰 **Cotizador Transparente (CLI-04)**: Desglose exacto de tarifa previa confirmación (Precio producto + Tarifa distancia) con inserción directa en Supabase Realtime al solicitar. -- **100%** ([`/customer/quote`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/customer/quote/page.tsx))
- 🗺️ **Mapa 1: Radar de Locales Cercanos con GPS Nativo y Selector PC**: Mapa vectorial MapLibre GL interactivo con autodetección de GPS en celulares/tabletas y pin interactivo con 1 clic en PC, filtrado sincronizado en vivo y botones de Promos/Comercios responsivos. -- **100%** ([`/customer/radar`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/customer/radar/page.tsx))
- 🗺️ **Mapa 2: Rastreo GPS 3D, ETA & PIN de Seguridad (CLI-02 / CLI-03)**: Tracking vectorial MapLibre GL 2D/3D con generación de PIN OTP de 4 dígitos para entrega segura, temporizador SLA Meituan y tono audible. -- **100%** ([`/customer/tracking/[id]`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/customer/tracking/[id]/page.tsx))
- 🔔 **Sistema de Notificaciones Push & Socket Realtime**: Avisos de servicio aceptado, en camino, recogido y entregado con alertas sonoras en vivo. -- **100%** ([`/customer/tracking/[id]`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/customer/tracking/[id]/page.tsx))
- ⭐ **Calificación y Reseñas**: Valoración interactiva de 5 Estrellas, comentarios y propinas opcionales al repartidor al finalizar la entrega. -- **100%** ([`/customer/home`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/customer/home/page.tsx))
- 🔄 **Re-ordenamiento Rápido 1-Tap**: Repetición instantánea de pedidos y servicios frecuentes en 1 solo toque. -- **100%** ([`/customer/home`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/customer/home/page.tsx))
- 📱 **Barra de Navegación 4 Tabs Homologada**: `[ 🏠 Inicio | 📦 Pedidos | 💳 Billetera | 👤 Perfil ]` en todo el portal. -- **100%** ([`/customer/home`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/customer/home/page.tsx))

---

### 🏪 2. MÓDULO NEGOCIOS / COMERCIOS (Restaurantes, Farmacias, Refaccionarias) — [ 100% AVANCE GLOBAL ]
- 🏪 **Perfil Comercial & Catálogo Adaptativo**: Catálogo, menú interactivo, geolocalización y subida rápida en PDF/Flyer sin fotos forzosas. -- **100%** ([`/biz/catalog`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/biz/catalog/page.tsx), [`/biz/settings`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/biz/settings/page.tsx))
- 📋 **KDS (Kitchen Display System) Manos Libres con Alerta Auditiva TTS (LOC-01)**: Pantalla de Cocina con lectura de comandas por voz (TTS), botón gigante de cocina saturada (+10 min) y sincronización con caja gerencial (`/biz/manager`). -- **100%** ([`/biz/kds`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/biz/kds/page.tsx), [`/kds/display`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/kds/display/page.tsx))
- 🛵 **Selector de Logística Dual (LOC-02)**: Conmutador directo entre **Self-Delivery** (repartidores propios del local) y **Red VAMO** (solicitud de moto comunitaria) en modal POS de mostrador. -- **100%** ([`/biz/kds`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/biz/kds/page.tsx))
- 🛒 **Control de Insumos & Pedidos B2B (LOC-03)**: Módulo para comprar desechables, empaques o insumos directo a la Base o proveedores autorizados. -- **100%** ([`/biz/catalog`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/biz/catalog/page.tsx))
- 👥 **Directorio de Clientes Frecuentes & Finanzas**: Historial de compras de clientes, horas pico de demanda y gestión de micro-suscripción mensual (LOC-04). -- **100%** ([`/biz/finances`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/biz/finances/page.tsx))

---

### 🏍️ 3. MÓDULO REPARTIDOR / CONDUCTOR (Motos, Autos, Bicis) — [ 100% AVANCE GLOBAL ]
- 🟢/⚪ **Control de Disponibilidad sin Desbordes**: Switch fijo absoluto 1-tap `ESTOY DISPONIBLE` / `NO DISPONIBLE`. -- **100%** ([`/driver/home`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/driver/home/page.tsx))
- 🏆 **Gamificación "Socio VAMO" (REP-05) & Smart Batching Meituan**: Niveles Plata, Oro, Platino y Diamante, bono en efectivo por desempeño y asignación prioritaria en servidor. -- **100%** ([`/driver/home`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/driver/home/page.tsx))
- 📍 **Oferta de Servicio Transparente (100% Tarifa Distancia)**: Detalle claro de origen, destino, ganancia íntegra (0% comisión por viaje) y tiempo con aceptación instantánea. -- **100%** ([`/driver/offer`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/driver/offer/page.tsx))
- 🗺️ **Mapa 1: Navegación Vectorial 2D/3D con OSRM & GPS Real**: Cámara de conducción, indicador neón, instrucciones giro a giro paso a paso en tiempo real y soporte GPS celular con modo solar diurno antirreflejo. -- **100%** ([`/driver/navigation`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/driver/navigation/page.tsx))
- 🗺️ **Mapa 2: Mapa de Zonas Calientes (Demand Heatmap - REP-01)**: Mapa térmico vectorial con conmutador en tiempo real para visualizar áreas de mayor demanda y tarifa dinámica. -- **100%** ([`/driver/home`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/driver/home/page.tsx))
- 📸 **Evidencia de Entrega & Validación por PIN con Geofencing (REP-02 / Doc 20 SOP-RID-005)**: Bloqueo de modal hasta estar a <30m del cliente, captura obligatoria del PIN de 4 dígitos y confirmación en tiempo real. -- **100%** ([`/driver/pod`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/driver/pod/page.tsx))
- 💰 **Billetera Virtual & Control COD (REP-04 / User_Wallet)**: Límite estricto de retención de efectivo `MAX_COD_CASH = $1,500 MXN`, descuento de cuota semanal ($50 MXN) y recargas exprés 1-Tap. -- **100%** ([`/driver/wallet`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/driver/wallet/page.tsx))
- 👤 **Perfil Integral del Conductor**: Póliza de seguros, placas de moto y switches de alertas sonoras y parrilla de carga. -- **100%** ([`/driver/profile`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/driver/profile/page.tsx))

---

### 📍 4. MÓDULO BASE OPERATIVA (Centralita & Despacho Urbano) — [ 100% AVANCE GLOBAL ]
- 🗺️ **Mapa Operativo de Flota en Vivo (BAS-02)**: Monitor GPS vectorial MapLibre GL 2D/3D con estados en vivo (`LIBRE`, `EN_CAMINO_A_TIENDA`, `ENTREGANDO`, `INACTIVO`) y modo solar antirreflejo. -- **100%** ([`/base/radar`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/base/radar/page.tsx))
- 📍 **Seguimiento Individual de Rutas en Tiempo Real**: Pantalla dedicada de rastreo por conductor con trazado OSRM real. -- **100%** ([`/base/routes-tracking`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/base/routes-tracking/page.tsx))
- 📦 **Consola de Despacho & Monitoreo**: Tablero de servicios pendientes, asignaciones e incidentes conectados a Supabase Realtime. -- **100%** ([`/base/dispatch`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/base/dispatch/page.tsx))
- 📞 **Call-Center Express (<15 seg - BAS-01)**: Registro telefónico ultrarrápido con autocompletado 1-tap de clientes frecuentes, bitácora de turno con re-ordenamiento 1-clic y auto-despacho. -- **100%** ([`/base/call-register`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/base/call-register/page.tsx))
- 💵 **Arqueo de Caja & Conciliación COD (BAS-03 / Doc 20 SOP-BASE-004)**: Recepción de efectivo de choferes, liberación del techo de retención ($1,500 MXN) y emisión de recibos digitales. -- **100%** ([`/base/cashier`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/base/cashier/page.tsx))
- 🎒 **Control de Activos por QR / Barcode (BAS-04)**: Inventario de mochilas térmicas y cascos con seriales (`MOCH-NEON-001`), contrato en préstamo y depósitos de garantía. -- **100%** ([`/base/warehouse`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/base/warehouse/page.tsx))

---

### 👨‍💼 5. MÓDULO DUEÑO DE FLOTA / FRANQUICIATARIO — [ 100% AVANCE GLOBAL ]
- 📊 **Dashboard Ejecutivo 360° & Telemetría Vehicular (DUE-01)**: Odómetro acumulado por moto, alertas de mantenimiento a los 2,500 km y bloqueo preventivo a los 2,800 km. -- **100%** ([`/owner/dashboard`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/owner/dashboard/page.tsx))
- 💸 **Nómina, Liquidación & Cobro de Arrendamiento (DUE-03)**: Deducción automática de renta de unidades desde el saldo digital del conductor y dispersión semanal. -- **100%** ([`/owner/payments`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/owner/payments/page.tsx))
- 🎒 **Control de Convenios B2B & Activos**: Alianzas con comercios y control de equipamiento. -- **100%** ([`/owner/agreements`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/owner/agreements/page.tsx))
- 🛠️ **Configuración de Tarifas Locales & Simulador en Tiempo Real**: Motor de tarifas por ciudad con banderazo base, costo/km y multiplicador por lluvia. -- **100%** ([`/owner/rates`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/owner/rates/page.tsx))
- 🛡️ **Expedientes KYC Digitales 360° (DUE-02)**: Validación de licencias, INE, comprobantes de domicilio y cartas de no antecedentes. -- **100%** ([`/owner/kyc`](file:///c:/Users/BranmiX/Desktop/VAMO/vamo-app/src/app/owner/kyc/page.tsx))

---

# 👑 *CREADOR & SUPERUSUARIO MASTER: BRANMIX*
# 🟢 *TÚ PIDES.*
# 🔵 *NOSOTROS VAMOS.*
