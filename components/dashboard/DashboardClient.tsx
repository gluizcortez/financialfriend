'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getWorkspaces, getCategories } from '@/lib/supabase/queries/settings'
import { getOrCreateMonthRecord, getBillRecordsForYear } from '@/lib/supabase/queries/bills'
import { getIncomeEntries, getAllIncomeEntries } from '@/lib/supabase/queries/income'
import { getInvestments, getTransactionsByWorkspace } from '@/lib/supabase/queries/investments'
import { getFGTSRecords } from '@/lib/supabase/queries/fgts'
import { getGoals } from '@/lib/supabase/queries/goals'
import { calculateNetWorth } from '@/lib/calculations'
import { formatCurrency, getCurrentMonthKey, getPrevMonthKey, getNextMonthKey, formatMonthYear } from '@/lib/formatters'
import { ExpensePieChart } from './ExpensePieChart'
import { IncomePieChart } from './IncomePieChart'
import { PortfolioPieChart } from './PortfolioPieChart'
import { ExpenseTrendChart } from './ExpenseTrendChart'
import { YearView } from './YearView'
import { LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react'
import type { BillEntry, MonthKey } from '@/types/models'

interface Props { householdId: string }

export function DashboardClient({ householdId }: Props) {
  const supabase = createClient()
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey())
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month')
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces', householdId],
    queryFn: () => getWorkspaces(supabase, householdId),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', householdId],
    queryFn: () => getCategories(supabase, householdId),
  })

  const billsWorkspaceIds = workspaces.filter(w => w.type === 'bills').map(w => w.id)
  const incomeWorkspaceIds = workspaces.filter(w => w.type === 'income').map(w => w.id)
  const investmentWorkspaceIds = workspaces.filter(w => w.type === 'investments').map(w => w.id)
  const fgtsWorkspaceIds = workspaces.filter(w => w.type === 'fgts').map(w => w.id)

  // ── Month mode data ──────────────────────────────────────

  const last6Months = useMemo(() => {
    const months: MonthKey[] = []
    let m = monthKey
    for (let i = 0; i < 6; i++) { months.unshift(m); m = getPrevMonthKey(m) }
    return months
  }, [monthKey])

  const { data: allMonthsData = [] } = useQuery({
    queryKey: ['dashboard-bills-trend', householdId, last6Months[0]],
    queryFn: async () => {
      const results = await Promise.all(
        last6Months.flatMap(mk => billsWorkspaceIds.map(id => getOrCreateMonthRecord(supabase, id, householdId, mk)))
      )
      return results
    },
    enabled: viewMode === 'month' && billsWorkspaceIds.length > 0,
  })

  const allEntries = useMemo(() => {
    return allMonthsData.filter(r => r.monthKey === monthKey).flatMap(r => r.entries ?? [])
  }, [allMonthsData, monthKey])

  const billsByMonth = useMemo(() => {
    const map = new Map<MonthKey, BillEntry[]>()
    for (const record of allMonthsData) {
      const existing = map.get(record.monthKey) ?? []
      map.set(record.monthKey, [...existing, ...(record.entries ?? [])])
    }
    return map
  }, [allMonthsData])

  const { data: allIncome = [] } = useQuery({
    queryKey: ['dashboard-income', householdId, monthKey],
    queryFn: async () => {
      const results = await Promise.all(incomeWorkspaceIds.map(id => getIncomeEntries(supabase, id, monthKey)))
      return results.flat()
    },
    enabled: viewMode === 'month' && incomeWorkspaceIds.length > 0,
  })

  // ── Shared data (investments + FGTS always loaded) ───────

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

  // ── Year mode data ────────────────────────────────────────

  const { data: yearBillRecords = [] } = useQuery({
    queryKey: ['dashboard-year-bills', householdId, year],
    queryFn: async () => {
      const results = await Promise.all(
        billsWorkspaceIds.map(id => getBillRecordsForYear(supabase, id, householdId, year))
      )
      return results.flat()
    },
    enabled: viewMode === 'year' && billsWorkspaceIds.length > 0,
  })

  const { data: yearIncomeEntries = [] } = useQuery({
    queryKey: ['dashboard-year-income', householdId, year],
    queryFn: async () => {
      const results = await Promise.all(incomeWorkspaceIds.map(id => getAllIncomeEntries(supabase, id)))
      return results.flat().filter(e => e.monthKey.startsWith(`${year}-`))
    },
    enabled: viewMode === 'year' && incomeWorkspaceIds.length > 0,
  })

  const { data: allTransactions = [] } = useQuery({
    queryKey: ['dashboard-year-transactions', householdId, year],
    queryFn: async () => {
      const results = await Promise.all(investmentWorkspaceIds.map(id => getTransactionsByWorkspace(supabase, id)))
      return results.flat()
    },
    enabled: viewMode === 'year' && investmentWorkspaceIds.length > 0,
  })

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', householdId],
    queryFn: () => getGoals(supabase, householdId),
    enabled: viewMode === 'year',
  })

  // ── Month mode computed values ────────────────────────────

  const totalExpenses = allEntries.reduce((s, e) => s + e.valueCents, 0)
  const paidExpenses = allEntries.filter(e => e.status === 'paid').reduce((s, e) => s + e.valueCents, 0)
  const pendingExpenses = totalExpenses - paidExpenses
  const totalIncome = allIncome.reduce((s, e) => s + e.amountCents, 0)
  const balance = totalIncome - totalExpenses
  const netWorth = calculateNetWorth(allInvestments, allFGTS)

  const pendingBills = allEntries
    .filter(e => e.status === 'pending' || e.status === 'overdue')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8)

  const summaryCards = [
    { label: 'Receitas', value: totalIncome, color: 'text-green-600' },
    { label: 'Despesas', value: totalExpenses, color: 'text-red-600' },
    { label: 'Saldo', value: balance, color: balance >= 0 ? 'text-primary-600' : 'text-red-600' },
    { label: 'Patrimônio', value: netWorth, color: 'text-blue-600' },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <LayoutDashboard size={22} className="text-gray-500" />
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 transition-colors ${viewMode === 'month' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Mensal
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-3 py-1.5 transition-colors border-l border-gray-200 ${viewMode === 'year' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Anual
            </button>
          </div>

          {/* Month / Year navigator */}
          {viewMode === 'month' ? (
            <div className="flex items-center gap-1">
              <button onClick={() => setMonthKey(getPrevMonthKey(monthKey))} className="p-1.5 rounded-lg hover:bg-gray-100">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-32 text-center">{formatMonthYear(monthKey)}</span>
              <button onClick={() => setMonthKey(getNextMonthKey(monthKey))} className="p-1.5 rounded-lg hover:bg-gray-100">
                <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button onClick={() => setYear(y => y - 1)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-16 text-center">{year}</span>
              <button onClick={() => setYear(y => y + 1)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Year mode */}
      {viewMode === 'year' && (
        <YearView
          year={year}
          billRecords={yearBillRecords}
          investments={allInvestments}
          transactions={allTransactions}
          goals={goals}
          fgtsRecords={allFGTS}
          incomeEntries={yearIncomeEntries}
          categories={categories}
        />
      )}

      {/* Month mode */}
      {viewMode === 'month' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {summaryCards.map(card => (
              <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                <p className={`text-xl font-bold ${card.color}`}>{formatCurrency(card.value)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Contas do Mês</h2>
                <span className="text-xs text-gray-400">{allEntries.length} contas</span>
              </div>
              {allEntries.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhuma conta registrada</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Pagas</span>
                    <span className="font-semibold text-green-600">{formatCurrency(paidExpenses)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Pendentes</span>
                    <span className="font-semibold text-amber-600">{formatCurrency(pendingExpenses)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: totalExpenses > 0 ? `${(paidExpenses / totalExpenses) * 100}%` : '0%' }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-right">
                    {totalExpenses > 0 ? `${((paidExpenses / totalExpenses) * 100).toFixed(0)}% pago` : ''}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Próximas a Pagar</h2>
                <span className="text-xs text-gray-400">{pendingBills.length} pendentes</span>
              </div>
              {pendingBills.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Tudo em dia 🎉</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {pendingBills.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm text-gray-800">{entry.name}</p>
                        <p className="text-xs text-gray-400">
                          Vence {new Date(entry.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600">{formatCurrency(entry.valueCents)}</p>
                        {entry.status === 'overdue' && <span className="text-xs text-red-500">Atrasada</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ExpensePieChart bills={allEntries} categories={categories} />
            <IncomePieChart entries={allIncome} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PortfolioPieChart investments={allInvestments} />
            <ExpenseTrendChart billsByMonth={billsByMonth} categories={categories} currentMonth={monthKey} />
          </div>
        </>
      )}
    </div>
  )
}
