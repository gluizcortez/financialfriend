'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCurrency } from '@/lib/formatters'

interface MonthData {
  label: string
  total: number
  paid: number
}

interface Props {
  data: MonthData[]
}

export function AnnualBarChart({ data }: Props) {
  const chartData = data.map(d => ({
    name: d.label,
    total: d.total / 100,
    paid: d.paid / 100,
  }))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">Despesas por Mês</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
          <Tooltip formatter={(v) => formatCurrency(Number(v) * 100)} />
          <Bar dataKey="total" name="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="paid" name="Pago" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
