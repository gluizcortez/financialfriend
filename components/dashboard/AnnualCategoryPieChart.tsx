'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/formatters'
import type { Category } from '@/types/models'

interface Props {
  categoryTotals: Map<string, number>
  categories: Category[]
}

export function AnnualCategoryPieChart({ categoryTotals, categories }: Props) {
  const data = categories
    .filter(c => categoryTotals.has(c.id) && (categoryTotals.get(c.id) ?? 0) > 0)
    .map(c => ({
      name: c.name,
      value: (categoryTotals.get(c.id) ?? 0) / 100,
      color: c.color,
    }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Despesas por Categoria (Ano)</h3>
        <p className="py-8 text-center text-sm text-gray-400">Sem dados</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">Despesas por Categoria (Ano)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatCurrency(Number(v) * 100)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
