import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { UserProvider } from '@/components/providers/UserProvider'
import { ToastProvider } from '@/components/providers/ToastProvider'
import type { Profile } from '@/lib/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Sessão válida mas sem perfil → sign out para evitar redirect loop
    await supabase.auth.signOut()
    redirect('/login')
  }

  if (!profile.active) {
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <UserProvider profile={profile as Profile}>
      <ToastProvider>
        <div className="flex min-h-screen bg-nt-bg">
          <Sidebar
            role={profile.role}
            userName={profile.full_name}
            company={profile.company}
          />
          <div className="flex flex-1 flex-col min-w-0">
            <Header />
            <main className="flex-1 p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </UserProvider>
  )
}
