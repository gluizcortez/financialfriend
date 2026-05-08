import type { BillEntry, BillStatus } from '@/types/models'

export function getEffectiveStatus(entry: BillEntry): BillStatus {
  if (entry.status === 'paid') return 'paid'
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (entry.dueDate < todayStr) return 'overdue'
  return 'pending'
}

export function getNextToggleStatus(effectiveStatus: BillStatus): BillStatus {
  return effectiveStatus === 'paid' ? 'pending' : 'paid'
}
