import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/sessions/utils/receptionSummary.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('require', 'module', 'exports', outputText)(() => ({}), module, module.exports)
const { containerGaps, describeGap, cashGap } = module.exports

const stock = [
  { productId: 'b12', productDetail: 'Bidón 12', fullOnBoard: 5, emptyOnBoard: 10 },
  { productId: 'b20', productDetail: 'Bidón 20', fullOnBoard: 0, emptyOnBoard: 3 },
  { productId: 'soda', productDetail: 'Soda', fullOnBoard: 2, emptyOnBoard: 0 },
]

test('lo contado contra lo que debía volver; lo que no se contó falta entero', () => {
  const gaps = containerGaps(stock, [{ productId: 'b12', llenos: 5, vacios: 8 }, { productId: 'b20', llenos: 0, vacios: 4 }])
  assert.deepEqual(gaps.map((g) => [g.productId, describeGap(g)]), [
    ['b12', 'faltan 2 vacíos'],
    ['b20', 'sobra 1 vacío'],
    ['soda', 'faltan 2 llenos'],
  ])
  assert.deepEqual(containerGaps(stock, [{ productId: 'b12', llenos: 5, vacios: 10 },
    { productId: 'b20', llenos: 0, vacios: 3 }, { productId: 'soda', llenos: 2, vacios: 0 }]), [])
})

test('la caja: positivo es plata que falta, sin errores de centavos', () => {
  assert.equal(cashGap(53000, 52000), 1000)
  assert.equal(cashGap(53000, 53500), -500)
  assert.equal(cashGap(0.3, 0.1 + 0.2), 0)
})
