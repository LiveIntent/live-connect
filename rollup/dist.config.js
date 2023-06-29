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
  input: './src/index.ts',
  output: [
    {
      file: `${OUTPUT_DIR}/index.cjs`,
      format: 'cjs',
      sourcemap: true
    }
  ],
  external: [/@babel\/runtime/],
  plugins: [
    cleaner({ targets: [OUTPUT_DIR] }),
    ts(),
    resolve({ preferBuiltins: true }),
    commonjs({ defaultIsModuleExports: true }),
    strip(),
    babel({ babelHelpers: 'runtime' }),
    terser(),
    mjsEntry() // https://nodejs.org/api/packages.html#packages_dual_commonjs_es_module_packages
  ]
}
