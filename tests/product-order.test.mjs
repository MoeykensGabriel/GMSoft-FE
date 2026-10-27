import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/core/utils/productOrder.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} })
const module = { exports: {} }
new Function('module', 'exports', outputText)(module, module.exports)
const { isDispenser, sortProducts } = module.exports

test('reconoce dispenser por nombre sin distinguir mayúsculas ni acentos', () => {
  for (const name of ['DISPENSER', 'Equipo Díspénsér frío', 'Di\u0301spenser']) assert.equal(isDispenser(name), true)
  for (const name of ['', 'Bidón 20 lts', 'Sifon 1.5 lts']) assert.equal(isDispenser(name), false)
})

test('ordena ambos grupos por detalle, sin mutar ni cambiar objetos o cantidades', () => {
  const products = ['Dispenser Z', 'Sifon 1.5 lts', 'Dispenser A', 'Bidón 20 lts', 'Bidón 12 lts']
    .map((productDetail, quantity) => Object.freeze({ productDetail, quantity }))
  Object.freeze(products)
  const sorted = sortProducts(products, (p) => p.productDetail)
  assert.deepEqual(sorted, [products[4], products[3], products[1], products[2], products[0]])
  for (const product of sorted) assert.ok(products.includes(product))
  assert.equal(products[0].productDetail, 'Dispenser Z')
  assert.deepEqual(sortProducts([], (p) => p.detail), [])
  assert.deepEqual(sortProducts(['DÍSPÉNSER', 'Sifon'], (p) => p), ['Sifon', 'DÍSPÉNSER'])
})
