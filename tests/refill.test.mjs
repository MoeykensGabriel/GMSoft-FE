import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/vehicleLoads/utils/refill.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('module', 'exports', outputText)(module, module.exports)
const { refillOptions, withRefills } = module.exports

const products = [
  { id: 'b20', detail: 'Bidón 20', tracking: 'ByBalance' },
  { id: 'agua', detail: 'Agua 2 L', tracking: 'None' },
  { id: 'soda', detail: 'Sifón', tracking: 'ByBalance' },
]
const stock = [
  { productId: 'b20', productDetail: 'Bidón 20', fullOnBoard: 0, emptyOnBoard: 12 },
  { productId: 'soda', productDetail: 'Sifón', fullOnBoard: 3, emptyOnBoard: 0 },
]

test('solo ofrece productos con envase y vacíos arriba; el máximo es el menor entre vacíos y llenos', () => {
  const options = refillOptions([{ productId: 'b20', quantity: 8 }, { productId: 'agua', quantity: 5 },
    { productId: 'soda', quantity: 4 }], products, stock)
  assert.deepEqual(options, [{ productId: 'b20', productDetail: 'Bidón 20', emptyOnBoard: 12, max: 8 }])
})

test('los rellenados se acotan al máximo y se descartan los de productos que ya no están', () => {
  const items = [{ productId: 'b20', quantity: 8 }]
  const options = refillOptions(items, products, stock)
  assert.deepEqual(withRefills(items, { b20: 20, soda: 3 }, options), [{ productId: 'b20', quantity: 8, refilledEmpties: 8 }])
  assert.deepEqual(withRefills(items, { b20: 0 }, options), [{ productId: 'b20', quantity: 8 }])
  assert.deepEqual(withRefills(items, {}, options), [{ productId: 'b20', quantity: 8 }])
})
