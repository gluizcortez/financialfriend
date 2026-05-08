import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserHousehold } from '@/lib/supabase/queries/settings'
import { FGTSClient } from '@/components/fgts/FGTSClient'

export default async function FGTSPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const household = await getUserHousehold(supabase, user.id)
  if (!household) redirect('/onboarding')

  return <FGTSClient householdId={household.id} />
}
