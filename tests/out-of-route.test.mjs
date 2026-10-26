import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

function load(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } })
  const module = { exports: {} }
  new Function('module', 'exports', 'require', outputText)(module, module.exports, (name) => {
    assert.ok(name in dependencies, `Dependencia inesperada: ${name}`)
    return dependencies[name]
  })
  return module.exports
}

const weekdays = load('../src/modules/core/utils/weekdays.ts')
const { outOfRouteChip, canOfferNoPurchase } = load('../src/modules/customers/utils/outOfRoute.ts', {
  '../../core': weekdays,
})

test('el chip abrevia los días y conserva la zona y sus acentos', () => {
  assert.equal(outOfRouteChip([4], 'Tafí Viejo'), 'Jue · Tafí Viejo')
  assert.equal(outOfRouteChip([1, 6], 'San Miguel de Tucumán'), 'Lun, Sáb · San Miguel de Tucumán')
  assert.equal(outOfRouteChip([7, 3, 2, 5], 'Centro'), 'Mar, Mié, Vie, Dom · Centro')
})

test('el chip ordena y no repite días ni separadores vacíos', () => {
  assert.equal(outOfRouteChip([6, 1, 1], ' Centro '), 'Lun, Sáb · Centro')
  assert.equal(outOfRouteChip([], 'Centro'), 'Centro')
  assert.equal(outOfRouteChip([4], ''), 'Jue')
})

test('No compró solo se ofrece dentro del recorrido normal', () => {
  assert.equal(canOfferNoPurchase(true), false)
  assert.equal(canOfferNoPurchase(false), true)
})
