import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

class ApiError extends Error {
  constructor(status, detail) { super(detail ?? 'Rechazo'); this.status = status; this.detail = detail; this.title = 'Error' }
  get fieldMessages() { return [] }
}

const source = readFileSync(new URL('../src/modules/core/lib/outbox.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })

/** Un almacenamiento compartido, como el del navegador entre pestañas. */
function storage({ failWrites = false } = {}) {
  const store = new Map()
  return {
    store,
    get length() { return store.size },
    key: (i) => [...store.keys()][i] ?? null,
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => { if (failWrites) throw new Error('QuotaExceededError'); store.set(k, String(v)) },
    removeItem: (k) => store.delete(k),
  }
}

/** Una pestaña: la bandeja real con su propia memoria, sobre el almacenamiento dado. */
function tab(localStorage, post = async () => ({}), token = { value: 'token-chofer' }) {
  const globals = { localStorage, window: { addEventListener() {}, removeEventListener() {} } }
  const module = { exports: {} }
  const imports = { react: { useSyncExternalStore: () => [] },
    './api': { api: { post }, ApiError, tokenStorage: { get: () => token.value } } }
  new Function('require', 'module', 'exports', ...Object.keys(globals), outputText)(
    (name) => imports[name], module, module.exports, ...Object.values(globals))
  return module.exports
}

const item = (id, createdAt = '2026-10-16T10:00:00Z') => ({ id, userId: 'chofer', sessionId: 'salida', customerId: 'c-' + id,
  label: 'Visita ' + id, path: '/api/deliveries', body: { clientRequestId: id }, invalidate: [['customers']], status: 'pending', createdAt })
const client = () => { const keys = []; return { keys, invalidateQueries: ({ queryKey }) => { keys.push(queryKey); return Promise.resolve() } } }
const ids = (list) => list.map((i) => i.id)

test('guardar, reemplazar por clave, marcar rechazado y quitar', () => {
  const ls = storage(); const { outbox } = tab(ls)
  assert.equal(outbox.put(item('a')), true)
  outbox.put({ ...item('a'), label: 'Otra' })
  assert.deepEqual(outbox.list('chofer').map((i) => i.label), ['Otra'])
  outbox.fail('chofer', 'a', 'La salida está cerrada.')
  assert.deepEqual(outbox.list('chofer').map((i) => [i.status, i.error]), [['failed', 'La salida está cerrada.']])
  outbox.remove('chofer', 'a')
  assert.deepEqual(outbox.list('chofer'), [])
  assert.equal(ls.store.size, 0)
})

test('qué cuenta como rechazo definitivo', () => {
  const { isDefiniteRejection } = tab(storage())
  for (const status of [400, 403, 404, 409, 422]) assert.equal(isDefiniteRejection(status), true, String(status))
  for (const status of [401, 408, 429, 500, 502]) assert.equal(isDefiniteRejection(status), false, String(status))
})

test('dos pestañas no se pisan, y lo que una quita no resucita en la otra', () => {
  const ls = storage(); const a = tab(ls); const b = tab(ls)
  a.outbox.list('chofer'); b.outbox.list('chofer') // Las dos leyeron la bandeja vacía.
  a.outbox.put(item('de-a'))
  b.outbox.put(item('de-b', '2026-10-16T10:01:00Z'))
  assert.deepEqual(ids(a.outbox.list('chofer')), ['de-a', 'de-b'])
  b.outbox.remove('chofer', 'de-a'); b.outbox.remove('chofer', 'de-b')
  assert.deepEqual(a.outbox.list('chofer'), [])
})

test('si el celular no deja guardar, avisa y lo conserva en memoria', () => {
  const { outbox } = tab(storage({ failWrites: true }))
  assert.equal(outbox.put(item('a')), false)
  assert.deepEqual(ids(outbox.list('chofer')), ['a'])
  outbox.remove('chofer', 'a')
  assert.deepEqual(outbox.list('chofer'), [])
})

test('el reenvío confirma en orden, corta sin señal y marca los rechazos', async () => {
  const sent = []
  let answer = () => ({})
  const { outbox, flushOutbox } = tab(storage(), async (path, body) => { sent.push(body.clientRequestId); return answer(body.clientRequestId) })
  outbox.put(item('segunda', '2026-10-16T10:05:00Z'))
  outbox.put(item('primera', '2026-10-16T10:00:00Z'))

  answer = () => { throw new TypeError('Failed to fetch') }
  await flushOutbox('chofer', client())
  assert.deepEqual(sent, ['primera'])
  assert.equal(outbox.list('chofer').length, 2)

  sent.length = 0; answer = () => { throw new ApiError(401) }
  await flushOutbox('chofer', client())
  assert.equal(outbox.list('chofer').filter((i) => i.status === 'pending').length, 2)

  sent.length = 0
  answer = (id) => { if (id === 'segunda') throw new ApiError(409, 'No tenés una salida abierta.'); return {} }
  const c = client()
  await flushOutbox('chofer', c)
  assert.deepEqual(sent, ['primera', 'segunda'])
  assert.deepEqual(c.keys, [['customers']])
  assert.deepEqual(outbox.list('chofer').map((i) => [i.id, i.status, i.error]), [['segunda', 'failed', 'No tenés una salida abierta.']])

  sent.length = 0; answer = () => ({})
  await flushOutbox('chofer', client())
  assert.deepEqual(sent, [])
})

test('si cambia la sesión del celular en medio del reenvío, se corta', async () => {
  const token = { value: 'token-a' }
  const sent = []
  const { outbox, flushOutbox } = tab(storage(), async (path, body) => {
    sent.push(body.clientRequestId)
    token.value = 'token-b' // Entró otro chofer mientras se esperaba la respuesta.
    throw new TypeError('Failed to fetch')
  }, token)
  outbox.put(item('uno', '2026-10-16T10:00:00Z'))
  outbox.put(item('dos', '2026-10-16T10:01:00Z'))
  await flushOutbox('chofer', client())
  assert.deepEqual(sent, ['uno'])
  // Con la sesión de otro no se manda nada.
  sent.length = 0
  const otro = tab(storage(), async () => { sent.push('x') }, { value: null })
  otro.outbox.put(item('tres'))
  await otro.flushOutbox('chofer', client())
  assert.deepEqual(sent, [])
})
