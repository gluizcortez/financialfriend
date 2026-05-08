import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="rounded-2xl bg-gray-100 p-4 mb-4">
        <Icon size={28} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-xs">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-200 rounded-lg px-4 py-2 hover:bg-primary-50 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
