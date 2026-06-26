'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/components/providers/UserProvider'
import { StatusBadge, ComplexityBadge } from '@/components/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { SearchIcon, EyeIcon } from '@/components/Icons'
import { STATUS_LABELS, COMPANIES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { AutomationRequest } from '@/lib/types'

export default function RequestsPage() {
  const { profile } = useUser()
  const [requests, setRequests] = useState<AutomationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [complexityFilter, setComplexityFilter] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      let query = supabase.from('automation_requests').select('*').order('created_at', { ascending: false })

      if (profile.role === 'collaborator') {
        query = query.eq('submitter_id', profile.id)
      } else if (profile.role === 'director' && profile.managed_company) {
        query = query.eq('company', profile.managed_company)
      }

      const { data } = await query
      setRequests((data as AutomationRequest[]) ?? [])
      setLoading(false)
    }
    load()
  }, [profile])

  const filtered = requests.filter(r => {
    const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.request_number.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || r.status === statusFilter
    const matchesCompany = !companyFilter || r.company === companyFilter
    const matchesComplexity = !complexityFilter || r.complexity === complexityFilter
    return matchesSearch && matchesStatus && matchesCompany && matchesComplexity
  })

  const isAdmin = profile.role === 'admin' || profile.role === 'analyst'
  const isCollaborator = profile.role === 'collaborator'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nt-primary">
            {isCollaborator ? 'Meus Chamados' : 'Chamados'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {(profile.role === 'collaborator' || profile.role === 'director') && (
          <Link
            href="/requests/new"
            className="rounded-card bg-nt-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#142d55] transition-colors"
          >
            + Novo Chamado
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="rounded-card bg-white p-4 shadow-sm mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título ou número..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-input border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-nt-accent focus:outline-none focus:ring-1 focus:ring-nt-accent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {isAdmin && (
          <select
            value={companyFilter}
            onChange={e => setCompanyFilter(e.target.value)}
            className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white"
          >
            <option value="">Todas as empresas</option>
            {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <select
          value={complexityFilter}
          onChange={e => setComplexityFilter(e.target.value)}
          className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white"
        >
          <option value="">Todas as complexidades</option>
          <option value="simple">Simples</option>
          <option value="medium">Médio</option>
          <option value="complex">Complexo</option>
        </select>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" className="text-nt-accent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-card bg-white p-12 text-center shadow-sm">
          <p className="text-gray-500 text-sm">Nenhum chamado encontrado.</p>
          {isCollaborator && (
            <Link href="/requests/new" className="mt-4 inline-block text-sm text-nt-accent hover:underline">
              Abrir o primeiro chamado
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-card bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Número</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Título</th>
                  {isAdmin && <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Empresa</th>}
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Frequência</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Complexidade</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Data</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.request_number}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 leading-tight">{r.title}</p>
                    </td>
                    {isAdmin && <td className="px-4 py-3 text-gray-600">{r.company}</td>}
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.frequency}</td>
                    <td className="px-4 py-3"><ComplexityBadge complexity={r.complexity} /></td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/requests/${r.id}`}
                        className="flex items-center gap-1 text-nt-accent hover:text-nt-primary text-xs font-medium"
                      >
                        <EyeIcon size={14} /> Ver
                      </Link>
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
