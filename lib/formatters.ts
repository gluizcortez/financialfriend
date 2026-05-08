import { MONTH_NAMES_PT } from './constants'

export function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function parseCurrencyInput(input: string): number {
  const cleaned = input.replace(/[^\d,.-]/g, '').replace(',', '.')
  const value = parseFloat(cleaned)
  if (isNaN(value)) return 0
  return Math.round(value * 100)
}

export function formatMonthYear(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  return `${MONTH_NAMES_PT[month - 1]} ${year}`
}

export function getCurrentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getNextMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  if (month === 12) return `${year + 1}-01`
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

export function getPrevMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  if (month === 1) return `${year - 1}-12`
  return `${year}-${String(month - 1).padStart(2, '0')}`
}

export function formatDate(isoDate: string): string {
  const parts = isoDate.split('T')[0].split('-')
  if (parts.length === 3) {
    const [y, m, d] = parts
    return `${d}/${m}/${y}`
  }
  return new Date(isoDate).toLocaleDateString('pt-BR')
}

export function formatCompactNumber(cents: number): string {
  const value = cents / 100
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}K`
  return formatCurrency(cents)
}

export function getYearFromMonthKey(monthKey: string): number {
  return parseInt(monthKey.split('-')[0], 10)
}

export function getMonthFromMonthKey(monthKey: string): number {
  return parseInt(monthKey.split('-')[1], 10)
}

export function getMaxDayInMonth(monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month, 0).getDate()
}
