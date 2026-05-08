import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Notifications } from '@/components/shared/Notifications'
import { QueryProvider } from '@/components/shared/QueryProvider'
import { WorkspaceStoreInit } from '@/components/workspace/WorkspaceStoreInit'
import { getUserWorkspaces, checkAndCreateInviteNotifications } from '@/lib/supabase/queries/workspaces'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Process pending invitations (non-blocking)
  checkAndCreateInviteNotifications(supabase, user.id, user.email ?? '')

  let workspaces = await getUserWorkspaces(supabase, user.id)

  // Fallback: trigger might have failed — create default workspace inline
  if (!workspaces.length) {
    const db = createServiceClient()
    // Ensure profile row exists (may be missing after data reset or if trigger failed)
    await db.from('profiles').upsert(
      { id: user.id, full_name: user.user_metadata?.full_name ?? null },
      { onConflict: 'id', ignoreDuplicates: true }
    )
    const { data: household } = await db
      .from('households')
      .insert({ name: 'Meu Espaço', created_by: user.id })
      .select()
      .single()

    if (household) {
      await db.from('household_members').insert({
        household_id: household.id,
        user_id: user.id,
        role: 'owner',
      })
      workspaces = [{ id: household.id, name: household.name, createdBy: user.id, createdAt: household.created_at, updatedAt: household.updated_at }]
    }
  }

  return (
    <QueryProvider>
      <WorkspaceStoreInit workspaces={workspaces} />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar userId={user.id} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <Notifications />
      </div>
    </QueryProvider>
  )
}
