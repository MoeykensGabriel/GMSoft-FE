import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/vehicleLoads/utils/loadTable.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('require', 'module', 'exports', outputText)(() => ({}), module, module.exports)
const { totalsByProduct, draftItems, sameLoad } = module.exports

test('suma las tandas por producto', () => {
  assert.deepEqual(totalsByProduct([{ productId: 'b20', quantity: 5 }, { productId: 'b20', quantity: 3 }, { productId: 'sif', quantity: 2 }]), { b20: 8, sif: 2 })
})

test('al guardar manda solo lo que queda con algo arriba', () => {
  assert.deepEqual(draftItems({ b20: 5, sif: 0, b12: 2 }), [{ productId: 'b20', quantity: 5 }, { productId: 'b12', quantity: 2 }])
})

test('detecta si la tabla cambió, contando lo que falta como cero', () => {
  assert.equal(sameLoad({ b20: 8, sif: 0 }, { b20: 8 }), true)
  assert.equal(sameLoad({ b20: 5 }, { b20: 8 }), false)
  assert.equal(sameLoad({}, { b20: 1 }), false)
})
