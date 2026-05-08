import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Workspace, Category, CustomField } from '@/types/models'

type Client = SupabaseClient<Database>

function mapWorkspace(row: Database['public']['Tables']['workspaces']['Row']): Workspace {
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    type: row.type as Workspace['type'],
    color: row.color,
    icon: row.icon ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapCategory(row: Database['public']['Tables']['categories']['Row']): Category {
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    type: row.type as Category['type'],
    isDefault: row.is_default,
    sortOrder: row.sort_order,
    budgetCents: row.budget_cents,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapCustomField(row: Database['public']['Tables']['custom_fields']['Row']): CustomField {
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    type: row.type as CustomField['type'],
    options: Array.isArray(row.options) ? (row.options as string[]) : null,
    appliesTo: row.applies_to as CustomField['appliesTo'],
    createdAt: row.created_at,
  }
}

// ── Workspaces ────────────────────────────────────────────

export async function getWorkspaces(client: Client, householdId: string): Promise<Workspace[]> {
  const { data, error } = await client
    .from('workspaces')
    .select('*')
    .eq('household_id', householdId)
    .order('sort_order')

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapWorkspace)
}

export async function createWorkspace(
  client: Client,
  ws: Omit<Database['public']['Tables']['workspaces']['Insert'], 'id'>
): Promise<Workspace> {
  const { data, error } = await client.from('workspaces').insert(ws).select().single()
  if (error || !data) throw new Error(error?.message)
  return mapWorkspace(data)
}

export async function updateWorkspace(
  client: Client,
  id: string,
  updates: Database['public']['Tables']['workspaces']['Update']
): Promise<Workspace> {
  const { data, error } = await client.from('workspaces').update(updates).eq('id', id).select().single()
  if (error || !data) throw new Error(error?.message)
  return mapWorkspace(data)
}

export async function deleteWorkspace(client: Client, id: string): Promise<void> {
  const { error } = await client.from('workspaces').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Categories ────────────────────────────────────────────

export async function getCategories(client: Client, householdId: string): Promise<Category[]> {
  const { data, error } = await client
    .from('categories')
    .select('*')
    .eq('household_id', householdId)
    .order('sort_order')

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapCategory)
}

export async function createCategory(
  client: Client,
  cat: Omit<Database['public']['Tables']['categories']['Insert'], 'id'>
): Promise<Category> {
  const { data, error } = await client.from('categories').insert(cat).select().single()
  if (error || !data) throw new Error(error?.message)
  return mapCategory(data)
}

export async function updateCategory(
  client: Client,
  id: string,
  updates: Database['public']['Tables']['categories']['Update']
): Promise<Category> {
  const { data, error } = await client.from('categories').update(updates).eq('id', id).select().single()
  if (error || !data) throw new Error(error?.message)
  return mapCategory(data)
}

export async function deleteCategory(
  client: Client,
  id: string,
  fallbackCategoryId: string
): Promise<void> {
  // Reassign bill_entries and bills to fallback before deleting
  await Promise.all([
    client.from('bill_entries').update({ category_id: fallbackCategoryId }).eq('category_id', id),
    client.from('bills').update({ category_id: fallbackCategoryId }).eq('category_id', id),
  ])
  const { error } = await client.from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Custom Fields ─────────────────────────────────────────

export async function getCustomFields(client: Client, householdId: string): Promise<CustomField[]> {
  const { data, error } = await client
    .from('custom_fields')
    .select('*')
    .eq('household_id', householdId)
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapCustomField)
}

export async function createCustomField(
  client: Client,
  field: Omit<Database['public']['Tables']['custom_fields']['Insert'], 'id'>
): Promise<CustomField> {
  const { data, error } = await client.from('custom_fields').insert(field).select().single()
  if (error || !data) throw new Error(error?.message)
  return mapCustomField(data)
}

export async function deleteCustomField(client: Client, id: string): Promise<void> {
  const { error } = await client.from('custom_fields').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Household members ────────────────────────────────────

export async function getHouseholdMembers(
  client: Client,
  householdId: string
): Promise<{ userId: string; fullName: string | null; role: string; joinedAt: string }[]> {
  const { data: members } = await client
    .from('household_members')
    .select('user_id, role, joined_at')
    .eq('household_id', householdId)

  if (!members?.length) return []

  const userIds = members.map(m => m.user_id)
  const { data: profiles } = await client
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.full_name]))

  return members.map(m => ({
    userId: m.user_id,
    fullName: profileMap.get(m.user_id) ?? null,
    role: m.role,
    joinedAt: m.joined_at,
  }))
}

export async function joinHousehold(
  client: Client,
  userId: string,
  householdId: string
): Promise<{ success: boolean; error?: string }> {
  // Check household exists
  const { data: household } = await client
    .from('households')
    .select('id')
    .eq('id', householdId)
    .single()

  if (!household) return { success: false, error: 'Código inválido ou espaço não encontrado.' }

  // Check not already a member
  const { data: existing } = await client
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .eq('household_id', householdId)
    .single()

  if (existing) return { success: false, error: 'Você já pertence a este espaço.' }

  // Add as member
  const { error } = await client.from('household_members').insert({
    household_id: householdId,
    user_id: userId,
    role: 'member',
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function removeMember(
  client: Client,
  householdId: string,
  userId: string
): Promise<void> {
  const { error } = await client
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
}

// ── Household ─────────────────────────────────────────────

export async function getUserHousehold(
  client: Client,
  userId: string
): Promise<{ id: string; name: string } | null> {
  const { data: member } = await client
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .limit(1)
    .single()

  if (!member) return null

  const { data: household } = await client
    .from('households')
    .select('id, name')
    .eq('id', member.household_id)
    .single()

  return household ?? null
}
