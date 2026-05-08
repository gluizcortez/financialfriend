'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getWorkspaces } from '@/lib/supabase/queries/settings'
import { getInvestments } from '@/lib/supabase/queries/investments'
import { getFGTSRecords } from '@/lib/supabase/queries/fgts'
import {
  getNetWorthTabs, createNetWorthTab, updateNetWorthTab, deleteNetWorthTab,
} from '@/lib/supabase/queries/networth'
import { calculateNetWorth } from '@/lib/calculations'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { PortfolioPieChart } from '@/components/dashboard/PortfolioPieChart'
import { EmptyState } from '@/components/shared/EmptyState'
import { INVESTMENT_TYPE_LABELS } from '@/types/models'
import { PieChart, Plus, Pencil, X, Check } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'

interface Props { householdId: string }

export function NetWorthClient({ householdId }: Props) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [showTabModal, setShowTabModal] = useState(false)
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [tabName, setTabName] = useState('')
  const [tabInvWsIds, setTabInvWsIds] = useState<string[]>([])
  const [tabFgtsWsIds, setTabFgtsWsIds] = useState<string[]>([])

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces', householdId],
    queryFn: () => getWorkspaces(supabase, householdId),
  })

  const { data: tabs = [] } = useQuery({
    queryKey: ['networth-tabs', householdId],
    queryFn: () => getNetWorthTabs(supabase, householdId),
  })

  const investmentWorkspaceIds = workspaces.filter(w => w.type === 'investments').map(w => w.id)
  const fgtsWorkspaceIds = workspaces.filter(w => w.type === 'fgts').map(w => w.id)
  const investmentWorkspaces = workspaces.filter(w => w.type === 'investments')
  const fgtsWorkspaces = workspaces.filter(w => w.type === 'fgts')

  const { data: allInvestments = [] } = useQuery({
    queryKey: ['all-investments', householdId],
    queryFn: async () => {
      const results = await Promise.all(investmentWorkspaceIds.map(id => getInvestments(supabase, id)))
      return results.flat()
    },
    enabled: investmentWorkspaceIds.length > 0,
  })

  const { data: allFGTS = [] } = useQuery({
    queryKey: ['all-fgts', householdId],
    queryFn: async () => {
      const results = await Promise.all(fgtsWorkspaceIds.map(id => getFGTSRecords(supabase, id)))
      return results.flat()
    },
    enabled: fgtsWorkspaceIds.length > 0,
  })

  // Default to first tab
  useEffect(() => {
    if (tabs.length > 0 && (!activeTabId || !tabs.find(t => t.id === activeTabId))) {
      setActiveTabId(tabs[0].id)
    }
  }, [tabs, activeTabId])

  const activeTab = tabs.find(t => t.id === activeTabId) ?? null

  const filteredInvestments = activeTab
    ? allInvestments.filter(i => activeTab.investmentWorkspaceIds.includes(i.workspaceId))
    : allInvestments

  const filteredFGTS = activeTab
    ? allFGTS.filter(r => activeTab.fgtsWorkspaceIds.includes(r.workspaceId))
    : allFGTS

  const totalNetWorth = calculateNetWorth(filteredInvestments, filteredFGTS)
  const totalInvestments = filteredInvestments.reduce((s, i) => s + i.currentBalanceCents, 0)
  const latestFGTSPerWorkspace = fgtsWorkspaceIds.map(wsId => {
    const wsRecords = filteredFGTS.filter(r => r.workspaceId === wsId).sort((a, b) => b.monthKey.localeCompare(a.monthKey))
    return wsRecords[0]?.balanceCents ?? 0
  })
  const latestFGTS = latestFGTSPerWorkspace.reduce((s, v) => s + v, 0)

  function openCreateModal() {
    setEditingTabId(null)
    setTabName('')
    setTabInvWsIds([])
    setTabFgtsWsIds([])
    setShowTabModal(true)
  }

  function openEditModal(tab: typeof tabs[0]) {
    setEditingTabId(tab.id)
    setTabName(tab.name)
    setTabInvWsIds([...tab.investmentWorkspaceIds])
    setTabFgtsWsIds([...tab.fgtsWorkspaceIds])
    setShowTabModal(true)
  }

  async function handleSaveTab() {
    if (!tabName.trim()) return
    if (editingTabId) {
      await updateNetWorthTab(supabase, editingTabId, tabName.trim(), tabInvWsIds, tabFgtsWsIds)
      addNotification('Aba atualizada', 'success')
    } else {
      const tab = await createNetWorthTab(supabase, householdId, tabName.trim(), tabInvWsIds, tabFgtsWsIds, tabs.length)
      setActiveTabId(tab.id)
      addNotification('Aba criada', 'success')
    }
    queryClient.invalidateQueries({ queryKey: ['networth-tabs', householdId] })
    setShowTabModal(false)
  }

  async function handleDeleteTab(tabId: string) {
    await deleteNetWorthTab(supabase, tabId)
    queryClient.invalidateQueries({ queryKey: ['networth-tabs', householdId] })
    addNotification('Aba removida', 'success')
    if (activeTabId === tabId) setActiveTabId(null)
  }

  function toggleInvWs(wsId: string) {
    setTabInvWsIds(prev => prev.includes(wsId) ? prev.filter(x => x !== wsId) : [...prev, wsId])
  }
  function toggleFgtsWs(wsId: string) {
    setTabFgtsWsIds(prev => prev.includes(wsId) ? prev.filter(x => x !== wsId) : [...prev, wsId])
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-4 pt-2 shrink-0">
        {tabs.map(tab => (
          <div key={tab.id} className={`group relative flex items-center gap-1.5 rounded-t-lg border border-b-0 px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            activeTabId === tab.id
              ? 'border-gray-200 bg-gray-50 text-gray-900'
              : 'border-transparent text-gray-500 hover:border-gray-100 hover:bg-gray-50'
          }`}>
            <button onClick={() => setActiveTabId(tab.id)} className="whitespace-nowrap">
              {tab.name}
            </button>
            {activeTabId === tab.id && (
              <div className="ml-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditModal(tab)} className="rounded p-0.5 text-gray-400 hover:text-gray-700">
                  <Pencil size={12} />
                </button>
                <button onClick={() => handleDeleteTab(tab.id)} className="rounded p-0.5 text-gray-400 hover:text-red-500">
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        ))}
        <button onClick={openCreateModal} className="flex items-center gap-1 rounded-t-lg px-2 py-1.5 text-sm text-gray-400 hover:text-gray-700">
          <Plus size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <PieChart size={22} className="text-gray-500" />
          <h1 className="text-xl font-semibold text-gray-900">Patrimônio</h1>
        </div>

        {tabs.length === 0 ? (
          <EmptyState
            icon={PieChart}
            title="Nenhuma aba criada"
            description="Crie uma aba para organizar quais carteiras e FGTS fazem parte do seu patrimônio."
            action={{ label: 'Criar primeira aba', onClick: openCreateModal }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-xs text-gray-500 mb-1">Patrimônio Total</p>
                <p className="text-2xl font-bold text-primary-600">{formatCurrency(totalNetWorth)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-xs text-gray-500 mb-1">Investimentos</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(totalInvestments)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-xs text-gray-500 mb-1">FGTS (último registro)</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(latestFGTS)}</p>
              </div>
            </div>

            {filteredInvestments.length === 0 && filteredFGTS.length === 0 ? (
              <EmptyState
                icon={PieChart}
                title="Sem dados nesta aba"
                description="Nenhum investimento ou FGTS está vinculado a esta aba. Clique no ícone de lápis para editar."
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredInvestments.length > 0 && (
                  <>
                    <PortfolioPieChart investments={filteredInvestments} />
                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-900">Investimentos</h2>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {filteredInvestments
                          .sort((a, b) => b.currentBalanceCents - a.currentBalanceCents)
                          .map(inv => (
                            <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                              <div>
                                <span className="text-sm text-gray-700">{inv.name}</span>
                                <span className="ml-2 text-xs text-gray-400">{INVESTMENT_TYPE_LABELS[inv.type]}</span>
                              </div>
                              <span className="text-sm font-semibold text-primary-600">{formatCurrency(inv.currentBalanceCents)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}

                {filteredFGTS.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden lg:col-span-2">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h2 className="text-sm font-semibold text-gray-900">Histórico FGTS</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {filteredFGTS
                        .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
                        .slice(0, 12)
                        .map(r => (
                          <div key={r.id} className="flex items-center justify-between px-5 py-3">
                            <span className="text-sm text-gray-500">{r.monthKey}</span>
                            <div className="text-right">
                              <span className="text-sm font-semibold text-green-600">{formatCurrency(r.balanceCents)}</span>
                              {r.date && <span className="ml-2 text-xs text-gray-400">{formatDate(r.date)}</span>}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tab modal */}
      {showTabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">
              {editingTabId ? 'Editar Aba' : 'Nova Aba de Patrimônio'}
            </h2>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nome da aba</label>
              <input
                autoFocus
                value={tabName}
                onChange={e => setTabName(e.target.value)}
                placeholder="Ex: Aposentadoria"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {investmentWorkspaces.length > 0 && (
              <div>
                <label className="block text-xs text-gray-500 mb-2">Investimentos incluídos</label>
                <div className="space-y-1.5">
                  {investmentWorkspaces.map(ws => (
                    <label key={ws.id} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tabInvWsIds.includes(ws.id)}
                        onChange={() => toggleInvWs(ws.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="flex items-center gap-1.5 text-sm text-gray-700">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ws.color }} />
                        {ws.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {fgtsWorkspaces.length > 0 && (
              <div>
                <label className="block text-xs text-gray-500 mb-2">FGTS incluído</label>
                <div className="space-y-1.5">
                  {fgtsWorkspaces.map(ws => (
                    <label key={ws.id} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tabFgtsWsIds.includes(ws.id)}
                        onChange={() => toggleFgtsWs(ws.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="flex items-center gap-1.5 text-sm text-gray-700">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ws.color }} />
                        {ws.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowTabModal(false)} className="text-sm text-gray-500 px-4 py-2 hover:text-gray-700">
                Cancelar
              </button>
              <button
                onClick={handleSaveTab}
                disabled={!tabName.trim()}
                className="flex items-center gap-1.5 text-sm bg-primary-600 text-white rounded-lg px-4 py-2 hover:bg-primary-700 disabled:opacity-40 transition-colors"
              >
                <Check size={14} />
                {editingTabId ? 'Salvar' : 'Criar aba'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
