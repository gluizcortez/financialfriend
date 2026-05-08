'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getGoals, createGoal, updateGoal, deleteGoal, addContribution, deleteContribution } from '@/lib/supabase/queries/goals'
import { formatCurrency, formatDate, getCurrentMonthKey } from '@/lib/formatters'
import { calculateGoalProgress } from '@/lib/calculations'
import { EmptyState } from '@/components/shared/EmptyState'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { Target, Plus, Trash2, ChevronDown, ChevronUp, Pencil, Check, X } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { WorkspaceHero } from '@/components/workspace/WorkspaceHero'
import { PERIODICITY_LABELS } from '@/lib/constants'
import type { Database } from '@/types/database'
import type { GoalContribution } from '@/types/models'

type Periodicity = Database['public']['Tables']['goals']['Insert']['periodicity']

export function GoalsClient() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()
  const { activeWorkspace } = useWorkspaceStore()
  const householdId = activeWorkspace?.id ?? null

  const [adding, setAdding] = useState(false)
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null)
  const [addingContribForGoalId, setAddingContribForGoalId] = useState<string | null>(null)

  const [goalName, setGoalName] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [goalTarget, setGoalTarget] = useState(0)
  const [goalPeriodicity, setGoalPeriodicity] = useState<Periodicity>('monthly')
  const [goalStartDate, setGoalStartDate] = useState(new Date().toISOString().split('T')[0])

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editGoalName, setEditGoalName] = useState('')
  const [editGoalDescription, setEditGoalDescription] = useState('')
  const [editGoalTarget, setEditGoalTarget] = useState(0)
  const [editGoalPeriodicity, setEditGoalPeriodicity] = useState<Periodicity>('monthly')

  const [contribPeriodKey, setContribPeriodKey] = useState(getCurrentMonthKey())
  const [contribTarget, setContribTarget] = useState(0)
  const [contribActual, setContribActual] = useState(0)
  const [contribDate, setContribDate] = useState(new Date().toISOString().split('T')[0])
  const [contribNotes, setContribNotes] = useState('')

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', householdId],
    queryFn: () => getGoals(supabase, householdId!),
    enabled: !!householdId,
  })

  function resetForm() {
    setGoalName(''); setGoalDescription(''); setGoalTarget(0)
    setGoalPeriodicity('monthly')
    setGoalStartDate(new Date().toISOString().split('T')[0])
    setAdding(false)
  }

  function resetContribForm() {
    setContribPeriodKey(getCurrentMonthKey())
    setContribTarget(0); setContribActual(0)
    setContribDate(new Date().toISOString().split('T')[0])
    setContribNotes('')
    setAddingContribForGoalId(null)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!householdId) return
    await createGoal(supabase, {
      household_id: householdId,
      name: goalName,
      description: goalDescription,
      goal_type: 'manual',
      target_amount_cents: goalTarget,
      periodicity: goalPeriodicity,
      start_date: goalStartDate,
      is_active: true,
    }, [])
    queryClient.invalidateQueries({ queryKey: ['goals', householdId] })
    addNotification('Meta criada', 'success')
    resetForm()
  }

  function startEditGoal(goalId: string) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    setEditingGoalId(goalId)
    setEditGoalName(goal.name)
    setEditGoalDescription(goal.description ?? '')
    setEditGoalTarget(goal.targetAmountCents)
    setEditGoalPeriodicity(goal.periodicity as Periodicity)
  }

  async function handleSaveGoal(goalId: string) {
    await updateGoal(supabase, goalId, {
      name: editGoalName,
      description: editGoalDescription,
      target_amount_cents: editGoalTarget,
      periodicity: editGoalPeriodicity,
    })
    queryClient.invalidateQueries({ queryKey: ['goals', householdId] })
    setEditingGoalId(null)
    addNotification('Meta atualizada', 'success')
  }

  async function handleToggleActive(goalId: string, isActive: boolean) {
    await updateGoal(supabase, goalId, { is_active: !isActive })
    queryClient.invalidateQueries({ queryKey: ['goals', householdId] })
  }

  async function handleDeleteGoal(goalId: string) {
    await deleteGoal(supabase, goalId)
    queryClient.invalidateQueries({ queryKey: ['goals', householdId] })
    addNotification('Meta removida', 'success')
  }

  async function handleAddContrib(e: React.FormEvent, goalId: string) {
    e.preventDefault()
    if (!householdId) return
    await addContribution(supabase, {
      goal_id: goalId,
      household_id: householdId,
      period_key: contribPeriodKey,
      target_amount_cents: contribTarget,
      actual_amount_cents: contribActual,
      date: contribDate,
      notes: contribNotes,
    })
    queryClient.invalidateQueries({ queryKey: ['goals', householdId] })
    addNotification('Contribuição registrada', 'success')
    resetContribForm()
  }

  async function handleDeleteContrib(c: GoalContribution) {
    await deleteContribution(supabase, c.id)
    queryClient.invalidateQueries({ queryKey: ['goals', householdId] })
    addNotification('Contribuição removida', 'success')
  }

  if (!householdId) {
    return <div className="p-6 text-sm text-gray-400">Carregando workspace...</div>
  }

  if (isLoading) return <div className="p-6 text-sm text-gray-400">Carregando...</div>

  return (
    <div className="flex flex-col h-full">
      <WorkspaceHero title="Metas" />
      <div className="p-6 flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target size={22} className="text-gray-500" />
            <h1 className="text-xl font-semibold text-gray-900">Metas</h1>
          </div>
          <button
            onClick={() => setAdding(!adding)}
            className="flex items-center gap-1.5 text-sm bg-primary-600 text-white rounded-lg px-3 py-1.5 hover:bg-primary-700 transition-colors"
          >
            <Plus size={14} />
            Nova meta
          </button>
        </div>

        {adding && (
          <form onSubmit={handleAdd} className="rounded-xl border border-gray-200 bg-white p-5 mb-6 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Nova Meta</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nome</label>
                <input
                  value={goalName}
                  onChange={e => setGoalName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Ex: Reserva de emergência"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Valor alvo por período</label>
                <CurrencyInput valueCents={goalTarget} onChange={setGoalTarget} className="w-full" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Periodicidade</label>
                <select
                  value={goalPeriodicity}
                  onChange={e => setGoalPeriodicity(e.target.value as Periodicity)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {Object.entries(PERIODICITY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data de início</label>
                <input
                  type="date"
                  value={goalStartDate}
                  onChange={e => setGoalStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <input
              value={goalDescription}
              onChange={e => setGoalDescription(e.target.value)}
              placeholder="Descrição (opcional)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button type="submit" className="text-sm bg-primary-600 text-white rounded-lg px-4 py-1.5 hover:bg-primary-700 transition-colors">Criar meta</button>
              <button type="button" onClick={resetForm} className="text-sm text-gray-500 px-3 py-1.5">Cancelar</button>
            </div>
          </form>
        )}

        {goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nenhuma meta"
            description="Crie sua primeira meta financeira."
            action={{ label: 'Nova meta', onClick: () => setAdding(true) }}
          />
        ) : (
          <div className="grid gap-4">
            {goals.map(goal => {
              const progress = calculateGoalProgress(goal)
              const isExpanded = expandedGoalId === goal.id
              const isEditing = editingGoalId === goal.id
              return (
                <div key={goal.id} className="rounded-xl border border-gray-200 bg-white p-5">
                  {isEditing ? (
                    <div className="mb-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-0.5">Nome</label>
                          <input value={editGoalName} onChange={e => setEditGoalName(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm" required />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-0.5">Valor alvo por período</label>
                          <CurrencyInput valueCents={editGoalTarget} onChange={setEditGoalTarget} className="w-full" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-0.5">Periodicidade</label>
                          <select value={editGoalPeriodicity} onChange={e => setEditGoalPeriodicity(e.target.value as Periodicity)}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
                            {Object.entries(PERIODICITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-0.5">Descrição</label>
                          <input value={editGoalDescription} onChange={e => setEditGoalDescription(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveGoal(goal.id)} className="flex items-center gap-1 text-xs bg-primary-600 text-white rounded-lg px-3 py-1.5 hover:bg-primary-700 transition-colors">
                          <Check size={12} /> Salvar
                        </button>
                        <button onClick={() => setEditingGoalId(null)} className="flex items-center gap-1 text-xs text-gray-500 px-3 py-1.5">
                          <X size={12} /> Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{goal.name}</h3>
                        <p className="text-xs text-gray-400">{PERIODICITY_LABELS[goal.periodicity]}</p>
                        {goal.description && <p className="text-xs text-gray-500 mt-1">{goal.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEditGoal(goal.id)} className="text-gray-300 hover:text-primary-600 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(goal.id, goal.isActive)}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                            goal.isActive
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {goal.isActive ? 'Ativa' : 'Pausada'}
                        </button>
                        <button onClick={() => handleDeleteGoal(goal.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{formatCurrency(progress.actual)} de {formatCurrency(progress.target || goal.targetAmountCents)}</span>
                    <span className={`font-medium ${
                      progress.status === 'above' ? 'text-green-600' :
                      progress.status === 'below' ? 'text-red-500' : 'text-gray-600'
                    }`}>
                      {progress.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        progress.status === 'above' ? 'bg-green-500' :
                        progress.status === 'below' ? 'bg-amber-500' : 'bg-primary-500'
                      }`}
                      style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                    />
                  </div>

                  <button
                    onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {(goal.contributions ?? []).length > 0
                      ? `${goal.contributions!.length} contribuição(ões)`
                      : 'Ver contribuições'}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                      {(goal.contributions ?? []).length > 0 && (
                        <div className="space-y-1">
                          {(goal.contributions ?? []).map(c => (
                            <div key={c.id} className="flex items-center justify-between text-xs py-1">
                              <span className="text-gray-500">{c.periodKey}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-gray-400">Meta: {formatCurrency(c.targetAmountCents)}</span>
                                <span className={`font-medium ${c.actualAmountCents >= c.targetAmountCents ? 'text-green-600' : 'text-amber-600'}`}>
                                  Real: {formatCurrency(c.actualAmountCents)}
                                </span>
                                {c.date && <span className="text-gray-400">{formatDate(c.date)}</span>}
                                <button onClick={() => handleDeleteContrib(c)} className="text-gray-300 hover:text-red-500 transition-colors ml-1">
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {addingContribForGoalId === goal.id ? (
                        <form onSubmit={e => handleAddContrib(e, goal.id)} className="bg-gray-50 rounded-lg p-3 space-y-2 mt-2">
                          <p className="text-xs font-medium text-gray-700">Nova contribuição</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-0.5">Período (AAAA-MM)</label>
                              <input
                                value={contribPeriodKey}
                                onChange={e => setContribPeriodKey(e.target.value)}
                                placeholder="2025-01"
                                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-0.5">Data</label>
                              <input
                                type="date"
                                value={contribDate}
                                onChange={e => setContribDate(e.target.value)}
                                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-0.5">Meta do período</label>
                              <CurrencyInput valueCents={contribTarget} onChange={setContribTarget} className="w-full text-xs" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-0.5">Valor real</label>
                              <CurrencyInput valueCents={contribActual} onChange={setContribActual} className="w-full text-xs" />
                            </div>
                          </div>
                          <input
                            value={contribNotes}
                            onChange={e => setContribNotes(e.target.value)}
                            placeholder="Observações (opcional)"
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                          />
                          <div className="flex gap-2">
                            <button type="submit" className="text-xs bg-primary-600 text-white rounded px-3 py-1.5 hover:bg-primary-700 transition-colors">
                              Salvar
                            </button>
                            <button type="button" onClick={resetContribForm} className="text-xs text-gray-500 px-2 py-1.5">
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => setAddingContribForGoalId(goal.id)}
                          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-1 transition-colors"
                        >
                          <Plus size={12} />
                          Registrar contribuição
                        </button>
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
