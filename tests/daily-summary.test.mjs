import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

function load(path, imports = {}) {
  const source = readFileSync(new URL(`../src/modules/${path}`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } })
  const module = { exports: {} }
  const require = (name) => {
    assert.ok(name in imports, `Importación inesperada: ${name}`)
    return imports[name]
  }
  new Function('require', 'module', 'exports', outputText)(require, module, module.exports)
  return module.exports
}

const utils = load('sessions/utils/dailySummary.ts')
const jsx = (type, props) => ({ type, props })
const runtime = { jsx, jsxs: jsx, Fragment: 'fragment' }
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(nodes)
  return [tree, ...nodes(tree.props?.children)]
}

test('fecha usa partes locales incluso después de las 21; etiqueta no interpreta UTC', () => {
  const localNight = new Date(2026, 9, 8, 23, 30)
  assert.equal(utils.summaryToday(localNight), '2026-10-08')
  assert.equal(utils.summaryToday(new Date(2026, 0, 2)), '2026-01-02')
  assert.equal(utils.summaryDateLabel('2026-10-08'), '08/10/2026')
})

test('abierta y pendiente son neutras; cerrada distingue cero, faltante y sobrante', () => {
  for (const value of [-5, 0, 5]) {
    assert.deepEqual(utils.summaryDifference(value, false), { highlight: false, label: '' })
  }
  for (const closed of [false, true]) {
    assert.deepEqual(utils.summaryDifference(null, closed), { highlight: false, label: 'Pendiente' })
  }
  assert.deepEqual(utils.summaryDifference(0, true), { highlight: false, label: '' })
  assert.deepEqual(utils.summaryDifference(2, true), { highlight: true, label: 'Faltante' })
  assert.deepEqual(utils.summaryDifference(-2, true), { highlight: true, label: 'Sobrante' })
})

test('servicio de solo lectura y consulta propia por vehículo y fecha con refresco', async () => {
  const calls = []
  const result = { sessions: [], dayTotals: {} }
  const { dailySummaryService } = load('sessions/services/dailySummaryService.ts', {
    '../../core': { api: { get: async (path) => { calls.push(path); return result } } },
  })
  const { dailySummaryQuery } = load('sessions/hooks/dailySummaryQuery.ts', {
    '../services/dailySummaryService': { dailySummaryService },
  })
  assert.equal(dailySummaryQuery('', '2026-10-08').enabled, false)
  assert.equal(dailySummaryQuery('truck', '').enabled, false)
  const query = dailySummaryQuery('truck', '2026-10-08')
  assert.equal(query.enabled, true)
  assert.deepEqual(query.queryKey, ['sessions', 'daily-summary', 'truck', '2026-10-08'])
  assert.equal(query.refetchInterval, 30_000)
  assert.equal(query.refetchOnWindowFocus, true)
  assert.equal(query.refetchOnReconnect, true)
  assert.equal(await query.queryFn(), result)
  assert.deepEqual(calls, ['/api/sessions/daily-summary?vehicleId=truck&date=2026-10-08'])
})

test('diferencia conserva el número y texto accesible; el cero nunca usa rojo', () => {
  const { SummaryDifference } = load('sessions/components/SummaryDifference.tsx', {
    'react/jsx-runtime': runtime,
    '../../core': { formatMoney: (n) => `$ ${n}` },
    '../utils/dailySummary': utils,
  })
  for (const [value, label] of [[2, 'Faltante'], [-2, 'Sobrante']]) {
    const tree = SummaryDifference({ value, isClosed: true })
    assert.ok(tree.props.className.includes('bg-danger-soft'))
    assert.ok(JSON.stringify(tree).includes(label))
    assert.equal(tree.props.children.props.children[0], value)
  }
  for (const isClosed of [true, false]) {
    const tree = SummaryDifference({ value: 0, isClosed })
    assert.ok(!tree.props.className.includes('danger'))
    assert.equal(tree.props.children.props.children[0], 0)
  }
  const open = SummaryDifference({ value: 4, isClosed: false, money: true })
  assert.ok(!open.props.className.includes('danger'))
  assert.equal(open.props.children.props.children[0], '$ 4')
  assert.equal(SummaryDifference({ value: null, isClosed: false }).props.children, 'Pendiente')
})

const tables = load('sessions/components/DailySummaryTables.tsx', {
  'react/jsx-runtime': runtime,
  '../../core': { DataTable: 'table', formatMoney: (n) => `$ ${n}` },
  './SummaryDifference': { SummaryDifference: 'difference' },
})
const stock = { fullLoaded: 15, fullSold: 6, fullReturned: 0, fullDifference: 9,
  emptyCollected: 5, emptyReturned: 0, emptyDifference: 5 }

test('tabla agrupa llenos y vacíos, renombra ambas diferencias y usa totales celestes', () => {
  for (const isClosed of [false, true]) {
    const tree = tables.DailySummaryStockTable({ products: [{ productId: 'p', productDetail: 'Bidón', stock }],
      totals: stock, isClosed, label: 'Productos' })
    const all = nodes(tree)
    assert.equal(all.filter((node) => node.type === 'th' && node.props.scope === 'colgroup').length, 2)
    const title = isClosed ? 'Diferencia' : 'A bordo'
    assert.equal(all.filter((node) => node.type === 'th' && node.props.children === title).length, 2)
    assert.ok(all.find((node) => node.type === 'tfoot').props.children.props.className.includes('bg-accent-soft'))
    assert.ok(tree.props.className.includes('min-w-'))
  }
  const pending = tables.DailySummaryMoneyTable({ money: { cashExpected: 100, cashDeclared: null,
    cashDifference: null, transfer: 20, card: 10 }, isClosed: false, label: 'Dinero' })
  assert.ok(JSON.stringify(pending).includes('Pendiente · Todavía no se rindió'))
})

