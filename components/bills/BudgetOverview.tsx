'use client'

import { useMemo } from 'react'
import { calculateBudgetStatus } from '@/lib/calculations'
import { formatCurrency } from '@/lib/formatters'
import type { BillEntry, Category } from '@/types/models'

interface Props {
  bills: BillEntry[]
  categories: Category[]
}

export function BudgetOverview({ bills, categories }: Props) {
  const budgets = useMemo(() => calculateBudgetStatus(bills, categories), [bills, categories])

  if (budgets.length === 0) return null

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Orçamento por Categoria</h3>
      <div className="space-y-3">
        {budgets.map(b => {
          const cat = categories.find(c => c.id === b.categoryId)
          const pct = Math.min(b.percentage, 100)
          const barColor = b.status === 'over' ? 'bg-red-500' : b.status === 'near' ? 'bg-amber-500' : 'bg-green-500'

          return (
            <div key={b.categoryId}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat?.color }} />
                  <span className="text-xs font-medium text-gray-700">{cat?.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatCurrency(b.spent)} / {formatCurrency(b.budget)}
                  <span className={`ml-1.5 font-semibold ${
                    b.status === 'over' ? 'text-red-600' : b.status === 'near' ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    ({Math.round(b.percentage)}%)
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
