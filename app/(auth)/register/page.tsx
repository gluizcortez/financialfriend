'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FinancialFriendLogo } from '@/components/logo/FinancialFriendLogo'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [householdName, setHouseholdName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingConfirmation, setPendingConfirmation] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }

    // No session = email confirmation required
    if (!data.session) {
      setPendingConfirmation(true)
      setLoading(false)
      return
    }

    // Session available = email confirmation disabled, create household immediately
    const { data: household, error: householdError } = await supabase
      .from('households')
      .insert({ name: householdName || `Casa de ${fullName}`, created_by: data.user.id })
      .select()
      .single()

    if (householdError || !household) {
      setError('Erro ao criar espaço financeiro. Contate o suporte.')
      setLoading(false)
      return
    }

    await supabase.from('household_members').insert({
      household_id: household.id,
      user_id: data.user.id,
      role: 'owner',
    })

    await seedDefaultCategories(supabase, household.id)

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="flex justify-center mb-8">
            <FinancialFriendLogo size={48} showText />
          </div>

          {pendingConfirmation ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">📧</div>
              <h1 className="text-xl font-semibold text-gray-900">Verifique seu e-mail</h1>
              <p className="text-sm text-gray-500">
                Enviamos um link de confirmação para <span className="font-medium text-gray-700">{email}</span>.
                Clique no link para ativar sua conta e configurar seu espaço financeiro.
              </p>
            </div>
          ) : (
          <>
          <h1 className="text-xl font-semibold text-gray-900 text-center mb-6">
            Criar sua conta
          </h1>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do seu espaço financeiro
              </label>
              <input
                type="text"
                value={householdName}
                onChange={e => setHouseholdName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ex: Casa Gabriel & Carol"
              />
              <p className="text-xs text-gray-500 mt-1">
                Você pode convidar outras pessoas para este espaço depois.
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
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-6">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary-600 hover:underline font-medium">
              Entrar
            </Link>
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  )
}

async function seedDefaultCategories(
  supabase: ReturnType<typeof createClient>,
  householdId: string
) {
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

  await supabase.from('categories').insert(
    DEFAULT_CATEGORIES.map(c => ({
      ...c,
      household_id: householdId,
      is_default: true,
    }))
  )
}
