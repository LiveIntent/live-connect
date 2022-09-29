import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import strip from '@rollup/plugin-strip'
import typescript from '@rollup/plugin-typescript'

export default {
  input: './src/index.ts',
  output: {
    file: `./index.js`,
    format: 'es'
  },
  plugins: [
    typescript({compilerOptions: {declaration: true}}),
    resolve(),
    commonjs(),
    babel(),
    strip()
  ]
}
