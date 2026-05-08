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

    // Authenticate with user client (respects auth)
    const userClient = await createClient()
    const { data: { user }, error: authError } = await userClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Get the user's household
    const { data: membership } = await userClient
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Household não encontrado' }, { status: 404 })
    }

    const householdId = membership.household_id

    // Use service_role to perform the deletion (bypasses RLS for cascade)
    const admin = createServiceClient()

    // Step 1: Delete all Storage files for this household
    const { data: storageFiles } = await admin.storage
      .from('attachments')
      .list(householdId, { limit: 1000 })

    if (storageFiles?.length) {
      const paths = storageFiles.map(f => `${householdId}/${f.name}`)
      await admin.storage.from('attachments').remove(paths)
    }

    // Also remove nested paths (entity sub-folders)
    const { data: attachmentRows } = await admin
      .from('attachments')
      .select('storage_path')
      .eq('household_id', householdId)

    if (attachmentRows?.length) {
      const storagePaths = attachmentRows.map(a => a.storage_path)
      // Remove in batches of 100
      for (let i = 0; i < storagePaths.length; i += 100) {
        await admin.storage.from('attachments').remove(storagePaths.slice(i, i + 100))
      }
    }

    // Step 2: Delete all household data (cascade deletes workspaces → bills → entries → etc.)
    // Order matters for non-cascade FKs
    // Join tables (goal_linked_*, net_worth_tab_*) cascade-delete with their parents
    const tables = [
      'goal_contributions',
      'goals',
      'net_worth_tabs',
      'attachments',
      'bill_entries',
      'monthly_bill_records',
      'bills',
      'investment_transactions',
      'investments',
      'fgts_records',
      'income_entries',
      'custom_fields',
      'categories',
      'workspaces',
    ] as const

    for (const table of tables) {
      await admin.from(table).delete().eq('household_id', householdId)
    }

    // Step 3: Remove household members and the household itself
    await admin.from('household_members').delete().eq('household_id', householdId)
    await admin.from('households').delete().eq('id', householdId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/reset]', error)
    return NextResponse.json({ error: 'Erro interno ao apagar dados' }, { status: 500 })
  }
}
