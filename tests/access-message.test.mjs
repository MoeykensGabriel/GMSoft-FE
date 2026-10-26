import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/drivers/utils/accessMessage.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} })
const module = { exports: {} }
new Function('module', 'exports', outputText)(module, module.exports)
const { accessMessage } = module.exports

test('el mensaje incluye solo el usuario cuando no se conoce la contraseña', () => {
  assert.equal(accessMessage('chofer.nuevo-1_2'), 'Usuario: chofer.nuevo-1_2')
  assert.equal(accessMessage('chofer', null), 'Usuario: chofer')
  assert.equal(accessMessage('chofer', ''), 'Usuario: chofer')
})

test('el mensaje conserva la contraseña conocida sin agregar texto ni emojis', () => {
  assert.equal(accessMessage('chofer', 'Clave.123!'), 'Usuario: chofer\nContraseña: Clave.123!')
})
