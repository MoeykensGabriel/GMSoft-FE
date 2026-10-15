import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

function load(path) {
  const source = readFileSync(new URL(`../src/modules/${path}`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } })
  const module = { exports: {} }
  new Function('module', 'exports', outputText)(module, module.exports)
  return module.exports
}
const { coverageMessage, coverageOptions } = load('schedule/utils/coverage.ts')
const { routeMembershipChanged } = load('customers/utils/routeMembership.ts')
const { buildRouteSave, hasChanges } = load('routePlanning/utils/routeDraft.ts')

test('la primera carga, el orden y los IDs repetidos no generan aviso', () => {
  assert.equal(routeMembershipChanged(null, ['a']), false)
  assert.equal(routeMembershipChanged(['a', 'b'], ['b', 'a']), false)
  assert.equal(routeMembershipChanged(['a'], ['a', 'a']), false)
  assert.equal(routeMembershipChanged([], []), false)
})
test('avisa por altas, bajas, reemplazos y recorrido que queda vacío', () => {
  assert.equal(routeMembershipChanged(['a'], ['b']), true)
  assert.equal(routeMembershipChanged(['a', 'b'], ['a']), true)
  assert.equal(routeMembershipChanged(['a'], ['b']), true)
  assert.equal(routeMembershipChanged(['a'], []), true)
  assert.equal(routeMembershipChanged([], ['a']), true)
})
test('cobertura desconocida o completa no se presenta como falta de cobertura', () => {
  assert.equal(coverageMessage({ covered: null, days: [] }), '')
  assert.equal(coverageMessage({ covered: true, days: [] }), '')
})
test('mensaje explica solo días sin cubrir, con zona o sin salida', () => {
  const coverage = { covered: false, days: [
    { day: 1, matches: true, scheduledZoneId: 'a', scheduledZoneName: 'Centro' },
    { day: 3, matches: false, scheduledZoneId: 'b', scheduledZoneName: 'Norte' },
    { day: 7, matches: false, scheduledZoneId: null, scheduledZoneName: null },
  ] }
  assert.equal(coverageMessage(coverage), 'Miércoles: el camión hace Norte. Domingo: el camión no sale según la agenda.')
  assert.deepEqual(coverageOptions(coverage).map((day) => day.scheduledZoneId), ['b'])
})
test('alternativas no duplican zonas y nunca proponen null como corrección', () => {
  assert.deepEqual(coverageOptions({ covered: false, days: [
    { day: 1, matches: false, scheduledZoneId: 'a' }, { day: 2, matches: false, scheduledZoneId: 'a' }, { day: 3, matches: false, scheduledZoneId: null },
  ] }).map((day) => day.scheduledZoneId), ['a'])
})
test('cambiar zona conserva todos los IDs y la versión, enviando changes.zoneId', () => {
  const row = { id: 'c', zoneId: 'a', vehicleId: 'truck', visitDays: [1] }
  const baseline = { version: 'opaque', items: [row] }
  const edited = [{ ...row, zoneId: 'b' }]
  assert.equal(hasChanges(edited, baseline.items), true)
  const body = buildRouteSave({ vehicleId: 'truck', zoneId: 'a', day: 1 }, baseline, edited)
  assert.equal(body.version, 'opaque')
  assert.deepEqual(body.customerIds, ['c'])
  assert.deepEqual(body.changes, [{ id: 'c', zoneId: 'b' }])
  assert.equal(row.zoneId, 'a')
})
