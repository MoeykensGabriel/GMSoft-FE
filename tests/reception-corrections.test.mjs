import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/sessions/utils/receptionChanges.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
const imports = { '../../core': { formatMoney: (n) => `$${n}` } }
new Function('require', 'module', 'exports', outputText)((name) => imports[name], module, module.exports)
const { correctionChanges, pendingCorrectionChanges } = module.exports

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

const reception = { sessionId: 's', kilometersAtOpen: 100, kilometersAtClose: 110, amountReceived: 190000, corrections: [],
  products: [{ productId: 'p', productDetail: 'Bidón 20 lts', fullReturned: 2, emptyReturned: 1, fullMissing: 0, emptyMissing: 7 }] }
const request = { reason: 'Se contó mal', kilometersAtClose: null, amountReceived: null, returns: [] }

test('antes de confirmar, muestra lo que va a cambiar con las frases del historial', () => {
  assert.deepEqual(pendingCorrectionChanges(reception, { ...request, kilometersAtClose: 115, amountReceived: 192000,
    returns: [{ productId: 'p', state: 'Empty', quantity: 8 }, { productId: 'p', state: 'Full', quantity: 0 }] }),
  ['Kilometraje de vuelta: 110 → 115 km', 'Plata rendida: $190000 → $192000',
    'Bidón 20 lts, vacíos descargados: 1 → 8', 'Bidón 20 lts, llenos descargados: 2 → 0'])
  assert.deepEqual(pendingCorrectionChanges(reception, request), [])
})
