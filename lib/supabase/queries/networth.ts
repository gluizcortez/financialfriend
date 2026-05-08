import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Investment, FGTSRecord } from '@/types/models'
import { getInvestments } from './investments'
import { getFGTSRecords } from './fgts'

type Client = SupabaseClient<Database>

export interface NetWorthData {
  investments: Investment[]
  fgtsRecords: FGTSRecord[]
  totalInvestments: number
  latestFGTS: number
  total: number
}

export async function getNetWorthData(client: Client, householdId: string): Promise<NetWorthData> {
  const [investments, fgtsRecords] = await Promise.all([
    getInvestments(client, householdId),
    getFGTSRecords(client, householdId),
  ])

  const totalInvestments = investments.reduce((s, i) => s + i.currentBalanceCents, 0)
  const latestFGTS = fgtsRecords.length > 0 ? fgtsRecords[0].balanceCents : 0
  const total = totalInvestments + latestFGTS

  return { investments, fgtsRecords, totalInvestments, latestFGTS, total }
}
