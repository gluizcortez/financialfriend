'use client'

import { useMemo } from 'react'
import { AnnualBarChart } from './AnnualBarChart'
import { AnnualCategoryPieChart } from './AnnualCategoryPieChart'
import { IncomeBarChart } from './IncomeBarChart'
import { FGTSLineChart } from './FGTSLineChart'
import { formatCurrency } from '@/lib/formatters'
import { getYearMonths, getCategoryTotals, calculateInvestmentsTotals, calculateOverallGoalProgress } from '@/lib/calculations'
import { MONTH_NAMES_PT } from '@/lib/constants'
import { INCOME_CATEGORY_LABELS } from '@/types/models'
import type { MonthlyBillRecord, Investment, InvestmentTransaction, Goal, FGTSRecord, IncomeEntry, Category, IncomeCategory } from '@/types/models'

interface Props {
  year: number
  billRecords: MonthlyBillRecord[]
  investments: Investment[]
  transactions: InvestmentTransaction[]
  goals: Goal[]
  fgtsRecords: FGTSRecord[]
  incomeEntries: IncomeEntry[]
  categories: Category[]
}

export function YearView({ year, billRecords, investments, transactions, goals, fgtsRecords, incomeEntries, categories }: Props) {
  const months = useMemo(() => getYearMonths(year), [year])

  const monthlyBillData = useMemo(() => {
    return months.map((monthKey, i) => {
      const entries = billRecords.filter(r => r.monthKey === monthKey).flatMap(r => r.entries ?? [])
      const total = entries.reduce((sum, b) => sum + b.valueCents, 0)
      const paid = entries.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.valueCents, 0)
      return { monthKey, label: MONTH_NAMES_PT[i].substring(0, 3), total, paid, count: entries.length }
    })
  }, [months, billRecords])

  const yearBills = useMemo(
    () => billRecords.filter(r => months.includes(r.monthKey)).flatMap(r => r.entries ?? []),
    [billRecords, months]
  )
  const yearExpenses = yearBills.reduce((sum, b) => sum + b.valueCents, 0)
  const yearPaid = yearBills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.valueCents, 0)
  const avgMonthly = yearExpenses / 12
  const categoryTotals = useMemo(() => getCategoryTotals(yearBills), [yearBills])

  const yearTransactions = useMemo(
    () => transactions.filter(t => months.includes(t.monthKey)),
    [transactions, months]
  )
  const investTotals = useMemo(
    () => calculateInvestmentsTotals(investments, yearTransactions),
    [investments, yearTransactions]
  )

  const yearFGTSMonthlyTotals = useMemo(() => {
    return months
      .map(monthKey => fgtsRecords.filter(r => r.monthKey === monthKey).reduce((sum, r) => sum + r.balanceCents, 0))
      .filter(total => total > 0)
  }, [fgtsRecords, months])
  const latestFGTS = yearFGTSMonthlyTotals[yearFGTSMonthlyTotals.length - 1] ?? 0
  const firstFGTS = yearFGTSMonthlyTotals[0] ?? 0
  const fgtsGrowth = latestFGTS - firstFGTS

  const yearIncome = useMemo(
    () => incomeEntries.filter(e => months.includes(e.monthKey)),
    [incomeEntries, months]
  )
  const totalIncome = yearIncome.reduce((sum, e) => sum + e.amountCents, 0)
  const incomeByCategory = useMemo(() => {
    const map = new Map<IncomeCategory, number>()
    for (const entry of yearIncome) {
      map.set(entry.category, (map.get(entry.category) ?? 0) + entry.amountCents)
    }
    return map
  }, [yearIncome])

  const activeGoals = goals.filter(g => g.isActive)
  const onTrackGoals = activeGoals.filter(g => {
    if (!g.contributions?.length) return false
    return calculateOverallGoalProgress(g).status !== 'below'
  })

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Despesas</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(yearExpenses)}</p>
          <p className="text-xs text-gray-400">{yearBills.length} contas</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-xs font-medium text-green-600 uppercase">Total Pago</p>
          <p className="mt-1 text-xl font-bold text-green-700">{formatCurrency(yearPaid)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Média Mensal</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(avgMonthly)}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-medium text-emerald-600 uppercase">Total Receitas</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatCurrency(totalIncome)}</p>
          <p className="text-xs text-emerald-500">{yearIncome.length} entrada(s)</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-medium text-blue-600 uppercase">Investimentos</p>
          <p className="mt-1 text-xl font-bold text-blue-700">{formatCurrency(investTotals.totalContributions)}</p>
          <p className="text-xs text-blue-500">aportado no ano</p>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <p className="text-xs font-medium text-purple-600 uppercase">Metas no Alvo</p>
          <p className="mt-1 text-xl font-bold text-purple-700">{onTrackGoals.length}/{activeGoals.length}</p>
          <p className="text-xs text-purple-500">metas ativas</p>
        </div>
      </div>

      {/* Annual balance bar */}
      {totalIncome > 0 && yearExpenses > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Balanço do Ano</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-emerald-600">Receitas: {formatCurrency(totalIncome)}</span>
                <span className="text-gray-500">Despesas: {formatCurrency(yearExpenses)}</span>
              </div>
              <div className="relative h-4 w-full overflow-hidden rounded-full bg-red-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min((totalIncome / (totalIncome + yearExpenses)) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${totalIncome - yearExpenses >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {totalIncome - yearExpenses >= 0 ? '+' : ''}{formatCurrency(totalIncome - yearExpenses)}
              </p>
              <p className="text-xs text-gray-400">saldo</p>
            </div>
          </div>
        </div>
      )}

      {/* Bills charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AnnualBarChart data={monthlyBillData} />
        <AnnualCategoryPieChart categoryTotals={categoryTotals} categories={categories} />
      </div>

      {/* Income + FGTS charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <IncomeBarChart entries={yearIncome} year={year} />
        <FGTSLineChart records={fgtsRecords} year={year} />
      </div>

      {/* Investments summary */}
      {yearTransactions.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Investimentos no Ano</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-xs text-blue-600">Total Aportado</p>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(investTotals.totalContributions)}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs text-amber-600">Rendimentos</p>
              <p className="text-lg font-bold text-amber-700">{formatCurrency(investTotals.totalYields)}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-xs text-red-600">Retiradas</p>
              <p className="text-lg font-bold text-red-700">{formatCurrency(investTotals.totalWithdrawals)}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-xs text-green-600">Saldo Total</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(investTotals.totalBalance)}</p>
            </div>
          </div>
        </div>
      )}

      {/* FGTS summary */}
      {yearFGTSMonthlyTotals.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">FGTS no Ano</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Saldo Atual</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(latestFGTS)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Saldo Inicial (Ano)</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(firstFGTS)}</p>
            </div>
            <div className={`rounded-lg p-3 ${fgtsGrowth >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-xs ${fgtsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>Variação</p>
              <p className={`text-lg font-bold ${fgtsGrowth >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {fgtsGrowth >= 0 ? '+' : ''}{formatCurrency(fgtsGrowth)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Income by category */}
      {incomeByCategory.size > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Receitas por Categoria no Ano</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from(incomeByCategory.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => (
                <div key={cat} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{INCOME_CATEGORY_LABELS[cat]}</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(amount)}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
