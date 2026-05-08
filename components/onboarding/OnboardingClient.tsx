'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FinancialFriendLogo } from '@/components/logo/FinancialFriendLogo'

const DEFAULT_CATEGORIES = [
  { name: 'Moradia', color: '#6366f1', type: 'bill' as const, sort_order: 0 },
  { name: 'Transporte', color: '#3b82f6', type: 'bill' as const, sort_order: 1 },
  { name: 'Alimentação', color: '#10b981', type: 'bill' as const, sort_order: 2 },
  { name: 'Saúde', color: '#ef4444', type: 'bill' as const, sort_order: 3 },
  { name: 'Educação', color: '#f59e0b', type: 'bill' as const, sort_order: 4 },
  { name: 'Lazer', color: '#ec4899', type: 'bill' as const, sort_order: 5 },
  { name: 'Serviços', color: '#8b5cf6', type: 'bill' as const, sort_order: 6 },
  { name: 'Seguros', color: '#06b6d4', type: 'bill' as const, sort_order: 7 },
  { name: 'Outros', color: '#6b7280', type: 'both' as const, sort_order: 8 },
  { name: 'Renda Fixa', color: '#059669', type: 'investment' as const, sort_order: 9 },
  { name: 'Renda Variável', color: '#d97706', type: 'investment' as const, sort_order: 10 },
  { name: 'Criptomoedas', color: '#f97316', type: 'investment' as const, sort_order: 11 },
]

interface Props {
  userId: string
  userEmail: string
}

export function OnboardingClient({ userId, userEmail }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [householdName, setHouseholdName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: household, error: householdError } = await supabase
      .from('households')
      .insert({ name: householdName || `Meu Espaço Financeiro`, created_by: userId })
      .select()
      .single()

    if (householdError || !household) {
      setError('Erro ao criar espaço financeiro. Tente novamente.')
      setLoading(false)
      return
    }

    await supabase.from('household_members').insert({
      household_id: household.id,
      user_id: userId,
      role: 'owner',
    })

    await supabase.from('categories').insert(
      DEFAULT_CATEGORIES.map(c => ({
        ...c,
        household_id: household.id,
        is_default: true,
      }))
    )

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="flex justify-center mb-8">
            <FinancialFriendLogo size={48} showText />
          </div>

          <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
            Bem-vindo ao FinancialFriend!
          </h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            Conta verificada: <span className="font-medium text-gray-700">{userEmail}</span>
            <br />Configure seu espaço financeiro para começar.
          </p>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do espaço financeiro
              </label>
              <input
                type="text"
                value={householdName}
                onChange={e => setHouseholdName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: Casa Gabriel & Carol"
              />
              <p className="text-xs text-gray-500 mt-1">
                Você pode convidar outra pessoa depois, em Configurações.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-600 text-white py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Criando...' : 'Criar espaço e entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
