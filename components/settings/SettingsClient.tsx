'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/stores/useUIStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import {
  getCategories,
  createCategory, updateCategory, deleteCategory,
  getHouseholdMembers, removeMember,
} from '@/lib/supabase/queries/settings'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus, Settings, LogOut, Book, Users, Copy, Check, Pencil, X } from 'lucide-react'
import Image from 'next/image'
import { WORKSPACE_COLORS } from '@/lib/constants'
import { ReleaseNotes } from './ReleaseNotes'

const CONFIRMATION_PHRASE = 'apagar todos os dados do financialfriend'

interface Props {
  userId: string
}

export function SettingsClient({ userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()
  const { activeWorkspace } = useWorkspaceStore()
  const householdId = activeWorkspace?.id ?? null

  const [resetInput, setResetInput] = useState('')
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [showReleaseNotes, setShowReleaseNotes] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data: members = [] } = useQuery({
    queryKey: ['household-members', householdId],
    queryFn: () => getHouseholdMembers(supabase, householdId!),
    enabled: !!householdId,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', householdId],
    queryFn: () => getCategories(supabase, householdId!),
    enabled: !!householdId,
  })

  async function handleCopyCode() {
    if (!householdId) return
    await navigator.clipboard.writeText(householdId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRemoveMember(uid: string) {
    if (!householdId) return
    await removeMember(supabase, householdId, uid)
    queryClient.invalidateQueries({ queryKey: ['household-members', householdId] })
    addNotification('Membro removido', 'success')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleReset() {
    if (resetInput.trim().toLowerCase() !== CONFIRMATION_PHRASE) return
    setResetting(true)

    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: CONFIRMATION_PHRASE }),
      })

      if (!res.ok) {
        const body = await res.json()
        addNotification(body.error ?? 'Erro ao apagar dados', 'error')
        return
      }

      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch {
      addNotification('Erro de conexão ao apagar dados', 'error')
    } finally {
      setResetting(false)
      setResetDialogOpen(false)
      setResetInput('')
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Settings size={22} className="text-gray-500" />
        <h1 className="text-xl font-semibold text-gray-900">Configurações</h1>
      </div>

      {/* Workspace info */}
      <Section title="Workspace Ativo" icon={<Users size={16} className="text-gray-400" />}>
        <p className="text-sm text-gray-600 mb-3">
          Workspace: <span className="font-medium text-gray-900">{activeWorkspace?.name ?? '—'}</span>
        </p>

        {householdId && (
          <>
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Membros ({members.length})</p>
              <div className="space-y-2">
                {members.map(m => (
                  <div key={m.userId} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{m.fullName ?? 'Usuário'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 capitalize">{m.role}</span>
                      {m.userId !== userId && m.role !== 'owner' && (
                        <button onClick={() => handleRemoveMember(m.userId)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">ID do workspace</p>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <code className="text-xs text-gray-600 flex-1 truncate">{householdId}</code>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 shrink-0"
                >
                  {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          </>
        )}
      </Section>

      {/* Novidades */}
      <Section title="Novidades" icon={<Book size={16} className="text-gray-400" />}>
        <button
          onClick={() => setShowReleaseNotes(true)}
          className="text-sm text-primary-600 hover:underline"
        >
          Ver o que há de novo na versão atual
        </button>
        {showReleaseNotes && <ReleaseNotes onClose={() => setShowReleaseNotes(false)} />}
      </Section>

      {/* Categories */}
      {householdId && (
        <Section title="Categorias">
          <CategoryManager householdId={householdId} categories={categories} />
        </Section>
      )}

      {/* Logout */}
      <Section title="Conta">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          <LogOut size={15} />
          Sair da conta
        </button>
      </Section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-sm font-semibold text-red-700 mb-3">Zona de Perigo</h2>
        <p className="text-sm text-red-600 mb-4">
          Apagar todos os dados é uma ação irreversível. Todos os dados do seu espaço financeiro
          serão permanentemente removidos, incluindo anexos armazenados.
        </p>

        {!resetDialogOpen ? (
          <button
            onClick={() => setResetDialogOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-red-700 border border-red-300 rounded-lg px-4 py-2 hover:bg-red-100 transition-colors"
          >
            <Trash2 size={15} />
            Apagar todos os dados
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-700 font-medium">
              Digite exatamente para confirmar:
            </p>
            <code className="block text-xs bg-red-100 text-red-800 px-3 py-2 rounded font-mono">
              {CONFIRMATION_PHRASE}
            </code>
            <input
              type="text"
              value={resetInput}
              onChange={e => setResetInput(e.target.value)}
              placeholder="Digite a frase de confirmação"
              className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={resetInput.trim().toLowerCase() !== CONFIRMATION_PHRASE || resetting}
                className="text-sm font-medium bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {resetting ? 'Apagando...' : 'Confirmar exclusão'}
              </button>
              <button
                onClick={() => { setResetDialogOpen(false); setResetInput('') }}
                className="text-sm text-gray-600 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Cortex branding */}
      <div className="flex flex-col items-center gap-2 pt-2 pb-4">
        <Image
          src="/cortex_logotransparente.png"
          alt="Cortex"
          width={90}
          height={45}
          className="object-contain opacity-60"
        />
        <p className="text-xs text-gray-400">FinancialFriend é um produto da Cortex</p>
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {WORKSPACE_COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-5 h-5 rounded-full transition-transform ${value === c ? 'ring-2 ring-offset-1 ring-gray-600 scale-110' : 'hover:scale-105'}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}

function CategoryManager({ householdId, categories }: { householdId: string; categories: ReturnType<typeof getCategories> extends Promise<infer T> ? T : never }) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'bill' | 'investment' | 'both'>('bill')
  const [newColor, setNewColor] = useState(WORKSPACE_COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  function startEdit(cat: { id: string; name: string; color: string }) {
    setEditingId(cat.id); setEditName(cat.name); setEditColor(cat.color)
  }

  async function handleSave(id: string) {
    await updateCategory(supabase, id, { name: editName.trim(), color: editColor })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    setEditingId(null)
    addNotification('Categoria atualizada', 'success')
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    await createCategory(supabase, {
      household_id: householdId,
      name: newName.trim(),
      color: newColor,
      type: newType,
      is_default: false,
      sort_order: categories.length,
    })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    setNewName('')
    setAdding(false)
    addNotification('Categoria criada', 'success')
  }

  async function handleDelete(id: string) {
    const fallback = categories.find(c => c.id !== id)
    if (!fallback) { addNotification('Mantenha pelo menos uma categoria', 'error'); return }
    await deleteCategory(supabase, id, fallback.id)
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    addNotification('Categoria removida', 'success')
  }

  const typeLabels: Record<string, string> = { bill: 'Conta', investment: 'Investimento', both: 'Ambos' }

  return (
    <div className="space-y-2">
      {categories.map(cat => (
        editingId === cat.id ? (
          <div key={cat.id} className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-3 space-y-2">
            <input
              autoFocus
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <ColorPicker value={editColor} onChange={setEditColor} />
            <div className="flex gap-2">
              <button onClick={() => handleSave(cat.id)} className="flex items-center gap-1 text-xs bg-primary-600 text-white rounded-lg px-3 py-1.5 hover:bg-primary-700">
                <Check size={12} /> Salvar
              </button>
              <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-xs text-gray-500 px-2">
                <X size={12} /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div key={cat.id} className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 group">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="flex-1 text-sm text-gray-800">{cat.name}</span>
            <span className="text-xs text-gray-400">{typeLabels[cat.type]}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(cat)} className="text-gray-400 hover:text-primary-600 transition-colors">
                <Pencil size={13} />
              </button>
              {!cat.isDefault && (
                <button onClick={() => handleDelete(cat.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        )
      ))}

      {adding ? (
        <form onSubmit={handleAdd} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 space-y-2 mt-2">
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nome da categoria"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as typeof newType)}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="bill">Conta</option>
              <option value="investment">Investimento</option>
              <option value="both">Ambos</option>
            </select>
          </div>
          <ColorPicker value={newColor} onChange={setNewColor} />
          <div className="flex gap-2">
            <button type="submit" className="text-sm bg-primary-600 text-white rounded-lg px-3 py-1.5 hover:bg-primary-700 transition-colors">
              Criar
            </button>
            <button type="button" onClick={() => setAdding(false)} className="text-sm text-gray-500 px-2">
              ✕
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mt-2"
        >
          <Plus size={14} />
          Adicionar categoria
        </button>
      )}
    </div>
  )
}
