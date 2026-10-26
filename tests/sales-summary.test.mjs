import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

function loadSource(path, require = () => { throw new Error('Import inesperado') }) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } })
  const module = { exports: {} }
  new Function('module', 'exports', 'require', outputText)(module, module.exports, require)
  return module.exports
}

const core = loadSource('../src/modules/core/utils/format.ts')
const { salesSummaryLine } = loadSource('../src/modules/sessions/utils/salesSummaryLine.ts', (path) => {
  assert.equal(path, '../../core')
  return core
})
const line = (values) => salesSummaryLine({ cash: 0, transfer: 0, card: 0, sales: 0, ...values }).replaceAll('\u00a0', ' ')

test('muestra efectivo, transferencia y cantidad de ventas con el formato de core', () => {
  assert.equal(line({ cash: 41500, transfer: 12000, sales: 4 }), 'Efectivo $ 41.500,00 · Transf. $ 12.000,00 · 4 ventas')
})

test('omite los medios en cero y usa venta en singular', () => {
  assert.equal(line({ cash: 100, sales: 1 }), 'Efectivo $ 100,00 · 1 venta')
  assert.equal(line({ transfer: 200, sales: 2 }), 'Transf. $ 200,00 · 2 ventas')
  assert.equal(line({ sales: 1 }), '1 venta')
})

test('agrega tarjeta solamente si tiene importe', () => {
  assert.equal(line({ card: 300, sales: 1 }), '1 venta · Tarjeta $ 300,00')
  assert.equal(line({ cash: 100, transfer: 200, card: 300, sales: 3 }), 'Efectivo $ 100,00 · Transf. $ 200,00 · 3 ventas · Tarjeta $ 300,00')
})

test('sin ventas no muestra la línea chica', () => {
  assert.equal(line({}), '')
})
