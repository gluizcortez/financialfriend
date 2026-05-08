import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Notifications } from '@/components/shared/Notifications'
import { QueryProvider } from '@/components/shared/QueryProvider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <QueryProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <Notifications />
      </div>
    </QueryProvider>
  )
}
