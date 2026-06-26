'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function loginAction(
  email: string,
  password: string
): Promise<{ success: true } | { error: string }> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.log('[AUTH] Erro signInWithPassword:', error.message)
    return { error: error.message }
  }

  console.log('[AUTH] Login OK, user:', data.user?.id)
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll().map(c => c.name)
  console.log('[AUTH] Cookies após login:', allCookies.join(', '))

  return { success: true }
}
