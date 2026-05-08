'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  getIncomeEntries,
  createIncomeEntry,
  updateIncomeEntry,
  deleteIncomeEntry,
  generateRecurringForMonth,
} from '@/lib/supabase/queries/income'
import {
  formatCurrency,
  formatDate,
  getCurrentMonthKey,
  getNextMonthKey,
  getPrevMonthKey,
  formatMonthYear,
} from '@/lib/formatters'
import { EmptyState } from '@/components/shared/EmptyState'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { DollarSign, ChevronLeft, ChevronRight, RefreshCw, Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { WorkspaceHero } from '@/components/workspace/WorkspaceHero'
import { INCOME_CATEGORY_LABELS } from '@/lib/constants'
import type { Database } from '@/types/database'

export function IncomeClient() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()
  const { activeWorkspace } = useWorkspaceStore()
  const householdId = activeWorkspace?.id ?? null

  const [monthKey, setMonthKey] = useState(getCurrentMonthKey())
  const [adding, setAdding] = useState(false)

  const [entryName, setEntryName] = useState('')
  const [entryAmount, setEntryAmount] = useState(0)
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [entryCategory, setEntryCategory] = useState<keyof typeof INCOME_CATEGORY_LABELS>('salary')
  const [entryNotes, setEntryNotes] = useState('')
  const [entryRecurring, setEntryRecurring] = useState(false)

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editAmount, setEditAmount] = useState(0)
  const [editDate, setEditDate] = useState('')
  const [editCategory, setEditCategory] = useState<keyof typeof INCOME_CATEGORY_LABELS>('salary')

  const { data: entries = [] } = useQuery({
    queryKey: ['income', householdId, monthKey],
    queryFn: () => getIncomeEntries(supabase, householdId!, monthKey),
    enabled: !!householdId,
  })

  const total = entries.reduce((s, e) => s + e.amountCents, 0)

  function resetForm() {
    setEntryName(''); setEntryAmount(0)
    setEntryDate(new Date().toISOString().split('T')[0])
    setEntryCategory('salary'); setEntryNotes(''); setEntryRecurring(false)
    setAdding(false)
  }

  async function handleGenerate() {
    if (!householdId) return
    const count = await generateRecurringForMonth(supabase, householdId, monthKey)
    queryClient.invalidateQueries({ queryKey: ['income', householdId, monthKey] })
    addNotification(`${count} receita(s) gerada(s)`, 'success')
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!householdId) return
    await createIncomeEntry(supabase, {
      household_id: householdId,
      month_key: entryDate.substring(0, 7),
      name: entryName,
      amount_cents: entryAmount,
      category: entryCategory as Database['public']['Tables']['income_entries']['Insert']['category'],
      date: entryDate,
      notes: entryNotes,
      is_recurring: entryRecurring,
    })
    queryClient.invalidateQueries({ queryKey: ['income', householdId, monthKey] })
    addNotification('Receita adicionada', 'success')
    resetForm()
  }

  async function handleDelete(id: string) {
    await deleteIncomeEntry(supabase, id)
    queryClient.invalidateQueries({ queryKey: ['income', householdId, monthKey] })
    addNotification('Receita removida', 'success')
  }

  function startEdit(entry: { id: string; name: string; amountCents: number; date: string; category: string }) {
    setEditingEntryId(entry.id)
    setEditName(entry.name)
    setEditAmount(entry.amountCents)
    setEditDate(entry.date)
    setEditCategory(entry.category as keyof typeof INCOME_CATEGORY_LABELS)
  }

  async function handleSaveEdit(id: string) {
    await updateIncomeEntry(supabase, id, {
      name: editName,
      amount_cents: editAmount,
      date: editDate,
      category: editCategory as Database['public']['Tables']['income_entries']['Update']['category'],
    })
    queryClient.invalidateQueries({ queryKey: ['income', householdId, monthKey] })
    setEditingEntryId(null)
    addNotification('Receita atualizada', 'success')
  }

  if (!householdId) {
    return <div className="p-6 text-sm text-gray-400">Carregando workspace...</div>
  }

  return (
    <div className="flex flex-col h-full">
      <WorkspaceHero title="Receitas" />
      <div className="p-6 flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <DollarSign size={22} className="text-gray-500" />
            <h1 className="text-xl font-semibold text-gray-900">Receitas</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-green-600">{formatCurrency(total)}</span>
            <button onClick={handleGenerate} className="flex items-center gap-1.5 text-sm text-primary-600 border border-primary-200 rounded-lg px-3 py-1.5 hover:bg-primary-50 transition-colors">
              <RefreshCw size={14} />
              Gerar recorrentes
            </button>
            <button onClick={() => setAdding(!adding)} className="flex items-center gap-1.5 text-sm bg-primary-600 text-white rounded-lg px-3 py-1.5 hover:bg-primary-700 transition-colors">
              <Plus size={14} />
              Nova
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setMonthKey(getPrevMonthKey(monthKey))} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft size={18} /></button>
          <span className="text-sm font-medium text-gray-700 min-w-32 text-center">{formatMonthYear(monthKey)}</span>
          <button onClick={() => setMonthKey(getNextMonthKey(monthKey))} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight size={18} /></button>
        </div>

        {adding && (
          <form onSubmit={handleAdd} className="rounded-xl border border-gray-200 bg-white p-5 mb-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Nova Receita</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Descrição</label>
                <input
                  value={entryName}
                  onChange={e => setEntryName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Ex: Salário"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Valor</label>
                <CurrencyInput valueCents={entryAmount} onChange={setEntryAmount} className="w-full" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={e => setEntryDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Categoria</label>
                <select
                  value={entryCategory}
                  onChange={e => setEntryCategory(e.target.value as keyof typeof INCOME_CATEGORY_LABELS)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {Object.entries(INCOME_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={entryRecurring}
                onChange={e => setEntryRecurring(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="recurring" className="text-xs text-gray-600">Receita recorrente</label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="text-sm bg-primary-600 text-white rounded-lg px-4 py-1.5 hover:bg-primary-700 transition-colors">Salvar</button>
              <button type="button" onClick={resetForm} className="text-sm text-gray-500 px-3 py-1.5">Cancelar</button>
            </div>
          </form>
        )}

        {entries.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="Nenhuma receita"
            description="Adicione suas entradas ou gere a partir de recorrentes."
            action={{ label: 'Gerar recorrentes', onClick: handleGenerate }}
          />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Descrição</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Categoria</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Data</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Valor</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => {
                  if (editingEntryId === e.id) {
                    return (
                      <tr key={e.id} className="border-b border-primary-100 bg-primary-50">
                        <td className="px-4 py-2">
                          <input value={editName} onChange={ev => setEditName(ev.target.value)}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
                        </td>
                        <td className="px-4 py-2">
                          <select value={editCategory} onChange={ev => setEditCategory(ev.target.value as keyof typeof INCOME_CATEGORY_LABELS)}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-xs">
                            {Object.entries(INCOME_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input type="date" value={editDate} onChange={ev => setEditDate(ev.target.value)}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
                        </td>
                        <td className="px-4 py-2">
                          <CurrencyInput valueCents={editAmount} onChange={setEditAmount} className="w-full text-right" />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleSaveEdit(e.id)} className="text-green-600 hover:text-green-700">
                              <Check size={14} />
                            </button>
                            <button onClick={() => setEditingEntryId(null)} className="text-gray-400 hover:text-gray-600">
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }
                  return (
                    <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {e.name}
                        {e.isRecurring && <span className="ml-2 text-xs text-primary-500">↻</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{INCOME_CATEGORY_LABELS[e.category]}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(e.date)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">{formatCurrency(e.amountCents)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => startEdit(e)} className="text-gray-300 hover:text-primary-500 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(e.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
