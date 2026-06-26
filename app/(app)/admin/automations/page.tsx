'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  AUTOMATION_STATUS_LABELS, AUTOMATION_STATUS_COLORS,
  AUTOMATION_CATEGORIES, COMPANIES,
} from '@/lib/constants'
import type { Automation } from '@/lib/types'

const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function AutomationStatusBadge({ status }: { status: string }) {
  const label = AUTOMATION_STATUS_LABELS[status] ?? status
  const color = AUTOMATION_STATUS_COLORS[status] ?? '#9CA3AF'
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: color + '20', color }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = { blue: 'border-l-nt-accent', green: 'border-l-nt-success', yellow: 'border-l-nt-warning', gray: 'border-l-gray-300' }
  return (
    <div className={`rounded-card bg-white p-4 shadow-sm border-l-4 ${colors[color] ?? colors.blue}`}>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-800">{value}</p>
    </div>
  )
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCompany, setFilterCompany] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('automations')
        .select('*')
        .order('status')
        .order('name')
      setAutomations((data ?? []) as Automation[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = automations.filter(a => {
    if (filterStatus && a.status !== filterStatus) return false
    if (filterCompany && a.company !== filterCompany) return false
    if (search) {
      const q = search.toLowerCase()
      if (!a.name.toLowerCase().includes(q) && !a.description?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const active = automations.filter(a => a.status === 'active')
  const inDev = automations.filter(a => a.status === 'development')
  const totalMonthlyROI = active.reduce((sum, a) =>
    sum + (a.monthly_hours_saved * a.hourly_cost - a.monthly_license_cost), 0)

  if (loading) return (
    <div className="flex justify-center py-16">
      <LoadingSpinner size="lg" className="text-nt-accent" />
    </div>
  )

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nt-primary">Automações</h1>
          <p className="text-sm text-gray-500">Catálogo de automações implementadas pelo grupo</p>
        </div>
        <Link href="/admin/automations/new"
          className="rounded-card bg-nt-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#142d55] transition-colors shrink-0">
          + Nova Automação
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total" value={automations.length} color="blue" />
        <StatCard label="Ativas" value={active.length} color="green" />
        <StatCard label="Em Desenvolvimento" value={inDev.length} color="yellow" />
        <StatCard label="ROI Mensal (Ativas)" value={fmtBRL(totalMonthlyROI)} color="green" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar automação..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none flex-1 min-w-48"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white">
          <option value="">Todos os status</option>
          {Object.entries(AUTOMATION_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
          className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white">
          <option value="">Todas as empresas</option>
          {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-card bg-white p-12 text-center text-gray-400 shadow-sm">
          {automations.length === 0
            ? 'Nenhuma automação cadastrada. Clique em "+ Nova Automação" para começar.'
            : 'Nenhuma automação encontrada com os filtros aplicados.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => (
            <Link key={a.id} href={`/admin/automations/${a.id}`}>
              <div className="rounded-card bg-white p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 cursor-pointer">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl shrink-0"
                  style={{ backgroundColor: a.color + '20' }}>
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-semibold text-gray-800">{a.name}</span>
                    <AutomationStatusBadge status={a.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                    <span>{a.company}</span>
                    {a.tool && <><span>·</span><span>{a.tool}</span></>}
                    {a.category && <><span>·</span><span>{AUTOMATION_CATEGORIES[a.category] ?? a.category}</span></>}
                  </div>
                </div>
                {a.status === 'active' && (
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">ROI/mês</p>
                    <p className="text-sm font-bold text-nt-success">
                      {fmtBRL(a.monthly_hours_saved * a.hourly_cost - a.monthly_license_cost)}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
