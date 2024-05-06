import replace from '@rollup/plugin-replace'
import strip from '@rollup/plugin-strip'
import ts from '@rollup/plugin-typescript'
import cleaner from 'rollup-plugin-cleaner'
import terser from '@rollup/plugin-terser'
import fs from 'fs'
import path from 'path'
import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import commonJs from '@rollup/plugin-commonjs'
import del from "rollup-plugin-delete";

const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), { encoding: 'utf-8' }))

const OUTPUT_DIR = './test-resources'

const input = './test/it/helpers/preambled.ts'
const tsOutput = `${OUTPUT_DIR}/bundle.ts.js`
const babelOutput = `${OUTPUT_DIR}/bundle.babel.js`
const output = `${OUTPUT_DIR}/bundle.iife.js`

export default [
  {
    input: input,
    output: {
      file: tsOutput,
      format: 'esm',
      sourcemap: false
    },
    plugins: [
      cleaner({ targets: [OUTPUT_DIR] }),
      replace({
        preventAssignment: true,
        LC_VERSION: JSON.stringify(`${packageJson.versionPrefix}${packageJson.version}`)
      }),
      commonJs({ sourceMap: false }),
      resolve(),
      ts(),
    ]
  },
  // transpile with babel
  {
    input: tsOutput,
    output: {
      file: babelOutput,
      format: 'esm',
      sourcemap: false
    },
    plugins: [
      babel({ babelHelpers: 'runtime', configFile: './rollup/babel-test-resources.json' }),
      del({ targets: tsOutput, hook: 'buildEnd' })
    ],
    external: [/core-js\/modules/] // will insert `import 'core-js/modules/...'`, we'll resolve this later
  },
  // minify and bundle
  {
    input: babelOutput,
    output: {
      file: output,
      format: 'iife',
      sourcemap: false
    },
    plugins: [
      commonJs({ sourceMap: false }),
      resolve(),
      strip(),
      terser(),
      del({ targets: babelOutput, hook: 'buildEnd' })
    ]
  },
]
