import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { BillEntry, Bill, MonthlyBillRecord, BillStatus } from '@/types/models'
import { getMaxDayInMonth } from '@/lib/formatters'

type Client = SupabaseClient<Database>

function mapBillEntry(row: Database['public']['Tables']['bill_entries']['Row']): BillEntry {
  return {
    id: row.id,
    monthlyRecordId: row.monthly_record_id,
    billId: row.bill_id,
    householdId: row.household_id,
    name: row.name,
    valueCents: row.value_cents,
    dueDate: row.due_date,
    status: row.status as BillStatus,
    paidDate: row.paid_date,
    notes: row.notes,
    categoryId: row.category_id,
    customFields: (row.custom_fields ?? {}) as Record<string, string>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapBill(row: Database['public']['Tables']['bills']['Row']): Bill {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    householdId: row.household_id,
    name: row.name,
    valueCents: row.value_cents,
    dueDay: row.due_day,
    categoryId: row.category_id,
    notes: row.notes,
    isRecurring: row.is_recurring,
    customFields: (row.custom_fields ?? {}) as Record<string, string>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ── Monthly Records ───────────────────────────────────────

export async function getOrCreateMonthRecord(
  client: Client,
  workspaceId: string,
  householdId: string,
  monthKey: string
): Promise<MonthlyBillRecord> {
  const { data: existing } = await client
    .from('monthly_bill_records')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('month_key', monthKey)
    .single()

  if (existing) {
    const entries = await getBillEntriesForRecord(client, existing.id)
    return { id: existing.id, workspaceId, householdId, monthKey, entries, createdAt: existing.created_at }
  }

  const { data: created, error } = await client
    .from('monthly_bill_records')
    .insert({ workspace_id: workspaceId, household_id: householdId, month_key: monthKey })
    .select()
    .single()

  if (error || !created) throw new Error(`Failed to create month record: ${error?.message}`)

  return { id: created.id, workspaceId, householdId, monthKey, entries: [], createdAt: created.created_at }
}

export async function getBillRecordsForYear(
  client: Client,
  workspaceId: string,
  householdId: string,
  year: number
): Promise<MonthlyBillRecord[]> {
  const { data: records, error } = await client
    .from('monthly_bill_records')
    .select('*')
    .eq('workspace_id', workspaceId)
    .like('month_key', `${year}-%`)
    .order('month_key')

  if (error) throw new Error(error.message)
  if (!records || records.length === 0) return []

  const results = await Promise.all(
    records.map(async (r) => {
      const entries = await getBillEntriesForRecord(client, r.id)
      return { id: r.id, workspaceId, householdId, monthKey: r.month_key, entries, createdAt: r.created_at }
    })
  )
  return results
}

export async function getBillEntriesForRecord(
  client: Client,
  monthlyRecordId: string
): Promise<BillEntry[]> {
  const { data, error } = await client
    .from('bill_entries')
    .select('*')
    .eq('monthly_record_id', monthlyRecordId)
    .order('due_date')

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapBillEntry)
}

// ── Bill Templates ────────────────────────────────────────

export async function getBills(client: Client, workspaceId: string): Promise<Bill[]> {
  const { data, error } = await client
    .from('bills')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapBill)
}

export async function createBill(
  client: Client,
  bill: Omit<Database['public']['Tables']['bills']['Insert'], 'id'>
): Promise<Bill> {
  const { data, error } = await client.from('bills').insert(bill).select().single()
  if (error || !data) throw new Error(error?.message)
  return mapBill(data)
}

export async function updateBill(
  client: Client,
  id: string,
  updates: Database['public']['Tables']['bills']['Update']
): Promise<Bill> {
  const { data, error } = await client.from('bills').update(updates).eq('id', id).select().single()
  if (error || !data) throw new Error(error?.message)
  return mapBill(data)
}

export async function deleteBill(client: Client, id: string): Promise<void> {
  const { error } = await client.from('bills').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Bill Entries ──────────────────────────────────────────

export async function createBillEntry(
  client: Client,
  entry: Omit<Database['public']['Tables']['bill_entries']['Insert'], 'id'>
): Promise<BillEntry> {
  const { data, error } = await client.from('bill_entries').insert(entry).select().single()
  if (error || !data) throw new Error(error?.message)
  return mapBillEntry(data)
}

export async function updateBillEntry(
  client: Client,
  id: string,
  updates: Database['public']['Tables']['bill_entries']['Update']
): Promise<BillEntry> {
  const { data, error } = await client.from('bill_entries').update(updates).eq('id', id).select().single()
  if (error || !data) throw new Error(error?.message)
  return mapBillEntry(data)
}

export async function deleteBillEntry(client: Client, id: string): Promise<void> {
  const { error } = await client.from('bill_entries').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function setBillEntryStatus(
  client: Client,
  id: string,
  status: 'pending' | 'paid' | 'overdue'
): Promise<BillEntry> {
  const updates: Database['public']['Tables']['bill_entries']['Update'] = {
    status,
    paid_date: status === 'paid' ? new Date().toISOString() : null,
  }
  return updateBillEntry(client, id, updates)
}

// ── Month generation from recurring templates ─────────────

export async function generateMonthFromTemplates(
  client: Client,
  workspaceId: string,
  householdId: string,
  monthKey: string
): Promise<BillEntry[]> {
  const record = await getOrCreateMonthRecord(client, workspaceId, householdId, monthKey)

  if (record.entries && record.entries.length > 0) {
    return record.entries
  }

  const recurringBills = await getBills(client, workspaceId)
  const templates = recurringBills.filter(b => b.isRecurring)

  if (templates.length === 0) return []

  const maxDay = getMaxDayInMonth(monthKey)
  const [year, month] = monthKey.split('-').map(Number)

  const entries = await Promise.all(
    templates.map(template => {
      const day = Math.min(template.dueDay, maxDay)
      const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      return createBillEntry(client, {
        monthly_record_id: record.id,
        bill_id: template.id,
        household_id: householdId,
        name: template.name,
        value_cents: template.valueCents,
        due_date: dueDate,
        status: 'pending',
        notes: template.notes,
        category_id: template.categoryId,
        custom_fields: template.customFields,
      })
    })
  )

  return entries
}
