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

const filenames = ['initializer.js', 'standard-live-connect.js', 'minimal-live-connect.js']
const outputs = filenames.reduce((accumulator, sourceFile) => {
  const action = [{
    input: `src/${sourceFile}`,
    output: {
      file: `${OUTPUT_DIR}esm/${sourceFile}`,
      format: 'esm'
    },
    plugins: plugins
  }, {
    input: `src/${sourceFile}`,
    output: {
      file: `${OUTPUT_DIR}cjs/${sourceFile}`,
      format: 'cjs'
    },
    plugins: plugins
  }]
  return (accumulator || []).concat(action)
}, [])

export default outputs
