import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NetWorthClient } from '@/components/networth/NetWorthClient'

export default async function NetWorthPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <NetWorthClient />
}
