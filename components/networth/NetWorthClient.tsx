'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getNetWorthData } from '@/lib/supabase/queries/networth'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { PortfolioPieChart } from '@/components/dashboard/PortfolioPieChart'
import { EmptyState } from '@/components/shared/EmptyState'
import { INVESTMENT_TYPE_LABELS } from '@/types/models'
import { PieChart } from 'lucide-react'
import { WorkspaceHero } from '@/components/workspace/WorkspaceHero'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'

export function NetWorthClient() {
  const supabase = createClient()
  const { activeWorkspace } = useWorkspaceStore()
  const householdId = activeWorkspace?.id ?? null

  const { data } = useQuery({
    queryKey: ['networth', householdId],
    queryFn: () => getNetWorthData(supabase, householdId!),
    enabled: !!householdId,
  })

  if (!householdId) {
    return <div className="p-6 text-sm text-gray-400">Carregando workspace...</div>
  }

  const investments = data?.investments ?? []
  const fgtsRecords = data?.fgtsRecords ?? []
  const totalNetWorth = data?.total ?? 0
  const totalInvestments = data?.totalInvestments ?? 0
  const latestFGTS = data?.latestFGTS ?? 0

  return (
    <div className="flex flex-col h-full">
      <WorkspaceHero title="Patrimônio" />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <PieChart size={22} className="text-gray-500" />
          <h1 className="text-xl font-semibold text-gray-900">Patrimônio</h1>
        </div>

        {investments.length === 0 && fgtsRecords.length === 0 ? (
          <EmptyState
            icon={PieChart}
            title="Nenhum dado"
            description="Adicione investimentos ou registros de FGTS para visualizar o patrimônio."
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {investments.length > 0 && (
                <>
                  <PortfolioPieChart investments={investments} />
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h2 className="text-sm font-semibold text-gray-900">Investimentos</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {investments
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

              {fgtsRecords.length > 0 && (
                <div className={`rounded-xl border border-gray-200 bg-white overflow-hidden ${investments.length > 0 ? 'lg:col-span-2' : ''}`}>
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-900">Histórico FGTS</h2>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {fgtsRecords
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
          </>
        )}
      </div>
    </div>
  )
}
