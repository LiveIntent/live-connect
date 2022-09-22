// rollup-iife.config.js
import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import replace from '@rollup/plugin-replace'
import packageJson from './package.json'
import cleaner from 'rollup-plugin-cleaner'
import strip from '@rollup/plugin-strip'
import typescript from '@rollup/plugin-typescript'

const OUTPUT_DIR = './dist/'

export default {
  input: 'test/it/helpers/preambled.ts',
  output: {
    file: `${OUTPUT_DIR}/bundle.iife.js`,
    format: 'iife'
  },
  plugins: [
    cleaner({
      targets: [
        OUTPUT_DIR
      ]
    }),
    typescript(),
    resolve(),
    commonjs(),
    babel(),
    strip(),
    terser(),
    replace({ LC_VERSION: `${packageJson.versionPrefix}${packageJson.version}` })
  ]
}
