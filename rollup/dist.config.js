import strip from '@rollup/plugin-strip'
import ts from '@rollup/plugin-typescript'
import cleaner from 'rollup-plugin-cleaner'
import dts from 'rollup-plugin-dts'
import del from "rollup-plugin-delete";
import commonJs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'

const OUTPUT_DIR = './dist'
const DECLARATION_DIR = `${OUTPUT_DIR}/dts`

const prebid = {
    input: "./src/index.ts",
    tsOutput: `${OUTPUT_DIR}/prebid.ts.mjs`,
    babelOutput: `${OUTPUT_DIR}/prebid.babel.mjs`,
    output: `${OUTPUT_DIR}/prebid.mjs`
}

export default [
    {
        input: ['./src/index.ts', './src/internal.ts'],
        output: [
            {
                dir: OUTPUT_DIR,
                entryFileNames: '[name].cjs',
                chunkFileNames: '[name]-[hash].cjs',
                format: 'cjs',
                sourcemap: false
            },
            {
                dir: OUTPUT_DIR,
                entryFileNames: '[name].mjs',
                chunkFileNames: '[name]-[hash].mjs',
                format: 'es',
                sourcemap: false
            }
        ],
        plugins: [
            cleaner({ targets: [OUTPUT_DIR] }),
            ts({ compilerOptions: { declaration: true, declarationDir: DECLARATION_DIR } }),
            strip()
        ],
        external: [
            'live-connect-common',
            'tiny-hashes'
        ]
    },
    {
        input: {
            index: `${DECLARATION_DIR}/src/index.d.ts`,
            internal: `${DECLARATION_DIR}/src/internal.d.ts`
        },
        output: [{ dir: OUTPUT_DIR, format: 'es' }],
        plugins: [dts(), del({ targets: DECLARATION_DIR, hook: 'buildEnd' })],
    },
    //
    // prebid build
    //
    {
        input: prebid.input,
        output: {
          file: prebid.tsOutput,
          format: 'esm',
          sourcemap: false
        },
        plugins: [
          commonJs({ sourceMap: false }),
          resolve(),
          ts(),
        ]
      },
      // transpile with babel
      {
        input: prebid.tsOutput,
        output: {
          file: prebid.babelOutput,
          format: 'esm',
          sourcemap: false
        },
        plugins: [
          babel({ babelHelpers: 'bundled' }),
          del({ targets: prebid.tsOutput, hook: 'buildEnd' })
        ],
        external: [/core-js\/modules/] // will insert `import 'core-js/modules/...'`, we'll resolve this later
      },
      // minify and bundle
      {
        input: prebid.babelOutput,
        output: {
          file: prebid.output,
          format: 'esm',
          sourcemap: false
        },
        plugins: [
          commonJs({ sourceMap: false }),
          resolve(),
          strip(),
          del({ targets: prebid.babelOutput, hook: 'buildEnd' })
        ]
      },
]
