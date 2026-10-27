import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/sessions/utils/receptionResult.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('require', 'module', 'exports', outputText)(() => ({}), module, module.exports)
const { receptionDifferences, signedDifference } = module.exports

const linea = (productDetail, fullOnBoard, emptyOnBoard) => ({ productId: productDetail, productDetail, fullOnBoard, emptyOnBoard })
const dif = (productDetail, difference) => ({ productId: productDetail, productDetail, difference })

test('todo en cero es que cuadró', () => {
  assert.deepEqual(receptionDifferences([linea('Bidón 20 lts', 0, 0)]), { full: [], empty: [] })
  assert.deepEqual(receptionDifferences([]), { full: [], empty: [] })
})

test('separa llenos y vacíos: lo que quedó a bordo falta, lo negativo sobra', () => {
  assert.deepEqual(receptionDifferences([linea('Bidón 20 lts', 2, -1), linea('Sifon 1.5 lts', 0, 3), linea('Dispenser', -1, 0)]), {
    full: [dif('Bidón 20 lts', -2), dif('Dispenser', 1)],
    empty: [dif('Bidón 20 lts', 1), dif('Sifon 1.5 lts', -3)],
  })
})

test('el número lleva signo: + sobra, − falta', () => {
  assert.equal(signedDifference(12), '+12')
  assert.equal(signedDifference(-7), '−7')
})
