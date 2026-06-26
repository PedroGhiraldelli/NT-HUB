'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/providers/ToastProvider'
import { RoleBadge, Badge } from '@/components/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { SearchIcon, PlusIcon } from '@/components/Icons'
import { ROLE_LABELS, COMPANIES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/lib/types'

export default function UsersPage() {
  const { showToast } = useToast()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function loadUsers() {
    const supabase = createClient()
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers((data as Profile[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  async function toggleActive(user: Profile) {
    setTogglingId(user.id)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ active: !user.active })
      .eq('id', user.id)
    if (error) {
      showToast('Erro ao atualizar usuário', 'error')
    } else {
      showToast(`Usuário ${user.active ? 'desativado' : 'ativado'} com sucesso`, 'success')
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: !u.active } : u))
    }
    setTogglingId(null)
  }

  const filtered = users.filter(u => {
    const matchesSearch = !search
      || u.full_name.toLowerCase().includes(search.toLowerCase())
      || u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = !roleFilter || u.role === roleFilter
    const matchesCompany = !companyFilter || u.company === companyFilter
    return matchesSearch && matchesRole && matchesCompany
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nt-primary">Gestão de Usuários</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} usuário{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/users/new"
          className="flex items-center gap-2 rounded-card bg-nt-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#142d55] transition-colors"
        >
          <PlusIcon size={16} /> Novo Usuário
        </Link>
      </div>

      {/* Filtros */}
      <div className="rounded-card bg-white p-4 shadow-sm mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-input border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-nt-accent focus:outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white"
        >
          <option value="">Todos os perfis</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
          className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white"
        >
          <option value="">Todas as empresas</option>
          {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" className="text-nt-accent" />
        </div>
      ) : (
        <div className="rounded-card bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">E-mail</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Perfil</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Empresa</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Criado em</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : filtered.map(user => (
                  <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${!user.active ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{user.full_name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{user.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      <div>{user.company}</div>
                      {user.managed_company && (
                        <div className="text-gray-400">Gerencia: {user.managed_company}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.active ? 'success' : 'gray'}>
                        {user.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => toggleActive(user)}
                          disabled={togglingId === user.id}
                          className={`text-xs font-medium transition-colors disabled:opacity-50
                            ${user.active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}
                        >
                          {togglingId === user.id ? (
                            <LoadingSpinner size="sm" className="text-gray-400" />
                          ) : user.active ? 'Desativar' : 'Ativar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
