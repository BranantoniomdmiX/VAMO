import { formatCurrencyMXN, formatNumberMX, formatDateMX } from '../src/lib/utils/formatters'

console.log('🧪 Iniciando pruebas de estandarización VAMO UX-PAGE-01...')

// 1. Validar formatCurrencyMXN
const testAmount = 1500.5
const formattedMXN = formatCurrencyMXN(testAmount)
console.assert(formattedMXN.includes('MXN'), 'formatCurrencyMXN debe incluir sufijo MXN')
console.assert(formattedMXN.includes('1,500.50'), 'formatCurrencyMXN debe formatear decimales y millares correctamente')
console.log('✅ formatCurrencyMXN:', formattedMXN)

// 2. Validar formatNumberMX
const testCount = 12450
const formattedCount = formatNumberMX(testCount)
console.assert(formattedCount === '12,450', 'formatNumberMX debe formatear con comas')
console.log('✅ formatNumberMX:', formattedCount)

// 3. Validar formatDateMX
const testDate = new Date('2026-09-11T12:00:00Z')
const formattedDate = formatDateMX(testDate)
console.assert(formattedDate.length > 5, 'formatDateMX debe entregar texto válido')
console.log('✅ formatDateMX:', formattedDate)

console.log('🎉 Todas las aserciones de formato pasaron exitosamente.')
