import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/vehicleLoads/utils/loadRange.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('require', 'module', 'exports', outputText)(() => ({}), module, module.exports)
const { rangeStatus, rangeLabel, rangeErrors } = module.exports

test('sin rango ni extremos no hay aviso', () => {
  for (const quantity of [0, 1, 100000]) {
    assert.equal(rangeStatus(quantity), 'ok')
    assert.equal(rangeStatus(quantity, { min: null, max: null }), 'ok')
  }
})

test('los extremos son inclusivos; cero también puede quedar por debajo del mínimo', () => {
  const range = { min: 1, max: 4 }
  assert.equal(rangeStatus(0, range), 'low')
  assert.equal(rangeStatus(1, range), 'ok')
  assert.equal(rangeStatus(4, range), 'ok')
  assert.equal(rangeStatus(5, range), 'high')
  assert.equal(rangeStatus(0, { min: 0, max: 0 }), 'ok')
  assert.equal(rangeStatus(1, { min: 0, max: 0 }), 'high')
})

test('un solo extremo controla únicamente ese límite', () => {
  assert.equal(rangeStatus(19, { min: 20, max: null }), 'low')
  assert.equal(rangeStatus(100000, { min: 20, max: null }), 'ok')
  assert.equal(rangeStatus(0, { min: null, max: 4 }), 'ok')
  assert.equal(rangeStatus(5, { min: null, max: 4 }), 'high')
})

test('etiquetas de ambos extremos, un extremo y rango vacío', () => {
  assert.equal(rangeLabel({ min: 1, max: 4 }), '1 – 4')
  assert.equal(rangeLabel({ min: null, max: 4 }), 'hasta 4')
  assert.equal(rangeLabel({ min: 20, max: null }), 'desde 20')
  assert.equal(rangeLabel({ min: 0, max: 0 }), '0 – 0')
  assert.equal(rangeLabel({ min: null, max: null }), '')
  assert.equal(rangeLabel(), '')
})

test('valida por fila sin mutar y marca Máx cuando es menor que Mín', () => {
  const rows = [
    { productId: 'agua', min: 20, max: 19 },
    { productId: 'soda', min: 0, max: 0 },
    { productId: 'dispenser', min: null, max: null },
    { productId: 'solo-min', min: 100000, max: null },
    { productId: 'solo-max', min: null, max: 100000 },
  ]
  const original = structuredClone(rows)
  const errors = rangeErrors(rows)
  assert.deepEqual(Object.keys(errors), ['agua'])
  assert.ok(errors.agua.max)
  assert.equal(errors.agua.min, undefined)
  assert.deepEqual(rows, original)
})

test('rechaza negativos, fracciones, valores no finitos y mayores que 100000', () => {
  for (const value of [-1, 1.5, 100001, NaN, Infinity]) {
    assert.ok(rangeErrors([{ productId: 'p', min: value, max: null }]).p.min)
    assert.ok(rangeErrors([{ productId: 'p', min: null, max: value }]).p.max)
  }
  assert.deepEqual(rangeErrors([]), {})
})

test('servicio: consulta por vehículo y reemplaza omitiendo filas sin extremos, incluso al borrar todo', async () => {
  const source = readFileSync(new URL('../src/modules/vehicles/services/vehicleService.ts', import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
  const calls = []
  const ranges = [{ productId: 'agua', min: 0, max: 4 }]
  const api = {
    get: async (url) => { calls.push(['GET', url]); return ranges },
    put: async (url, body) => { calls.push(['PUT', url, body]) },
  }
  const module = { exports: {} }
  new Function('require', 'module', 'exports', outputText)(() => ({ api }), module, module.exports)
  const { vehicleService } = module.exports
  assert.deepEqual(await vehicleService.getLoadRanges('v'), ranges)
  assert.equal(await vehicleService.saveLoadRanges('v', [...ranges, { productId: 'soda', min: null, max: null }]), undefined)
  await vehicleService.saveLoadRanges('v', [])
  assert.deepEqual(calls, [
    ['GET', '/api/vehicles/v/load-ranges'],
    ['PUT', '/api/vehicles/v/load-ranges', { ranges }],
    ['PUT', '/api/vehicles/v/load-ranges', { ranges: [] }],
  ])
})
