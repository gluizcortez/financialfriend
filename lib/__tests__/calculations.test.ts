import { describe, it, expect } from 'vitest'
import {
  calculateBillsTotals,
  calculateInvestmentsTotals,
  normalizePeriodKey,
  calculatePeriodGoalProgress,
  calculateOverallGoalProgress,
  getCategoryTotals,
  calculateBudgetStatus,
  getYearMonths,
  calculateNetWorth,
  reconstructHistoricalBalance,
} from '../calculations'
import type { BillEntry, Investment, InvestmentTransaction, Goal, Category, FGTSRecord } from '@/types/models'

// ─── Factories ───────────────────────────────────────────────────────────────

function makeBill(overrides: Partial<BillEntry> = {}): BillEntry {
  return {
    id: 'b1',
    monthlyRecordId: 'mr1',
    billId: null,
    householdId: 'hh1',
    name: 'Conta',
    valueCents: 10000,
    dueDate: '2099-12-31',
    status: 'pending',
    notes: '',
    categoryId: null,
    customFields: {},
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

function makeInvestment(overrides: Partial<Investment> = {}): Investment {
  return {
    id: 'inv1',
    householdId: 'hh1',
    name: 'CDB',
    type: 'renda_fixa',
    currentBalanceCents: 100000,
    notes: '',
    isActive: true,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

function makeTx(overrides: Partial<InvestmentTransaction> = {}): InvestmentTransaction {
  return {
    id: 'tx1',
    investmentId: 'inv1',
    householdId: 'hh1',
    type: 'contribution',
    amountCents: 50000,
    monthKey: '2024-01',
    date: '2024-01-15',
    notes: '',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g1',
    householdId: 'hh1',
    name: 'Meta',
    description: '',
    goalType: 'manual',
    targetAmountCents: 100000,
    periodicity: 'monthly',
    startDate: '2024-01-01',
    linkedInvestmentIds: [],
    contributions: [],
    isActive: true,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat1',
    householdId: 'hh1',
    name: 'Moradia',
    color: '#6366f1',
    type: 'bill',
    isDefault: false,
    sortOrder: 0,
    budgetCents: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

function makeFGTS(overrides: Partial<FGTSRecord> = {}): FGTSRecord {
  return {
    id: 'f1',
    householdId: 'hh1',
    monthKey: '2024-01',
    balanceCents: 50000,
    notes: '',
    date: '2024-01-31',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

// ─── calculateBillsTotals ─────────────────────────────────────────────────────

describe('calculateBillsTotals', () => {
  it('returns zeros for empty array', () => {
    expect(calculateBillsTotals([])).toEqual({ total: 0, paid: 0, pending: 0, overdue: 0, count: 0 })
  })

  it('sums total of all bills', () => {
    const bills = [makeBill({ valueCents: 30000 }), makeBill({ id: 'b2', valueCents: 20000 })]
    expect(calculateBillsTotals(bills).total).toBe(50000)
  })

  it('separates paid, pending, overdue correctly', () => {
    const bills = [
      makeBill({ status: 'paid', valueCents: 10000 }),
      makeBill({ id: 'b2', status: 'pending', valueCents: 20000, dueDate: '2099-12-31' }),
      makeBill({ id: 'b3', status: 'pending', valueCents: 5000, dueDate: '2000-01-01' }), // overdue by date
    ]
    const result = calculateBillsTotals(bills)
    expect(result.paid).toBe(10000)
    expect(result.pending).toBe(20000)
    expect(result.overdue).toBe(5000)
    expect(result.count).toBe(3)
  })
})

// ─── calculateInvestmentsTotals ───────────────────────────────────────────────

describe('calculateInvestmentsTotals', () => {
  it('returns zeros for empty inputs', () => {
    expect(calculateInvestmentsTotals([], [])).toEqual({
      totalBalance: 0, totalContributions: 0, totalWithdrawals: 0, totalYields: 0, count: 0,
    })
  })

  it('sums balance across all investments', () => {
    const investments = [makeInvestment({ currentBalanceCents: 100000 }), makeInvestment({ id: 'inv2', currentBalanceCents: 50000 })]
    expect(calculateInvestmentsTotals(investments, []).totalBalance).toBe(150000)
  })

  it('splits transactions by type', () => {
    const txs = [
      makeTx({ type: 'contribution', amountCents: 30000 }),
      makeTx({ id: 'tx2', type: 'withdrawal', amountCents: 10000 }),
      makeTx({ id: 'tx3', type: 'yield', amountCents: 5000 }),
      makeTx({ id: 'tx4', type: 'contribution', amountCents: 20000 }),
    ]
    const result = calculateInvestmentsTotals([], txs)
    expect(result.totalContributions).toBe(50000)
    expect(result.totalWithdrawals).toBe(10000)
    expect(result.totalYields).toBe(5000)
  })
})

// ─── normalizePeriodKey ───────────────────────────────────────────────────────

describe('normalizePeriodKey', () => {
  it('monthly returns the key unchanged', () => {
    expect(normalizePeriodKey('2024-03', 'monthly')).toBe('2024-03')
  })

  it('yearly returns only the year', () => {
    expect(normalizePeriodKey('2024-07', 'yearly')).toBe('2024')
  })

  it('semiannual: Jan-Jun → H1, Jul-Dec → H2', () => {
    expect(normalizePeriodKey('2024-01', 'semiannual')).toBe('2024-H1')
    expect(normalizePeriodKey('2024-06', 'semiannual')).toBe('2024-H1')
    expect(normalizePeriodKey('2024-07', 'semiannual')).toBe('2024-H2')
    expect(normalizePeriodKey('2024-12', 'semiannual')).toBe('2024-H2')
  })

  it('quarterly groups months into quarters', () => {
    expect(normalizePeriodKey('2024-01', 'quarterly')).toBe('2024-Q1')
    expect(normalizePeriodKey('2024-03', 'quarterly')).toBe('2024-Q1')
    expect(normalizePeriodKey('2024-04', 'quarterly')).toBe('2024-Q2')
    expect(normalizePeriodKey('2024-09', 'quarterly')).toBe('2024-Q3')
    expect(normalizePeriodKey('2024-10', 'quarterly')).toBe('2024-Q4')
    expect(normalizePeriodKey('2024-12', 'quarterly')).toBe('2024-Q4')
  })
})

// ─── calculatePeriodGoalProgress ─────────────────────────────────────────────

describe('calculatePeriodGoalProgress', () => {
  it('returns zero progress with no contributions', () => {
    const goal = makeGoal({ targetAmountCents: 100000, contributions: [] })
    const result = calculatePeriodGoalProgress(goal, '2024-01')
    expect(result.actual).toBe(0)
    expect(result.percentage).toBe(0)
    expect(result.status).toBe('below')
  })

  it('filters contributions by normalized period', () => {
    const goal = makeGoal({
      targetAmountCents: 100000,
      periodicity: 'monthly',
      contributions: [
        { id: 'c1', goalId: 'g1', householdId: 'hh1', periodKey: '2024-01', targetAmountCents: 100000, actualAmountCents: 80000, date: '', notes: '', createdAt: '', updatedAt: '' },
        { id: 'c2', goalId: 'g1', householdId: 'hh1', periodKey: '2024-02', targetAmountCents: 100000, actualAmountCents: 50000, date: '', notes: '', createdAt: '', updatedAt: '' },
      ],
    })
    const result = calculatePeriodGoalProgress(goal, '2024-01')
    expect(result.actual).toBe(80000)
    expect(result.percentage).toBe(80)
    expect(result.status).toBe('below')
    expect(result.difference).toBe(-20000)
  })

  it('reports above when actual exceeds target', () => {
    const goal = makeGoal({
      targetAmountCents: 50000,
      contributions: [
        { id: 'c1', goalId: 'g1', householdId: 'hh1', periodKey: '2024-01', targetAmountCents: 50000, actualAmountCents: 60000, date: '', notes: '', createdAt: '', updatedAt: '' },
      ],
    })
    const result = calculatePeriodGoalProgress(goal, '2024-01')
    expect(result.status).toBe('above')
    expect(result.difference).toBe(10000)
  })

  it('reports on_target when actual equals target', () => {
    const goal = makeGoal({
      targetAmountCents: 50000,
      contributions: [
        { id: 'c1', goalId: 'g1', householdId: 'hh1', periodKey: '2024-01', targetAmountCents: 50000, actualAmountCents: 50000, date: '', notes: '', createdAt: '', updatedAt: '' },
      ],
    })
    expect(calculatePeriodGoalProgress(goal, '2024-01').status).toBe('on_target')
  })
})

// ─── calculateOverallGoalProgress ────────────────────────────────────────────

describe('calculateOverallGoalProgress', () => {
  it('aggregates contributions across multiple periods', () => {
    const goal = makeGoal({
      targetAmountCents: 100000,
      periodicity: 'monthly',
      contributions: [
        { id: 'c1', goalId: 'g1', householdId: 'hh1', periodKey: '2024-01', targetAmountCents: 100000, actualAmountCents: 80000, date: '', notes: '', createdAt: '', updatedAt: '' },
        { id: 'c2', goalId: 'g1', householdId: 'hh1', periodKey: '2024-02', targetAmountCents: 100000, actualAmountCents: 120000, date: '', notes: '', createdAt: '', updatedAt: '' },
      ],
    })
    const result = calculateOverallGoalProgress(goal)
    expect(result.target).toBe(200000) // 2 periods × 100000
    expect(result.actual).toBe(200000) // 80000 + 120000
    expect(result.status).toBe('on_target')
  })
})

// ─── getCategoryTotals ────────────────────────────────────────────────────────

describe('getCategoryTotals', () => {
  it('returns empty map for empty array', () => {
    expect(getCategoryTotals([]).size).toBe(0)
  })

  it('excludes bills without category', () => {
    const bills = [makeBill({ categoryId: null, valueCents: 10000 })]
    expect(getCategoryTotals(bills).size).toBe(0)
  })

  it('groups and sums by category', () => {
    const bills = [
      makeBill({ categoryId: 'cat1', valueCents: 30000 }),
      makeBill({ id: 'b2', categoryId: 'cat1', valueCents: 20000 }),
      makeBill({ id: 'b3', categoryId: 'cat2', valueCents: 15000 }),
    ]
    const map = getCategoryTotals(bills)
    expect(map.get('cat1')).toBe(50000)
    expect(map.get('cat2')).toBe(15000)
  })
})

// ─── calculateBudgetStatus ────────────────────────────────────────────────────

describe('calculateBudgetStatus', () => {
  it('excludes categories without budget', () => {
    const bills = [makeBill({ categoryId: 'cat1', valueCents: 50000 })]
    const cats = [makeCategory({ id: 'cat1', budgetCents: null })]
    expect(calculateBudgetStatus(bills, cats)).toHaveLength(0)
  })

  it('reports under when < 80% of budget', () => {
    const bills = [makeBill({ categoryId: 'cat1', valueCents: 50000 })]
    const cats = [makeCategory({ id: 'cat1', budgetCents: 100000 })]
    const result = calculateBudgetStatus(bills, cats)
    expect(result[0].status).toBe('under')
    expect(result[0].percentage).toBe(50)
  })

  it('reports near when >= 80% but < 100% of budget', () => {
    const bills = [makeBill({ categoryId: 'cat1', valueCents: 85000 })]
    const cats = [makeCategory({ id: 'cat1', budgetCents: 100000 })]
    expect(calculateBudgetStatus(bills, cats)[0].status).toBe('near')
  })

  it('reports over when >= 100% of budget', () => {
    const bills = [makeBill({ categoryId: 'cat1', valueCents: 110000 })]
    const cats = [makeCategory({ id: 'cat1', budgetCents: 100000 })]
    expect(calculateBudgetStatus(bills, cats)[0].status).toBe('over')
  })

  it('sorts results by percentage descending', () => {
    const bills = [
      makeBill({ categoryId: 'cat1', valueCents: 20000 }),
      makeBill({ id: 'b2', categoryId: 'cat2', valueCents: 90000 }),
    ]
    const cats = [
      makeCategory({ id: 'cat1', budgetCents: 100000 }),
      makeCategory({ id: 'cat2', budgetCents: 100000 }),
    ]
    const result = calculateBudgetStatus(bills, cats)
    expect(result[0].categoryId).toBe('cat2')
    expect(result[1].categoryId).toBe('cat1')
  })
})

// ─── getYearMonths ────────────────────────────────────────────────────────────

describe('getYearMonths', () => {
  it('returns 12 months in YYYY-MM format', () => {
    const months = getYearMonths(2024)
    expect(months).toHaveLength(12)
    expect(months[0]).toBe('2024-01')
    expect(months[11]).toBe('2024-12')
  })

  it('zero-pads single-digit months', () => {
    const months = getYearMonths(2024)
    expect(months[8]).toBe('2024-09')
  })
})

// ─── calculateNetWorth ────────────────────────────────────────────────────────

describe('calculateNetWorth', () => {
  it('returns 0 for empty inputs', () => {
    expect(calculateNetWorth([], [])).toBe(0)
  })

  it('sums investment balances', () => {
    const investments = [
      makeInvestment({ currentBalanceCents: 100000 }),
      makeInvestment({ id: 'inv2', currentBalanceCents: 50000 }),
    ]
    expect(calculateNetWorth(investments, [])).toBe(150000)
  })

  it('uses only the latest FGTS record per household', () => {
    const fgts: FGTSRecord[] = [
      makeFGTS({ id: 'f1', householdId: 'hh1', monthKey: '2024-01', balanceCents: 40000 }),
      makeFGTS({ id: 'f2', householdId: 'hh1', monthKey: '2024-06', balanceCents: 60000 }), // latest for hh1
      makeFGTS({ id: 'f3', householdId: 'hh2', monthKey: '2024-03', balanceCents: 20000 }),
    ]
    expect(calculateNetWorth([], fgts)).toBe(80000) // 60000 (hh1 latest) + 20000 (hh2)
  })

  it('combines investments and FGTS', () => {
    const investments = [makeInvestment({ currentBalanceCents: 100000 })]
    const fgts = [makeFGTS({ balanceCents: 50000 })]
    expect(calculateNetWorth(investments, fgts)).toBe(150000)
  })
})

// ─── reconstructHistoricalBalance ─────────────────────────────────────────────

describe('reconstructHistoricalBalance', () => {
  it('returns 0 when no transactions match', () => {
    expect(reconstructHistoricalBalance('inv1', [], '2024-06')).toBe(0)
  })

  it('sums contributions and yields, subtracts withdrawals', () => {
    const txs = [
      makeTx({ type: 'contribution', amountCents: 50000, monthKey: '2024-01' }),
      makeTx({ id: 'tx2', type: 'yield', amountCents: 5000, monthKey: '2024-02' }),
      makeTx({ id: 'tx3', type: 'withdrawal', amountCents: 10000, monthKey: '2024-03' }),
    ]
    expect(reconstructHistoricalBalance('inv1', txs, '2024-12')).toBe(45000)
  })

  it('excludes transactions after upToMonth', () => {
    const txs = [
      makeTx({ type: 'contribution', amountCents: 30000, monthKey: '2024-01' }),
      makeTx({ id: 'tx2', type: 'contribution', amountCents: 20000, monthKey: '2024-06' }),
    ]
    expect(reconstructHistoricalBalance('inv1', txs, '2024-03')).toBe(30000)
  })

  it('excludes transactions for other investments', () => {
    const txs = [
      makeTx({ investmentId: 'inv1', amountCents: 30000 }),
      makeTx({ id: 'tx2', investmentId: 'inv2', amountCents: 50000 }),
    ]
    expect(reconstructHistoricalBalance('inv1', txs, '2024-12')).toBe(30000)
  })
})
