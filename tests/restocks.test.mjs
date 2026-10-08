import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import ts from 'typescript'

// Módulos reales, con HTTP y React sustituidos. No se llama a ninguna API.
function load(path, imports = {}, globals = {}) {
  const source = readFileSync(new URL(`../src/modules/${path}`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } })
  const module = { exports: {} }
  const require = (name) => {
    assert.ok(name in imports, `Importación inesperada: ${name}`)
    return imports[name]
  }
  new Function('require', 'module', 'exports', ...Object.keys(globals), outputText)(require, module, module.exports, ...Object.values(globals))
  return module.exports
}

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
          options.onSuccess(mutation.data)
          return mutation.data
        } catch (error) { mutation.error = error; throw error }
        finally { mutation.isPending = false }
      }
      mutation.reset = () => { mutation.error = null; mutation.isSuccess = false; mutation.data = undefined }
      return mutation
    },
  }
  const { useRestockWrite } = load('vehicleLoads/hooks/useRestockWrite.ts', {
    react, '@tanstack/react-query': query,
    '../../core': { ApiError, newRequestId: randomUUID },
    '../../sessions': { sessionService: { registerRestock: write }, SESION_ACTUAL: ['session', 'current'] },
  })
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Simulador de renders offline.
  return { render() { cursor = 0; return useRestockWrite('salida') }, invalidated }
}

test('recarga usa el contrato nuevo; current 204 se transforma en null', async () => {
  const calls = []
  const api = {
    post: async (path, body) => { calls.push({ path, body }); return { id: 'recarga', occurredAt: '2026-10-08T15:30:00Z' } },
    get: async () => undefined,
  }
  const { sessionService } = load('sessions/services/sessionService.ts', { '../../core': { api } })
  const body = { clientRequestId: randomUUID(), items: [{ productId: 'p', quantity: 3 }], notes: 'En ruta' }
  const response = await sessionService.registerRestock('salida', body)
  assert.deepEqual(calls, [{ path: '/api/sessions/salida/restocks', body }])
  assert.equal(response.occurredAt, '2026-10-08T15:30:00Z')
  assert.equal(await sessionService.getCurrent(), null)
})

test('doble toque, respuesta perdida y reintento conservan clave y cuerpo', async () => {
  const calls = []
  let rejectFirst
  const first = new Promise((_, reject) => { rejectFirst = reject })
  const harness = hookHarness(async (sessionId, body) => {
    assert.equal(sessionId, 'salida')
    calls.push(structuredClone(body))
    if (calls.length === 1) return first
    return { id: 'r', occurredAt: '2026-10-08T15:30:00Z' }
  })
  let hook = harness.render()
  const body = { items: [{ productId: 'p', quantity: 3 }], notes: 'Original' }
  const sending = hook.send(body)
  await hook.send(body)
  assert.equal(calls.length, 1)
  body.items[0].quantity = 99
  body.notes = 'Cambio externo'
  rejectFirst(new TypeError('Respuesta perdida'))
  await sending
  hook = harness.render()
  assert.equal(hook.locked, true)
  assert.equal(hook.canCorrect, false)
  hook.correct()
  hook.startAnother()
  await hook.send(body)
  assert.deepEqual(calls[1], calls[0])
  assert.equal(calls[1].items[0].quantity, 3)
  assert.equal(calls[1].notes, 'Original')
  // Incluso un handler de un render anterior queda bloqueado tras el éxito.
  await hook.send(body)
  assert.equal(calls.length, 2)
  assert.deepEqual(harness.invalidated, [['sessions'], ['session', 'current'], ['vehicles']])
  hook = harness.render()
  hook.startAnother()
  await harness.render().send({ items: [{ productId: 'p', quantity: 1 }], notes: null })
  assert.notEqual(calls[2].clientRequestId, calls[0].clientRequestId)
})

