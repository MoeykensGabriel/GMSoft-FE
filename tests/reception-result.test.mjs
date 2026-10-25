import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/sessions/utils/receptionResult.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('require', 'module', 'exports', outputText)(() => ({}), module, module.exports)
const { receptionDifferences } = module.exports

const linea = (productDetail, fullOnBoard, emptyOnBoard) => ({ productId: productDetail, productDetail, fullOnBoard, emptyOnBoard })

test('todo en cero es que cuadró', () => {
  assert.deepEqual(receptionDifferences([linea('Bidón 20 lts', 0, 0)]), [])
  assert.deepEqual(receptionDifferences([]), [])
})

test('positivo falta, negativo sobra, en singular y plural', () => {
  assert.deepEqual(receptionDifferences([linea('Bidón 20 lts', 2, -1), linea('Sifon 1.5 lts', 1, 3)]), [
    'Faltan 2 llenos de Bidón 20 lts', 'Sobra 1 vacío de Bidón 20 lts',
    'Falta 1 lleno de Sifon 1.5 lts', 'Faltan 3 vacíos de Sifon 1.5 lts',
  ])
})
