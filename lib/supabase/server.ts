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

// Fallback: read the access token directly from the raw session cookie.
// Used when getSession() returns null (e.g. PKCE race, chunked-cookie mismatch).
// @supabase/ssr encodes session cookies as: base64-<base64url(json)>
async function extractTokenFromCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): Promise<string | null> {
  const ref = new URL(SUPABASE_URL).hostname.split('.')[0]
  const key = `sb-${ref}-auth-token`
  const all = cookieStore.getAll()

  // Try the unchunked cookie first, then chunked chunks (.0, .1, …)
  let raw = all.find(c => c.name === key)?.value ?? null
  if (!raw) {
    const parts: string[] = []
    for (let i = 0; ; i++) {
      const part = all.find(c => c.name === `${key}.${i}`)?.value
      if (!part) break
      parts.push(part)
    }
    if (parts.length) raw = parts.join('')
  }
  if (!raw) return null

  try {
    // @supabase/ssr may store the cookie as "base64-<base64url>" or plain JSON
    const json = raw.startsWith('base64-')
      ? Buffer.from(raw.slice(7).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
      : raw
    const parsed = JSON.parse(json) as { access_token?: string }
    return parsed.access_token ?? null
  } catch {
    return null
  }
}

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

  // Step 1: read the session token from cookies via @supabase/ssr
  const authOnlyClient = createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookies: cookieHandlers,
  })

  const { data: { session } } = await authOnlyClient.auth.getSession()

  // Step 2: if getSession() came back empty, try reading the cookie directly
  const accessToken = session?.access_token ?? await extractTokenFromCookies(cookieStore)

  if (!accessToken) {
    // No session cookie — unauthenticated client (public routes only)
    return authOnlyClient
  }

  // Step 3: return a client with the token pre-injected in every request header,
  // bypassing the broken _getAccessToken() → getSession() fallback chain.
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookies: cookieHandlers,
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
