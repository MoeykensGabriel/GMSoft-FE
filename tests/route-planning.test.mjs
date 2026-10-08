import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

function load(path, imports = {}) {
  const source = readFileSync(new URL(`../src/modules/routePlanning/${path}`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } })
  const module = { exports: {} }
  const require = (name) => {
    assert.ok(name in imports, `Importación inesperada: ${name}`)
    return imports[name]
  }
  new Function('require', 'module', 'exports', outputText)(require, module, module.exports)
  return module.exports
}

const { moveRow, dropRow, hasChanges, rowModified, toggleVisitDay, buildRouteSave } = load('utils/routeDraft.ts')
const filters = { vehicleId: 'truck', zoneId: 'zone', day: 1 }
function baseline() {
  return { version: 'version-read', items: [2, 6, 10].map((routeOrder, index) => ({
    id: `customer-${index}`, routeOrder, visitDays: [1, 4], vehicleId: 'truck', zoneId: 'zone',
  })) }
}

test('mover primero y último renumera el orden visual sin mutar posiciones persistidas', () => {
  const base = baseline()
  const rows = moveRow(base.items, 0, 2)
  assert.deepEqual(rows.map((row) => row.id), ['customer-1', 'customer-2', 'customer-0'])
  assert.deepEqual(base.items.map((row) => row.routeOrder), [2, 6, 10])
  assert.deepEqual(moveRow(rows, 2, 0), base.items)
  assert.equal(moveRow(rows, 0, -1), rows)
  assert.equal(moveRow(rows, 2, 3), rows)
})

test('arrastre antes y después de una fila, incluidos los extremos', () => {
  const rows = ['a', 'b', 'c', 'd']
  assert.deepEqual(dropRow(rows, 0, 4), ['b', 'c', 'd', 'a'])
  assert.deepEqual(dropRow(rows, 3, 0), ['d', 'a', 'b', 'c'])
  assert.deepEqual(dropRow(rows, 0, 2), ['b', 'a', 'c', 'd'])
  assert.deepEqual(dropRow(rows, 0, 1), rows)
})

test('detectar cambios y deshacerlos incluye orden, días y camión', () => {
  const base = baseline()
  assert.equal(hasChanges(base.items, base.items), false)
  const reordered = moveRow(base.items, 0, 2)
  assert.equal(hasChanges(reordered, base.items), true)
  assert.equal(rowModified(reordered[0], 0, base.items), true)
  assert.equal(hasChanges(moveRow(reordered, 2, 0), base.items), false)
  assert.equal(hasChanges([{ ...base.items[0], visitDays: [4, 1] }, ...base.items.slice(1)], base.items), false)
  assert.equal(hasChanges([{ ...base.items[0], vehicleId: 'other' }, ...base.items.slice(1)], base.items), true)
  assert.equal(hasChanges([{ ...base.items[0], visitDays: [4] }, ...base.items.slice(1)], base.items), true)
})

test('el último día no se puede quitar; agregar días conserva orden ISO', () => {
  assert.equal(toggleVisitDay([1], 1), null)
  assert.deepEqual(toggleVisitDay([1, 4], 1), [4])
  assert.deepEqual(toggleVisitDay([4], 1), [1, 4])
})

test('el cuerpo conserva todos los IDs, incluidos quienes salen, y solo envía campos editados', () => {
  const base = baseline()
  const edited = [{ ...base.items[2], vehicleId: 'other', visitDays: [4] }, base.items[0], base.items[1]]
  assert.deepEqual(buildRouteSave(filters, base, edited), {
    ...filters, version: 'version-read', customerIds: ['customer-2', 'customer-0', 'customer-1'],
    changes: [{ id: 'customer-2', visitDays: [4], vehicleId: 'other' }],
  })
  assert.deepEqual(buildRouteSave(filters, base, moveRow(base.items, 0, 2)).changes, [])
  assert.deepEqual(base.items[2].visitDays, [1, 4])
})

test('servicio usa endpoints y clave de caché propios de Recorridos', async () => {
  const calls = []
  const snapshot = baseline()
  const { routePlanningService, routePlanningKey } = load('services/routePlanningService.ts', {
    '../../core': { api: {
      get: async (path) => { calls.push(['GET', path]); return snapshot },
      put: async (path, body) => { calls.push(['PUT', path, body]); return snapshot },
    } },
  })
  assert.deepEqual(routePlanningKey(filters), ['route-planning', 'list', filters])
  const body = buildRouteSave(filters, snapshot, snapshot.items)
  assert.equal(await routePlanningService.get(filters), snapshot)
  assert.equal(await routePlanningService.save(body), snapshot)
  assert.deepEqual(calls, [
    ['GET', '/api/route-planning?vehicleId=truck&zoneId=zone&day=1'],
    ['PUT', '/api/route-planning', body],
  ])
})
