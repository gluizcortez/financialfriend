import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BillsClient } from '@/components/bills/BillsClient'

export default async function BillsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <BillsClient />
}