function viewHarness({ vehicleId = '', date = '2026-10-08', data, error = null, loading = false } = {}) {
  const queries = []
  let state = 0
  let retries = 0
  const listAll = () => Promise.resolve([{ id: 'truck', name: 'Camión 1', licensePlate: 'AA123BB' }])
  const { DailySummaryView } = load('sessions/views/DailySummaryView.tsx', {
    'react/jsx-runtime': runtime,
    react: { useState: () => [state++ === 0 ? vehicleId : date, () => {}] },
    '@tanstack/react-query': { useQuery: (options) => {
      queries.push(options)
      return queries.length === 1 ? { data: [{ id: 'truck', name: 'Camión 1', licensePlate: 'AA123BB' }] }
        : { data, error, isError: Boolean(error), isLoading: loading, refetch: () => { retries++ } }
    } },
    '../../core': { Button: 'button', ErrorMessage: 'error', Field: 'field', Page: 'page', PageHeader: 'header', Select: 'select' },
    '../../vehicles': { vehicleService: { listAll } },
    '../hooks/dailySummaryQuery': load('sessions/hooks/dailySummaryQuery.ts', {
      '../services/dailySummaryService': { dailySummaryService: { get() { throw new Error('No llamar API') } } },
    }),
    '../components/SessionDailySummaryCard': { SessionDailySummaryCard: 'session' },
    '../components/DailySummaryTables': { DailySummaryMoneyTable: 'money', DailySummaryStockTable: 'stock' },
    '../utils/dailySummary': utils,
  })
  return { tree: DailySummaryView(), queries, listAll, retries: () => retries }
}

test('sin vehículo no consulta resumen y caché vehicles/all conserva listAll', () => {
  const h = viewHarness()
  assert.deepEqual(h.queries[0].queryKey, ['vehicles', 'all'])
  assert.equal(h.queries[0].queryFn, h.listAll)
  assert.equal(h.queries[1].enabled, false)
  assert.ok(JSON.stringify(h.tree).includes('Elegí un vehículo para ver el resumen del día'))
})

test('vista maneja carga, fecha vacía, día sin salidas y reintento con datos anteriores', () => {
  assert.ok(JSON.stringify(viewHarness({ vehicleId: 'truck', loading: true }).tree).includes('Cargando resumen'))
  assert.ok(JSON.stringify(viewHarness({ vehicleId: 'truck', date: '' }).tree).includes('Elegí una fecha'))
  const empty = viewHarness({ vehicleId: 'truck', data: { sessions: [] } })
  assert.ok(JSON.stringify(empty.tree).includes('08/10/2026'))
  const failed = viewHarness({ vehicleId: 'truck', error: new Error('Red'), data: { sessions: [{ sessionId: 'one' }] } })
  assert.ok(JSON.stringify(failed.tree).includes('últimos datos recibidos'))
  nodes(failed.tree).find((node) => node.type === 'button').props.onClick()
  assert.equal(failed.retries(), 1)
  assert.equal(nodes(failed.tree).filter((node) => node.type === 'session').length, 1)
})

test('total solo aparece con varias salidas y conserva el agregado del backend como provisional', () => {
  const one = viewHarness({ vehicleId: 'truck', data: { sessions: [{ sessionId: 'one' }] } })
  assert.equal(nodes(one.tree).filter((node) => node.type === 'section').length, 0)
  const totals = { isClosed: false, pendingSettlements: 1, money: {}, products: [], totals: stock }
  const two = viewHarness({ vehicleId: 'truck', data: { sessions: [{ sessionId: 'one' }, { sessionId: 'two' }], dayTotals: totals } })
  assert.equal(nodes(two.tree).filter((node) => node.type === 'session').length, 2)
  const table = nodes(two.tree).find((node) => node.type === 'stock')
  assert.equal(table.props.totals, totals.totals)
  assert.equal(table.props.isClosed, false)
  assert.equal(table.props.provisional, true)
  assert.ok(JSON.stringify(two.tree).includes('Total provisional'))
})

test('encabezado usa Argentina en todas las horas y enlaza a la salida', () => {
  const calls = []
  const { SessionDailySummaryCard } = load('sessions/components/SessionDailySummaryCard.tsx', {
    'react/jsx-runtime': runtime,
    'react-router-dom': { Link: 'link' },
    '../../core': { Badge: 'badge', BUSINESS_TIME_ZONE: 'America/Argentina/Buenos_Aires',
      formatDateTime: (date, zone) => { calls.push([date, zone]); return date } },
    './DailySummaryTables': tables,
  })
  const session = { sessionId: 'one', driverName: 'Juan', zoneName: 'Centro', vehicleName: 'Camión',
    vehicleLicensePlate: 'AA123BB', openedAt: '2026-10-08T11:00:00Z', closedAt: '2026-10-08T20:00:00Z',
    receivedAt: '2026-10-08T21:00:00Z', isClosed: true, notes: 'Contado', money: {}, products: [], totals: stock }
  const tree = SessionDailySummaryCard({ session })
  assert.ok(calls.every(([, zone]) => zone === 'America/Argentina/Buenos_Aires'))
  assert.ok(calls.some(([date]) => date === session.closedAt))
  assert.ok(calls.some(([date]) => date === session.receivedAt))
  assert.equal(nodes(tree).find((node) => node.type === 'link').props.to, '/panel/salidas/one')
  assert.ok(JSON.stringify(tree).includes('Contado'))
  const open = SessionDailySummaryCard({ session: { ...session, isClosed: false, closedAt: null, receivedAt: null } })
  assert.equal(nodes(open).find((node) => node.type === 'badge').props.children, 'En la calle')
})
