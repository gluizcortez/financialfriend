import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserHousehold } from '@/lib/supabase/queries/settings'
import { SettingsClient } from '@/components/settings/SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const household = await getUserHousehold(supabase, user.id)
  if (!household) redirect('/onboarding')

  return <SettingsClient householdId={household.id} householdName={household.name} userId={user.id} />
}
