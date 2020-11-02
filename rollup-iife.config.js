// rollup-iife.config.js
import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import { uglify } from 'rollup-plugin-uglify'
import replace from '@rollup/plugin-replace'
import packageJson from './package.json'
import cleaner from 'rollup-plugin-cleaner'
import strip from '@rollup/plugin-strip'
import analyze from 'rollup-plugin-analyzer'
import cleanup from 'rollup-plugin-cleanup'

const MODE = process.env.LiveConnectMode || 'standard'
const OUTPUT_DIR = `./dist/${MODE}`

export default {
  input: 'test/it/helpers/preambled.js',
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
    analyze(),
    strip(),
    uglify(),
    cleanup(),
    replace(
      { LC_VERSION: `${packageJson.versionPrefix}${packageJson.version}`, 'process.env.LiveConnectMode': JSON.stringify(MODE) })
  ]
}
