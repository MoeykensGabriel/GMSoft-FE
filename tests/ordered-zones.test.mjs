import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/zones/utils/orderedZones.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('module', 'exports', outputText)(module, module.exports)
const { addZone, removeZone, moveZone, sameZones, orderedZones, zoneBlocks, zonesLabel } = module.exports

function service(path, api) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
  const module = { exports: {} }
  new Function('module', 'exports', 'require', outputText)(module, module.exports, () => ({ api }))
  return module.exports
}

test('editor: agrega hasta cinco zonas, sin repetir ni aceptar la opción vacía', () => {
  const original = ['a']
  assert.deepEqual(addZone(original, 'b'), ['a', 'b'])
  assert.deepEqual(addZone(original, 'a'), original)
  assert.deepEqual(addZone(original, ''), original)
  assert.deepEqual(addZone(['a', 'b', 'c', 'd', 'e'], 'f'), ['a', 'b', 'c', 'd', 'e'])
  assert.deepEqual(original, ['a'])
})

test('editor: quita, sube y baja sin mutar la lista ni cruzar sus extremos', () => {
  const ids = ['a', 'b', 'c']
  assert.deepEqual(removeZone(ids, 'b'), ['a', 'c'])
  assert.deepEqual(removeZone(['a'], 'a'), [])
  assert.deepEqual(moveZone(ids, 1, -1), ['b', 'a', 'c'])
  assert.deepEqual(moveZone(ids, 1, 1), ['a', 'c', 'b'])
  assert.deepEqual(moveZone(ids, 0, -1), ids)
  assert.deepEqual(moveZone(ids, 2, 1), ids)
  assert.deepEqual(moveZone(ids, -1, 1), ids)
  assert.deepEqual(ids, ['a', 'b', 'c'])
})

test('sugerencia: exige las mismas zonas en el mismo orden, incluso sin salida', () => {
  assert.equal(sameZones(['a', 'b'], ['a', 'b']), true)
  assert.equal(sameZones(['b', 'a'], ['a', 'b']), false)
  assert.equal(sameZones(['a'], ['a', 'b']), false)
  assert.equal(sameZones(['a', 'c'], ['a', 'b']), false)
  assert.equal(sameZones([], []), true)
  assert.equal(sameZones(['a'], []), false)
})

test('bloques: respeta el orden de la salida y de los clientes dentro de cada zona', () => {
  const zones = [{ zoneId: 'b', zoneName: 'Tafí Viejo' }, { zoneId: 'a', zoneName: 'San Miguel' }, { zoneId: 'c', zoneName: 'Sin clientes' }]
  const customers = [{ id: '1', zoneId: 'a' }, { id: '3', zoneId: 'b' }, { id: '2', zoneId: 'a' }, { id: '4', zoneId: 'ajena' }]
  const blocks = zoneBlocks(zones, customers)
  assert.deepEqual(blocks.map((block) => block.zoneId), ['b', 'a', 'c'])
  assert.deepEqual(blocks.map((block) => block.customers.map((customer) => customer.id)), [['3'], ['1', '2'], []])
  assert.deepEqual(zoneBlocks(zones.slice(0, 1), customers)[0].customers, [customers[1]])
  assert.deepEqual(zoneBlocks([], customers), [])
})

test('compatibilidad: la lista explícita prevalece, la principal sirve para respuestas antiguas', () => {
  assert.deepEqual(orderedZones({ zones: [], zoneId: 'a' }), [])
  assert.deepEqual(orderedZones({ zoneId: 'a', zoneName: 'Centro' }), [{ zoneId: 'a', zoneName: 'Centro' }])
  assert.deepEqual(orderedZones(null), [])
  assert.equal(zonesLabel({ zoneId: 'a', zoneName: 'Centro' }), 'Centro')
  assert.equal(zonesLabel({ zoneId: 'a', zoneName: 'Centro', zones: [{ zoneId: 'a', zoneName: 'Centro' }, { zoneId: 'b', zoneName: 'Norte' }] }), 'Zonas: Centro → Norte')
})

test('hoja: lee todas las páginas de cada zona, conserva bloques y busca en todas', async () => {
  const calls = []
  const { customerService } = service('../src/modules/customers/services/customerService.ts', {
    get: async (path) => {
      const params = new URL(path, 'http://local.invalid').searchParams
      calls.push(params)
      const zoneId = params.get('zoneId')
      const page = Number(params.get('page'))
      return { items: [{ id: `${zoneId}${page}`, zoneId }], hasNextPage: zoneId === 'b' && page === 1 }
    },
  })
  const rows = await customerService.listRoute([{ zoneId: 'b' }, { zoneId: 'a' }], [1, 3], 'camion', 'María & Ana')
  assert.deepEqual(rows.map((row) => row.id), ['b1', 'b2', 'a1'])
  assert.equal(calls.length, 3)
  for (const params of calls) {
    assert.equal(params.get('vehicleId'), 'camion')
    assert.equal(params.get('search'), 'María & Ana')
    assert.deepEqual(params.getAll('visitDays'), ['1', '3'])
  }
})

test('hoja: una zona fallida no se presenta como un recorrido completo', async () => {
  const { customerService } = service('../src/modules/customers/services/customerService.ts', {
    get: async (path) => {
      if (path.includes('zoneId=b')) throw new Error('Sin señal')
      return { items: [{ id: 'a1', zoneId: 'a' }], hasNextPage: false }
    },
  })
  await assert.rejects(customerService.listRoute([{ zoneId: 'a' }, { zoneId: 'b' }], [1], 'camion'), /Sin señal/)
})

test('organizar: consulta y guarda con la zona y su propia versión', async () => {
  const calls = []
  const { routeOrderService } = service('../src/modules/sessions/services/routeOrderService.ts', {
    get: async (path) => { calls.push(path); return { items: [], version: 'version-b' } },
    put: async (path, body) => { calls.push({ path, body }); return { items: [], version: 'nueva-b' } },
  })
  const snapshot = await routeOrderService.get('salida', 'b')
  await routeOrderService.save('salida', ['b2', 'b1'], snapshot.version, 'b')
  assert.deepEqual(calls, ['/api/sessions/salida/route-order?zoneId=b', {
    path: '/api/sessions/salida/route-order', body: { customerIds: ['b2', 'b1'], version: 'version-b', zoneId: 'b' },
  }])
})
