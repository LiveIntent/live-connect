import strip from '@rollup/plugin-strip'
import ts from '@rollup/plugin-typescript'
import cleaner from 'rollup-plugin-cleaner'
import dts from 'rollup-plugin-dts'
import del from "rollup-plugin-delete";

const OUTPUT_DIR = './dist'
const DECLARATION_DIR = `${OUTPUT_DIR}/dts`

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
            ts({ compilerOptions: { declarationDir: DECLARATION_DIR } }),
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
    }
]
