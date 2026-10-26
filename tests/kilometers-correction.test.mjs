import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/vehicles/utils/kilometersCorrection.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } })
const module = { exports: {} }
new Function('module', 'exports', outputText)(module, module.exports)
const { requiresKilometersReason } = module.exports

for (const [current, next, expected] of [[300000100, 150000, true], [100, 99, true], [100, 0, true], [100, 100, false], [100, 101, false], [0, 0, false]]) {
  test(`motivo de ${current} a ${next}: ${expected}`, () => {
    assert.equal(requiresKilometersReason(current, next), expected)
  })
}
