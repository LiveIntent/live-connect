// rollup-iife.config.js
import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import { uglify } from 'rollup-plugin-uglify'
import replace from '@rollup/plugin-replace'
import packageJson from './package.json'
import cleaner from 'rollup-plugin-cleaner'
import strip from '@rollup/plugin-strip'

const OUTPUT_DIR = './dist/'

export default {
  input: 'src/preambled.js',
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
    resolve(),
    commonjs(),
    babel(),
    strip(),
    uglify(),
    replace({ LC_VERSION: `${packageJson.versionPrefix}${packageJson.version}` })
  ]
}
