import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserWorkspaces } from '@/lib/supabase/queries/workspaces'
import { WorkspacesClient } from '@/components/workspaces/WorkspacesClient'

export default async function WorkspacesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const workspaces = await getUserWorkspaces(supabase, user.id)
  return <WorkspacesClient initialWorkspaces={workspaces} userId={user.id} />
}
