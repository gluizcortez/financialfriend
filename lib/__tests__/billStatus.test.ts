import { describe, it, expect } from 'vitest'
import { getEffectiveStatus, getNextToggleStatus } from '../billStatus'
import type { BillEntry } from '@/types/models'

function makeBill(overrides: Partial<BillEntry>): BillEntry {
  return {
    id: 'b1',
    monthlyRecordId: 'mr1',
    billId: null,
    householdId: 'hh1',
    name: 'Conta',
    valueCents: 10000,
    dueDate: '2099-12-31',
    status: 'pending',
    notes: '',
    categoryId: null,
    customFields: {},
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('getEffectiveStatus', () => {
  it('returns paid when status is paid, regardless of dueDate', () => {
    const bill = makeBill({ status: 'paid', dueDate: '2000-01-01' })
    expect(getEffectiveStatus(bill)).toBe('paid')
  })

  it('returns overdue when not paid and dueDate is in the past', () => {
    const bill = makeBill({ status: 'pending', dueDate: '2000-01-01' })
    expect(getEffectiveStatus(bill)).toBe('overdue')
  })

  it('returns pending when not paid and dueDate is in the future', () => {
    const bill = makeBill({ status: 'pending', dueDate: '2099-12-31' })
    expect(getEffectiveStatus(bill)).toBe('pending')
  })

  it('overdue status in DB is still overridden by paid check', () => {
    // even if stored status is 'overdue', if paid it returns paid
    const bill = makeBill({ status: 'paid', dueDate: '2000-01-01' })
    expect(getEffectiveStatus(bill)).toBe('paid')
  })
})

describe('getNextToggleStatus', () => {
  it('paid → pending', () => {
    expect(getNextToggleStatus('paid')).toBe('pending')
  })

  it('pending → paid', () => {
    expect(getNextToggleStatus('pending')).toBe('paid')
  })

  it('overdue → paid', () => {
    expect(getNextToggleStatus('overdue')).toBe('paid')
  })
})
