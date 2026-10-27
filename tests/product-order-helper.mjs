import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/core/utils/productOrder.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} })
const module = { exports: {} }
new Function('module', 'exports', outputText)(module, module.exports)
export const { isDispenser, sortProducts } = module.exports
