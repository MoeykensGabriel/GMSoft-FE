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


const { draftDays, validateDays, workingHoursBody, normalizeFieldErrors } = load('workingHours/utils.ts')

test('sin configuración sugiere una semana sin modificar ni guardar el GET', () => {
  const response = { isConfigured: false, days: [] }
  const days = draftDays(response)
  assert.equal(days.length, 7)
  assert.equal(days[0].from, '08:00')
  assert.equal(days[4].until, '18:00')
  assert.equal(days[5].until, '13:00')
  assert.equal(days[6].isWorkingDay, false)
  assert.deepEqual(response, { isConfigured: false, days: [] })
  assert.deepEqual(validateDays(days), {})
  const body = workingHoursBody(days)
  assert.equal(body.days[0].from, '08:00:00')
  assert.equal(body.days[0].openingCutoff, null)
  assert.deepEqual(body.days[6], { dayOfWeek: 7, isWorkingDay: false, from: null, until: null, openingCutoff: null })
  assert.deepEqual(draftDays({ isConfigured: true, days: body.days }), days)
})

test('horas válidas, límites inclusivos y semana completa; no acepta medianoche ni segundos', () => {
  const original = draftDays({ isConfigured: false, days: [] })
  const errors = (patch) => validateDays(original.map((day, i) => i ? day : { ...day, ...patch }))
  for (const patch of [{ from: null }, { until: null }, { from: '24:00' }, { from: '08:00:01' },
    { from: '18:00' }, { until: '07:00' }, { openingCutoff: '07:59' }, { openingCutoff: '18:01' }, { openingCutoff: '24:00' }]) {
    assert.ok(Object.keys(errors(patch)).length, JSON.stringify(patch))
  }
  for (const openingCutoff of [null, '08:00', '16:00', '18:00']) assert.deepEqual(errors({ openingCutoff }), {})
  assert.ok(validateDays(original.slice(1)).days)
  assert.ok(validateDays([...original.slice(1), original[1]]).days)
  assert.ok(errors({ isWorkingDay: false })['days[0].from'])
  const closed = original.map((day) => ({ ...day, isWorkingDay: false, from: null, until: null, openingCutoff: null }))
  assert.deepEqual(validateDays(closed), {})
  assert.equal(workingHoursBody(closed).days.length, 7)
})

test('errores del servidor se asocian al campo sin depender de mayúsculas', () => {
  assert.deepEqual(normalizeFieldErrors({ 'Days[0].From': ['Obligatorio'], '$.days[1].openingCutoff': ['Fuera del rango'] }),
    { 'days[0].from': 'Obligatorio', 'days[1].openingcutoff': 'Fuera del rango' })
})

test('GET y PUT usan el mismo DTO y clave de caché', async () => {
  const calls = []
  const response = { isConfigured: true, days: workingHoursBody(draftDays({ isConfigured: false, days: [] })).days }
  const api = { get: async (path) => { calls.push(path); return response }, put: async (path, body) => { calls.push([path, body]); return response } }
  const { workingHoursQuery, saveWorkingHours } = load('workingHours/service.ts', { '../core': { api } })
  assert.deepEqual(workingHoursQuery.queryKey, ['working-hours'])
  assert.equal(await workingHoursQuery.queryFn(), response)
  assert.equal(await saveWorkingHours({ days: response.days }), response)
  assert.deepEqual(calls, ['/api/working-hours', ['/api/working-hours', { days: response.days }]])
})

