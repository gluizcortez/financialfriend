'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/formatters'
import { MONTH_NAMES_PT } from '@/lib/constants'
import { getYearMonths } from '@/lib/calculations'
import type { FGTSRecord } from '@/types/models'

interface Props {
  records: FGTSRecord[]
  year: number
}

export function FGTSLineChart({ records, year }: Props) {
  const months = useMemo(() => getYearMonths(year), [year])

  const chartData = useMemo(() => {
    return months
      .map((monthKey, i) => {
        const total = records
          .filter(r => r.monthKey === monthKey)
          .reduce((sum, r) => sum + r.balanceCents, 0)
        return { name: MONTH_NAMES_PT[i].substring(0, 3), saldo: total > 0 ? total / 100 : null }
      })
      .filter(d => d.saldo !== null)
  }, [records, months])

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Evolução FGTS no Ano</h3>
        <p className="py-8 text-center text-sm text-gray-400">Sem dados</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">Evolução FGTS no Ano</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} />
          <Tooltip formatter={(v) => formatCurrency(Math.round(Number(v) * 100))} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
          <Line type="monotone" dataKey="saldo" name="Saldo FGTS" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
