import next from 'eslint-config-next'

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'out/**', 'test-results/**']
  },
  ...next
]

export default config