test('solo 400/403/404/409 permiten corregir e iniciar otra clave', async () => {
  for (const status of [400, 403, 404, 409, 401, 408, 429, 500, 503]) {
    const calls = []
    const harness = hookHarness(async (_, body) => { calls.push(structuredClone(body)); throw new ApiError(status) })
    await harness.render().send({ items: [{ productId: 'p', quantity: 3 }], notes: null })
    let hook = harness.render()
    const canCorrect = [400, 403, 404, 409].includes(status)
    assert.equal(hook.canCorrect, canCorrect)
    await hook.send({ items: [{ productId: 'p', quantity: 8 }], notes: null })
    assert.deepEqual(calls[1], calls[0])
    hook = harness.render()
    hook.correct()
    await harness.render().send({ items: [{ productId: 'p', quantity: 1 }], notes: null })
    assert.equal(calls[2].clientRequestId === calls[0].clientRequestId, !canCorrect)
    assert.equal(calls[2].items[0].quantity, canCorrect ? 1 : 3)
  }
})

function storageHarness(storage) {
  return load('sessions/states/restockSeenStorage.ts', {}, { localStorage: storage }).restockSeenStorage
}

test('visto persiste por usuario y salida; cambiar o recibir limpia las marcas', () => {
  const data = new Map()
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) }
  let seen = storageHarness(storage)
  seen.activate('u1', 's1')
  seen.acknowledge('u1', 's1', 'r1')
  seen.acknowledge('u1', 's1', 'r1')
  seen = storageHarness(storage) // Simula recargar la página.
  assert.equal(seen.snapshot('u1', 's1'), '["r1"]')
  assert.equal(seen.snapshot('u2', 's1'), '[]')
  assert.equal(seen.snapshot('u1', 's2'), '[]')
  seen.activate('u1', 's2')
  assert.equal(seen.snapshot('u1', 's1'), '[]')
  seen.acknowledge('u1', 's2', 'r2')
  seen.clear('u1')
  assert.equal(seen.snapshot('u1', 's2'), '[]')
  assert.equal(data.size, 0)
})

test('almacenamiento bloqueado o corrupto conserva Entendido en memoria', () => {
  for (const value of ['{', '{"sessionId":"s","ids":[1]}', null]) {
    const storage = {
      getItem: () => { if (value === null) throw new Error('Bloqueado'); return value },
      setItem: () => { throw new Error('Sin espacio') }, removeItem: () => { throw new Error('Bloqueado') },
    }
    const seen = storageHarness(storage)
    let notifications = 0
    const unsubscribe = seen.subscribe(() => { notifications++ })
    assert.equal(seen.snapshot('u', 's'), '[]')
    seen.activate('u', 's')
    seen.acknowledge('u', 's', 'r')
    assert.equal(seen.snapshot('u', 's'), '["r"]')
    assert.equal(notifications, 2)
    seen.activate('u', 'otra')
    assert.equal(seen.snapshot('u', 's'), '[]')
    seen.clear('u')
    unsubscribe()
  }
})

test('el aviso usa hora argentina y una línea con todos los productos', () => {
  const { restockTime, restockProducts } = load('sessions/utils/restocks.ts', {
    '../../core': { BUSINESS_TIME_ZONE: 'America/Argentina/Buenos_Aires' },
  })
  assert.equal(restockTime('2026-10-08T15:30:00Z'), '12:30')
  assert.equal(restockTime('2026-10-09T02:10:00Z'), '23:10')
  assert.equal(restockProducts({ items: [{ quantity: 3, productDetail: 'Bidon 20 lts' }, { quantity: 2, productDetail: 'Soda 1.5 lts' }] }), '3 × Bidon 20 lts y 2 × Soda 1.5 lts')
})

test('current se refresca en foco, reconexión y cada 30 segundos para el chofer', () => {
  let options
  const { useCurrentSession } = load('sessions/hooks/useCurrentSession.ts', {
    '@tanstack/react-query': { useQuery: (value) => { options = value } },
    '../services/sessionService': { sessionService: { getCurrent() {} } },
    '../../auth': { useAuth: () => ({ user: { userId: 'u', roles: ['Driver'] } }), ROLES: { driver: 'Driver' } },
    '../states/activeDepartureStorage': {},
  })
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Límite React sustituido.
  useCurrentSession()
  assert.deepEqual(options.queryKey, ['session', 'current', 'u'])
  assert.equal(options.enabled, true)
  assert.equal(options.refetchOnWindowFocus, true)
  assert.equal(options.refetchOnReconnect, true)
  assert.equal(options.refetchInterval, 30_000)
})

