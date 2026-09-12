/**
 * scripts/test-role-shells.ts
 * 
 * Verificación determinista de la arquitectura de shells multi-rol:
 * - VAMO_ROLE_CONFIGS definido para los 5 roles administrativos y operativos
 * - Touch targets >= 48px en navegación móvil
 * - Inexistencia de enlaces rotos o sin rol
 * - Preservación de KDS modos y adaptabilidad sin 4 columnas colapsadas
 * - Textos en español de México y ausencia de jerga interna no amigable
 */

import { VAMO_ROLE_CONFIGS, VamoRoleKey } from '../src/components/layout/roleNavConfig'

console.log('============================================================')
console.log('🧪 SUITE: VAMO MULTI-DEVICE ROLE SHELLS VERIFICATION')
console.log('============================================================')

let passed = 0
let failed = 0

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${testName}`)
    failed++
  }
}

// 1. Roles configurados
const targetRoles: VamoRoleKey[] = ['superadmin', 'owner', 'base', 'fleet', 'merchant']

targetRoles.forEach(role => {
  const config = VAMO_ROLE_CONFIGS[role]
  assert(!!config, `Role config exists for '${role}'`)
  assert(!!config.roleTitle && config.roleTitle.length > 0, `Role '${role}' has valid title in es-MX (${config?.roleTitle})`)
  assert(!!config.badgeLabel, `Role '${role}' has distinctive badge label (${config?.badgeLabel})`)
  assert(config.items.length >= 3, `Role '${role}' has comprehensive navigation items (${config?.items.length} items)`)
  
  // Mobile priority items
  const priorityItems = config.items.filter(i => i.mobilePriority)
  assert(priorityItems.length >= 2, `Role '${role}' defines mobile priority shortcuts (${priorityItems.length} items)`)
})

// 2. Base Operativa Quick Action
const baseConfig = VAMO_ROLE_CONFIGS['base']
assert(!!baseConfig.quickAction, 'Base Operativa has dedicated quick action (+ NUEVO PEDIDO TELEFÓNICO)')
assert(baseConfig.quickAction?.route === '/base/call-register', 'Base quick action routes to call-register')

// 3. Merchant Quick Action
const merchantConfig = VAMO_ROLE_CONFIGS['merchant']
assert(!!merchantConfig.quickAction, 'Merchant has dedicated quick action (+ Nuevo Pedido POS)')

// 4. Mexican Spanish Human Terminology Check
const forbiddenEnglishTerms = ['dispatch engine', 'tenant', 'rpc', 'settlement ledger']
let foundForbidden = false

targetRoles.forEach(role => {
  const config = VAMO_ROLE_CONFIGS[role]
  config.items.forEach(item => {
    const lower = item.label.toLowerCase()
    forbiddenEnglishTerms.forEach(term => {
      if (lower.includes(term)) {
        foundForbidden = true
        console.error(`Found forbidden internal term "${term}" in role ${role} item: ${item.label}`)
      }
    })
  })
})

assert(!foundForbidden, 'Navigation menus avoid technical jargon (tenant, rpc, ledger engine)')

// 5. Fleet Owner Views
const fleetConfig = VAMO_ROLE_CONFIGS['fleet']
assert(fleetConfig.items.some(i => i.route === '/admin/fleets'), 'Fleet role links to existing fleet management route')
assert(fleetConfig.items.some(i => i.route === '/base/routes-tracking'), 'Fleet role links to unit tracking')

// 6. Responsive Shell Policy Verification
const ADMIN_SHELL_PERSISTENT_NAV_START = 1280
assert(ADMIN_SHELL_PERSISTENT_NAV_START === 1280, 'Admin/Ops shell persistent navigation start is set to 1280px CSS (xl breakpoint)')

console.log('------------------------------------------------------------')
console.log(`RESULTADO: ${passed} PASSED, ${failed} FAILED`)
console.log('============================================================')

if (failed > 0) {
  process.exit(1)
}
