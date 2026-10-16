import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/sessions/utils/receptionChanges.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
const imports = { '../../core': { formatMoney: (n) => `$${n}` } }
new Function('require', 'module', 'exports', outputText)((name) => imports[name], module, module.exports)
const { correctionChanges } = module.exports

const base = { id: 'c', correctedAt: '2026-10-16T20:00:00Z', correctedByUserName: 'admin', reason: 'Se contó mal',
  previousKilometers: null, newKilometers: null, previousAmountReceived: null, newAmountReceived: null, lines: [] }

test('muestra solo lo que cambió, con el antes y el después', () => {
  assert.deepEqual(correctionChanges({ ...base, previousKilometers: 110, newKilometers: 115 }),
    ['Kilometraje de vuelta: 110 → 115 km'])
  assert.deepEqual(correctionChanges({ ...base, previousAmountReceived: 190000, newAmountReceived: 192000,
    lines: [{ productId: 'p', productDetail: 'Bidón 20 lts', state: 'Empty', previousQuantity: 1, newQuantity: 8 }] }),
    ['Plata rendida: $190000 → $192000', 'Bidón 20 lts, vacíos descargados: 1 → 8'])
  assert.deepEqual(correctionChanges(base), [])
})
