import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createRequire } from 'node:module'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
function load(path, imports = {}) {
  const source = readFileSync(new URL(`../src/modules/${path}`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', outputText)((name) => {
    if (name === 'react/jsx-runtime') return require(name)
    assert.ok(name in imports, `Importación inesperada: ${name}`)
    return imports[name]
  }, module, module.exports)
  return module.exports
}
const detail = load('customers/utils/accountStatement.ts', {
  './noPurchase': load('customers/utils/noPurchase.ts'),
  './removal': load('customers/utils/removal.ts'),
})
const base = { date: '2026-10-14T01:00:00Z', kind: 'Sale', referenceId: 'sale', lines: [],
  containersDelivered: [], containersReturned: [], containerChanges: [], charge: 0,
  payments: [], paid: 0, noPurchaseReason: null, notes: null, balanceAfter: 12000 }
const product = (id, quantity) => ({ productId: id, productDetail: `Bidón ${id} lts`, quantity })

test('cambio de envase queda junto a la devolución y usa la nota histórica', () => {
  const result = detail.statementDetail({ ...base,
    lines: [product('12', 1)], containersReturned: [product('20', 1)],
    containerExchanges: [{ ...product('20', 1), notes: 'Cambio por Bidón 12 lts' }],
  })
  assert.deepEqual(result, { title: '1 × Bidón 12 lts', details: [
    'dejó 0 · devolvió 1', 'Cambio de envase: devolvió 1 vacío de Bidón 20 lts y se llevó Bidón 12 lts',
  ] })
})

test('detalle de venta agrupa productos y separa envases por producto', () => {
  assert.deepEqual(detail.statementDetail({ ...base,
    lines: [product('20', 4), product('12', 2)],
    containersDelivered: [product('20', 4), product('12', 2)],
    containersReturned: [product('20', 3)],
  }), { title: '4 × Bidón 20 lts + 2 × Bidón 12 lts', details: [
    'Bidón 20 lts: dejó 4 · devolvió 3', 'Bidón 12 lts: dejó 2 · devolvió 0',
  ] })
  assert.deepEqual(detail.statementDetail({ ...base, kind: 'ContainerOnly', containersReturned: [product('20', 2)] }),
    { title: 'Movimiento de envases', details: ['dejó 0 · devolvió 2'] })
})

test('motivos, promociones, cobros y cambios administrativos conservan su significado', () => {
  assert.equal(detail.statementDetail({ ...base, kind: 'NoPurchase', noPurchaseReason: 'NotHome' }).title, 'No compró · No estaba')
  assert.equal(detail.statementDetail({ ...base, kind: 'Payment' }).title, 'Cobro de deuda')
  assert.equal(detail.statementDetail({ ...base, kind: 'Promotion', lines: [product('20', 1)] }).title, 'Promoción · 1 × Bidón 20 lts')
  for (const [kind, title, quantity, reason, expected] of [
    ['Loan', 'Préstamo', 1, null, 'Bidón 20 lts: +1'],
    ['LoanReturn', 'Retiro de préstamo', -1, null, 'Bidón 20 lts: -1'],
    ['ContainerAdjustment', 'Ajuste de envases', 2, 'Recuento', 'Bidón 20 lts: +2 · Recuento'],
    ['ContainerLoss', 'Pérdida de envases', -1, 'Rotura', 'Bidón 20 lts: -1 · Rotura'],
    ['ContainerAdjustment', 'Ajuste de envases', -2, null, 'Bidón 20 lts: -2'],
  ]) assert.deepEqual(detail.statementDetail({ ...base, kind,
    containerChanges: [{ ...product('20', quantity), reason }],
  }), { title, details: [expected] })
})

const core = { ...load('core/utils/format.ts'), ...load('core/components/Badge.tsx'), ...load('core/components/DataTable.tsx', { react: require('react') }) }
const { CustomerAccountMovements } = load('customers/components/CustomerAccountMovements.tsx', {
  '../../core': core, '../utils/accountStatement': detail,
})
const render = (account) => renderToStaticMarkup(CustomerAccountMovements({ account }))

test('cuenta limitada conserva saldo del servidor, pagos separados y fecha argentina en ambas vistas', () => {
  const html = render({ balance: 12000, statementTotalCount: 9, statement: [{ ...base,
    charge: 10000, payments: [{ amount: 2000, method: 'Cash' }, { amount: 1000, method: 'Transfer' }, { amount: 500, method: 'Card' }],
    notes: 'Nota de la visita',
  }] })
  assert.ok(html.includes(`Debe ${core.formatMoney(12000)}`))
  assert.ok(html.includes('Mostrando 1 de 9 movimientos'))
  for (const text of ['Efectivo', 'Transferencia', 'Tarjeta', 'Nota de la visita', core.formatDateTime(base.date, core.BUSINESS_TIME_ZONE)]) {
    assert.equal(html.split(text).length - 1, 2)
  }
  assert.ok(html.includes('hidden md:block'))
  assert.ok(html.includes('md:hidden'))
  assert.ok(html.includes('<table'))
  assert.ok(html.includes('<ul'))
})

test('cuenta vacía y saldo a favor', () => {
  const empty = render({ balance: 0, statementTotalCount: 0, statement: [] })
  assert.ok(empty.includes('Al día'))
  assert.ok(empty.includes('Todavía no hay movimientos.'))
  assert.ok(!empty.includes('Mostrando'))
  assert.ok(render({ balance: -500, statementTotalCount: 1, statement: [{ ...base, balanceAfter: -500 }] })
    .includes(`Saldo a favor ${core.formatMoney(500)}`))
})

test('baja del chofer: motivo, nota en Otro y envases', () => {
  const { validRemoval, removalLabel } = load('customers/utils/removal.ts')
  assert.equal(validRemoval(null, '', false, false), false)
  assert.equal(validRemoval('Moved', '', false, false), true)
  assert.equal(validRemoval('Other', '  ', false, false), false)
  assert.equal(validRemoval('Other', 'Se fue a Salta', false, false), true)
  assert.equal(validRemoval('Moved', '', true, false), false, 'con envases hay que marcar que no los devolvió')
  assert.equal(validRemoval('Moved', '', true, true), true)
  assert.equal(removalLabel('ClosedBusiness'), 'Cerró el negocio')
  assert.equal(detail.statementDetail({ ...base, kind: 'RemovalRequested', removalReason: 'Moved' }).title, 'Baja pedida por el chofer · Se mudó')
})
