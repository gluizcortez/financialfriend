import type {
  BillEntry, Investment, InvestmentTransaction, Goal,
  Category, MonthlyBillRecord, FGTSRecord, MonthKey, Periodicity,
} from '@/types/models'
import { getEffectiveStatus } from './billStatus'

export function calculateBillsTotals(bills: BillEntry[]) {
  const total = bills.reduce((sum, b) => sum + b.valueCents, 0)
  const paid = bills.filter(b => getEffectiveStatus(b) === 'paid').reduce((sum, b) => sum + b.valueCents, 0)
  const pending = bills.filter(b => getEffectiveStatus(b) === 'pending').reduce((sum, b) => sum + b.valueCents, 0)
  const overdue = bills.filter(b => getEffectiveStatus(b) === 'overdue').reduce((sum, b) => sum + b.valueCents, 0)
  return { total, paid, pending, overdue, count: bills.length }
}

export function calculateInvestmentsTotals(investments: Investment[], transactions: InvestmentTransaction[]) {
  const totalBalance = investments.reduce((sum, i) => sum + i.currentBalanceCents, 0)
  const totalContributions = transactions.filter(t => t.type === 'contribution').reduce((sum, t) => sum + t.amountCents, 0)
  const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amountCents, 0)
  const totalYields = transactions.filter(t => t.type === 'yield').reduce((sum, t) => sum + t.amountCents, 0)
  return { totalBalance, totalContributions, totalWithdrawals, totalYields, count: investments.length }
}

export interface GoalProgress {
  target: number
  actual: number
  percentage: number
  status: 'above' | 'below' | 'on_target'
  difference: number
}

export function normalizePeriodKey(periodKey: string, periodicity: Periodicity): string {
  const parts = periodKey.split('-').map(Number)
  const year = parts[0]
  const month = parts[1] || 1
  switch (periodicity) {
    case 'yearly': return `${year}`
    case 'semiannual': return month <= 6 ? `${year}-H1` : `${year}-H2`
    case 'quarterly': return `${year}-Q${Math.ceil(month / 3)}`
    case 'monthly': return periodKey
    default: return periodKey
  }
}

export function calculatePeriodGoalProgress(goal: Goal, periodFilter: string): GoalProgress {
  const contributions = (goal.contributions ?? []).filter(c =>
    normalizePeriodKey(c.periodKey, goal.periodicity) === periodFilter
  )
  const totalActual = contributions.reduce((sum, c) => sum + c.actualAmountCents, 0)
  const target = goal.targetAmountCents
  const percentage = target > 0 ? (totalActual / target) * 100 : 0
  const difference = totalActual - target
  const status: GoalProgress['status'] = difference > 0 ? 'above' : difference < 0 ? 'below' : 'on_target'
  return { target, actual: totalActual, percentage: Math.round(percentage * 10) / 10, status, difference }
}

export function calculateOverallGoalProgress(goal: Goal): GoalProgress {
  const periodMap = new Map<string, number>()
  for (const c of goal.contributions ?? []) {
    const key = normalizePeriodKey(c.periodKey, goal.periodicity)
    periodMap.set(key, (periodMap.get(key) || 0) + c.actualAmountCents)
  }
  const totalTarget = periodMap.size * goal.targetAmountCents
  const totalActual = [...periodMap.values()].reduce((sum, v) => sum + v, 0)
  const percentage = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0
  const difference = totalActual - totalTarget
  const status: GoalProgress['status'] = difference > 0 ? 'above' : difference < 0 ? 'below' : 'on_target'
  return { target: totalTarget, actual: totalActual, percentage: Math.round(percentage * 10) / 10, status, difference }
}

export function calculateGoalProgress(goal: Goal): GoalProgress {
  return calculateOverallGoalProgress(goal)
}

export function getCategoryTotals(bills: BillEntry[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const bill of bills) {
    if (!bill.categoryId) continue
    map.set(bill.categoryId, (map.get(bill.categoryId) || 0) + bill.valueCents)
  }
  return map
}

export interface BudgetStatus {
  categoryId: string
  budget: number
  spent: number
  percentage: number
  status: 'under' | 'near' | 'over'
}

