import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/reports/utils/salesPeriod.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('require', 'module', 'exports', outputText)(() => { throw new Error('No se permiten imports de runtime') }, module, module.exports)
const { periodFor, shiftPeriod, periodTitle, isCurrentPeriod, rangeTitle, parsePercent, percentAmount } = module.exports

test('semana de lunes a domingo, incluso al cruzar mes o año', () => {
  const october = { from: '2026-09-28', to: '2026-10-04' }
  assert.deepEqual(periodFor('week', '2026-10-01'), october)
  assert.deepEqual(periodFor('week', october.from), october)
  assert.deepEqual(periodFor('week', october.to), october)
  assert.deepEqual(periodFor('week', '2027-01-01'), { from: '2026-12-28', to: '2027-01-03' })
})

test('desplaza semanas completas en ambas direcciones sin mutar el rango', () => {
  const range = { from: '2026-12-28', to: '2027-01-03' }
  assert.deepEqual(shiftPeriod('week', range, 1), { from: '2027-01-04', to: '2027-01-10' })
  assert.deepEqual(shiftPeriod('week', range, -1), { from: '2026-12-21', to: '2026-12-27' })
  assert.deepEqual(range, { from: '2026-12-28', to: '2027-01-03' })
})

test('mes calendario y cambio de diciembre a enero en ambas direcciones', () => {
  const december = periodFor('month', '2026-12-31')
  const january = { from: '2027-01-01', to: '2027-01-31' }
  assert.deepEqual(december, { from: '2026-12-01', to: '2026-12-31' })
  assert.deepEqual(shiftPeriod('month', december, 1), january)
  assert.deepEqual(shiftPeriod('month', january, -1), december)
})

test('febrero común y bisiesto, sin desbordar al cambiar desde meses de 31 días', () => {
  for (const [year, lastDay] of [[2026, 28], [2028, 29]]) {
    const february = { from: `${year}-02-01`, to: `${year}-02-${lastDay}` }
    assert.deepEqual(periodFor('month', `${year}-02-15`), february)
    assert.deepEqual(shiftPeriod('month', periodFor('month', `${year}-01-31`), 1), february)
    assert.deepEqual(shiftPeriod('month', periodFor('month', `${year}-03-31`), -1), february)
    assert.deepEqual(shiftPeriod('month', february, 1), { from: `${year}-03-01`, to: `${year}-03-31` })
  }
})

test('títulos en español con días y meses de dos dígitos', () => {
  assert.equal(periodTitle('week', periodFor('week', '2025-10-20')), 'Semana del 20/10 al 26/10')
  assert.equal(periodTitle('week', periodFor('week', '2027-01-01')), 'Semana del 28/12 al 03/01')
  assert.equal(periodTitle('month', periodFor('month', '2026-10-27')), 'Octubre 2026')
  assert.equal(periodTitle('month', periodFor('month', '2027-01-15')), 'Enero 2027')
})

test('reconoce el período actual y descarta anteriores y siguientes', () => {
  for (const kind of ['week', 'month']) {
    const current = periodFor(kind, '2026-10-27')
    assert.equal(isCurrentPeriod(kind, current, '2026-10-27'), true)
    assert.equal(isCurrentPeriod(kind, current, current.from), true)
    assert.equal(isCurrentPeriod(kind, current, current.to), true)
    assert.equal(isCurrentPeriod(kind, shiftPeriod(kind, current, -1), '2026-10-27'), false)
    assert.equal(isCurrentPeriod(kind, shiftPeriod(kind, current, 1), '2026-10-27'), false)
  }
})

test('título del rango: período exacto o fechas sueltas', () => {
  assert.equal(rangeTitle('week', { from: '2025-10-20', to: '2025-10-26' }), 'Semana del 20/10 al 26/10')
  assert.equal(rangeTitle('month', { from: '2026-11-01', to: '2026-11-30' }), 'Noviembre 2026')
  assert.equal(rangeTitle('month', { from: '2026-11-03', to: '2026-11-10' }), 'Del 03/11/2026 al 10/11/2026')
  assert.equal(rangeTitle('week', { from: '2026-11-05', to: '2026-11-05' }), 'El 05/11/2026')
})

test('porcentaje con coma o punto decimal, entre 0 y 100', () => {
  assert.equal(parsePercent('1'), 1)
  assert.equal(parsePercent(' 1,5 '), 1.5)
  assert.equal(parsePercent('0.25'), 0.25)
  assert.equal(parsePercent(',5'), 0.5)
  assert.equal(parsePercent('100'), 100)
  for (const invalid of ['', 'abc', '-1', '101', '1,2,3', '1e2', '1.']) assert.equal(parsePercent(invalid), null)
})

test('monto del porcentaje redondeado a centavos', () => {
  assert.equal(percentAmount(1_234_567, 1), 12_345.67)
  assert.equal(percentAmount(1000, 1.5), 15)
  assert.equal(percentAmount(333.33, 0.5), 1.67)
  assert.equal(percentAmount(0, 10), 0)
})
