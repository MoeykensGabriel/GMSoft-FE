import { sortProducts } from './product-order-helper.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

function load(path) {
  const source = readFileSync(new URL(`../src/modules/${path}`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', outputText)(() => ({ sortProducts }), module, module.exports)
  return module.exports
}

const { containerColumns, containerQuantity, sheetDateLabel, sheetFileTitle } = load('reports/utils/routeSheet.ts')

const cliente = (id, containers) => ({ customerId: id, routeOrder: 1, displayName: id, address: '', balance: 0, containers })
const hoja = {
  vehicleId: 'v', vehicleName: 'Dfsk', licensePlate: 'AG989DE', date: '2026-10-22',
  zones: [
    { zoneId: 'z1', zoneName: 'San Miguel', customers: [cliente('a', [{ productId: 's', productDetail: 'Soda', quantity: 3 }])] },
    { zoneId: 'z2', zoneName: 'Tafí Viejo', customers: [
      cliente('b', [{ productId: 'b20', productDetail: 'Bidon 20 lts', quantity: 2 }, { productId: 's', productDetail: 'Soda', quantity: 1 }]),
      cliente('c', []),
    ] },
  ],
}

test('una columna por envase de toda la hoja, sin repetir y en orden alfabético', () => {
  assert.deepEqual(containerColumns(hoja).map((c) => c.productDetail), ['Bidon 20 lts', 'Soda'])
  assert.deepEqual(containerColumns({ ...hoja, zones: [] }), [])
})

test('las columnas del PDF ponen todos los dispenser después de soda', () => {
  const sheet = { ...hoja, zones: [...hoja.zones, { customers: [cliente('d', [
    { productId: 'd2', productDetail: 'Dispenser Z', quantity: 1 },
    { productId: 'd1', productDetail: 'DÍSPÉNSER A', quantity: 2 },
  ])] }] }
  assert.deepEqual(containerColumns(sheet).map((c) => c.productId), ['b20', 's', 'd1', 'd2'])
})

test('cantidad por envase, cero si el cliente no tiene', () => {
  const [, tafi] = hoja.zones
  assert.equal(containerQuantity(tafi.customers[0], 'b20'), 2)
  assert.equal(containerQuantity(tafi.customers[1], 'b20'), 0)
})

test('la fecha va con su día de la semana y no se corre por la zona horaria', () => {
  assert.equal(sheetDateLabel('2026-10-22'), 'Jueves 22/10/2026')
  assert.equal(sheetDateLabel('2026-11-01'), 'Domingo 01/11/2026')
})

test('el PDF se propone con la patente y la fecha', () => {
  assert.equal(sheetFileTitle(hoja), 'Hoja de ruta AG989DE 2026-10-22')
})