export function calculateBudgetStatus(bills: BillEntry[], categories: Category[]): BudgetStatus[] {
  const totals = getCategoryTotals(bills)
  return categories
    .filter(c => c.budgetCents && c.budgetCents > 0)
    .map(c => {
      const spent = totals.get(c.id) || 0
      const percentage = (spent / c.budgetCents!) * 100
      const status: BudgetStatus['status'] = percentage >= 100 ? 'over' : percentage >= 80 ? 'near' : 'under'
      return { categoryId: c.id, budget: c.budgetCents!, spent, percentage, status }
    })
    .sort((a, b) => b.percentage - a.percentage)
}

export function getYearMonths(year: number): MonthKey[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
}

export function calculateYearlyTotals(billRecords: MonthlyBillRecord[], year: number) {
  const months = getYearMonths(year)
  const yearBills = billRecords
    .filter(r => months.includes(r.monthKey))
    .flatMap(r => r.entries ?? [])
  const totalExpenses = yearBills.reduce((sum, b) => sum + b.valueCents, 0)
  const categoryTotals = getCategoryTotals(yearBills)
  return { totalExpenses, categoryTotals, billCount: yearBills.length }
}

export function calculateNetWorth(investments: Investment[], fgtsRecords: FGTSRecord[]): number {
  const investTotal = investments.reduce((sum, i) => sum + i.currentBalanceCents, 0)
  const latestByHousehold = new Map<string, FGTSRecord>()
  for (const r of fgtsRecords) {
    const existing = latestByHousehold.get(r.householdId)
    if (!existing || r.monthKey > existing.monthKey) latestByHousehold.set(r.householdId, r)
  }
  const fgtsTotal = [...latestByHousehold.values()].reduce((sum, r) => sum + r.balanceCents, 0)
  return investTotal + fgtsTotal
}

export interface GoalProjection {
  estimatedDate: string | null
  avgPerPeriod: number
  periodsRemaining: number
  hasEnoughData: boolean
}

export function calculateGoalProjection(goal: Goal, investmentTransactions?: InvestmentTransaction[]): GoalProjection {
  const noData: GoalProjection = { estimatedDate: null, avgPerPeriod: 0, periodsRemaining: 0, hasEnoughData: false }
  let avgPerPeriod = 0

  if (goal.goalType === 'manual') {
    if (!goal.contributions?.length) return noData
    const periodMap = new Map<string, number>()
    for (const c of goal.contributions) {
      const key = normalizePeriodKey(c.periodKey, goal.periodicity)
      periodMap.set(key, (periodMap.get(key) || 0) + c.actualAmountCents)
    }
    if (periodMap.size < 2) return noData
    const values = [...periodMap.values()]
    avgPerPeriod = values.reduce((a, b) => a + b, 0) / values.length
  } else if (goal.goalType === 'investment_linked' && investmentTransactions) {
    const relevant = investmentTransactions.filter(tx => {
      if (tx.type !== 'contribution') return false
      if (goal.linkedInvestmentIds.length > 0) return goal.linkedInvestmentIds.includes(tx.investmentId)
      return true
    })
    const monthMap = new Map<string, number>()
    for (const tx of relevant) monthMap.set(tx.monthKey, (monthMap.get(tx.monthKey) || 0) + tx.amountCents)
    if (monthMap.size < 2) return noData
    const values = [...monthMap.values()]
    avgPerPeriod = values.reduce((a, b) => a + b, 0) / values.length
  } else {
    return noData
  }

  if (avgPerPeriod <= 0) return noData

  const periodsRemaining = Math.ceil(goal.targetAmountCents / avgPerPeriod)
  const now = new Date()
  const monthsToAdd = { monthly: 1, quarterly: 3, semiannual: 6, yearly: 12, custom: 1 }[goal.periodicity] * periodsRemaining
  const estimated = new Date(now.getFullYear(), now.getMonth() + monthsToAdd, 1)
  const estimatedDate = `${estimated.getFullYear()}-${String(estimated.getMonth() + 1).padStart(2, '0')}`

  return { estimatedDate, avgPerPeriod, periodsRemaining, hasEnoughData: true }
}

export function reconstructHistoricalBalance(
  investmentId: string,
  transactions: InvestmentTransaction[],
  upToMonth: MonthKey
): number {
  return transactions
    .filter(t => t.investmentId === investmentId && t.monthKey <= upToMonth)
    .reduce((sum, t) => (t.type === 'withdrawal' ? sum - t.amountCents : sum + t.amountCents), 0)
}
