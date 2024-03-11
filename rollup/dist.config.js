import strip from '@rollup/plugin-strip'
import ts from '@rollup/plugin-typescript'
import cleaner from 'rollup-plugin-cleaner'
import dts from 'rollup-plugin-dts'
import del from "rollup-plugin-delete";
import mjsEntry from 'rollup-plugin-mjs-entry'

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
            }
        ],
        plugins: [
            cleaner({ targets: [OUTPUT_DIR] }),
            ts({ compilerOptions: { declarationDir: DECLARATION_DIR } }),
            strip(),
            mjsEntry() // https://nodejs.org/api/packages.html#packages_dual_commonjs_es_module_packages
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
