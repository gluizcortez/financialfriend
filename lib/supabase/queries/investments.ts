import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Investment, InvestmentTransaction, InvestmentType, TransactionType } from '@/types/models'

type Client = SupabaseClient<Database>

function mapInvestment(row: Database['public']['Tables']['investments']['Row']): Investment {
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    type: row.type as InvestmentType,
    currentBalanceCents: row.current_balance_cents,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapTransaction(row: Database['public']['Tables']['investment_transactions']['Row']): InvestmentTransaction {
  return {
    id: row.id,
    investmentId: row.investment_id,
    householdId: row.household_id,
    type: row.type as TransactionType,
    amountCents: row.amount_cents,
    monthKey: row.month_key,
    date: row.date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getInvestments(client: Client, householdId: string): Promise<Investment[]> {
  const { data, error } = await client
    .from('investments')
    .select('*')
    .eq('household_id', householdId)
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapInvestment)
}

export async function createInvestment(
  client: Client,
  inv: Omit<Database['public']['Tables']['investments']['Insert'], 'id'>
): Promise<Investment> {
  const { data, error } = await client.from('investments').insert(inv).select().single()
  if (error || !data) throw new Error(error?.message)
  return mapInvestment(data)
}

export async function updateInvestment(
  client: Client,
  id: string,
  updates: Database['public']['Tables']['investments']['Update']
): Promise<Investment> {
  const { data, error } = await client.from('investments').update(updates).eq('id', id).select().single()
  if (error || !data) throw new Error(error?.message)
  return mapInvestment(data)
}

export async function deleteInvestment(client: Client, id: string): Promise<void> {
  const { error } = await client.from('investments').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getTransactions(client: Client, investmentId: string): Promise<InvestmentTransaction[]> {
  const { data, error } = await client
    .from('investment_transactions')
    .select('*')
    .eq('investment_id', investmentId)
    .order('date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapTransaction)
}

export async function getTransactionsByHousehold(
  client: Client,
  householdId: string,
  monthKey?: string
): Promise<InvestmentTransaction[]> {
  let query = client
    .from('investment_transactions')
    .select('*')
    .eq('household_id', householdId)

  if (monthKey) query = query.eq('month_key', monthKey)

  const { data, error } = await query.order('date', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapTransaction)
}

export async function addTransaction(
  client: Client,
  tx: Omit<Database['public']['Tables']['investment_transactions']['Insert'], 'id'>
): Promise<InvestmentTransaction> {
  const { data, error } = await client.from('investment_transactions').insert(tx).select().single()
  if (error || !data) throw new Error(error?.message)

  const created = mapTransaction(data)
  await recalculateBalance(client, created.investmentId)
  return created
}

export async function deleteTransaction(client: Client, tx: InvestmentTransaction): Promise<void> {
  const { error } = await client.from('investment_transactions').delete().eq('id', tx.id)
  if (error) throw new Error(error.message)
  await recalculateBalance(client, tx.investmentId)
}

export async function recalculateBalance(client: Client, investmentId: string): Promise<number> {
  const { data, error } = await client
    .from('investment_transactions')
    .select('type, amount_cents')
    .eq('investment_id', investmentId)

  if (error) throw new Error(error.message)

  const balance = (data ?? []).reduce((sum, tx) =>
    tx.type === 'withdrawal' ? sum - tx.amount_cents : sum + tx.amount_cents, 0
  )

  await client.from('investments').update({ current_balance_cents: balance }).eq('id', investmentId)
  return balance
}
