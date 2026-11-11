import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/vehicles/utils/vehicleControl.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('require', 'module', 'exports', outputText)(() => ({}), module, module.exports)
const { kilometersStatus, lastDays, kmLabel } = module.exports

test('el estado del km: verde solo revisado y sin otra lectura esperando', () => {
  assert.equal(kilometersStatus({ kilometersCheckedAt: '2026-11-09T19:31:41Z' }, false).tone, 'success')
  assert.equal(kilometersStatus({ kilometersCheckedAt: '2026-11-09T19:31:41Z' }, true).label, 'Esperando revisión')
  assert.equal(kilometersStatus({ kilometersCheckPending: true }, false).label, 'Sin revisar')
  assert.match(kilometersStatus({ kilometersCheckPending: true }, false).detail, /próxima salida/)
  assert.equal(kilometersStatus({}, false).tone, 'warning')
})

test('los últimos 30 días cruzan el mes y el año', () => {
  assert.deepEqual(lastDays('2026-11-09', 30), { from: '2026-10-11', to: '2026-11-09' })
  assert.deepEqual(lastDays('2027-01-05', 30), { from: '2026-12-07', to: '2027-01-05' })
  assert.deepEqual(lastDays('2026-11-09', 1), { from: '2026-11-09', to: '2026-11-09' })
})

test('km con separador de miles y un decimal, o raya si no hay dato', () => {
  assert.equal(kmLabel(35040), '35.040 km')
  assert.equal(kmLabel(40.25), '40,3 km')
  assert.equal(kmLabel(null), '—')
})
