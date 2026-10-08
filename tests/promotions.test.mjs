import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import ts from 'typescript'

// Pruebas offline: ejecutan los módulos reales con los límites HTTP/React sustituidos.
// No levantan servidores ni usan fetch.
function load(path, imports = {}) {
  const source = readFileSync(new URL(`../src/modules/promotions/${path}`, import.meta.url), 'utf8')
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

test('fechas locales, validación de prospectos y prioridad de pendientes', () => {
  const { pickupLabel, validProspect, sortPending } = load('utils/promotion.ts')
  assert.equal(pickupLabel('2026-10-07'), '07/10/2026')
  const prospect = { contactName: 'Ana', phone: '112233', address: 'Calle 123', businessName: null, notes: null, visitDays: [2, 5] }
  assert.equal(validProspect(prospect), true)
  for (const patch of [{ contactName: ' ' }, { phone: '' }, { address: 'x'.repeat(301) }, { notes: 'x'.repeat(1001) },
    { visitDays: [] }, { visitDays: [2, 2] }, { visitDays: [0] }, { visitDays: [1.5] }]) {
    assert.equal(validProspect({ ...prospect, ...patch }), false)
  }
  const pending = [
    { id: 'c', pickupDate: '2026-10-14', registeredAt: '2026-10-07T15:00:00Z' },
    { id: 'b', pickupDate: '2026-10-07', registeredAt: '2026-10-01T15:00:00Z' },
    { id: 'a', pickupDate: '2026-10-06', registeredAt: '2026-09-29T15:00:00Z' },
  ]
  assert.deepEqual(sortPending(pending).map(({ id }) => id), ['a', 'b', 'c'])
  assert.equal(pending[0].id, 'c', 'No muta la caché de consultas')
})

test('endpoints, filtros y cuerpos respetan el contrato sin enviar precios ni cobros', async () => {
  const calls = []
  const api = Object.fromEntries(['get', 'post', 'put'].map((method) => [method, async (path, body) => {
    calls.push({ method, path, body }); return {}
  }]))
  const { promotionService } = load('services/promotionService.ts', { '../../core': { api } })
  const prospect = { businessName: null, contactName: 'Ana', phone: '11', address: 'Calle 1', notes: null, visitDays: [1] }
  const register = { clientRequestId: randomUUID(), prospect, items: [{ productId: 'p', quantity: 3 }] }
  await promotionService.register(register)
  assert.deepEqual(calls.at(-1), { method: 'post', path: '/api/promotions', body: register })
  for (const close of [
    { clientRequestId: randomUUID(), convertToCustomer: true, customer: null, containersReturned: [] },
    { clientRequestId: randomUUID(), convertToCustomer: true, customer: { ...prospect, address: 'Otra 2' }, containersReturned: [] },
    { clientRequestId: randomUUID(), convertToCustomer: false, customer: null, containersReturned: [{ productId: 'p', quantity: 2 }] },
  ]) {
    await promotionService.close('promo', close)
    assert.deepEqual(calls.at(-1), { method: 'post', path: '/api/promotions/promo/close', body: close })
  }
  await promotionService.pending()
  assert.equal(calls.at(-1).path, '/api/promotions/pending')
  await promotionService.list({ status: 'Overdue', vehicleId: 'truck', from: '2026-10-01', to: '2026-10-31' }, 2)
  const params = new URL(calls.at(-1).path, 'http://offline.invalid').searchParams
  assert.deepEqual(Object.fromEntries(params), { page: '2', pageSize: '20', status: 'Overdue', vehicleId: 'truck', from: '2026-10-01', to: '2026-10-31' })
  await promotionService.saveSettings(10)
  assert.deepEqual(calls.at(-1), { method: 'put', path: '/api/promotions/settings', body: { pickupDays: 10 } })
})

class ApiError extends Error {
  constructor(status) { super('Rechazo confirmado'); this.status = status }
}

function hookHarness(write) {
  const slots = []
  let cursor = 0
  const invalidated = []
  const mutation = { error: null, isPending: false, isSuccess: false, data: undefined }
  const react = {
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial } },
    useState(initial) { const index = cursor++; slots[index] ??= { value: initial }; return [slots[index].value, (value) => { slots[index].value = value }] },
  }
  const query = {
    useQueryClient: () => ({ invalidateQueries: ({ queryKey }) => { invalidated.push(queryKey); return Promise.resolve() } }),
    useMutation(options) {
      assert.equal(options.retry, false)
      mutation.mutateAsync = async (body) => {
        mutation.isPending = true
        try {
          mutation.data = await options.mutationFn(body)
          mutation.error = null
          mutation.isSuccess = true
          options.onSuccess()
          return mutation.data
        } catch (error) { mutation.error = error; throw error }
        finally { mutation.isPending = false }
      }
      mutation.reset = () => { mutation.error = null; mutation.isSuccess = false }
      return mutation
    },
  }
  const { usePromotionWrite } = load('hooks/usePromotionWrite.ts', {
    react, '@tanstack/react-query': query,
    '../../core': { ApiError, newRequestId: randomUUID }, '../../sessions': { SESION_ACTUAL: ['session', 'current'] },
  })
  // eslint-disable-next-line react-hooks/rules-of-hooks -- React está sustituido por el simulador de renders de esta prueba offline.
  return { render() { cursor = 0; return usePromotionWrite(write) }, invalidated }
}

test('doble toque y respuesta incierta conservan exactamente clave y cuerpo', async () => {
  const calls = []
  let rejectFirst
  const first = new Promise((_, reject) => { rejectFirst = reject })
  const harness = hookHarness(async (body) => {
    calls.push(structuredClone(body))
    if (calls.length === 1) return first
    return { promotionId: 'promo', status: 'Pending', pickupDate: '2026-10-14' }
  })
  let hook = harness.render()
  const body = { prospect: { contactName: 'Ana' }, items: [{ productId: 'p', quantity: 3 }] }
  const sending = hook.send(body)
  await hook.send(body)
  assert.equal(calls.length, 1)
  body.items[0].quantity = 99
  rejectFirst(new TypeError('Respuesta perdida'))
  await sending
  hook = harness.render()
  assert.equal(hook.locked, true)
  assert.equal(hook.canCorrect, false)
  hook.correct()
  await hook.send(body)
  assert.deepEqual(calls[1], calls[0])
  assert.equal(calls[1].items[0].quantity, 3)
  assert.deepEqual(harness.invalidated, [['promotions'], ['session', 'current'], ['customers']])
  hook = harness.render()
  await hook.send(body)
  assert.equal(calls.length, 2)
})

test('un rechazo conserva el intento al reintentar; corregir inicia una clave nueva', async () => {
  const calls = []
  const harness = hookHarness(async (body) => { calls.push(structuredClone(body)); throw new ApiError(409) })
  let hook = harness.render()
  await hook.send({ convertToCustomer: false, customer: null, containersReturned: [{ productId: 'p', quantity: 2 }] })
  hook = harness.render()
  assert.equal(hook.canCorrect, true)
  await hook.send({ convertToCustomer: true, customer: null, containersReturned: [] })
  assert.deepEqual(calls[1], calls[0])
  hook = harness.render()
  hook.correct()
  hook = harness.render()
  assert.equal(hook.locked, false)
  await hook.send({ convertToCustomer: false, customer: null, containersReturned: [{ productId: 'p', quantity: 1 }] })
  assert.notEqual(calls[2].clientRequestId, calls[0].clientRequestId)
  assert.equal(calls[2].containersReturned[0].quantity, 1)
})
