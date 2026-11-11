import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/driverControl/format.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('require', 'module', 'exports', outputText)(() => ({ BUSINESS_TIME_ZONE: 'America/Argentina/Buenos_Aires' }), module, module.exports)
const { duration, workingHoursSummary, time } = module.exports

test('las duraciones se leen de un vistazo', () => {
  assert.equal(duration(45), '45 s')
  assert.equal(duration(79), '1 min')
  assert.equal(duration(180), '3 min')
  assert.equal(duration(3900), '1 h 5 min')
  assert.equal(duration(7200), '2 h')
  assert.equal(duration(308 * 3600), '12 d 20 h')
})

test('la hora se muestra en hora argentina', () => {
  assert.equal(time('2026-11-10T14:40:00Z'), '11:40')
})

test('el horario agrupa los días seguidos iguales', () => {
  const work = (dayOfWeek) => ({ dayOfWeek, isWorkingDay: true, from: '07:00:00', until: '18:00:00', openingCutoff: '10:00:00' })
  const days = [1, 2, 3, 4, 5].map(work).concat(
    { dayOfWeek: 6, isWorkingDay: true, from: '07:00:00', until: '13:00:00', openingCutoff: null },
    { dayOfWeek: 7, isWorkingDay: false, from: null, until: null, openingCutoff: null })
  assert.deepEqual(workingHoursSummary(days), [
    'Lun–Vie 07:00–18:00 · abrir hasta 10:00', 'Sáb 07:00–13:00', 'Dom No se trabaja'])
})
