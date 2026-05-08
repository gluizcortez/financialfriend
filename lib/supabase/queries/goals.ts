import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Goal, GoalContribution, GoalType, Periodicity } from '@/types/models'

type Client = SupabaseClient<Database>

function mapContribution(row: Database['public']['Tables']['goal_contributions']['Row']): GoalContribution {
  return {
    id: row.id,
    goalId: row.goal_id,
    householdId: row.household_id,
    periodKey: row.period_key,
    targetAmountCents: row.target_amount_cents,
    actualAmountCents: row.actual_amount_cents,
    date: row.date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapGoal(
  row: Database['public']['Tables']['goals']['Row'],
  linkedInvestmentIds: string[],
  contributions: GoalContribution[]
): Goal {
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    description: row.description,
    goalType: row.goal_type as GoalType,
    targetAmountCents: row.target_amount_cents,
    periodicity: row.periodicity as Periodicity,
    customPeriodDays: row.custom_period_days,
    startDate: row.start_date,
    endDate: row.end_date,
    linkedInvestmentIds,
    contributions,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getGoals(client: Client, householdId: string): Promise<Goal[]> {
  const { data: goalRows, error } = await client
    .from('goals')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at')

  if (error) throw new Error(error.message)
  if (!goalRows?.length) return []

  const goalIds = goalRows.map(g => g.id)

  const [{ data: linkedInvs }, { data: contribs }] = await Promise.all([
    client.from('goal_linked_investments').select('*').in('goal_id', goalIds),
    client.from('goal_contributions').select('*').in('goal_id', goalIds).order('date'),
  ])

  return goalRows.map(row => mapGoal(
    row,
    (linkedInvs ?? []).filter(r => r.goal_id === row.id).map(r => r.investment_id),
    (contribs ?? []).filter(r => r.goal_id === row.id).map(mapContribution)
  ))
}

export async function createGoal(
  client: Client,
  goal: Omit<Database['public']['Tables']['goals']['Insert'], 'id'>,
  linkedInvestmentIds: string[]
): Promise<Goal> {
  const { data, error } = await client.from('goals').insert(goal).select().single()
  if (error || !data) throw new Error(error?.message)

  if (linkedInvestmentIds.length > 0) {
    await client.from('goal_linked_investments').insert(
      linkedInvestmentIds.map(inv_id => ({ goal_id: data.id, investment_id: inv_id }))
    )
  }

  return mapGoal(data, linkedInvestmentIds, [])
}

export async function updateGoal(
  client: Client,
  id: string,
  updates: Database['public']['Tables']['goals']['Update'],
  linkedInvestmentIds?: string[]
): Promise<void> {
  await client.from('goals').update(updates).eq('id', id)

  if (linkedInvestmentIds !== undefined) {
    await client.from('goal_linked_investments').delete().eq('goal_id', id)
    if (linkedInvestmentIds.length > 0) {
      await client.from('goal_linked_investments').insert(
        linkedInvestmentIds.map(inv_id => ({ goal_id: id, investment_id: inv_id }))
      )
    }
  }
}

export async function deleteGoal(client: Client, id: string): Promise<void> {
  const { error } = await client.from('goals').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addContribution(
  client: Client,
  contribution: Omit<Database['public']['Tables']['goal_contributions']['Insert'], 'id'>
): Promise<GoalContribution> {
  const { data, error } = await client.from('goal_contributions').insert(contribution).select().single()
  if (error || !data) throw new Error(error?.message)
  return mapContribution(data)
}

export async function updateContribution(
  client: Client,
  id: string,
  updates: Database['public']['Tables']['goal_contributions']['Update']
): Promise<GoalContribution> {
  const { data, error } = await client.from('goal_contributions').update(updates).eq('id', id).select().single()
  if (error || !data) throw new Error(error?.message)
  return mapContribution(data)
}

export async function deleteContribution(client: Client, id: string): Promise<void> {
  const { error } = await client.from('goal_contributions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
