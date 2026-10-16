# VAMO — Autoridad de infraestructura durante recuperación

**Fecha de corte:** 2026-10-15  
**Estado:** DECISIÓN OPERATIVA TEMPORAL APROBADA POR PRODUCT OWNER  
**Ámbito:** mientras se reconstruye Oracle Cloud + Dokploy

## 1. Situación actual

La instancia/base PostgreSQL que VAMO utilizaba en Oracle Cloud/Dokploy dejó de estar disponible. No debe asumirse que ese PostgreSQL continúa siendo accesible ni utilizarse como dependencia obligatoria para la auditoría o el desarrollo inmediato.

El proyecto Supabase existente de VAMO continúa activo y será utilizado como plataforma temporal de datos mientras se reconstruye la infraestructura definitiva.

La inspección realizada el 2026-10-15 confirmó que el proyecto Supabase VAMO conserva decenas de tablas de dominio (incluyendo perfiles, conductores, comercios, servicios, pricing, wallets, customer_orders, delivery_tasks, ledger y otras), pero actualmente no contiene `public.orders`.

## 2. Decisión canónica temporal

Durante esta etapa:

1. **Supabase PostgreSQL será la única autoridad transaccional activa de VAMO.**
2. Supabase Auth puede seguir siendo la autoridad de identidad/autenticación.
3. Supabase Storage puede seguir utilizándose donde corresponda.
4. Se debe crear/restaurar en Supabase el modelo canónico `public.orders` y las funciones/constraints/RLS que necesite la columna vertebral reparada por Antigravity.
5. No se permite dual-write entre una base Supabase y una base Dokploy paralela.
6. No se permite mantener dos tablas independientes como fuente de verdad de una misma orden.
7. Las tablas históricas `customer_orders`, `delivery_tasks`, `services` u otras deben clasificarse explícitamente como autoridad, proyección/read model, compatibilidad temporal o legado antes de seguir escribiendo en ellas.

## 3. Objetivo inmediato

Reconstruir y demostrar en un entorno seguro el flujo real:

`Cliente -> public.orders -> Comercio/KDS -> Dispatch -> Conductor -> Tracking -> POD -> Historial/Pago`

La evidencia debe involucrar transacciones reales en una base de prueba/staging o datos de prueba claramente aislados. Las inspecciones de texto del código y las simulaciones en memoria no bastan para declarar el flujo E2E como production-ready.

## 4. Migración futura a Oracle/Dokploy

Cuando la nueva infraestructura Oracle Cloud + Dokploy esté estable:

1. provisionar PostgreSQL con versión/extensiones compatibles;
2. restaurar el esquema mediante migraciones reproducibles;
3. migrar datos mediante procedimiento documentado (`pg_dump`/`pg_restore` u otra estrategia validada);
4. ejecutar verificaciones de conteos, constraints, funciones, RLS, checksums/muestreo e integridad financiera;
5. congelar escrituras o utilizar una estrategia explícita de cutover;
6. cambiar la configuración de la aplicación una sola vez hacia el nuevo PostgreSQL canónico;
7. ejecutar pruebas E2E y smoke tests posteriores al corte;
8. conservar rollback/backup verificable;
9. sólo después retirar la autoridad transaccional temporal de Supabase.

La migración debe ser un **cambio de autoridad controlado**, nunca una etapa prolongada de doble escritura.

## 5. Implicación para la reparación de Antigravity

El commit original de Antigravity `574b3b141a6ee7f482d6f338fd223b5fed9957c6` fue diseñado bajo la premisa de `public.orders` como fuente única de verdad. Esa decisión conceptual se conserva.

Lo que cambia temporalmente es **dónde vive `public.orders`**:

- antes: PostgreSQL Dokploy;
- ahora, durante recuperación: PostgreSQL de Supabase;
- después del cutover: nuevo PostgreSQL gestionado en Oracle/Dokploy.

No reescribir el dominio sólo por este cambio de hosting. La capa de acceso a datos debe minimizar el acoplamiento al proveedor.

## 6. Reglas para Gemini/otros agentes

- Leer este documento antes de ejecutar la Reality Audit.
- No marcar como error que Dokploy no responda actualmente; está en reconstrucción.
- No intentar revivir URLs/credenciales antiguas como solución arquitectónica.
- No realizar INSERT/UPDATE/DELETE destructivos sobre datos reales para descubrir el esquema.
- Usar `information_schema`, migraciones, introspección de sólo lectura y entornos/datos de prueba autorizados.
- Detectar código acoplado directamente a dos motores/bases y proponer una convergencia progresiva.
- Mantener `REUSE > EXTEND > CREATE`.
- Priorizar portabilidad PostgreSQL para facilitar el futuro cutover.

## 7. Criterio de salida de esta fase

La etapa temporal termina cuando exista:

- Oracle/Dokploy estable y respaldado;
- PostgreSQL destino reproducible;
- migración ensayada;
- backup + restore probado;
- pruebas E2E del spine exitosas;
- plan de corte y rollback aprobado por Jorge.
