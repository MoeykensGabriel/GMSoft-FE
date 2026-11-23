import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/driverControl/accessFormat.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const module = { exports: {} }
new Function('require', 'module', 'exports', outputText)(() => ({}), module, module.exports)
const { describeAccess, clientLabel } = module.exports

test('una entrada sin salida antes se marca como sesión perdida', () => {
  assert.deepEqual(describeAccess({ kind: 'Login', reason: null, loss: 'None' }), { label: 'Entró', tone: 'success' })
  assert.equal(describeAccess({ kind: 'Login', reason: null, loss: 'DataCleared' }).tone, 'danger')
  assert.equal(describeAccess({ kind: 'Login', reason: null, loss: 'NoExitRecorded' }).tone, 'warning')
  assert.match(describeAccess({ kind: 'Login', reason: null, loss: 'DataCleared' }).note, /borró los datos/)
})

test('cada salida dice por qué, con su color', () => {
  const of = (kind, reason) => describeAccess({ kind, reason, loss: 'None' })
  assert.deepEqual(of('Logout', 'Manual'), { label: 'Cerró sesión', tone: 'neutral' })
  assert.deepEqual(of('Logout', 'ReceptionCompleted'), { label: 'Recepción del camión', tone: 'navigation' })
  assert.deepEqual(of('Rejected', 'Expired'), { label: 'Venció el acceso', tone: 'warning' })
  assert.equal(of('Rejected', 'Deactivated').tone, 'danger')
})

test('el navegador de otra app se marca como alerta', () => {
  assert.deepEqual(clientLabel('EmbeddedBrowser'), { label: 'Dentro de otra app', tone: 'warning' })
  assert.deepEqual(clientLabel('InstalledApp'), { label: 'App instalada', tone: 'success' })
  assert.equal(clientLabel('Unknown'), null)
})
