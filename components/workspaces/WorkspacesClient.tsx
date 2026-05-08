'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layers, Plus, Pencil, Trash2, Check, X, Mail, Send } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getPendingInvitations } from '@/lib/supabase/queries/workspaces'
import { useUIStore } from '@/stores/useUIStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import {
  createWorkspaceAction,
  updateWorkspaceAction,
  deleteWorkspaceAction,
  inviteToWorkspaceAction,
} from '@/app/(app)/workspaces/actions'
import type { UserWorkspace } from '@/types/models'

interface Props {
  initialWorkspaces: UserWorkspace[]
  userId: string
}

export function WorkspacesClient({ initialWorkspaces, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()
  const { workspaces: storeWorkspaces, setWorkspaces } = useWorkspaceStore()

  const workspaces = storeWorkspaces.length > 0 ? storeWorkspaces : initialWorkspaces

  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState<Record<string, string>>({})
  const [inviting, setInviting] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const result = await createWorkspaceAction(newName)
      if (result.error) {
        addNotification(result.error, 'error')
      } else {
        addNotification('Workspace criado', 'success')
        setNewName('')
        router.refresh()
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdate(id: string) {
    const result = await updateWorkspaceAction(id, editName)
    if (result.error) {
      addNotification(result.error, 'error')
    } else {
      addNotification('Workspace atualizado', 'success')
      setEditingId(null)
      router.refresh()
    }
  }

  async function handleDelete(id: string) {
    if (workspaces.length <= 1) {
      addNotification('Você precisa ter pelo menos um workspace', 'error')
      return
    }
    const result = await deleteWorkspaceAction(id)
    if (result.error) {
      addNotification(result.error, 'error')
    } else {
      addNotification('Workspace removido', 'success')
      setDeletingId(null)
      router.refresh()
    }
  }

  async function handleInvite(e: React.FormEvent, householdId: string) {
    e.preventDefault()
    const email = inviteEmail[householdId]?.trim()
    if (!email) return
    setInviting(householdId)
    try {
      const result = await inviteToWorkspaceAction(householdId, email)
      if (result.error) {
        addNotification(result.error, 'error')
      } else {
        addNotification(`Convite enviado para ${email}`, 'success')
        setInviteEmail(prev => ({ ...prev, [householdId]: '' }))
        queryClient.invalidateQueries({ queryKey: ['pending-invitations', householdId] })
      }
    } finally {
      setInviting(null)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Layers size={22} className="text-gray-500" />
        <h1 className="text-xl font-semibold text-gray-900">Workspaces</h1>
      </div>

      {/* Existing workspaces */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Meus Workspaces</h2>
        <div className="space-y-3">
          {workspaces.map(ws => (
            <WorkspaceRow
              key={ws.id}
              ws={ws}
              userId={userId}
              editingId={editingId}
              editName={editName}
              deletingId={deletingId}
              inviteEmail={inviteEmail[ws.id] ?? ''}
              inviting={inviting === ws.id}
              onStartEdit={() => { setEditingId(ws.id); setEditName(ws.name) }}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={() => handleUpdate(ws.id)}
              onEditNameChange={setEditName}
              onStartDelete={() => setDeletingId(ws.id)}
              onCancelDelete={() => setDeletingId(null)}
              onConfirmDelete={() => handleDelete(ws.id)}
              onInviteEmailChange={v => setInviteEmail(prev => ({ ...prev, [ws.id]: v }))}
              onInvite={e => handleInvite(e, ws.id)}
            />
          ))}
        </div>
      </section>

      {/* Create new workspace */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Criar Novo Workspace</h2>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nome do workspace (ex: Casa, Pessoal)"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="flex items-center gap-1.5 text-sm bg-primary-600 text-white rounded-lg px-4 py-2 hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <Plus size={14} />
            {creating ? 'Criando...' : 'Criar'}
          </button>
        </form>
      </section>
    </div>
  )
}

interface WorkspaceRowProps {
  ws: UserWorkspace
  userId: string
  editingId: string | null
  editName: string
  deletingId: string | null
  inviteEmail: string
  inviting: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onEditNameChange: (v: string) => void
  onStartDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
  onInviteEmailChange: (v: string) => void
  onInvite: (e: React.FormEvent) => void
}

function WorkspaceRow({
  ws, userId, editingId, editName, deletingId, inviteEmail, inviting,
  onStartEdit, onCancelEdit, onSaveEdit, onEditNameChange,
  onStartDelete, onCancelDelete, onConfirmDelete,
  onInviteEmailChange, onInvite,
}: WorkspaceRowProps) {
  const supabase = createClient()
  const isOwner = ws.createdBy === userId

  const { data: invitations = [] } = useQuery({
    queryKey: ['pending-invitations', ws.id],
    queryFn: () => getPendingInvitations(supabase, ws.id),
    enabled: isOwner,
  })

  if (editingId === ws.id) {
    return (
      <div className="rounded-lg border border-primary-200 bg-primary-50 p-3 space-y-2">
        <input
          autoFocus
          value={editName}
          onChange={e => onEditNameChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <div className="flex gap-2">
          <button onClick={onSaveEdit} className="flex items-center gap-1 text-xs bg-primary-600 text-white rounded-lg px-3 py-1.5 hover:bg-primary-700">
            <Check size={12} /> Salvar
          </button>
          <button onClick={onCancelEdit} className="flex items-center gap-1 text-xs text-gray-500 px-2">
            <X size={12} /> Cancelar
          </button>
        </div>
      </div>
    )
  }

  if (deletingId === ws.id) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
        <p className="text-sm text-red-700">Confirmar exclusão de <strong>{ws.name}</strong>? Todos os dados serão perdidos.</p>
        <div className="flex gap-2">
          <button onClick={onConfirmDelete} className="text-xs bg-red-600 text-white rounded-lg px-3 py-1.5 hover:bg-red-700">
            Confirmar
          </button>
          <button onClick={onCancelDelete} className="text-xs text-gray-500 px-2 py-1.5">
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-800">{ws.name}</span>
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${isOwner ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
            {isOwner ? 'owner' : 'membro'}
          </span>
        </div>
        {isOwner && (
          <div className="flex items-center gap-1">
            <button onClick={onStartEdit} className="text-gray-400 hover:text-primary-600 p-1 transition-colors">
              <Pencil size={13} />
            </button>
            <button onClick={onStartDelete} className="text-gray-400 hover:text-red-500 p-1 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {isOwner && (
        <div className="border-t border-gray-200 pt-3 space-y-3">
          <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
            <Mail size={12} />
            Convidar por e-mail
          </p>
          <form onSubmit={onInvite} className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={e => onInviteEmailChange(e.target.value)}
              placeholder="email@exemplo.com"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="flex items-center gap-1 text-xs bg-primary-600 text-white rounded-lg px-3 py-1.5 hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              <Send size={12} />
              {inviting ? '...' : 'Enviar'}
            </button>
          </form>

          {invitations.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Convites pendentes:</p>
              <div className="space-y-1">
                {invitations.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between text-xs text-gray-500 bg-white rounded px-2 py-1 border border-gray-100">
                    <span>{inv.invitedEmail}</span>
                    <span className="text-amber-600">pendente</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
