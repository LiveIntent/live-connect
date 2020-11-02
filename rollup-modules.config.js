// rollup-modules.config.js
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import strip from '@rollup/plugin-strip'
import babel from 'rollup-plugin-babel'
import analyze from 'rollup-plugin-analyzer'

const OUTPUT_DIR = './'
const plugins = [
  resolve(),
  commonjs(),
  babel(),
  strip(),
  analyze()
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
  }]
