import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

function load(path) {
  const source = readFileSync(new URL(`../src/modules/${path}`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', outputText)(() => ({}), module, module.exports)
  return module.exports
}
const { zoneChoices } = load('zones/utils/orderedZones.ts')
const { zoneCountsForDays } = load('sessions/utils/zoneCounts.ts')

const zonas = [
  { id: 'sm', name: 'San Miguel de Tucumán', isActive: true },
  { id: 'tv', name: 'Tafí Viejo', isActive: true },
  { id: 'yb', name: 'Yerba Buena', isActive: true },
  { id: 'old', name: 'Vieja', isActive: false },
]

test('con conteos: primero las zonas con clientes, las vacías al final y marcadas', () => {
  assert.deepEqual(zoneChoices(zonas, ['yb'], { tv: 3 }).map((z) => z.label),
    ['Tafí Viejo — 3 clientes hoy', 'San Miguel de Tucumán (sin clientes hoy)'])
  assert.deepEqual(zoneChoices(zonas, ['yb'], { sm: 1 })[0].label, 'San Miguel de Tucumán — 1 cliente hoy')
})

test('sin conteos: las zonas activas no elegidas, por nombre como antes', () => {
  assert.deepEqual(zoneChoices(zonas, ['yb']).map((z) => z.label), ['San Miguel de Tucumán', 'Tafí Viejo'])
})

test('clientes por zona para los días de la salida, sin contar dos veces y con hoy si no hay carga', () => {
  const counts = [
    { day: 1, zoneId: 'sm', zoneName: 'SM', customers: 4 },
    { day: 3, zoneId: 'sm', zoneName: 'SM', customers: 6 },
    { day: 3, zoneId: 'tv', zoneName: 'TV', customers: 2 },
  ]
  assert.deepEqual(zoneCountsForDays(counts, [1, 3], 6), { sm: 6, tv: 2 })
  assert.deepEqual(zoneCountsForDays(counts, [], 1), { sm: 4 })
})
