/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'supabase.co', port: '', pathname: '/**' }
    ]
  },
  // NOTE: Avoid embedding secrets here. Use .env.local or your host's environment
  // variables (NEXT_PUBLIC_* for client-safe envs and SUPABASE_SERVICE_ROLE_KEY for server-only).
}

export default nextConfig
