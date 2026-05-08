import { BILL_STATUS_LABELS } from '@/lib/constants'

interface Props {
  status: 'pending' | 'paid' | 'overdue'
}

export function StatusBadge({ status }: Props) {
  const styles = {
    paid: 'bg-green-50 text-green-700 border-green-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {BILL_STATUS_LABELS[status]}
    </span>
  )
}
