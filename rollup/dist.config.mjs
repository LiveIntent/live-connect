import config from 'live-connect-common/rollup.common'
import cleaner from 'rollup-plugin-cleaner'
import ts from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import strip from '@rollup/plugin-strip'
import babel from '@rollup/plugin-babel'
import mjsEntry from 'rollup-plugin-mjs-entry'
import terser from '@rollup/plugin-terser'

const OUTPUT_DIR = './dist'

export default {
  ...config,
  external: [/@babel\/runtime/],
  plugins: [
    cleaner({ targets: [OUTPUT_DIR] }),
    ts(),
    commonjs(),
    babel({ babelHelpers: 'runtime' }),
    resolve(),
    strip(),
    mjsEntry(), // https://nodejs.org/api/packages.html#packages_dual_commonjs_es_module_packages
    terser()
  ]
}
