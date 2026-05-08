import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserHousehold } from '@/lib/supabase/queries/settings'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const household = await getUserHousehold(supabase, user.id)
  if (!household) redirect('/onboarding')

  return <DashboardClient householdId={household.id} />
}
