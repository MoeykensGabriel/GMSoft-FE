import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/customers/utils/routeProgress.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('module', 'exports', outputText)(module, module.exports)
const { routeProgress, share } = module.exports

test('separa compraron, visitados sin compra y pendientes', () => {
  assert.deepEqual(routeProgress(['a', 'b', 'c', 'd'], ['a', 'b'], ['b']), { total: 4, sold: 1, noPurchase: 1, pending: 2 })
})

test('las visitas fuera del recorrido no llenan la barra', () => {
  assert.deepEqual(routeProgress(['a', 'b'], ['a', 'x'], ['y']), { total: 2, sold: 1, noPurchase: 0, pending: 1 })
})

test('un recorrido vacío no divide por cero', () => {
  assert.deepEqual(routeProgress([], [], []), { total: 0, sold: 0, noPurchase: 0, pending: 0 })
  assert.equal(share(3, 0), 0)
  assert.equal(share(1, 4), 25)
})