const jsx = (type, props) => ({ type, props })
const jsxRuntime = { jsx, jsxs: jsx, Fragment: 'fragment' }
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(nodes)
  return [tree, ...nodes(tree.props?.children), ...nodes(tree.props?.footer)]
}

test('el modal compartido revisa sin enviar; bloquea edición incierta y usa fecha de referencia', () => {
  const { LoadConfirmModal } = load('vehicleLoads/components/LoadConfirmModal.tsx', {
    'react/jsx-runtime': jsxRuntime,
    '../../core': { BUSINESS_TIME_ZONE: 'America/Argentina/Buenos_Aires', Button: 'button', Modal: 'modal',
      ErrorMessage: 'error', DataTable: 'table', weekdayLabels: () => 'Jueves', formatDateTime: () => '8/10/26, 12:30' },
  })
  let sent = 0
  let edited = 0
  const props = { restock: true, vehicleName: 'Camión 1', licensePlate: 'AA123BB', driverNames: ['Juan'], routeDays: [4],
    lines: [{ productId: 'p', productDetail: 'Bidon', quantity: 3, totalOnBoard: 3 }], openedAt: new Date(),
    sending: false, error: null, onBack: () => { edited++ }, onConfirm: () => { sent++ } }
  let tree = LoadConfirmModal(props)
  assert.equal(sent, 0)
  assert.equal(tree.props.title, 'Confirmar recarga en ruta')
  tree.props.onClose()
  assert.equal(edited, 1)
  assert.equal(sent, 0)
  const confirm = nodes(tree).find((node) => node.type === 'button' && node.props.children === 'Confirmar recarga')
  confirm.props.onClick()
  assert.equal(sent, 1)
  tree = LoadConfirmModal({ ...props, backDisabled: true })
  tree.props.onClose()
  assert.equal(edited, 1)
  assert.equal(nodes(tree).find((node) => node.type === 'button' && node.props.children === 'Volver a editar').props.disabled, true)
  tree = LoadConfirmModal({ ...props, sending: true })
  assert.equal(tree.props.busy, true)
  assert.ok(nodes(tree).filter((node) => node.type === 'button').every((node) => node.props.disabled))
  assert.ok(JSON.stringify(tree).includes('Una recarga confirmada no se puede anular'))
  assert.ok(JSON.stringify(tree).includes('La fecha y hora mostradas son de referencia'))
})

test('aviso accesible: descartar una recarga mantiene las demás y las nuevas', () => {
  const seen = storageHarness({ getItem: () => null, setItem() {}, removeItem() {} })
  const { RestockNotice } = load('sessions/components/RestockNotice.tsx', {
    'react/jsx-runtime': jsxRuntime,
    react: { useSyncExternalStore: (_, snapshot) => snapshot() },
    '../../core': { Badge: 'badge', Button: 'button' },
    '../states/restockSeenStorage': { restockSeenStorage: seen },
    '../utils/restocks': { restockProducts: (restock) => restock.id, restockTime: () => '12:30' },
  })
  const session = { id: 's', restocks: [{ id: 'r1' }, { id: 'r2' }] }
  let tree = RestockNotice({ userId: 'u', session })
  assert.equal(tree.props.role, 'status')
  assert.equal(nodes(tree).filter((node) => node.type === 'li').length, 2)
  nodes(tree).find((node) => node.type === 'button').props.onClick()
  tree = RestockNotice({ userId: 'u', session })
  assert.equal(nodes(tree).filter((node) => node.type === 'li').length, 1)
  nodes(tree).find((node) => node.type === 'button').props.onClick()
  assert.equal(RestockNotice({ userId: 'u', session }), null)
  session.restocks.push({ id: 'r3' })
  tree = RestockNotice({ userId: 'u', session })
  assert.equal(nodes(tree).filter((node) => node.type === 'li').length, 1)
  assert.equal(nodes(RestockNotice({ userId: 'otro', session })).filter((node) => node.type === 'li').length, 3)
})
