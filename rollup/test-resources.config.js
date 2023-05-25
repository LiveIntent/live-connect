import replace from '@rollup/plugin-replace'
import fs from 'fs'
import path from 'path'
import config from './dist.config.js'

const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), { encoding: 'utf-8' }))

const OUTPUT_DIR = './test-resources'

export default {
  input: './test/it/helpers/preambled.ts',
  output: {
    file: `${OUTPUT_DIR}/bundle.iife.js`,
    format: 'iife',
    sourcemap: true
  },
  plugins: [
    ...config.plugins,
    replace({
      preventAssignment: true,
      LC_VERSION: JSON.stringify(`${packageJson.versionPrefix}${packageJson.version}`)
    })
  ]
}
