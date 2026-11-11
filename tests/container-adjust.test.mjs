import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/customers/utils/containerAdjust.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('module', 'exports', outputText)(module, module.exports)
const { changedCounts } = module.exports

test('solo manda los productos cuyo conteo cambió, con la cantidad real', () => {
  assert.deepEqual(changedCounts({ b12: 2, soda: 6 }, { b12: 2, soda: 4, disp: 1 }),
    [{ productId: 'soda', realQuantity: 4 }, { productId: 'disp', realQuantity: 1 }])
})

test('un cliente sin envases registrados toma el conteo como nuevo; volver a cero también es un cambio', () => {
  assert.deepEqual(changedCounts({}, { b12: 1, b20: 0 }), [{ productId: 'b12', realQuantity: 1 }])
  assert.deepEqual(changedCounts({ b12: 3 }, { b12: 0 }), [{ productId: 'b12', realQuantity: 0 }])
})
