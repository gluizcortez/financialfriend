'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/formatters'
import { INCOME_CATEGORY_LABELS } from '@/types/models'
import type { IncomeEntry, IncomeCategory } from '@/types/models'

const CATEGORY_COLORS: Record<IncomeCategory, string> = {
  salary: '#10b981',
  freelance: '#3b82f6',
  investments: '#8b5cf6',
  bonus: '#f59e0b',
  other: '#6b7280',
}

interface Props { entries: IncomeEntry[] }

export function IncomePieChart({ entries }: Props) {
  const data = useMemo(() => {
    const map = new Map<IncomeCategory, number>()
    for (const e of entries) map.set(e.category, (map.get(e.category) || 0) + e.amountCents)
    return Array.from(map.entries())
      .map(([cat, value]) => ({ name: INCOME_CATEGORY_LABELS[cat], value, color: CATEGORY_COLORS[cat] }))
      .sort((a, b) => b.value - a.value)
  }, [entries])

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Receitas por Categoria</h3>
        <p className="py-8 text-center text-sm text-gray-400">Sem receitas no período</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">Receitas por Categoria</h3>
      <div className="flex items-center gap-6">
        <div className="h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                {data.map((_, i) => <Cell key={i} fill={data[i].color} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map(item => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
              <span className="text-xs font-medium text-gray-700">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
