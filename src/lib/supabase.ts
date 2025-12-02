import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side usage: lazily create an admin client only when actually used at runtime.
// This avoids module-evaluation errors during builds when SUPABASE_SERVICE_ROLE_KEY is not present
// (e.g. local developer machines using remote Supabase without service-role in env).
export const supabaseAdmin: any = (() => {
  let client: any = null

  function getClient() {
    if (!client) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!url || !key) {
        throw new Error(
          'supabaseAdmin requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set in the environment (server-only).'
        )
      }
      client = createClient(url, key)
    }
    return client
  }

  return new Proxy({}, {
    get(_t, prop) {
      const real = getClient()
      const v = (real as any)[prop]
      if (typeof v === 'function') return v.bind(real)
      return v
    },
    apply(_t, _thisArg, args) {
      const real = getClient()
      return (real as any)(...args)
    }
  })
})()