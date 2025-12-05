import nextConfig from 'eslint-config-next'

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'supabase/functions/**'],
  },
  ...nextConfig,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'import/no-anonymous-default-export': 'off',
    },
  },
]
