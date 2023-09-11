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

const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), { encoding: 'utf-8' }))

const OUTPUT_DIR = './test-resources'

export default {
  input: './test/it/helpers/preambled.ts',
  output: {
    file: `${OUTPUT_DIR}/bundle.iife.js`,
    format: 'iife'
  },
  plugins: [
    cleaner({ targets: [OUTPUT_DIR] }),
    commonJs({}),
    replace({
      preventAssignment: true,
      LC_VERSION: JSON.stringify(`${packageJson.versionPrefix}${packageJson.version}`)
    }),
    ts({
        compilerOptions: {
            outDir: OUTPUT_DIR,
            declaration: false,
            sourceMap: false
        }
    }),
    resolve({ preferBuiltins: true }),
    babel({ babelHelpers: 'runtime' }),
    strip(),
    terser()
  ]
}
