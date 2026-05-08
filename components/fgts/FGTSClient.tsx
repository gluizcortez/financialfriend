'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getFGTSRecords, upsertFGTSRecord, updateFGTSRecord, deleteFGTSRecord } from '@/lib/supabase/queries/fgts'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { EmptyState } from '@/components/shared/EmptyState'
import { Wallet, Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { WorkspaceHero } from '@/components/workspace/WorkspaceHero'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import type { FGTSRecord } from '@/types/models'

export function FGTSClient() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()
  const { activeWorkspace } = useWorkspaceStore()
  const householdId = activeWorkspace?.id ?? null

  const [adding, setAdding] = useState(false)
  const [newBalance, setNewBalance] = useState(0)
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [newNotes, setNewNotes] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBalance, setEditBalance] = useState(0)
  const [editDate, setEditDate] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const { data: records = [] } = useQuery({
    queryKey: ['fgts', householdId],
    queryFn: () => getFGTSRecords(supabase, householdId!),
    enabled: !!householdId,
  })

  function startEdit(r: FGTSRecord) {
    setEditingId(r.id)
    setEditBalance(r.balanceCents)
    setEditDate(r.date)
    setEditNotes(r.notes ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function handleSave(id: string) {
    await updateFGTSRecord(supabase, id, {
      balance_cents: editBalance,
      date: editDate,
      notes: editNotes,
      month_key: editDate.substring(0, 7),
    })
    queryClient.invalidateQueries({ queryKey: ['fgts', householdId] })
    setEditingId(null)
    addNotification('Registro atualizado', 'success')
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!householdId) return
    const monthKey = newDate.substring(0, 7)
    await upsertFGTSRecord(supabase, {
      household_id: householdId,
      month_key: monthKey,
      balance_cents: newBalance,
      date: newDate,
      notes: newNotes,
    })
    queryClient.invalidateQueries({ queryKey: ['fgts', householdId] })
    setAdding(false)
    setNewBalance(0)
    setNewNotes('')
    addNotification('Registro FGTS salvo', 'success')
  }

  async function handleDelete(id: string) {
    await deleteFGTSRecord(supabase, id)
    queryClient.invalidateQueries({ queryKey: ['fgts', householdId] })
    addNotification('Registro removido', 'success')
  }

  if (!householdId) {
    return <div className="p-6 text-sm text-gray-400">Carregando workspace...</div>
  }

  return (
    <div className="flex flex-col h-full">
      <WorkspaceHero title="FGTS" />
      <div className="p-6 flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Wallet size={22} className="text-gray-500" />
            <h1 className="text-xl font-semibold text-gray-900">FGTS</h1>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-sm bg-primary-600 text-white rounded-lg px-3 py-1.5 hover:bg-primary-700 transition-colors"
          >
            <Plus size={14} />
            Novo registro
          </button>
        </div>

        {adding && (
          <form onSubmit={handleAdd} className="rounded-xl border border-gray-200 bg-white p-5 mb-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Novo Registro FGTS</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Saldo</label>
                <CurrencyInput valueCents={newBalance} onChange={setNewBalance} className="w-full" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" required />
              </div>
            </div>
            <input type="text" value={newNotes} onChange={e => setNewNotes(e.target.value)}
              placeholder="Observações (opcional)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button type="submit" className="text-sm bg-primary-600 text-white rounded-lg px-4 py-1.5 hover:bg-primary-700 transition-colors">
                Salvar
              </button>
              <button type="button" onClick={() => setAdding(false)} className="text-sm text-gray-500 px-3 py-1.5">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {records.length === 0 ? (
          <EmptyState icon={Wallet} title="Nenhum registro" description="Registre seu saldo FGTS mês a mês." action={{ label: 'Novo registro', onClick: () => setAdding(true) }} />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Mês</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Saldo</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  editingId === r.id ? (
                    <tr key={r.id} className="border-b border-gray-50 bg-blue-50">
                      <td className="px-4 py-2">
                        <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-400">{editDate.substring(0, 7)}</td>
                      <td className="px-4 py-2">
                        <CurrencyInput valueCents={editBalance} onChange={setEditBalance} className="w-full text-right" />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleSave(r.id)} className="text-green-600 hover:text-green-700 p-1">
                            <Check size={14} />
                          </button>
                          <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 p-1">
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={r.id} className="border-b border-gray-50 group">
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(r.date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.monthKey}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">{formatCurrency(r.balanceCents)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(r)} className="text-gray-400 hover:text-primary-600 p-1">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(r.id)} className="text-gray-300 hover:text-red-500 p-1">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