test('historial sin marcas no muestra nada; desglose usa tipo e ID y hora argentina', () => {
  const jsx = (type, props, key) => ({ type, props, key })
  const calls = []
  const { OutsideWorkingHoursBadge, OutsideWorkingHoursEvents } = load('workingHours/OutsideWorkingHours.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '../core': { Badge: 'badge', BUSINESS_TIME_ZONE: 'America/Argentina/Buenos_Aires',
      formatDateTime: (date, zone) => { calls.push(zone); return date } },
  })
  assert.equal(OutsideWorkingHoursBadge({ marked: false }), null)
  assert.equal(OutsideWorkingHoursEvents({ events: [] }), null)
  assert.equal(OutsideWorkingHoursBadge({ marked: true }).props.tone, 'warning')
  const tree = OutsideWorkingHoursEvents({ events: ['promotion', 'promotion-close', 'initial-load', 'visit', 'settlement', 'session-close', 'restock', 'session-open'].map((operation) => ({ operation, id: 'same-id', occurredAt: '2026-10-14T01:00:00Z' })) })
  const serialized = JSON.stringify(tree)
  for (const label of ['Registro de promoción', 'Cierre de promoción', 'Carga inicial', 'Visita', 'Rendición de efectivo', 'Recepción del camión', 'Recarga', 'Apertura de salida']) assert.ok(serialized.includes(label))
  assert.ok(serialized.includes('promotion:same-id'))
  assert.ok(serialized.includes('promotion-close:same-id'))
  assert.ok(calls.every((zone) => zone === 'America/Argentina/Buenos_Aires'))
})


test('cliente HTTP conserva type, detail y errors de ProblemDetails', async () => {
  const source = readFileSync(new URL('../src/modules/core/lib/api.ts', import.meta.url), 'utf8').replace('import.meta.env.VITE_API_URL', "''")
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
  const module = { exports: {} }
  const problem = { type: 'outside-working-hours', title: 'Conflict', detail: 'No laborable', errors: { 'Days[0].From': ['Inválido'] } }
  new Function('module', 'exports', 'fetch', 'localStorage', outputText)(module, module.exports,
    async () => ({ ok: false, status: 409, text: async () => JSON.stringify(problem) }), { getItem: () => null })
  await assert.rejects(module.exports.api.post('/api/vehicles/v/load', {}), (error) => {
    assert.ok(error instanceof module.exports.ApiError)
    assert.equal(error.status, 409)
    assert.equal(error.type, problem.type)
    assert.equal(error.detail, problem.detail)
    assert.deepEqual(error.errors, problem.errors)
    return true
  })
})

function loadViewHarness(registerLoad) {
  const slots = []
  const mutations = []
  let cursor = 0
  let mutationCursor = 0
  class ApiError extends Error { constructor(status, type) { super(type); this.status = status; this.type = type } }
  const react = {
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial } },
    useState(initial) { const i = cursor++; slots[i] ??= { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, (v) => { slots[i].value = typeof v === 'function' ? v(slots[i].value) : v }] },
  }
  const jsx = (type, props) => ({ type, props })
  let nextId = 0
  const query = {
    useQueryClient: () => ({ invalidateQueries: async () => {} }),
    useQuery: ({ queryKey }) => ({ data: queryKey[0] === 'drivers' ? [] : queryKey[0] === 'products'
      ? { items: [{ id: 'p', detail: 'Bidón' }] } : queryKey[1] === 'load-status'
      ? [{ id: 'v', name: 'Camión', licensePlate: 'AA', isOnRoute: false, pendingUnits: 0 }] : [], isPending: false, isError: false, isSuccess: true }),
    useMutation(options) {
      const i = mutationCursor++
      const mutation = mutations[i] ??= { isIdle: true, isPending: false, isError: false, error: null }
      mutation.mutateAsync = async (arg) => {
        mutation.isIdle = false; mutation.isPending = true
        try { const result = await options.mutationFn(arg); mutation.error = null; mutation.isError = false; await options.onSuccess?.(result); return result }
        catch (error) { mutation.error = error; mutation.isError = true; throw error }
        finally { mutation.isPending = false }
      }
      mutation.mutate = (arg) => { void mutation.mutateAsync(arg).catch(() => {}) }
      mutation.reset = () => { mutation.error = null; mutation.isError = false; mutation.isIdle = true }
      return mutation
    },
  }
  const { VehicleLoadView } = load('vehicleLoads/views/VehicleLoadView.tsx', {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' }, '@tanstack/react-query': query,
    'react-router-dom': { Link: 'link', useNavigate: () => () => {}, useSearchParams: () => [new URLSearchParams()] },
    '../../core': { ApiError, Button: 'button', ErrorMessage: 'error', Select: 'select', WeekdaysField: 'weekdays', Page: 'page', PageHeader: 'header',
      DataTable: 'table', Modal: 'modal', QuantityInput: 'quantity', LinkButton: 'linkbutton',
      newRequestId: () => `id-${++nextId}`, currentBusinessWeekday: () => 1, formatDateTime: () => 'Ahora' },
    '../utils/loadTable': load('vehicleLoads/utils/loadTable.ts'),
    '../../products': { productService: {} }, '../../drivers': { driverService: {} },
    '../../vehicles': { vehicleService: { registerLoad } },
    '../components/VehicleAssignmentSummary': { VehicleAssignmentSummary: 'assignment' },
    '../components/LoadConfirmModal': { LoadConfirmModal: 'confirm' },
  })
  return { ApiError, render() { cursor = 0; mutationCursor = 0; return VehicleLoadView() } }
}
function findNode(tree, type) {
  if (!tree || typeof tree !== 'object') return undefined
  if (Array.isArray(tree)) return tree.map((node) => findNode(node, type)).find(Boolean)
  return tree.type === type ? tree : findNode(tree.props?.children, type)
}
const flush = () => new Promise((resolve) => setImmediate(resolve))

