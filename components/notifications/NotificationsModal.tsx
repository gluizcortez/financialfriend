'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  getNotifications,
  markAllNotificationsRead,
  declineInvitation,
  deleteNotification,
  deleteAllNotifications,
  getUserWorkspaces,
} from '@/lib/supabase/queries/workspaces'
import { acceptInvitationAction } from '@/app/(app)/workspaces/actions'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { X, Bell, Check, Trash2, AlertTriangle } from 'lucide-react'

interface Props {
  userId: string
  onClose: () => void
}

export function NotificationsModal({ userId, onClose }: Props) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const setWorkspaces = useWorkspaceStore(s => s.setWorkspaces)
  const [confirmClear, setConfirmClear] = useState(false)

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => getNotifications(supabase, userId),
  })

  useEffect(() => {
    markAllNotificationsRead(supabase, userId).then(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications-count', userId] })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAccept(invitationId: string, notifId: string) {
    await acceptInvitationAction(invitationId)
    await deleteNotification(supabase, notifId)
    refetch()
    queryClient.invalidateQueries({ queryKey: ['notifications-count', userId] })
    const workspaces = await getUserWorkspaces(supabase, userId)
    setWorkspaces(workspaces)
    queryClient.invalidateQueries({ queryKey: ['user-workspaces'] })
  }

  async function handleDecline(invitationId: string, notifId: string) {
    await declineInvitation(supabase, invitationId)
    await deleteNotification(supabase, notifId)
    refetch()
    queryClient.invalidateQueries({ queryKey: ['notifications-count', userId] })
  }

  async function handleClearAll() {
    await deleteAllNotifications(supabase, userId)
    setConfirmClear(false)
    refetch()
    queryClient.invalidateQueries({ queryKey: ['notifications-count', userId] })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="relative h-full w-full max-w-sm bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Notificações</h2>
            {notifications.length > 0 && (
              <span className="text-xs text-gray-400">({notifications.length})</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Limpar todas as notificações"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Confirm clear banner */}
        {confirmClear && (
          <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 mb-3">
                  Limpar todas as notificações?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearAll}
                    className="flex-1 rounded-lg bg-red-600 text-white text-xs font-medium py-1.5 hover:bg-red-700 transition-colors"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 rounded-lg border border-red-200 text-red-600 text-xs font-medium py-1.5 hover:bg-red-100 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto mt-1">
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
                    className={`px-5 py-4 ${notif.isRead ? '' : 'bg-blue-50/40'}`}
                  >
                    <p className="text-sm font-medium text-gray-900 mb-0.5">{notif.title}</p>
                    <p className="text-xs text-gray-500 mb-3">{notif.body}</p>

                    {notif.type === 'workspace_invite' && invitationId && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(invitationId, notif.id)}
                          className="flex items-center gap-1 text-xs bg-primary-600 text-white rounded-lg px-3 py-1.5 hover:bg-primary-700 transition-colors"
                        >
                          <Check size={12} />
                          Aceitar
                        </button>
                        <button
                          onClick={() => handleDecline(invitationId, notif.id)}
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
