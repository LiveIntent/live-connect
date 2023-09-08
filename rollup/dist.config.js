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
        input: './src/index.ts',
        output: [
            {
                file: `${OUTPUT_DIR}/index.js`,
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
        ]
    },
    {
        input: `${OUTPUT_DIR}/dts/src/index.d.ts`,
        output: [{ file: `${OUTPUT_DIR}/index.d.ts`, format: 'es' }],
        plugins: [dts(), del({ targets: `${OUTPUT_DIR}/dts`, hook: 'buildEnd' })],
    }
]
