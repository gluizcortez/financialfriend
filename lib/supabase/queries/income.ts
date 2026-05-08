import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { IncomeEntry, IncomeCategory } from '@/types/models'
import { getMaxDayInMonth } from '@/lib/formatters'

type Client = SupabaseClient<Database>

function mapEntry(row: Database['public']['Tables']['income_entries']['Row']): IncomeEntry {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    householdId: row.household_id,
    monthKey: row.month_key,
    name: row.name,
    amountCents: row.amount_cents,
    category: row.category as IncomeCategory,
    date: row.date,
    notes: row.notes,
    isRecurring: row.is_recurring,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getIncomeEntries(client: Client, workspaceId: string, monthKey: string): Promise<IncomeEntry[]> {
  const { data, error } = await client
    .from('income_entries')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('month_key', monthKey)
    .order('date')

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapEntry)
}

export async function getAllIncomeEntries(client: Client, workspaceId: string): Promise<IncomeEntry[]> {
  const { data, error } = await client
    .from('income_entries')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('date')

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapEntry)
}

export async function createIncomeEntry(
  client: Client,
  entry: Omit<Database['public']['Tables']['income_entries']['Insert'], 'id'>
): Promise<IncomeEntry> {
  const { data, error } = await client.from('income_entries').insert(entry).select().single()
  if (error || !data) throw new Error(error?.message)
  return mapEntry(data)
}

export async function updateIncomeEntry(
  client: Client,
  id: string,
  updates: Database['public']['Tables']['income_entries']['Update']
): Promise<IncomeEntry> {
  const { data, error } = await client.from('income_entries').update(updates).eq('id', id).select().single()
  if (error || !data) throw new Error(error?.message)
  return mapEntry(data)
}

export async function deleteIncomeEntry(client: Client, id: string): Promise<void> {
  const { error } = await client.from('income_entries').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function generateRecurringForMonth(
  client: Client,
  workspaceId: string,
  householdId: string,
  targetMonthKey: string
): Promise<number> {
  // Find recurring entries from previous months
  const { data: recurringTemplates } = await client
    .from('income_entries')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_recurring', true)
    .lt('month_key', targetMonthKey)

  if (!recurringTemplates?.length) return 0

  // Deduplicate by name+category — keep latest
  const templateMap = new Map<string, typeof recurringTemplates[0]>()
  for (const t of recurringTemplates) {
    const key = `${t.name}::${t.category}`
    const existing = templateMap.get(key)
    if (!existing || t.month_key > existing.month_key) templateMap.set(key, t)
  }

  // Check what already exists in target month
  const { data: existing } = await client
    .from('income_entries')
    .select('name, category')
    .eq('workspace_id', workspaceId)
    .eq('month_key', targetMonthKey)

  const existingKeys = new Set((existing ?? []).map(e => `${e.name}::${e.category}`))

  const maxDay = getMaxDayInMonth(targetMonthKey)
  const [year, month] = targetMonthKey.split('-').map(Number)
  let created = 0

  for (const [key, template] of templateMap) {
    if (existingKeys.has(key)) continue

    const [, , templateDay] = template.date.split('-').map(Number)
    const day = Math.min(templateDay, maxDay)
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    await createIncomeEntry(client, {
      workspace_id: workspaceId,
      household_id: householdId,
      month_key: targetMonthKey,
      name: template.name,
      amount_cents: template.amount_cents,
      category: template.category,
      date,
      notes: template.notes,
      is_recurring: true,
    })
    created++
  }

  return created
}
