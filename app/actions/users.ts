'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export interface CreateUserPayload {
  full_name: string
  email: string
  password: string
  role: string
  company: string
  managed_company?: string
}

export async function createUser(payload: CreateUserPayload): Promise<{ error?: string; data?: { tempPassword: string } }> {
  // Verificar que o solicitante é admin
  const supabase = createServerClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return { error: 'Não autenticado' }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, id')
    .eq('id', currentUser.id)
    .single()

  if (!currentProfile || currentProfile.role !== 'admin') {
    return { error: 'Apenas administradores podem criar usuários' }
  }

  const admin = getAdminClient()

  // Criar o usuário no Supabase Auth
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: {
      full_name: payload.full_name,
      role: payload.role,
      company: payload.company,
      managed_company: payload.managed_company ?? null,
    },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { error: 'Este e-mail já está cadastrado.' }
    }
    return { error: authError.message }
  }

  // Inserir perfil na tabela profiles
  const { error: profileError } = await admin.from('profiles').insert({
    id: authData.user.id,
    full_name: payload.full_name,
    email: payload.email,
    role: payload.role,
    company: payload.company,
    managed_company: payload.managed_company ?? null,
    created_by: currentProfile.id,
    active: true,
  })

  if (profileError) {
    // Rollback: remove o usuário auth criado
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: 'Erro ao criar perfil: ' + profileError.message }
  }

  return { data: { tempPassword: payload.password } }
}
