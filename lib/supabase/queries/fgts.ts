import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { FGTSRecord } from '@/types/models'

type Client = SupabaseClient<Database>

function mapRecord(row: Database['public']['Tables']['fgts_records']['Row']): FGTSRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    householdId: row.household_id,
    monthKey: row.month_key,
    balanceCents: row.balance_cents,
    notes: row.notes,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getFGTSRecords(client: Client, workspaceId: string): Promise<FGTSRecord[]> {
  const { data, error } = await client
    .from('fgts_records')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('month_key', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRecord)
}

export async function upsertFGTSRecord(
  client: Client,
  record: Omit<Database['public']['Tables']['fgts_records']['Insert'], 'id'>
): Promise<FGTSRecord> {
  // Use upsert to enforce one record per workspace+month
  const { data, error } = await client
    .from('fgts_records')
    .upsert(record, { onConflict: 'workspace_id,month_key' })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message)
  return mapRecord(data)
}

export async function updateFGTSRecord(
  client: Client,
  id: string,
  updates: Database['public']['Tables']['fgts_records']['Update']
): Promise<FGTSRecord> {
  const { data, error } = await client
    .from('fgts_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) throw new Error(error?.message)
  return mapRecord(data)
}

export async function deleteFGTSRecord(client: Client, id: string): Promise<void> {
  const { error } = await client.from('fgts_records').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
