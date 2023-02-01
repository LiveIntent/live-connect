import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import strip from '@rollup/plugin-strip'
import ts from "rollup-plugin-ts";
import cleaner from 'rollup-plugin-cleaner'
import mjsEntry from 'rollup-plugin-mjs-entry'
import commonjs from 'rollup-plugin-commonjs';

const OUTPUT_DIR = './dist'

export default {
  input: './src/index.ts',
  output: [
    {
      file: `${OUTPUT_DIR}/index.js`,
      format: 'cjs'
    }
  ],
  plugins: [
    cleaner({targets: [OUTPUT_DIR]}),
    ts(),
    resolve(),
    commonjs(),
    strip(),
    babel(),
    mjsEntry() // https://nodejs.org/api/packages.html#packages_dual_commonjs_es_module_packages
  ]
}
