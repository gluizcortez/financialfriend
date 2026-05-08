'use client'

import { X } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'

export function Notifications() {
  const { notifications, removeNotification } = useUIStore()

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm ${
            n.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : n.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <span className="flex-1">{n.message}</span>
          {n.action && (
            <button
              onClick={n.action.onClick}
              className="font-medium underline whitespace-nowrap hover:no-underline"
            >
              {n.action.label}
            </button>
          )}
          <button
            onClick={() => removeNotification(n.id)}
            className="shrink-0 opacity-60 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
