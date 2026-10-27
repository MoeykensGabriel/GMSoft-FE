import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/customers/utils/activity.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } })
const module = { exports: {} }
new Function('module', 'exports', outputText)(module, module.exports)
const { purchaseActivityLabel, customerListActivityLabel } = module.exports

test('listado de oficina: solo tiempo sin comprar o compra al día', () => {
  assert.equal(customerListActivityLabel(0), 'Compra al día')
  assert.equal(customerListActivityLabel(1), '1 semana sin comprar')
  assert.equal(customerListActivityLabel(3), '3 semanas sin comprar')
})

test('ficha y chofer conservan el aviso de compras no registradas', () => {
  assert.equal(purchaseActivityLabel(0, true), 'Sin compras registradas')
  assert.equal(purchaseActivityLabel(1, true), 'Sin compras registradas · 1 semana sin comprar')
  assert.equal(purchaseActivityLabel(3, true), 'Sin compras registradas · 3 semanas sin comprar')
  assert.equal(purchaseActivityLabel(0, false), 'Compra al día')
  assert.equal(purchaseActivityLabel(1, false), '1 semana sin comprar')
  assert.equal(purchaseActivityLabel(3, false), '3 semanas sin comprar')
})
