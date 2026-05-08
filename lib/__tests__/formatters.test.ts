import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  parseCurrencyInput,
  formatMonthYear,
  getNextMonthKey,
  getPrevMonthKey,
  formatDate,
  formatCompactNumber,
  getYearFromMonthKey,
  getMonthFromMonthKey,
  getMaxDayInMonth,
} from '../formatters'

describe('formatCurrency', () => {
  it('formats zero', () => {
    expect(formatCurrency(0)).toContain('0')
  })

  it('formats centavos as reais with pt-BR style', () => {
    const result = formatCurrency(150000) // R$ 1.500,00
    expect(result).toContain('1')
    expect(result).toContain('500')
  })

  it('formats small amounts correctly', () => {
    const result = formatCurrency(99) // R$ 0,99
    expect(result).toContain('0')
    expect(result).toContain('99')
  })
})

describe('parseCurrencyInput', () => {
  it('parses decimal with dot', () => {
    expect(parseCurrencyInput('15.50')).toBe(1550)
  })

  it('parses decimal with comma (pt-BR style)', () => {
    expect(parseCurrencyInput('15,50')).toBe(1550)
  })

  it('parses integer', () => {
    expect(parseCurrencyInput('100')).toBe(10000)
  })

  it('strips currency symbols and spaces', () => {
    expect(parseCurrencyInput('R$ 25,00')).toBe(2500)
  })

  it('returns 0 for empty or invalid input', () => {
    expect(parseCurrencyInput('')).toBe(0)
    expect(parseCurrencyInput('abc')).toBe(0)
  })
})

describe('formatMonthYear', () => {
  it('formats January correctly', () => {
    expect(formatMonthYear('2024-01')).toBe('Janeiro 2024')
  })

  it('formats December correctly', () => {
    expect(formatMonthYear('2024-12')).toBe('Dezembro 2024')
  })

  it('formats mid-year month', () => {
    expect(formatMonthYear('2024-07')).toBe('Julho 2024')
  })
})

describe('getNextMonthKey', () => {
  it('increments month normally', () => {
    expect(getNextMonthKey('2024-05')).toBe('2024-06')
  })

  it('wraps December to January of next year', () => {
    expect(getNextMonthKey('2024-12')).toBe('2025-01')
  })

  it('zero-pads single-digit months', () => {
    expect(getNextMonthKey('2024-08')).toBe('2024-09')
  })
})

describe('getPrevMonthKey', () => {
  it('decrements month normally', () => {
    expect(getPrevMonthKey('2024-05')).toBe('2024-04')
  })

  it('wraps January to December of previous year', () => {
    expect(getPrevMonthKey('2024-01')).toBe('2023-12')
  })

  it('zero-pads single-digit months', () => {
    expect(getPrevMonthKey('2024-10')).toBe('2024-09')
  })
})

describe('formatDate', () => {
  it('formats ISO date string to DD/MM/YYYY', () => {
    expect(formatDate('2024-03-15')).toBe('15/03/2024')
  })

  it('handles datetime strings by taking the date part', () => {
    expect(formatDate('2024-03-15T10:30:00Z')).toBe('15/03/2024')
  })
})

describe('formatCompactNumber', () => {
  it('formats values under 1000 as currency', () => {
    const result = formatCompactNumber(50000) // R$ 500,00
    expect(result).toContain('500')
  })

  it('formats values >= 1000 reais with K', () => {
    const result = formatCompactNumber(200000) // R$ 2.000 → 2.0K
    expect(result).toContain('K')
  })

  it('formats values >= 1M reais with M', () => {
    const result = formatCompactNumber(150000000) // R$ 1.500.000 → 1.5M
    expect(result).toContain('M')
  })
})

describe('getYearFromMonthKey', () => {
  it('extracts the year', () => {
    expect(getYearFromMonthKey('2024-07')).toBe(2024)
  })
})

describe('getMonthFromMonthKey', () => {
  it('extracts the month as a number', () => {
    expect(getMonthFromMonthKey('2024-07')).toBe(7)
    expect(getMonthFromMonthKey('2024-01')).toBe(1)
  })
})

describe('getMaxDayInMonth', () => {
  it('returns 31 for January', () => {
    expect(getMaxDayInMonth('2024-01')).toBe(31)
  })

  it('returns 28 for February in a non-leap year', () => {
    expect(getMaxDayInMonth('2023-02')).toBe(28)
  })

  it('returns 29 for February in a leap year', () => {
    expect(getMaxDayInMonth('2024-02')).toBe(29)
  })

  it('returns 30 for April', () => {
    expect(getMaxDayInMonth('2024-04')).toBe(30)
  })
})
