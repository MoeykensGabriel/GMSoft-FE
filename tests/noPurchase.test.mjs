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
  const { useNoPurchaseWrite } = load('deliveries/hooks/useNoPurchaseWrite.ts', {
    react, '@tanstack/react-query': query,
    '../../core': { ApiError, newRequestId: randomUUID },
    '../../sessions': { SESION_ACTUAL: ['session', 'current'] },
    '../services/deliveryService': { deliveryService: { register: write } },
  })
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Simulador de renders offline.
  return { render() { cursor = 0; return useNoPurchaseWrite('cliente') }, invalidated }
}

test('motivos únicos, nota obligatoria y límite de 300', () => {
  const { NO_PURCHASE_REASONS, noPurchaseLabel, validNoPurchase } = load('customers/utils/noPurchase.ts')
  assert.equal(Object.keys(NO_PURCHASE_REASONS).length, 6)
  assert.equal(noPurchaseLabel('StillHasProduct'), 'Todavía tiene producto')
  assert.equal(validNoPurchase(null, ''), false)
  assert.equal(validNoPurchase('Other', '  '), false)
  assert.equal(validNoPurchase('Other', 'Nota'), true)
  assert.equal(validNoPurchase('NotHome', ''), true)
  assert.equal(validNoPurchase('NotHome', 'x'.repeat(300)), true)
  assert.equal(validNoPurchase('NotHome', 'x'.repeat(301)), false)
})

test('doble toque y respuesta incierta conservan clave y motivo aunque se intente cambiar', async () => {
  const calls = []
  let rejectFirst
  const first = new Promise((_, reject) => { rejectFirst = reject })
  const harness = hookHarness(async (body) => {
    calls.push(structuredClone(body))
    if (calls.length === 1) return first
    return { deliveryId: 'visita', total: 0 }
  })
  let hook = harness.render()
  const pending = hook.send('NotHome', ' Nota ')
  await hook.send('NoMoney', 'Otro')
  assert.equal(calls.length, 1)
  rejectFirst(new TypeError('Respuesta perdida'))
  await pending
  hook = harness.render()
  assert.equal(hook.locked, true)
  assert.equal(hook.canCorrect, false)
  hook.correct()
  assert.equal(await hook.send('Other', 'Cambio'), true)
  assert.deepEqual(calls[0], calls[1])
  assert.equal(calls[0].noPurchaseReason, 'NotHome')
  assert.equal(calls[0].notes, 'Nota')
  assert.deepEqual(calls[0].items, [])
  assert.equal(calls[0].payment, null)
  await hook.send('NotHome', '')
  assert.equal(calls.length, 2)
  assert.deepEqual(harness.invalidated, [['session', 'current'], ['sessions'], ['customers']])
})

test('rechazo confirmado permite corregir con clave nueva; 500 conserva intento', async () => {
  for (const status of [400, 403, 404, 409, 500]) {
    const calls = []
    const harness = hookHarness(async (body) => { calls.push(structuredClone(body)); throw new ApiError(status) })
    await harness.render().send('NotHome', '')
    const hook = harness.render()
    assert.equal(hook.canCorrect, status !== 500)
    hook.correct()
    await harness.render().send('Other', 'Nota')
    assert.equal(calls[0].clientRequestId === calls[1].clientRequestId, status === 500)
    assert.equal(calls[1].noPurchaseReason, status === 500 ? 'NotHome' : 'Other')
  }
})
