import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

function load(path) {
  const source = readFileSync(new URL(`../src/modules/${path}`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } })
  const module = { exports: {} }
  new Function('module', 'exports', outputText)(module, module.exports)
  return module.exports
}
const { periodRange, rangeError } = load('reports/utils/period.ts')
const { abbreviatedMoney, formatPercent } = load('reports/utils/format.ts')
const { currentBusinessDate } = load('core/utils/format.ts')

test('semana de lunes a domingo cruza mes y año', () => {
  for (const date of ['2025-12-29', '2026-01-01', '2026-01-04']) {
    assert.deepEqual(periodRange('week', date), { from: '2025-12-29', to: '2026-01-04' })
  }
  assert.deepEqual(periodRange('week', '2026-01-05'), { from: '2026-01-05', to: '2026-01-11' })
})
test('meses completos, bisiestos y mes anterior al cambio de año', () => {
  assert.deepEqual(periodRange('month', '2024-02-10'), { from: '2024-02-01', to: '2024-02-29' })
  assert.deepEqual(periodRange('month', '2025-02-28'), { from: '2025-02-01', to: '2025-02-28' })
  assert.deepEqual(periodRange('previousMonth', '2026-01-31'), { from: '2025-12-01', to: '2025-12-31' })
  assert.deepEqual(periodRange('previousMonth', '2024-03-31'), { from: '2024-02-01', to: '2024-02-29' })
})
test('el período cambia a medianoche argentina, no UTC', () => {
  const before = currentBusinessDate(new Date('2026-10-01T02:59:59Z'))
  const after = currentBusinessDate(new Date('2026-10-01T03:00:00Z'))
  assert.equal(periodRange('month', before).from, '2026-09-01')
  assert.equal(periodRange('month', after).from, '2026-10-01')
})
test('validación del contrato: fechas reales, orden y 366 días inclusivos', () => {
  assert.equal(rangeError({ from: '2024-01-01', to: '2024-12-31' }), null)
  assert.equal(rangeError({ from: '2026-10-15', to: '2026-10-15' }), null)
  for (const [from, to] of [['2024-01-01', '2025-01-01'], ['2026-10-15', '2026-10-14'], ['', '2026-10-15'], ['2025-02-29', '2025-03-01'], ['0001-01-01', '0001-01-02'], ['9999-12-30', '9999-12-31'], ['2026-1-01', '2026-01-02']]) {
    assert.ok(rangeError({ from, to }))
  }
})
test('pesos abreviados conservan signo, decimales argentinos y magnitud', () => {
  for (const [value, expected] of [[0, '$0'], [850000, '$850 k'], [1200000, '$1,2 M'], [-1200000, '-$1,2 M'], [1500, '$1,5 k'], [999999, '$1 M'], [25.5, '$25,5']]) {
    assert.equal(abbreviatedMoney(value), expected)
  }
  assert.equal(formatPercent(null), '—')
  assert.match(formatPercent(1.25), /125/)
  assert.match(formatPercent(0), /0/)
})
