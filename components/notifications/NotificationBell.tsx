'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getUnreadNotificationCount } from '@/lib/supabase/queries/workspaces'
import { NotificationsModal } from './NotificationsModal'

interface Props {
  userId: string
  collapsed?: boolean
}

export function NotificationBell({ userId, collapsed }: Props) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  const { data: count = 0, refetch } = useQuery({
    queryKey: ['notifications-count', userId],
    queryFn: () => getUnreadNotificationCount(supabase, userId),
    refetchInterval: 30000,
  })

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Notificações"
        className="relative flex items-center justify-center h-9 w-9 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
        {!collapsed && <span className="sr-only">Notificações</span>}
      </button>

      {open && (
        <NotificationsModal
          userId={userId}
          onClose={() => { setOpen(false); refetch() }}
        />
      )}
    </>
  )
}
