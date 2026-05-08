'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'

const DEFAULT_CATEGORIES = [
  { name: 'Moradia', color: '#6366f1', type: 'bill' as const, sort_order: 0 },
  { name: 'Transporte', color: '#3b82f6', type: 'bill' as const, sort_order: 1 },
  { name: 'Alimentação', color: '#10b981', type: 'bill' as const, sort_order: 2 },
  { name: 'Saúde', color: '#ef4444', type: 'bill' as const, sort_order: 3 },
  { name: 'Educação', color: '#f59e0b', type: 'bill' as const, sort_order: 4 },
  { name: 'Lazer', color: '#ec4899', type: 'bill' as const, sort_order: 5 },
  { name: 'Serviços', color: '#8b5cf6', type: 'bill' as const, sort_order: 6 },
  { name: 'Seguros', color: '#06b6d4', type: 'bill' as const, sort_order: 7 },
  { name: 'Outros', color: '#6b7280', type: 'both' as const, sort_order: 8 },
  { name: 'Renda Fixa', color: '#059669', type: 'investment' as const, sort_order: 9 },
  { name: 'Renda Variável', color: '#d97706', type: 'investment' as const, sort_order: 10 },
  { name: 'Criptomoedas', color: '#f97316', type: 'investment' as const, sort_order: 11 },
]

export async function createHouseholdAction(name: string): Promise<{ error: string | null }> {
  // Step 1: verify identity via the auth API (network call, always reliable)
  const authClient = await createClient()
  const { data: { user }, error: userError } = await authClient.auth.getUser()

  console.log('[createHouseholdAction] user:', user?.id ?? null, 'userError:', userError?.message ?? null)

  if (!user) return { error: 'not_authenticated' }

  // Step 2: use the service-role client for all DB writes.
  // Server Actions run exclusively on the server, so using the service role key
  // here is safe. The user identity has already been verified above via getUser().
  // We do this because the new sb_publishable_* key is not a JWT and PostgREST
  // cannot decode it to evaluate RLS policies.
  const db = createServiceClient()

  const { data: household, error: householdError } = await db
    .from('households')
    .insert({ name: name || 'Meu Espaço Financeiro', created_by: user.id })
    .select()
    .single()

  if (householdError || !household) {
    console.error('[createHouseholdAction] households insert error:', householdError)
    return { error: householdError?.message ?? 'insert_failed' }
  }

  const { error: memberError } = await db.from('household_members').insert({
    household_id: household.id,
    user_id: user.id,
    role: 'owner',
  })

  if (memberError) {
    console.error('[createHouseholdAction] household_members insert error:', memberError)
  }

  const { error: catError } = await db.from('categories').insert(
    DEFAULT_CATEGORIES.map(c => ({
      ...c,
      household_id: household.id,
      is_default: true,
    }))
  )

  if (catError) {
    console.error('[createHouseholdAction] categories insert error:', catError)
  }

  return { error: null }
}
