import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/app/admin/menu.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} })
const module = { exports: {} }
new Function('module', 'exports', outputText)(module, module.exports)
const { groups, menuFor } = module.exports

const paths = (menu) => menu.flatMap((group) => group.items.map((item) => item.to))
const extra = ['/panel/control-choferes', '/panel/control-vehiculos', '/panel/estadisticas']

test('el plan base no muestra las pantallas de Control y estadísticas', () => {
  const menu = paths(menuFor([]))
  for (const path of extra) assert.ok(!menu.includes(path), path)
  assert.equal(menu.length, paths(groups).length - extra.length)
})

test('Ventas y la Configuración quedan siempre en el plan base', () => {
  const menu = paths(menuFor([]))
  assert.ok(menu.includes('/panel/ventas'))
  assert.ok(menu.includes('/panel/configuracion'))
})

test('con el módulo control el menú está completo y en el mismo orden', () => {
  assert.deepEqual(paths(menuFor(['control'])), paths(groups))
})
