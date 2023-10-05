import strip from '@rollup/plugin-strip'
import ts from '@rollup/plugin-typescript'
import cleaner from 'rollup-plugin-cleaner'
import mjsEntry from 'rollup-plugin-mjs-entry'
import dts from 'rollup-plugin-dts'
import del from "rollup-plugin-delete";
import terser from '@rollup/plugin-terser'

const OUTPUT_DIR = './dist'

export default [
    {
        input: ['./src/index.ts', './src/internal.ts'],
        output: [
            {
                dir: `${OUTPUT_DIR}`,
                format: 'cjs',
                sourcemap: true
            }
        ],
        plugins: [
            cleaner({ targets: [OUTPUT_DIR] }),
            ts({
                compilerOptions: {
                    outDir: OUTPUT_DIR,
                    declarationDir: `${OUTPUT_DIR}/dts`,
                }
            }),
            strip(),
            terser(),
            mjsEntry() // https://nodejs.org/api/packages.html#packages_dual_commonjs_es_module_packages
        ],
        external: [
            'live-connect-common',
            'tiny-hashes/md5',
            'tiny-hashes/sha1',
            'tiny-hashes/sha256',
        ]
    },
    {
        input: {
            index: `${OUTPUT_DIR}/dts/src/index.d.ts`,
            internal: `${OUTPUT_DIR}/dts/src/internal.d.ts`
        },
        output: [{ dir: OUTPUT_DIR, format: 'es' }],
        plugins: [dts(), del({ targets: `${OUTPUT_DIR}/dts`, hook: 'buildEnd' })],
    }
]
