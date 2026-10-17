import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const source = readFileSync(new URL('../src/modules/deliveries/utils/loans.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('module', 'exports', outputText)(module, module.exports)
const { loanLimits, loanSummary } = module.exports

test('prestar comparte los llenos con lo vendido y retirar usa el saldo previo del cliente', () => {
  assert.deepEqual(loanLimits(5, 2, 1), { maxOut: 3, maxIn: 1, visible: true })
  assert.deepEqual(loanLimits(5, 5, 0), { maxOut: 0, maxIn: 0, visible: true })
  assert.deepEqual(loanLimits(1, 2, 3), { maxOut: 0, maxIn: 3, visible: true })
})

test('sin stock permite retirar, sin saldo permite prestar, sin ambos no muestra la sección', () => {
  assert.deepEqual(loanLimits(0, 0, 2), { maxOut: 0, maxIn: 2, visible: true })
  assert.deepEqual(loanLimits(1, 0, 0), { maxOut: 1, maxIn: 0, visible: true })
  assert.deepEqual(loanLimits(0, 0, 0), { maxOut: 0, maxIn: 0, visible: false })
})

test('aplica el tope de la API y no ofrece cantidades negativas', () => {
  assert.deepEqual(loanLimits(2000, 1, 2000), { maxOut: 1000, maxIn: 1000, visible: true })
  assert.deepEqual(loanLimits(-1, 0, -2), { maxOut: 0, maxIn: 0, visible: false })
})

test('confirmación y visita registrada distinguen préstamo sin cargo y retiro', () => {
  assert.deepEqual(loanSummary([{ productId: 'd', productDetail: 'Dispenser', presta: 1, retiraPrestamo: 2 }]),
    ['Presta 1 Dispenser (sin cargo)', 'Retira 2 Dispenser'])
  assert.deepEqual(loanSummary([{ productId: 'd', productDetail: 'Dispenser', presta: 0, retiraPrestamo: 0 }]), [])
})

test('solo préstamos confirma sin preguntar cobro; venta con préstamo mantiene la pregunta', () => {
  const source = readFileSync(new URL('../src/modules/deliveries/components/SaleConfirmModal.tsx', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const local = { exports: {} }
  const require = createRequire(import.meta.url)
  const core = {
    Button: ({ children, ...props }) => createElement('button', props, children),
    Modal: ({ title, children, footer }) => createElement('section', null, title, children, footer),
    Select: () => null, formatMoney: (n) => `$${n}`,
  }
  new Function('require', 'module', 'exports', compiled)((name) => name === '../../core' ? core : require(name), local, local.exports)
  const props = { lines: [], total: 0, loanSummary: ['Presta 1 Dispenser (sin cargo)', 'Retira 1 Dispenser'],
    cobro: null, metodo: 'Cash', sending: false, error: null, onBack() {}, onConfirm() {}, onCobro() {}, onMetodo() {} }
  const html = renderToStaticMarkup(createElement(local.exports.SaleConfirmModal, props))
  assert.ok(html.includes('Confirmar visita'))
  assert.ok(html.includes('Presta 1 Dispenser (sin cargo)'))
  assert.ok(html.includes('Retira 1 Dispenser'))
  assert.ok(!html.includes('¿Cobraste'))
  assert.ok(!html.includes('disabled'))
  const sale = renderToStaticMarkup(createElement(local.exports.SaleConfirmModal, { ...props,
    lines: [{ productId: 'd', productDetail: 'Dispenser', quantity: 1, subtotal: 5000 }], total: 5000 }))
  assert.ok(sale.includes('¿Cobraste esta venta?'))
  assert.ok(sale.includes('disabled'))
  assert.ok(sale.includes('Presta 1 Dispenser (sin cargo)'))
})
