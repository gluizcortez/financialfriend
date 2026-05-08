'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  getNotifications,
  markAllNotificationsRead,
  declineInvitation,
  getUserWorkspaces,
} from '@/lib/supabase/queries/workspaces'
import { acceptInvitationAction } from '@/app/(app)/workspaces/actions'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { X, Bell, Check } from 'lucide-react'

interface Props {
  userId: string
  onClose: () => void
}

export function NotificationsModal({ userId, onClose }: Props) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const setWorkspaces = useWorkspaceStore(s => s.setWorkspaces)

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => getNotifications(supabase, userId),
  })

  // Mark all read when modal opens
  useEffect(() => {
    markAllNotificationsRead(supabase, userId).then(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications-count', userId] })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAccept(invitationId: string) {
    await acceptInvitationAction(invitationId)
    refetch()
    // Refresh workspace list
    const workspaces = await getUserWorkspaces(supabase, userId)
    setWorkspaces(workspaces)
    queryClient.invalidateQueries({ queryKey: ['user-workspaces'] })
  }

  async function handleDecline(invitationId: string) {
    await declineInvitation(supabase, invitationId)
    refetch()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative h-full w-full max-w-sm bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Notificações</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
              <Bell size={32} className="opacity-30" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(notif => {
                const invitationId = (notif.data as Record<string, string>).invitation_id

                return (
                  <div
                    key={notif.id}
                    className={`px-5 py-4 ${notif.isRead ? 'opacity-60' : 'bg-blue-50/40'}`}
                  >
                    <p className="text-sm font-medium text-gray-900 mb-0.5">{notif.title}</p>
                    <p className="text-xs text-gray-500 mb-3">{notif.body}</p>

                    {notif.type === 'workspace_invite' && invitationId && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(invitationId)}
                          className="flex items-center gap-1 text-xs bg-primary-600 text-white rounded-lg px-3 py-1.5 hover:bg-primary-700 transition-colors"
                        >
                          <Check size={12} />
                          Aceitar
                        </button>
                        <button
                          onClick={() => handleDecline(invitationId)}
                          className="text-xs text-gray-500 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                        >
                          Recusar
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
