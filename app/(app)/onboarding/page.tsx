import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserHousehold } from '@/lib/supabase/queries/settings'
import { OnboardingClient } from '@/components/onboarding/OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Already has a household — go straight in
  const household = await getUserHousehold(supabase, user.id)
  if (household) redirect('/dashboard')

  return <OnboardingClient userId={user.id} userEmail={user.email ?? ''} />
}
