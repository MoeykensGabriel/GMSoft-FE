import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/sessions/utils/usageSince.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('require', 'module', 'exports', outputText)(() => { throw new Error('No debe importar runtime') }, module, module.exports)
const { usageSinceLabel } = module.exports

test('muestra el día y la fecha de arranque sin correrla por la zona horaria', () => {
  assert.equal(usageSinceLabel('2026-10-24', 12), 'Día 12 · desde 24/10/2026')
  assert.equal(usageSinceLabel('2026-11-01', 1), 'Día 1 · desde 01/11/2026')
})

test('sin salidas no hay etiqueta', () => {
  assert.equal(usageSinceLabel(null, null), null)
})
