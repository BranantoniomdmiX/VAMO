# 📘 MANUAL DE PROCEDIMIENTOS OPERATIVOS ESTÁNDAR (SOPs): FRANQUICIA VAMO

Este manual contiene los procedimientos operativos, financieros y de gobernanza obligatorios para la apertura y operación exitosa de una **Plaza Franquiciada VAMO** o **Base de Operaciones**.

---

## 🏛️ EJE 1: MODELO DE NEGOCIO Y COMERCIALIZACIÓN DUAL

### 1. Modalidad A: Franquicia Territorial Exclusiva VAMO
- **Canon de Entrada (Setup):** $80,000.00 — $186,000.00 MXN.
- **Iguala Mensual SaaS:** $3,000.00 — $5,000.00 MXN/mes.
- **Regalía por Transacción:** $2.00 — $3.00 MXN por viaje finalizado.
- **Lo que incluye:** Exclusividad territorial en la ciudad, paquete de marca, acceso maestro a la Torre de Control y soporte técnico 24/7.

### 2. Modalidad B: Renta SaaS para Flotas Externas (Marca Blanca)
- **Cobro por Vehículo:** $150.00 — $300.00 MXN mensuales por cada moto activa en su panel.
- **Cobro por Transacción:** $2.00 — $4.00 MXN fijos por orden.

### 3. Modalidad C: Módulo Self-Delivery para Comercios
- **Suscripción Fija:** $300.00 — $899.00 MXN/mes por sucursal con pedidos ilimitados para sus propios repartidores.

---

## 📋 EJE 2: PROCEDIMIENTOS OPERATIVOS ESTÁNDAR (SOPs)

### 🔹 SOP-01: Onboarding y Verificación KYC de Choferes
1. **Recepción de Documentos Digitales:**
   - INE / Identificación oficial con fotografía vigente.
   - Licencia de conducir de motociclista vigente.
   - Tarjeta de circulación de la motocicleta.
   - Comprobante de domicilio reciente (<3 meses).
   - Carta de no antecedentes penales.
2. **Validación en Consola (`/owner/kyc`):**
   - El administrador de base valida la autenticidad y fecha de vencimiento.
   - Aprobación en sistema con auto-alta en la Billetera Digital (`User_Wallet`).
3. **Entrega de Equipamiento en Préstamo (`/base/warehouse`):**
   - Asignación de mochila térmica neón (`MOCH-NEON-XXX`) y casco certificado bajo contrato de depósito ($500 MXN).

---

### 🔹 SOP-02: Arqueo Diario y Liquidación de Efectivo COD ($1,500 MXN)
1. **Regla de Techo Máximo (`MAX_COD_CASH = $1,500.00 MXN`):**
   - Cuando el conductor acumula $1,500 MXN de cobros en efectivo, la app bloquea automáticamente nuevos viajes en efectivo.
2. **Procedimiento en Ventanilla de Base (`/base/cashier`):**
   - El chofer acude a la Base y entrega el dinero en efectivo acumulado al operador de caja.
   - El operador presiona **"PROCESAR CORTE Y RECIBIR CAJA"**.
   - El sistema emite un comprobante digital (`#REC-XXXXX`), reinicia el contador de efectivo a **$0.00 MXN** y desbloquea inmediatamente al conductor.

---

### 🔹 SOP-03: Afiliación de Locatarios y Despliegue de Pantalla KDS Cocina
1. **Registro del Comercio (`/biz/settings`):**
   - Configuración de datos fiscales, horario de cocina y fotografía de fachada.
2. **Instalación de Pantalla KDS (`/biz/kds` y `/kds/display`):**
   - Conexión de tableta o monitor en la cocina mediante Código QR o Store Code + PIN de 4 dígitos.
   - Activación de alertas de voz (TTS) para anunciar comandas manos libres.
3. **Selección de Cuota Mensual:**
   - Tier Micro: $50.00 MXN/mes.
   - Tier PyME: $100.00 — $200.00 MXN/mes.
   - Tier Restaurante / Cadena: $300.00 — $500.00 MXN/mes.

---

### 🔹 SOP-04: Gestión de Desborde Inteligente entre Flotas (ADM-01)
1. Si un pedido entra y los conductores de la flota titular no lo aceptan en **180 segundos (3 minutos)**:
2. El algoritmo transfiere la solicitud a la **flota colindante más cercana**.
3. El sistema aplica una **cuota de compensación del 3%** entre franquicias de manera 100% automatizada.

---

# 🟢 *TÚ PIDES.*
# 🔵 *NOSOTROS VAMOS.*
