// rollup-modules.config.js
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import strip from '@rollup/plugin-strip'
import babel from 'rollup-plugin-babel'
import cleanup from 'rollup-plugin-cleanup'

const OUTPUT_DIR = './'
const plugins = [
  resolve(),
  commonjs(),
  babel(),
  cleanup(),
  strip()
]
export default [
  {
    input: 'src/live-connect.js',
    output: {
      file: `${OUTPUT_DIR}esm/live-connect.js`,
      format: 'esm'
    },
    plugins: plugins
  }, {
    input: 'src/live-connect.js',
    output: {
      file: `${OUTPUT_DIR}cjs/live-connect.js`,
      format: 'cjs'
    },
    plugins: plugins
  }, {
    input: 'src/minimal-live-connect.js',
    output: {
      file: `${OUTPUT_DIR}esm/minimal-live-connect.js`,
      format: 'esm'
    },
    plugins: plugins
  }, {
    input: 'src/minimal-live-connect.js',
    output: {
      file: `${OUTPUT_DIR}cjs/minimal-live-connect.js`,
      format: 'cjs'
    },
    plugins: plugins
  }]
