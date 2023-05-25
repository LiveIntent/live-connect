import config from 'live-connect-common/rollup.common'
import cleaner from 'rollup-plugin-cleaner'
import ts from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import strip from '@rollup/plugin-strip'
import babel from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'
import mjsEntry from 'rollup-plugin-mjs-entry'
const OUTPUT_DIR = './dist'

export default {
  ...config,
  output: [
    {
      file: `${OUTPUT_DIR}/index.js`,
      format: 'cjs',
      sourcemap: false
    }
  ],
  external: [/@babel\/runtime/],
  plugins: [
    cleaner({ targets: [OUTPUT_DIR] }),
    ts({ compilerOptions: { sourceMap: false } }),
    commonjs(),
    babel({ babelHelpers: 'runtime' }),
    resolve({ preferBuiltins: true }),
    strip(),
    mjsEntry({ includeDefault: true }), // https://nodejs.org/api/packages.html#packages_dual_commonjs_es_module_packages
    terser()
  ]
}
