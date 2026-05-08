import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/reset
// Deletes ALL data for the authenticated user's household.
// Uses service_role to bypass RLS for cascade deletion.
// After successful deletion, the client must sign out and redirect to /login.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { confirmation } = body as { confirmation?: string }

    if (confirmation !== 'apagar todos os dados do financialfriend') {
      return NextResponse.json({ error: 'Confirmação inválida' }, { status: 400 })
    }

    const userClient = await createClient()
    const { data: { user }, error: authError } = await userClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: membership } = await userClient
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Household não encontrado' }, { status: 404 })
    }

    const householdId = membership.household_id

    const admin = createServiceClient()

    // Delete all Storage files for this household
    const { data: storageFiles } = await admin.storage
      .from('attachments')
      .list(householdId, { limit: 1000 })

    if (storageFiles?.length) {
      const paths = storageFiles.map(f => `${householdId}/${f.name}`)
      await admin.storage.from('attachments').remove(paths)
    }

    const { data: attachmentRows } = await admin
      .from('attachments')
      .select('storage_path')
      .eq('household_id', householdId)

    if (attachmentRows?.length) {
      const storagePaths = attachmentRows.map(a => a.storage_path)
      for (let i = 0; i < storagePaths.length; i += 100) {
        await admin.storage.from('attachments').remove(storagePaths.slice(i, i + 100))
      }
    }

    // Delete all household data in FK-safe order
    const tables = [
      'notifications',
      'workspace_invitations',
      'goal_contributions',
      'goal_linked_investments',
      'goals',
      'bill_entries',
      'monthly_bill_records',
      'bills',
      'investment_transactions',
      'investments',
      'fgts_records',
      'income_entries',
      'attachments',
      'categories',
      'custom_fields',
    ] as const

    for (const table of tables) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from(table) as any).delete().eq('household_id', householdId)
    }

    await admin.from('household_members').delete().eq('household_id', householdId)
    await admin.from('households').delete().eq('id', householdId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/reset]', error)
    return NextResponse.json({ error: 'Erro interno ao apagar dados' }, { status: 500 })
  }
}