test('carga inicial conserva exactamente el pedido al confirmar excepción y reintentar respuesta incierta', async () => {
  const calls = []
  const harness = loadViewHarness(async (...args) => {
    calls.push(structuredClone(args))
    if (calls.length === 1) throw new harness.ApiError(409, 'outside-working-hours')
    if (calls.length === 2) throw new TypeError('Respuesta incierta')
    return { loadedAt: '2026-10-14T01:00:00Z' }
  })
  findNode(harness.render(), 'select').props.onChange({ target: { value: 'v' } })
  findNode(harness.render(), 'quantity').props.onChange(5)
  findNode(harness.render(), 'button').props.onClick()
  assert.equal(calls.length, 0)
  findNode(harness.render(), 'confirm').props.onConfirm()
  await flush()
  assert.equal(calls[0][4], false)
  findNode(harness.render(), 'confirm').props.onConfirm()
  await flush()
  assert.deepEqual(calls[1], [...calls[0].slice(0, 4), true, true])
  assert.deepEqual(calls[0][1], [{ productId: 'p', quantity: 5 }])
  const uncertain = findNode(harness.render(), 'confirm')
  assert.equal(uncertain.props.backDisabled, true)
  uncertain.props.onConfirm()
  await flush()
  assert.deepEqual(calls[2], calls[1])
  assert.equal(findNode(harness.render(), 'confirm'), undefined)
})

test('carga inicial: otro 409 conserva el manejo habitual, sin autorización de horario', async () => {
  const calls = []
  const harness = loadViewHarness(async (...args) => { calls.push(args); throw new harness.ApiError(409, 'otro-conflicto') })
  findNode(harness.render(), 'select').props.onChange({ target: { value: 'v' } })
  findNode(harness.render(), 'quantity').props.onChange(5)
  findNode(harness.render(), 'button').props.onClick()
  findNode(harness.render(), 'confirm').props.onConfirm()
  await flush()
  findNode(harness.render(), 'confirm').props.onConfirm()
  await flush()
  assert.equal(calls[0][4], false)
  assert.equal(calls[1][4], false)
  const modal = findNode(harness.render(), 'confirm')
  assert.equal(modal.props.backDisabled, false)
  modal.props.onBack()
  assert.equal(findNode(harness.render(), 'confirm'), undefined)
})
