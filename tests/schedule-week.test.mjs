import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/vehicles/utils/scheduleWeek.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('require', 'module', 'exports', outputText)(() => ({}), module, module.exports)
const { customersFor, unscheduled, replaceDay, zoneWithCount } = module.exports

const counts = [
  { day: 5, zoneId: 'sm', zoneName: 'San Miguel', customers: 33 },
  { day: 5, zoneId: 'tv', zoneName: 'Tafí Viejo', customers: 58 },
  { day: 5, zoneId: 'ec', zoneName: 'El Colmenar', customers: 1 },
  { day: 4, zoneId: 'sm', zoneName: 'San Miguel', customers: 112 },
]

test('clientes por zona y día', () => {
  assert.equal(customersFor(counts, 5, 'sm'), 33)
  assert.equal(customersFor(counts, 1, 'sm'), 0)
})

test('zonas con clientes que faltan agendar, de la que más tiene a la que menos', () => {
  assert.deepEqual(unscheduled(counts, 5, ['tv']).map((c) => c.zoneId), ['sm', 'ec'])
  assert.deepEqual(unscheduled(counts, 4, ['sm']), [])
})

test('cambiar un día deja los otros seis como estaban', () => {
  const week = [{ day: 4, zoneIds: ['sm'] }, { day: 5, zoneIds: ['tv'] }]
  const next = replaceDay(week, 5, ['sm', 'tv'])
  assert.equal(next.length, 7)
  assert.deepEqual(next.find((d) => d.day === 5).zoneIds, ['sm', 'tv'])
  assert.deepEqual(next.find((d) => d.day === 4).zoneIds, ['sm'])
  assert.deepEqual(next.find((d) => d.day === 7).zoneIds, [])
})

test('nombre con cantidad', () => {
  assert.equal(zoneWithCount('Tafí Viejo', 58), 'Tafí Viejo (58)')
  assert.equal(zoneWithCount('Lules', 0), 'Lules')
})
