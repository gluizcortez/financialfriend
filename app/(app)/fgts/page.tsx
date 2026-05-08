import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FGTSClient } from '@/components/fgts/FGTSClient'

export default async function FGTSPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <FGTSClient />
}
