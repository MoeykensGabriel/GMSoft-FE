import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/deliveries/utils/exchange.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('module', 'exports', outputText)(module, module.exports)
const { exchangeSummary } = module.exports
const products = [
  { id: 'a', detail: 'Bidón 12 L', tracking: 'ByBalance', exchangeGroup: 'Bidones' },
  { id: 'b', detail: 'Bidón 20 L', tracking: 'ByBalance', exchangeGroup: 'BIDONES' },
  { id: 'c', detail: 'Bidón 10 L', tracking: 'ByBalance', exchangeGroup: 'Bidones' },
  { id: 's', detail: 'Soda', tracking: 'ByBalance', exchangeGroup: null },
]
const line = (productId, vende = 0, retiraEnvases = 0) => ({ productId, vende, retiraEnvases })

test('cambio entre grupos sin distinguir mayúsculas, con saldo y entregados propios primero', () => {
  assert.deepEqual(exchangeSummary([line('a', 1), line('b', 0, 1)], products, []), ['Cambio de envase: 1 Bidón 20 L por Bidón 12 L'])
  assert.deepEqual(exchangeSummary([line('a', 1), line('b', 0, 1)], products, [{ productId: 'b', quantity: 1 }]), [])
  assert.deepEqual(exchangeSummary([line('b', 1, 1)], products, []), [])
})

test('sin venta, sin grupo o excediendo el cupo no anuncia un cambio', () => {
  for (const lines of [[line('b', 0, 1)], [line('s', 1), line('b', 0, 1)], [line('a', 1), line('b', 0, 2)], [line('b', 1, 2)]]) {
    assert.deepEqual(exchangeSummary(lines, products, []), [])
  }
  assert.deepEqual(exchangeSummary([line('a', 1), line('b', 0, 1)], products.map((p) => p.id === 'b' ? { ...p, exchangeGroup: 'Otro' } : p), []), [])
})

test('dos excesos comparten el cupo y se muestran en orden de producto', () => {
  assert.deepEqual(exchangeSummary([line('a', 1), line('c', 0, 1), line('b', 0, 1)], products, []), [])
  assert.deepEqual(exchangeSummary([line('a', 2), line('c', 0, 1), line('b', 0, 1)], products, []), [
    'Cambio de envase: 1 Bidón 20 L por Bidón 12 L', 'Cambio de envase: 1 Bidón 10 L por Bidón 12 L',
  ])
})

test('elige el más vendido y desempata por ID sin depender del orden cargado', () => {
  assert.deepEqual(exchangeSummary([line('c', 2), line('b', 0, 1), line('a', 1)], products, []), ['Cambio de envase: 1 Bidón 20 L por Bidón 10 L'])
  assert.deepEqual(exchangeSummary([line('c', 1), line('b', 0, 1), line('a', 1)], products, []), ['Cambio de envase: 1 Bidón 20 L por Bidón 12 L'])
})
