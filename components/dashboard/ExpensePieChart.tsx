'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { getCategoryTotals } from '@/lib/calculations'
import { formatCurrency } from '@/lib/formatters'
import type { BillEntry, Category } from '@/types/models'

interface Props {
  bills: BillEntry[]
  categories: Category[]
}

export function ExpensePieChart({ bills, categories }: Props) {
  const categoryTotals = getCategoryTotals(bills)

  const data = Array.from(categoryTotals.entries())
    .map(([catId, value]) => {
      const cat = categories.find(c => c.id === catId)
      return { name: cat?.name || 'Sem categoria', value, color: cat?.color || '#737373' }
    })
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Despesas por Categoria</h3>
        <p className="py-8 text-center text-sm text-gray-400">Sem dados no período</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">Despesas por Categoria</h3>
      <div className="flex items-center gap-6">
        <div className="h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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
