'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  AUTOMATION_STATUS_LABELS, AUTOMATION_STATUS_COLORS,
  AUTOMATION_CATEGORIES, COMPANIES,
} from '@/lib/constants'
import { useUser } from '@/components/providers/UserProvider'
import { useToast } from '@/components/providers/ToastProvider'
import type { Automation } from '@/lib/types'

const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Mapeamento de campos do portal antigo → banco
const STATUS_MAP: Record<string, string> = {
  'Ativa': 'active', 'ativa': 'active', 'active': 'active',
  'Em Desenvolvimento': 'development', 'em desenvolvimento': 'development', 'development': 'development',
  'Planejada': 'planned', 'planejada': 'planned', 'planned': 'planned',
  'Pausada': 'paused', 'pausada': 'paused', 'paused': 'paused',
}

const COMPANY_MAP: Record<string, string> = {
  'Nova Trindade Gestão de Serviços Compartilhados Ltda.': 'Nova Trindade SSC',
  'Nova Trindade SSC': 'Nova Trindade SSC',
}

const CATEGORY_MAP: Record<string, string> = {
  'Financeiro / Fiscal': 'fiscal', 'Fiscal': 'fiscal',
  'RPA / Automação Web': 'rpa', 'RPA': 'rpa',
  'Integração de Dados': 'data_integration',
  'Relatórios / Dashboard': 'report', 'Relatórios': 'report',
  'E-mail / Comunicação': 'email',
  'Documentos / PDF': 'document',
  'ERP / Sistema Interno': 'erp',
  'API / Webhook': 'api',
  'Outro': 'other',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapJsonToAutomation(raw: any, userId: string): Omit<Automation, 'id' | 'created_at' | 'updated_at'> {
  const steps = Array.isArray(raw.steps) ? raw.steps.join('\n') : (raw.workflow_steps ?? '')
  return {
    name: raw.name ?? '',
    company: COMPANY_MAP[raw.company] ?? raw.company ?? '',
    status: (STATUS_MAP[raw.status] ?? 'planned') as Automation['status'],
    tool: raw.tool ?? null,
    category: CATEGORY_MAP[raw.category] ?? null,
    description: raw.description ?? null,
    workflow_steps: steps || null,
    icon: raw.icon ?? '🤖',
    color: raw.color ?? '#4A90D9',
    technical_notes: raw.notes ?? raw.technical_notes ?? null,
    monthly_hours_saved: raw.roi?.horasEco ?? raw.monthly_hours_saved ?? 0,
    hourly_cost: raw.roi?.custoHora ?? raw.hourly_cost ?? 25,
    development_hours: raw.roi?.horasDev ?? raw.development_hours ?? 0,
    monthly_license_cost: raw.roi?.licenca ?? raw.monthly_license_cost ?? 0,
    go_live_date: raw.roi?.dataCampo ?? raw.go_live_date ?? null,
    created_by: userId,
  }
}

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
  const colors: Record<string, string> = { blue: 'border-l-nt-accent', green: 'border-l-nt-success', yellow: 'border-l-nt-warning' }
  return (
    <div className={`rounded-card bg-white p-4 shadow-sm border-l-4 ${colors[color] ?? colors.blue}`}>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-800">{value}</p>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ImportModal({ items, onConfirm, onCancel, importing }: {
  items: ReturnType<typeof mapJsonToAutomation>[]
  onConfirm: () => void
  onCancel: () => void
  importing: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-card shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-nt-primary text-lg">Importar Automações</h3>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} automação{items.length !== 1 ? 'ões' : ''} encontrada{items.length !== 1 ? 's' : ''} no arquivo</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {items.map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl shrink-0"
                style={{ backgroundColor: a.color + '20' }}>
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{a.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <AutomationStatusBadge status={a.status} />
                  <span className="text-xs text-gray-400 truncate">{a.company}</span>
                </div>
              </div>
              {a.monthly_hours_saved > 0 && (
                <div className="text-right shrink-0 text-xs text-gray-500">
                  {a.monthly_hours_saved}h/mês
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onConfirm} disabled={importing}
            className="flex items-center gap-2 flex-1 justify-center rounded-card bg-nt-primary py-2.5 text-sm font-semibold text-white hover:bg-[#142d55] disabled:opacity-50 transition-colors">
            {importing && <LoadingSpinner size="sm" className="text-white" />}
            {importing ? 'Importando...' : `Importar ${items.length} automação${items.length !== 1 ? 'ões' : ''}`}
          </button>
          <button onClick={onCancel} disabled={importing}
            className="rounded-card border border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AutomationsPage() {
  const { profile } = useUser()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCompany, setFilterCompany] = useState('')

  const [importItems, setImportItems] = useState<ReturnType<typeof mapJsonToAutomation>[] | null>(null)
  const [importing, setImporting] = useState(false)

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

  useEffect(() => { load() }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string)
        // Suporta formato { automacoes: [...] } ou array direto
        const raw = Array.isArray(json) ? json : (json.automacoes ?? json.automations ?? [])
        if (!raw.length) { showToast('Nenhuma automação encontrada no arquivo', 'error'); return }
        const mapped = raw.map((item: unknown) => mapJsonToAutomation(item, profile.id))
        setImportItems(mapped)
      } catch {
        showToast('Arquivo JSON inválido', 'error')
      }
      // Limpa o input para permitir reimportar o mesmo arquivo
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsText(file)
  }

  async function handleConfirmImport() {
    if (!importItems) return
    setImporting(true)
    const supabase = createClient()
    const { error } = await supabase.from('automations').insert(importItems)
    if (error) {
      showToast('Erro ao importar: ' + error.message, 'error')
    } else {
      showToast(`${importItems.length} automação${importItems.length !== 1 ? 'ões importadas' : ' importada'} com sucesso`, 'success')
      setImportItems(null)
      await load()
    }
    setImporting(false)
  }

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
  const totalAnnualROI = totalMonthlyROI * 12

  if (loading) return (
    <div className="flex justify-center py-16">
      <LoadingSpinner size="lg" className="text-nt-accent" />
    </div>
  )

  return (
    <div>
      {importItems && (
        <ImportModal
          items={importItems}
          onConfirm={handleConfirmImport}
          onCancel={() => setImportItems(null)}
          importing={importing}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nt-primary">Automações</h1>
          <p className="text-sm text-gray-500">Catálogo de automações implementadas pelo grupo</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-card border border-nt-primary px-4 py-2.5 text-sm font-semibold text-nt-primary hover:bg-blue-50 transition-colors">
            Importar JSON
          </button>
          <Link href="/admin/automations/new"
            className="rounded-card bg-nt-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#142d55] transition-colors">
            + Nova Automação
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total" value={automations.length} color="blue" />
        <StatCard label="Ativas" value={active.length} color="green" />
        <StatCard label="Economia Mensal" value={fmtBRL(totalMonthlyROI)} color="green" />
        <StatCard label="Economia Anual" value={fmtBRL(totalAnnualROI)} color="green" />
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
            ? 'Nenhuma automação cadastrada. Clique em "+ Nova Automação" ou "Importar JSON".'
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
                {a.monthly_hours_saved > 0 && (
                  <div className="text-right shrink-0 space-y-0.5">
                    <div>
                      <p className="text-xs text-gray-400">Economia/mês</p>
                      <p className="text-sm font-bold text-nt-success">
                        {fmtBRL(a.monthly_hours_saved * a.hourly_cost - a.monthly_license_cost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Economia/ano</p>
                      <p className="text-sm font-semibold text-nt-primary">
                        {fmtBRL((a.monthly_hours_saved * a.hourly_cost - a.monthly_license_cost) * 12)}
                      </p>
                    </div>
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
