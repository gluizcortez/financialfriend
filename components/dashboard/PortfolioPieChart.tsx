'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/formatters'
import type { Investment } from '@/types/models'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

interface Props { investments: Investment[] }

export function PortfolioPieChart({ investments }: Props) {
  const data = useMemo(() =>
    investments
      .filter(i => i.currentBalanceCents > 0)
      .map((i, idx) => ({ name: i.name, value: i.currentBalanceCents, color: COLORS[idx % COLORS.length] }))
      .sort((a, b) => b.value - a.value),
    [investments]
  )

  const total = data.reduce((s, d) => s + d.value, 0)

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Alocação da Carteira</h3>
        <p className="py-8 text-center text-sm text-gray-400">Sem investimentos com saldo</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">Alocação da Carteira</h3>
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
                <span className="text-xs text-gray-600 truncate max-w-24">{item.name}</span>
              </div>
              <span className="text-xs font-medium text-gray-700">{total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
