import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

/**
 * Returns a Supabase server client with the session access token pre-injected
 * into global.headers so that all PostgREST requests carry a valid JWT.
 *
 * With the new sb_publishable_* key format, supabase-js's internal
 * _getAccessToken() falls back to the publishable key when auth.getSession()
 * returns null, which is not a JWT — PostgREST can't decode it and auth.uid()
 * returns NULL, breaking all RLS policies. Pre-injecting the Authorization
 * header bypasses that path entirely (fetchWithAuth only sets the header when
 * it is absent).
 */
export async function createClient() {
  const cookieStore = await cookies()

  const cookieHandlers = {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
        )
      } catch {
        // Server Component — mutations ignored
      }
    },
  }

  // Step 1: read the session token from cookies
  const authOnlyClient = createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookies: cookieHandlers,
  })

  const { data: { session } } = await authOnlyClient.auth.getSession()

  if (!session?.access_token) {
    // No session — return unauthenticated client (public routes only)
    return authOnlyClient
  }

  // Step 2: return a client with the token pre-injected in every request header,
  // bypassing the broken _getAccessToken() → getSession() path.
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookies: cookieHandlers,
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  })
}

export function createServiceClient() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js') as typeof import('@supabase/supabase-js')
  return createClient<Database>(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
