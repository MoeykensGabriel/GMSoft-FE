import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/sessions/utils/kilometers.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('require', 'module', 'exports', outputText)(() => ({}), module, module.exports)
const { checkKilometers } = module.exports

test('vacío, negativo o con decimales no deja seguir', () => {
  assert.equal(checkKilometers('', 100).ok, false)
  assert.equal(checkKilometers('  ', 100).ok, false)
  assert.match(checkKilometers('-5', 100).error, /números enteros/)
  assert.match(checkKilometers('100.5', 100).error, /números enteros/)
})

test('menor que el último registrado no deja seguir y dice cuál es', () => {
  assert.match(checkKilometers('49999', 50085).error, /50\.085 km/)
})

test('igual o algo más que el último pasa; un salto grande pide confirmar', () => {
  assert.deepEqual(checkKilometers('50085', 50085), { ok: true })
  assert.deepEqual(checkKilometers('50300', 50085), { ok: true })
  assert.deepEqual(checkKilometers('500850', 50085), { ok: false, salto: 450765 })
})

test('sin último registrado solo controla que sea un número', () => {
  assert.deepEqual(checkKilometers('1234', null), { ok: true })
})

test('con el km sin revisar vale lo que marca el tablero, aunque sea menos o mucho más', () => {
  assert.deepEqual(checkKilometers('187420', 30000863, true), { ok: true })
  assert.deepEqual(checkKilometers('99999999', 100, true), { ok: true })
  assert.equal(checkKilometers('', 100, true).ok, false)
  assert.match(checkKilometers('12.5', 100, true).error, /números enteros/)
})
