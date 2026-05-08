'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCurrency, formatMonthYear, getPrevMonthKey } from '@/lib/formatters'
import { getCategoryTotals } from '@/lib/calculations'
import type { BillEntry, Category, MonthKey } from '@/types/models'

function getLast6Months(current: MonthKey): MonthKey[] {
  const months: MonthKey[] = []
  let m = current
  for (let i = 0; i < 6; i++) {
    months.unshift(m)
    m = getPrevMonthKey(m)
  }
  return months
}

interface Props {
  billsByMonth: Map<MonthKey, BillEntry[]>
  categories: Category[]
  currentMonth: MonthKey
}

export function ExpenseTrendChart({ billsByMonth, categories, currentMonth }: Props) {
  const months = useMemo(() => getLast6Months(currentMonth), [currentMonth])
  const billCategories = useMemo(() => categories.filter(c => c.type === 'bill' || c.type === 'both'), [categories])

  const data = useMemo(() => {
    return months.map(monthKey => {
      const bills = billsByMonth.get(monthKey) ?? []
      const totals = getCategoryTotals(bills)
      const point: Record<string, number | string> = { month: formatMonthYear(monthKey) }
      for (const cat of billCategories) point[cat.id] = (totals.get(cat.id) || 0) / 100
      return point
    })
  }, [months, billsByMonth, billCategories])

  const activeCategories = useMemo(() =>
    billCategories.filter(cat => data.some(p => (p[cat.id] as number) > 0)),
    [data, billCategories]
  )

  if (activeCategories.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Tendência de Despesas (6 meses)</h3>
        <p className="py-8 text-center text-sm text-gray-400">Sem dados suficientes</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">Tendência de Despesas (6 meses)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
          <Tooltip
            formatter={(value, name) => {
              const cat = categories.find(c => c.id === String(name))
              return [formatCurrency(Number(value) * 100), cat?.name || String(name)]
            }}
          />
          {activeCategories.map(cat => (
            <Line key={cat.id} type="monotone" dataKey={cat.id} stroke={cat.color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
