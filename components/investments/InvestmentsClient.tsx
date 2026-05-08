'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  getInvestments,
  getTransactions,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  addTransaction,
  deleteTransaction,
} from '@/lib/supabase/queries/investments'
import { formatCurrency, getCurrentMonthKey } from '@/lib/formatters'
import { EmptyState } from '@/components/shared/EmptyState'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { TrendingUp, Plus, Trash2, ChevronDown, ChevronUp, Pencil, Check, X, Paperclip } from 'lucide-react'
import { AttachmentInput } from '@/components/shared/AttachmentInput'
import { useUIStore } from '@/stores/useUIStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { WorkspaceHero } from '@/components/workspace/WorkspaceHero'
import { INVESTMENT_TYPE_LABELS } from '@/lib/constants'
import type { InvestmentTransaction } from '@/types/models'
import type { Database } from '@/types/database'

export function InvestmentsClient() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()
  const { activeWorkspace } = useWorkspaceStore()
  const householdId = activeWorkspace?.id ?? null

  const [addingInvestment, setAddingInvestment] = useState(false)
  const [expandedInvestmentId, setExpandedInvestmentId] = useState<string | null>(null)
  const [addingTxForId, setAddingTxForId] = useState<string | null>(null)
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null)
  const [attachmentTxId, setAttachmentTxId] = useState<string | null>(null)
  const [editInvName, setEditInvName] = useState('')
  const [editInvType, setEditInvType] = useState<keyof typeof INVESTMENT_TYPE_LABELS>('renda_fixa')
  const [editInvNotes, setEditInvNotes] = useState('')

  const [invName, setInvName] = useState('')
  const [invType, setInvType] = useState<keyof typeof INVESTMENT_TYPE_LABELS>('renda_fixa')
  const [invNotes, setInvNotes] = useState('')

  const [txType, setTxType] = useState<'contribution' | 'withdrawal' | 'yield'>('contribution')
  const [txAmount, setTxAmount] = useState(0)
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0])
  const [txNotes, setTxNotes] = useState('')

  const { data: investments = [] } = useQuery({
    queryKey: ['investments', householdId],
    queryFn: () => getInvestments(supabase, householdId!),
    enabled: !!householdId,
  })

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', expandedInvestmentId],
    queryFn: () => expandedInvestmentId ? getTransactions(supabase, expandedInvestmentId) : [],
    enabled: !!expandedInvestmentId,
  })

  const totalBalance = investments.reduce((s, i) => s + i.currentBalanceCents, 0)

  function resetInvForm() {
    setInvName(''); setInvType('renda_fixa'); setInvNotes('')
    setAddingInvestment(false)
  }

  function resetTxForm() {
    setTxType('contribution'); setTxAmount(0)
    setTxDate(new Date().toISOString().split('T')[0]); setTxNotes('')
    setAddingTxForId(null)
  }

  async function handleAddInvestment(e: React.FormEvent) {
    e.preventDefault()
    if (!householdId) return
    await createInvestment(supabase, {
      household_id: householdId,
      name: invName,
      type: invType as Database['public']['Tables']['investments']['Insert']['type'],
      notes: invNotes,
    })
    queryClient.invalidateQueries({ queryKey: ['investments', householdId] })
    addNotification('Investimento criado', 'success')
    resetInvForm()
  }

  async function handleDeleteInvestment(id: string) {
    await deleteInvestment(supabase, id)
    queryClient.invalidateQueries({ queryKey: ['investments', householdId] })
    addNotification('Investimento removido', 'success')
  }

  async function handleAddTransaction(e: React.FormEvent, investmentId: string) {
    e.preventDefault()
    if (!householdId) return
    const monthKey = txDate.substring(0, 7)
    await addTransaction(supabase, {
      investment_id: investmentId,
      household_id: householdId,
      type: txType,
      amount_cents: txAmount,
      month_key: monthKey,
      date: txDate,
      notes: txNotes,
    })
    queryClient.invalidateQueries({ queryKey: ['investments', householdId] })
    queryClient.invalidateQueries({ queryKey: ['transactions', investmentId] })
    addNotification('Transação registrada', 'success')
    resetTxForm()
  }

  function startEditInvestment(inv: { id: string; name: string; type: string; notes: string }) {
    setEditingInvestmentId(inv.id)
    setEditInvName(inv.name)
    setEditInvType(inv.type as keyof typeof INVESTMENT_TYPE_LABELS)
    setEditInvNotes(inv.notes)
  }

  async function handleSaveInvestment(id: string) {
    await updateInvestment(supabase, id, {
      name: editInvName,
      type: editInvType as Database['public']['Tables']['investments']['Update']['type'],
      notes: editInvNotes,
    })
    queryClient.invalidateQueries({ queryKey: ['investments', householdId] })
    setEditingInvestmentId(null)
    addNotification('Investimento atualizado', 'success')
  }

  async function handleDeleteTransaction(tx: InvestmentTransaction) {
    await deleteTransaction(supabase, tx)
    queryClient.invalidateQueries({ queryKey: ['investments', householdId] })
    queryClient.invalidateQueries({ queryKey: ['transactions', tx.investmentId] })
    addNotification('Transação removida', 'success')
  }

  if (!householdId) {
    return <div className="p-6 text-sm text-gray-400">Carregando workspace...</div>
  }

  return (
    <div className="flex flex-col h-full">
      <WorkspaceHero title="Investimentos" />
      <div className="p-6 flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp size={22} className="text-gray-500" />
            <h1 className="text-xl font-semibold text-gray-900">Investimentos</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">Saldo total</p>
              <p className="text-lg font-bold text-primary-600">{formatCurrency(totalBalance)}</p>
            </div>
            <button
              onClick={() => setAddingInvestment(!addingInvestment)}
              className="flex items-center gap-1.5 text-sm bg-primary-600 text-white rounded-lg px-3 py-1.5 hover:bg-primary-700 transition-colors"
            >
              <Plus size={14} />
              Novo
            </button>
          </div>
        </div>

        {addingInvestment && (
          <form onSubmit={handleAddInvestment} className="rounded-xl border border-gray-200 bg-white p-5 mb-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Novo Investimento</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nome</label>
                <input
                  value={invName}
                  onChange={e => setInvName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Ex: Tesouro Selic"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                <select
                  value={invType}
                  onChange={e => setInvType(e.target.value as keyof typeof INVESTMENT_TYPE_LABELS)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {Object.entries(INVESTMENT_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <input
              value={invNotes}
              onChange={e => setInvNotes(e.target.value)}
              placeholder="Observações (opcional)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button type="submit" className="text-sm bg-primary-600 text-white rounded-lg px-4 py-1.5 hover:bg-primary-700 transition-colors">Salvar</button>
              <button type="button" onClick={resetInvForm} className="text-sm text-gray-500 px-3 py-1.5">Cancelar</button>
            </div>
          </form>
        )}

        {investments.length === 0 ? (
          <EmptyState icon={TrendingUp} title="Nenhum investimento" description="Adicione seu primeiro investimento." action={{ label: 'Adicionar', onClick: () => setAddingInvestment(true) }} />
        ) : (
          <div className="grid gap-4">
            {investments.map(inv => {
              const isExpanded = expandedInvestmentId === inv.id
              const invTransactions = isExpanded ? transactions.filter(t => t.investmentId === inv.id) : []
              return (
                <div key={inv.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <div className="p-5">
                    {editingInvestmentId === inv.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input value={editInvName} onChange={e => setEditInvName(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Nome" />
                          <select value={editInvType} onChange={e => setEditInvType(e.target.value as keyof typeof INVESTMENT_TYPE_LABELS)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                            {Object.entries(INVESTMENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                        <input value={editInvNotes} onChange={e => setEditInvNotes(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Observações" />
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveInvestment(inv.id)} className="flex items-center gap-1 text-xs bg-primary-600 text-white rounded-lg px-3 py-1.5 hover:bg-primary-700">
                            <Check size={12} /> Salvar
                          </button>
                          <button onClick={() => setEditingInvestmentId(null)} className="text-xs text-gray-500 px-2 py-1.5">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{inv.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{INVESTMENT_TYPE_LABELS[inv.type]}</p>
                          {inv.notes && <p className="text-xs text-gray-500 mt-1">{inv.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-primary-600">{formatCurrency(inv.currentBalanceCents)}</p>
                          <button onClick={() => startEditInvestment(inv)} className="text-gray-300 hover:text-primary-500 transition-colors p-1">
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (isExpanded) { setExpandedInvestmentId(null); setAddingTxForId(null) }
                              else setExpandedInvestmentId(inv.id)
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <button onClick={() => handleDeleteInvestment(inv.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Transações</h4>
                        <button
                          onClick={() => setAddingTxForId(addingTxForId === inv.id ? null : inv.id)}
                          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                        >
                          <Plus size={12} />
                          Registrar
                        </button>
                      </div>

                      {addingTxForId === inv.id && (
                        <form onSubmit={e => handleAddTransaction(e, inv.id)} className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                              <select
                                value={txType}
                                onChange={e => setTxType(e.target.value as typeof txType)}
                                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs"
                              >
                                <option value="contribution">Aporte</option>
                                <option value="withdrawal">Retirada</option>
                                <option value="yield">Rendimento</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Valor</label>
                              <CurrencyInput valueCents={txAmount} onChange={setTxAmount} className="w-full text-xs py-1.5" required />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Data</label>
                              <input
                                type="date"
                                value={txDate}
                                onChange={e => setTxDate(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs"
                                required
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" className="text-xs bg-primary-600 text-white rounded-md px-3 py-1.5 hover:bg-primary-700">Salvar</button>
                            <button type="button" onClick={resetTxForm} className="text-xs text-gray-500 px-2 py-1.5">Cancelar</button>
                          </div>
                        </form>
                      )}

                      {invTransactions.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2">Nenhuma transação registrada</p>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {invTransactions.slice(0, 10).map(tx => (
                            <div key={tx.id}>
                              <div className="flex items-center justify-between py-2">
                                <div>
                                  <span className={`text-xs font-medium ${
                                    tx.type === 'contribution' ? 'text-blue-600' :
                                    tx.type === 'yield' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {tx.type === 'contribution' ? 'Aporte' : tx.type === 'yield' ? 'Rendimento' : 'Retirada'}
                                  </span>
                                  <span className="text-xs text-gray-400 ml-2">{tx.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-800">{formatCurrency(tx.amountCents)}</span>
                                  <button
                                    onClick={() => setAttachmentTxId(attachmentTxId === tx.id ? null : tx.id)}
                                    className={`transition-colors p-0.5 ${attachmentTxId === tx.id ? 'text-primary-500' : 'text-gray-300 hover:text-primary-500'}`}
                                    title="Anexos"
                                  >
                                    <Paperclip size={12} />
                                  </button>
                                  <button onClick={() => handleDeleteTransaction(tx)} className="text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                              {attachmentTxId === tx.id && (
                                <div className="pb-2 pl-2">
                                  <AttachmentInput entityType="investment_transaction" entityId={tx.id} householdId={householdId} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
