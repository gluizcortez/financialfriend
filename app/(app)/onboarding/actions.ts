'use server'

import { createClient } from '@/lib/supabase/server'

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
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not_authenticated' }

  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({ name: name || 'Meu Espaço Financeiro', created_by: user.id })
    .select()
    .single()

  if (householdError || !household) {
    console.error('[createHousehold] error:', householdError)
    return { error: householdError?.message ?? 'insert_failed' }
  }

  await supabase.from('household_members').insert({
    household_id: household.id,
    user_id: user.id,
    role: 'owner',
  })

  await supabase.from('categories').insert(
    DEFAULT_CATEGORIES.map(c => ({
      ...c,
      household_id: household.id,
      is_default: true,
    }))
  )

  return { error: null }
}
