'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCurrency } from '@/lib/formatters'
import { MONTH_NAMES_PT } from '@/lib/constants'
import { getYearMonths } from '@/lib/calculations'
import type { IncomeEntry } from '@/types/models'

interface Props {
  entries: IncomeEntry[]
  year: number
}

export function IncomeBarChart({ entries, year }: Props) {
  const months = useMemo(() => getYearMonths(year), [year])

  const chartData = useMemo(() => {
    return months.map((monthKey, i) => {
      const total = entries
        .filter(e => e.monthKey === monthKey)
        .reduce((sum, e) => sum + e.amountCents, 0)
      return { name: MONTH_NAMES_PT[i].substring(0, 3), total: total / 100 }
    })
  }, [entries, months])

  if (!chartData.some(d => d.total > 0)) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Receitas por Mês</h3>
        <p className="py-8 text-center text-sm text-gray-400">Sem dados</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">Receitas por Mês</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
          <Tooltip formatter={(v) => formatCurrency(Number(v) * 100)} />
          <Bar dataKey="total" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
