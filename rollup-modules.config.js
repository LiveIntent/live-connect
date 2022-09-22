// rollup-modules.config.js
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import strip from '@rollup/plugin-strip'
import babel from 'rollup-plugin-babel'
import cleanup from 'rollup-plugin-cleanup'
import typescript from '@rollup/plugin-typescript'

const OUTPUT_DIR = './'
const plugins = [
  typescript(),
  resolve(),
  commonjs(),
  babel(),
  cleanup(),
  strip()
]

const filenames = ['initializer.ts', 'standard-live-connect.ts', 'minimal-live-connect.ts']
const outputs = filenames.reduce((accumulator, sourceFile) => {
  const action = [{
    input: `src/${sourceFile}`,
    output: {
      file: `${OUTPUT_DIR}esm/${sourceFile.replace(".ts", ".js")}`,
      format: 'esm'
    },
    plugins: plugins
  }, {
    input: `src/${sourceFile}`,
    output: {
      file: `${OUTPUT_DIR}cjs/${sourceFile.replace(".ts", ".js")}`,
      format: 'cjs'
    },
    plugins: plugins
  }]
  return (accumulator || []).concat(action)
}, [])

export default outputs
