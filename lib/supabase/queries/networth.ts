import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Client = SupabaseClient<Database>

export interface NetWorthTab {
  id: string
  householdId: string
  name: string
  sortOrder: number
  investmentWorkspaceIds: string[]
  fgtsWorkspaceIds: string[]
  createdAt: string
  updatedAt: string
}

export async function getNetWorthTabs(client: Client, householdId: string): Promise<NetWorthTab[]> {
  const { data: tabs, error } = await client
    .from('net_worth_tabs')
    .select('*')
    .eq('household_id', householdId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  if (!tabs || tabs.length === 0) return []

  const tabIds = tabs.map(t => t.id)

  const [invLinks, fgtsLinks] = await Promise.all([
    client.from('net_worth_tab_investment_workspaces').select('*').in('tab_id', tabIds),
    client.from('net_worth_tab_fgts_workspaces').select('*').in('tab_id', tabIds),
  ])

  return tabs.map(tab => ({
    id: tab.id,
    householdId: tab.household_id,
    name: tab.name,
    sortOrder: tab.sort_order,
    investmentWorkspaceIds: (invLinks.data ?? []).filter(l => l.tab_id === tab.id).map(l => l.workspace_id),
    fgtsWorkspaceIds: (fgtsLinks.data ?? []).filter(l => l.tab_id === tab.id).map(l => l.workspace_id),
    createdAt: tab.created_at,
    updatedAt: tab.updated_at,
  }))
}

export async function createNetWorthTab(
  client: Client,
  householdId: string,
  name: string,
  investmentWorkspaceIds: string[],
  fgtsWorkspaceIds: string[],
  sortOrder: number
): Promise<NetWorthTab> {
  const { data: tab, error } = await client
    .from('net_worth_tabs')
    .insert({ household_id: householdId, name, sort_order: sortOrder })
    .select()
    .single()

  if (error || !tab) throw new Error(error?.message)

  if (investmentWorkspaceIds.length > 0) {
    await client.from('net_worth_tab_investment_workspaces').insert(
      investmentWorkspaceIds.map(wsId => ({ tab_id: tab.id, workspace_id: wsId }))
    )
  }
  if (fgtsWorkspaceIds.length > 0) {
    await client.from('net_worth_tab_fgts_workspaces').insert(
      fgtsWorkspaceIds.map(wsId => ({ tab_id: tab.id, workspace_id: wsId }))
    )
  }

  return {
    id: tab.id,
    householdId: tab.household_id,
    name: tab.name,
    sortOrder: tab.sort_order,
    investmentWorkspaceIds,
    fgtsWorkspaceIds,
    createdAt: tab.created_at,
    updatedAt: tab.updated_at,
  }
}

export async function updateNetWorthTab(
  client: Client,
  tabId: string,
  name: string,
  investmentWorkspaceIds: string[],
  fgtsWorkspaceIds: string[]
): Promise<void> {
  await client.from('net_worth_tabs').update({ name }).eq('id', tabId)

  // Replace workspace links
  await client.from('net_worth_tab_investment_workspaces').delete().eq('tab_id', tabId)
  await client.from('net_worth_tab_fgts_workspaces').delete().eq('tab_id', tabId)

  if (investmentWorkspaceIds.length > 0) {
    await client.from('net_worth_tab_investment_workspaces').insert(
      investmentWorkspaceIds.map(wsId => ({ tab_id: tabId, workspace_id: wsId }))
    )
  }
  if (fgtsWorkspaceIds.length > 0) {
    await client.from('net_worth_tab_fgts_workspaces').insert(
      fgtsWorkspaceIds.map(wsId => ({ tab_id: tabId, workspace_id: wsId }))
    )
  }
}

export async function deleteNetWorthTab(client: Client, tabId: string): Promise<void> {
  await client.from('net_worth_tab_investment_workspaces').delete().eq('tab_id', tabId)
  await client.from('net_worth_tab_fgts_workspaces').delete().eq('tab_id', tabId)
  await client.from('net_worth_tabs').delete().eq('id', tabId)
}
