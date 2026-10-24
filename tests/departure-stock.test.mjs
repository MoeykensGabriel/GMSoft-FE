import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/sessions/utils/departureStock.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('require', 'module', 'exports', outputText)(() => ({}), module, module.exports)
const { departureRows, stockTone } = module.exports

const fila = (initial, restocked, fullOnBoard) => ({ productId: 'p', productDetail: 'Bidón', initial, restocked, delivered: initial + restocked - fullOnBoard, fullOnBoard, emptyOnBoard: 0 })

test('usa el stock a bordo cuando viene, y si no muestra la carga inicial', () => {
  assert.deepEqual(departureRows({ initialLoad: [], stock: [fila(10, 0, 4)] }), [fila(10, 0, 4)])
  assert.deepEqual(departureRows({ initialLoad: [{ productId: 'p', productDetail: 'Bidón', quantity: 7 }] }),
    [{ productId: 'p', productDetail: 'Bidón', initial: 7, restocked: 0, delivered: 0, fullOnBoard: 7, emptyOnBoard: 0 }])
})

test('marca sin stock y poco stock según lo que llevó, recargas incluidas', () => {
  assert.equal(stockTone(fila(10, 0, 0)), 'empty')
  assert.equal(stockTone(fila(10, 5, 2)), 'low')
  assert.equal(stockTone(fila(10, 0, 2)), 'ok')
  assert.equal(stockTone(fila(0, 0, 0)), 'ok')
})
