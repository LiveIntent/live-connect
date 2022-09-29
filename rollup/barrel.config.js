import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import strip from '@rollup/plugin-strip'
import ts from "rollup-plugin-ts";

export default {
  input: './src/index.ts',
  output: {
    file: `./lib/index.js`,
    format: 'es'
  },
  plugins: [
    ts({transpileOnly: true, tsconfig: resolvedConfig => ({...resolvedConfig, declaration: true})}),
    resolve(),
    commonjs(),
    babel(),
    strip()
  ]
}
