import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/sessions/utils/transfer.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('require', 'module', 'exports', outputText)(() => { throw new Error('No debe importar runtime') }, module, module.exports)
const { transferableStock, transferLines, describeTransfer } = module.exports

const stock = Object.freeze([
  { productId: 'a', productDetail: 'Bidón 12 lts', fullOnBoard: 5 },
  { productId: 'b', productDetail: 'Bidón 20 lts', fullOnBoard: 0 },
  { productId: 'c', productDetail: 'Sifón', fullOnBoard: 2 },
])

test('solo se ofrecen los productos con llenos a bordo', () => {
  assert.deepEqual(transferableStock(stock).map((line) => line.productId), ['a', 'c'])
  assert.deepEqual(transferableStock(undefined), [])
})

test('las líneas llevan solo lo cargado y nunca más de lo que hay a bordo', () => {
  assert.deepEqual(transferLines(stock, { a: 3, c: 9 }), [
    { productId: 'a', productDetail: 'Bidón 12 lts', quantity: 3 },
    { productId: 'c', productDetail: 'Sifón', quantity: 2 },
  ])
  assert.deepEqual(transferLines(stock, { a: 0, b: 4 }), [])
})

test('describe el pase en una frase', () => {
  assert.equal(describeTransfer([{ productId: 'a', productDetail: 'Bidón 12 lts', quantity: 3 }]), '3 Bidón 12 lts')
  assert.equal(describeTransfer([
    { productId: 'a', productDetail: 'Bidón 12 lts', quantity: 3 },
    { productId: 'b', productDetail: 'Bidón 20 lts', quantity: 1 },
    { productId: 'c', productDetail: 'Cajón', quantity: 3 },
  ]), '3 Bidón 12 lts, 1 Bidón 20 lts y 3 Cajón')
})
