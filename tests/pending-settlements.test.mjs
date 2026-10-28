import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/sessions/utils/pendingSettlements.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('require', 'module', 'exports', outputText)(() => { throw new Error('No debe importar runtime') }, module, module.exports)
const { countPendingByPlate, filterPendingByPlate, totalPendingCash, pendingSettlementsLabel } = module.exports

const items = Object.freeze([
  Object.freeze({ sessionId: 'vieja', vehicleLicensePlate: 'AVP463', cashToDeliver: 100.25 }),
  Object.freeze({ sessionId: 'otra', vehicleLicensePlate: 'ABC123', cashToDeliver: 50.5 }),
  Object.freeze({ sessionId: 'nueva', vehicleLicensePlate: 'AVP463', cashToDeliver: 0 }),
])

test('cuenta por patente y admite una lista vacía', () => {
  assert.deepEqual([...countPendingByPlate(items)], [['AVP463', 2], ['ABC123', 1]])
  assert.equal(countPendingByPlate(items).get('SIN000') ?? 0, 0)
  assert.equal(countPendingByPlate([]).size, 0)
})

test('filtra por patente exacta sin modificar la lista ni su orden', () => {
  assert.deepEqual(filterPendingByPlate(items, 'AVP463'), [items[0], items[2]])
  assert.deepEqual(filterPendingByPlate(items, 'avp463'), [])
  assert.deepEqual(filterPendingByPlate(items, 'SIN000'), [])
  assert.deepEqual(filterPendingByPlate([], 'AVP463'), [])
})

test('suma efectivo de todos o del camión filtrado, incluyendo cero y centavos', () => {
  assert.equal(totalPendingCash(items), 150.75)
  assert.equal(totalPendingCash(filterPendingByPlate(items, 'AVP463')), 100.25)
  assert.equal(totalPendingCash([]), 0)
})

test('usa singular solo para una salida', () => {
  assert.equal(pendingSettlementsLabel(0), '0 salidas sin rendir')
  assert.equal(pendingSettlementsLabel(1), '1 salida sin rendir')
  assert.equal(pendingSettlementsLabel(3), '3 salidas sin rendir')
})
