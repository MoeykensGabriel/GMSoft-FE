import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/sessions/utils/routeOrderChanges.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('module', 'exports', outputText)(module, module.exports)
const { routeOrderChanges } = module.exports
const rows = ['Ana', 'Beto', 'Carla', 'Diego', 'Eva'].map((displayName, i) => ({ id: String(i), displayName, routeOrder: i * 4 + 2 }))

test('sin movimientos, vacío y un único cliente no tienen cambios', () => {
  assert.deepEqual(routeOrderChanges(rows, [...rows]), [])
  assert.deepEqual(routeOrderChanges([], []), [])
  assert.deepEqual(routeOrderChanges(rows.slice(0, 1), rows.slice(0, 1)), [])
})

test('el resumen incluye todos los desplazados en el orden nuevo con posiciones desde 1', () => {
  const ordered = [rows[0], rows[4], rows[1], rows[2], rows[3]]
  assert.deepEqual(routeOrderChanges(rows, ordered), [
    { id: '4', displayName: 'Eva', from: 5, to: 2 },
    { id: '1', displayName: 'Beto', from: 2, to: 3 },
    { id: '2', displayName: 'Carla', from: 3, to: 4 },
    { id: '3', displayName: 'Diego', from: 4, to: 5 },
  ])
  assert.equal(rows[1].displayName, 'Beto')
  assert.equal(ordered[1].displayName, 'Eva')
})

test('volver al orden inicial elimina todos los cambios', () => {
  assert.equal(routeOrderChanges(rows, [...rows].reverse()).length, 4)
  assert.deepEqual(routeOrderChanges(rows, [...rows].reverse().reverse()), [])
})

test('se identifica por ID aunque los nombres coincidan', () => {
  const sameName = rows.slice(0, 2).map((r) => ({ ...r, displayName: 'Juan' }))
  assert.deepEqual(routeOrderChanges(sameName, [...sameName].reverse()).map(({ id, from, to }) => ({ id, from, to })), [
    { id: '1', from: 2, to: 1 }, { id: '0', from: 1, to: 2 },
  ])
})
