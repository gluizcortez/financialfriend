'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FinancialFriendLogo } from '@/components/logo/FinancialFriendLogo'
import { createHouseholdAction } from '@/app/(app)/onboarding/actions'

interface Props {
  userEmail: string
}

export function OnboardingClient({ userEmail }: Props) {
  const router = useRouter()
  const [householdName, setHouseholdName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await createHouseholdAction(householdName)

    if (error) {
      console.error('[onboarding] createHouseholdAction error:', error)
      setError('Erro ao criar espaço financeiro. Tente novamente.')
      setLoading(false)
      return
    }

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
