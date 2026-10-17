import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/customers/utils/routeLater.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('module', 'exports', outputText)(module, module.exports)
const { postpone, splitRoute } = module.exports

const route = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }))
const ids = (list) => list.map((customer) => customer.id)

test('posponer manda al cliente al final, y posponerlo de nuevo otra vez al final', () => {
  assert.deepEqual(postpone([], 'b'), ['b'])
  assert.deepEqual(postpone(['b'], 'd'), ['b', 'd'])
  assert.deepEqual(postpone(['b', 'd'], 'b'), ['d', 'b'])
})

test('los pospuestos salen de su lugar y quedan al final, en el orden en que se pospusieron', () => {
  const { pending, later, visited } = splitRoute(route, [], ['d', 'b'])
  assert.deepEqual(ids(pending), ['a', 'c', 'e'])
  assert.deepEqual(ids(later), ['d', 'b'])
  assert.deepEqual(visited, [])
})

test('una visita le gana a «más tarde»: el pospuesto que ya se visitó pasa a visitados', () => {
  const { pending, later, visited } = splitRoute(route, ['b', 'a'], ['b', 'd'])
  assert.deepEqual(ids(pending), ['c', 'e'])
  assert.deepEqual(ids(later), ['d'])
  assert.deepEqual(ids(visited), ['a', 'b'])
})

test('un pospuesto que no está en la hoja (otra página o fuera del recorrido) no aparece', () => {
  const { pending, later } = splitRoute(route, [], ['x', 'c'])
  assert.deepEqual(ids(pending), ['a', 'b', 'd', 'e'])
  assert.deepEqual(ids(later), ['c'])
})

test('la búsqueda de los pospuestos ignora acentos y mayúsculas, y busca en nombre, dirección y teléfono', () => {
  const { matchesSearch } = module.exports
  const customer = { displayName: 'Panadería La Espiga', address: 'Av. Mitre 1200', phone: '3814112233' }
  assert.equal(matchesSearch(customer, ''), true)
  assert.equal(matchesSearch(customer, 'panaderia'), true)
  assert.equal(matchesSearch(customer, 'MITRE'), true)
  assert.equal(matchesSearch(customer, '4112'), true)
  assert.equal(matchesSearch(customer, 'ferretería'), false)
  assert.equal(matchesSearch({ ...customer, phone: null }, '381'), false)
})
