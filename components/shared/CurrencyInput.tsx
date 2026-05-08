'use client'

import { useState, useCallback } from 'react'
import { parseCurrencyInput, formatCurrency } from '@/lib/formatters'

interface Props {
  valueCents: number
  onChange: (cents: number) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export function CurrencyInput({ valueCents, onChange, placeholder = 'R$ 0,00', className = '', required }: Props) {
  const [raw, setRaw] = useState(valueCents > 0 ? (valueCents / 100).toFixed(2).replace('.', ',') : '')

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setRaw(value)
    onChange(parseCurrencyInput(value))
  }, [onChange])

  const handleBlur = useCallback(() => {
    if (valueCents > 0) {
      setRaw((valueCents / 100).toFixed(2).replace('.', ','))
    }
  }, [valueCents])

  return (
    <input
      type="text"
      inputMode="decimal"
      value={raw}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      required={required}
      className={`rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${className}`}
    />
  )
}
