'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getCategories } from '@/lib/supabase/queries/settings'
import {
  getOrCreateMonthRecord,
  getBills,
  setBillEntryStatus,
  deleteBillEntry,
  createBillEntry,
  updateBillEntry,
  generateMonthFromTemplates,
  createBill,
  updateBill,
  deleteBill,
} from '@/lib/supabase/queries/bills'
import {
  getCurrentMonthKey,
  getNextMonthKey,
  getPrevMonthKey,
  formatMonthYear,
  formatDate,
  formatCurrency,
} from '@/lib/formatters'
import { getEffectiveStatus } from '@/lib/billStatus'
import { calculateBillsTotals } from '@/lib/calculations'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { AttachmentInput } from '@/components/shared/AttachmentInput'
import { WorkspaceHero } from '@/components/workspace/WorkspaceHero'
import { Receipt, ChevronLeft, ChevronRight, RefreshCw, Plus, Trash2, List, Pencil, Check, X } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { BudgetOverview } from './BudgetOverview'

type Tab = 'entries' | 'templates'

export function BillsClient() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()
  const { activeWorkspace } = useWorkspaceStore()
  const householdId = activeWorkspace?.id ?? null

  const [monthKey, setMonthKey] = useState(getCurrentMonthKey())
  const [tab, setTab] = useState<Tab>('entries')
  const [addingEntry, setAddingEntry] = useState(false)
  const [addingTemplate, setAddingTemplate] = useState(false)

  // New entry form state
  const [entryName, setEntryName] = useState('')
  const [entryValue, setEntryValue] = useState(0)
  const [entryDueDate, setEntryDueDate] = useState(new Date().toISOString().split('T')[0])
  const [entryCategoryId, setEntryCategoryId] = useState('')
  const [entryNotes, setEntryNotes] = useState('')

  // New template form state
  const [templateName, setTemplateName] = useState('')
  const [templateValue, setTemplateValue] = useState(0)
  const [templateDueDay, setTemplateDueDay] = useState(1)
  const [templateCategoryId, setTemplateCategoryId] = useState('')
  const [templateNotes, setTemplateNotes] = useState('')

  // Edit template state
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [editTplName, setEditTplName] = useState('')
  const [editTplValue, setEditTplValue] = useState(0)
  const [editTplDueDay, setEditTplDueDay] = useState(1)
  const [editTplCategoryId, setEditTplCategoryId] = useState('')

  // Edit entry state
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editValue, setEditValue] = useState(0)
  const [editDueDate, setEditDueDate] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', householdId],
    queryFn: () => getCategories(supabase, householdId!),
    enabled: !!householdId,
  })

  const billCategories = categories.filter(c => c.type === 'bill' || c.type === 'both')

  const { data: record, isLoading } = useQuery({
    queryKey: ['bills', householdId, monthKey],
    queryFn: () => getOrCreateMonthRecord(supabase, householdId!, monthKey),
    enabled: !!householdId,
  })

  const { data: templates = [] } = useQuery({
    queryKey: ['bill-templates', householdId],
    queryFn: () => getBills(supabase, householdId!),
    enabled: !!householdId,
  })

  const entries = record?.entries ?? []
  const totals = calculateBillsTotals(entries)

  function resetEntryForm() {
    setEntryName(''); setEntryValue(0)
    setEntryDueDate(new Date().toISOString().split('T')[0])
    setEntryCategoryId(''); setEntryNotes('')
    setAddingEntry(false)
  }

  function resetTemplateForm() {
    setTemplateName(''); setTemplateValue(0); setTemplateDueDay(1)
    setTemplateCategoryId(''); setTemplateNotes('')
    setAddingTemplate(false)
  }

  async function handleToggleStatus(entryId: string, current: 'pending' | 'paid' | 'overdue') {
    const next = current === 'paid' ? 'pending' : 'paid'
    await setBillEntryStatus(supabase, entryId, next)
    queryClient.invalidateQueries({ queryKey: ['bills', householdId, monthKey] })
  }

  async function handleDeleteEntry(id: string) {
    await deleteBillEntry(supabase, id)
    queryClient.invalidateQueries({ queryKey: ['bills', householdId, monthKey] })
    addNotification('Conta removida', 'success')
  }

  async function handleGenerate() {
    if (!householdId) return
    await generateMonthFromTemplates(supabase, householdId, monthKey)
    queryClient.invalidateQueries({ queryKey: ['bills', householdId, monthKey] })
    addNotification('Contas do mês geradas', 'success')
  }

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!householdId || !record) return
    await createBillEntry(supabase, {
      monthly_record_id: record.id,
      household_id: householdId,
      name: entryName,
      value_cents: entryValue,
      due_date: entryDueDate,
      status: 'pending',
      notes: entryNotes,
      category_id: entryCategoryId || null,
    })
    queryClient.invalidateQueries({ queryKey: ['bills', householdId, monthKey] })
    addNotification('Conta adicionada', 'success')
    resetEntryForm()
  }

  async function handleAddTemplate(e: React.FormEvent) {
    e.preventDefault()
    if (!householdId) return
    await createBill(supabase, {
      household_id: householdId,
      name: templateName,
      value_cents: templateValue,
      due_day: templateDueDay,
      is_recurring: true,
      notes: templateNotes,
      category_id: templateCategoryId || null,
    })
    queryClient.invalidateQueries({ queryKey: ['bill-templates', householdId] })
    addNotification('Template criado', 'success')
    resetTemplateForm()
  }

  async function handleDeleteTemplate(id: string) {
    await deleteBill(supabase, id)
    queryClient.invalidateQueries({ queryKey: ['bill-templates', householdId] })
    addNotification('Template removido', 'success')
  }

  function startEditTemplate(t: { id: string; name: string; valueCents: number; dueDay: number; categoryId: string | null }) {
    setEditingTemplateId(t.id)
    setEditTplName(t.name)
    setEditTplValue(t.valueCents)
    setEditTplDueDay(t.dueDay)
    setEditTplCategoryId(t.categoryId ?? '')
  }

  async function handleSaveTemplate(id: string) {
    await updateBill(supabase, id, {
      name: editTplName,
      value_cents: editTplValue,
      due_day: editTplDueDay,
      category_id: editTplCategoryId || null,
    })
    queryClient.invalidateQueries({ queryKey: ['bill-templates', householdId] })
    setEditingTemplateId(null)
    addNotification('Template atualizado', 'success')
  }

  function startEditEntry(entry: { id: string; name: string; valueCents: number; dueDate: string; categoryId: string | null; notes: string }) {
    setEditingEntryId(entry.id)
    setEditName(entry.name)
    setEditValue(entry.valueCents)
    setEditDueDate(entry.dueDate)
    setEditCategoryId(entry.categoryId ?? '')
    setEditNotes(entry.notes)
  }

  async function handleSaveEntry(id: string) {
    await updateBillEntry(supabase, id, {
      name: editName,
      value_cents: editValue,
      due_date: editDueDate,
      category_id: editCategoryId || null,
      notes: editNotes,
    })
    queryClient.invalidateQueries({ queryKey: ['bills', householdId, monthKey] })
    setEditingEntryId(null)
    addNotification('Conta atualizada', 'success')
  }

  if (!householdId) {
    return <div className="p-6 text-sm text-gray-400">Carregando workspace...</div>
  }

  return (
    <div className="flex flex-col h-full">
      <WorkspaceHero title="Contas Mensais" />

      <div className="p-6 flex-1 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Receipt size={22} className="text-gray-500" />
            <h1 className="text-xl font-semibold text-gray-900">Contas Mensais</h1>
          </div>
          <div className="flex items-center gap-2">
            {tab === 'entries' && (
              <>
                <button onClick={handleGenerate} className="flex items-center gap-1.5 text-sm text-primary-600 border border-primary-200 rounded-lg px-3 py-1.5 hover:bg-primary-50 transition-colors">
                  <RefreshCw size={14} />
                  Gerar do mês
                </button>
                <button onClick={() => setAddingEntry(!addingEntry)} className="flex items-center gap-1.5 text-sm bg-primary-600 text-white rounded-lg px-3 py-1.5 hover:bg-primary-700 transition-colors">
                  <Plus size={14} />
                  Nova conta
                </button>
              </>
            )}
            {tab === 'templates' && (
              <button onClick={() => setAddingTemplate(!addingTemplate)} className="flex items-center gap-1.5 text-sm bg-primary-600 text-white rounded-lg px-3 py-1.5 hover:bg-primary-700 transition-colors">
                <Plus size={14} />
                Novo template
              </button>
            )}
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab('entries')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'entries' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Receipt size={14} />
            Contas do Mês
          </button>
          <button
            onClick={() => setTab('templates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'templates' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List size={14} />
            Templates Recorrentes
          </button>
        </div>

        {tab === 'entries' && (
          <>
            {/* Month navigator */}
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setMonthKey(getPrevMonthKey(monthKey))} className="p-1.5 rounded-lg hover:bg-gray-100">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-32 text-center">{formatMonthYear(monthKey)}</span>
              <button onClick={() => setMonthKey(getNextMonthKey(monthKey))} className="p-1.5 rounded-lg hover:bg-gray-100">
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total', value: totals.total, color: 'text-gray-900' },
                { label: 'Pago', value: totals.paid, color: 'text-green-600' },
                { label: 'Pendente', value: totals.pending, color: 'text-amber-600' },
                { label: 'Atrasado', value: totals.overdue, color: 'text-red-600' },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
                  <p className={`text-base font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
                </div>
              ))}
            </div>

            {/* Budget overview */}
            <BudgetOverview bills={entries} categories={billCategories} />

            {/* Add entry form */}
            {addingEntry && (
              <form onSubmit={handleAddEntry} className="rounded-xl border border-gray-200 bg-white p-5 mb-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Nova Conta</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Descrição</label>
                    <input
                      value={entryName}
                      onChange={e => setEntryName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Nome da conta"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Valor</label>
                    <CurrencyInput valueCents={entryValue} onChange={setEntryValue} className="w-full" required />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Vencimento</label>
                    <input
                      type="date"
                      value={entryDueDate}
                      onChange={e => setEntryDueDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Categoria</label>
                    <select
                      value={entryCategoryId}
                      onChange={e => setEntryCategoryId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Sem categoria</option>
                      {billCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <input
                  value={entryNotes}
                  onChange={e => setEntryNotes(e.target.value)}
                  placeholder="Observações (opcional)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button type="submit" className="text-sm bg-primary-600 text-white rounded-lg px-4 py-1.5 hover:bg-primary-700 transition-colors">Salvar</button>
                  <button type="button" onClick={resetEntryForm} className="text-sm text-gray-500 px-3 py-1.5">Cancelar</button>
                </div>
              </form>
            )}

            {/* Entries table */}
            {isLoading ? (
              <div className="text-center py-8 text-sm text-gray-400">Carregando...</div>
            ) : entries.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="Nenhuma conta neste mês"
                description="Clique em 'Gerar do mês' para criar a partir dos templates ou adicione manualmente."
                action={{ label: 'Gerar contas', onClick: handleGenerate }}
              />
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Conta</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Vencimento</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Valor</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(entry => {
                      const effectiveStatus = getEffectiveStatus(entry)
                      if (editingEntryId === entry.id) {
                        return (
                          <>
                            <tr key={`edit-${entry.id}`} className="border-b border-primary-100 bg-primary-50">
                              <td className="px-4 py-2">
                                <input value={editName} onChange={e => setEditName(e.target.value)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
                              </td>
                              <td className="px-4 py-2">
                                <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
                              </td>
                              <td className="px-4 py-2">
                                <CurrencyInput valueCents={editValue} onChange={setEditValue} className="w-full text-right" />
                              </td>
                              <td className="px-4 py-2">
                                <select value={editCategoryId} onChange={e => setEditCategoryId(e.target.value)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs">
                                  <option value="">Sem categoria</option>
                                  {billCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => handleSaveEntry(entry.id)} className="text-green-600 hover:text-green-700">
                                    <Check size={14} />
                                  </button>
                                  <button onClick={() => setEditingEntryId(null)} className="text-gray-400 hover:text-gray-600">
                                    <X size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            <tr key={`attach-${entry.id}`} className="border-b border-primary-100 bg-primary-50/60">
                              <td colSpan={5} className="px-4 pb-3 pt-0">
                                <AttachmentInput entityType="bill_entry" entityId={entry.id} householdId={householdId} />
                              </td>
                            </tr>
                          </>
                        )
                      }
                      return (
                        <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-800">{entry.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDate(entry.dueDate)}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 text-right font-medium">{formatCurrency(entry.valueCents)}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => handleToggleStatus(entry.id, effectiveStatus)}>
                              <StatusBadge status={effectiveStatus} />
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => startEditEntry(entry)} className="text-gray-300 hover:text-primary-500 transition-colors">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => handleDeleteEntry(entry.id)} className="text-gray-300 hover:text-red-500 transition-colors">
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
          </>
        )}

        {tab === 'templates' && (
          <>
            {/* Add template form */}
            {addingTemplate && (
              <form onSubmit={handleAddTemplate} className="rounded-xl border border-gray-200 bg-white p-5 mb-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Novo Template Recorrente</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Descrição</label>
                    <input
                      value={templateName}
                      onChange={e => setTemplateName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Nome da conta"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Valor</label>
                    <CurrencyInput valueCents={templateValue} onChange={setTemplateValue} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Dia de vencimento</label>
                    <input
                      type="number"
                      min={1} max={31}
                      value={templateDueDay}
                      onChange={e => setTemplateDueDay(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Categoria</label>
                    <select
                      value={templateCategoryId}
                      onChange={e => setTemplateCategoryId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Sem categoria</option>
                      {billCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <input
                  value={templateNotes}
                  onChange={e => setTemplateNotes(e.target.value)}
                  placeholder="Observações (opcional)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button type="submit" className="text-sm bg-primary-600 text-white rounded-lg px-4 py-1.5 hover:bg-primary-700 transition-colors">Salvar</button>
                  <button type="button" onClick={resetTemplateForm} className="text-sm text-gray-500 px-3 py-1.5">Cancelar</button>
                </div>
              </form>
            )}

            {/* Templates list */}
            {templates.length === 0 ? (
              <EmptyState
                icon={List}
                title="Nenhum template"
                description="Crie templates de contas recorrentes para gerar meses automaticamente."
                action={{ label: 'Criar template', onClick: () => setAddingTemplate(true) }}
              />
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Conta</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Dia</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Valor</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map(t => (
                      editingTemplateId === t.id ? (
                        <tr key={t.id} className="border-b border-gray-50 bg-blue-50">
                          <td className="px-4 py-2">
                            <input value={editTplName} onChange={e => setEditTplName(e.target.value)}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <input type="number" min={1} max={31} value={editTplDueDay} onChange={e => setEditTplDueDay(Number(e.target.value))}
                              className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center" />
                          </td>
                          <td className="px-4 py-2">
                            <CurrencyInput valueCents={editTplValue} onChange={setEditTplValue} className="w-full text-right" />
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleSaveTemplate(t.id)} className="text-green-600 hover:text-green-700 p-1">
                                <Check size={14} />
                              </button>
                              <button onClick={() => setEditingTemplateId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={t.id} className="border-b border-gray-50 group">
                          <td className="px-4 py-3 text-sm text-gray-800">{t.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 text-center">todo dia {t.dueDay}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800 text-right">{formatCurrency(t.valueCents)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditTemplate(t)} className="text-gray-300 hover:text-primary-500 p-1">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => handleDeleteTemplate(t.id)} className="text-gray-300 hover:text-red-500 p-1">
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
          </>
        )}
      </div>
    </div>
  )
}
