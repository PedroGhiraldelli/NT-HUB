import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/Badge'
import { FREQUENCY_MONTHLY, TIME_MINUTES } from '@/lib/constants'
import type { Profile } from '@/lib/types'

const DEFAULT_HOURLY_RATE = 25

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function monthLabel(yyyymm: string) {
  const [year, month] = yyyymm.split('-')
  return `${MONTH_NAMES[parseInt(month) - 1]}/${year.slice(2)}`
}

function computeRoi(reqs: { frequency: string; time_per_execution: string; people_count: number; created_at: string }[]) {
  let totalMonthlyHours = 0
  const byMonth: Record<string, number> = {}

  for (const r of reqs) {
    const monthlyTimes = FREQUENCY_MONTHLY[r.frequency] ?? 0
    const minutes = TIME_MINUTES[r.time_per_execution] ?? 0
    const monthlyHours = (monthlyTimes * minutes * r.people_count) / 60
    totalMonthlyHours += monthlyHours
    const key = r.created_at.slice(0, 7)
    byMonth[key] = (byMonth[key] ?? 0) + monthlyHours * DEFAULT_HOURLY_RATE
  }

  const monthlyChart = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ label: monthLabel(key), value: Math.round(value), color: '#16A34A' }))

  return {
    totalMonthlyHours,
    totalMonthlySavings: totalMonthlyHours * DEFAULT_HOURLY_RATE,
    totalAnnualSavings: totalMonthlyHours * 12 * DEFAULT_HOURLY_RATE,
    monthlyChart,
  }
}

const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

async function getProfile(): Promise<Profile> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!data) redirect('/login')
  return data as Profile
}

function StatCard({ label, value, sub, color = 'blue' }: { label: string; value: number | string; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    blue: 'border-l-nt-accent',
    green: 'border-l-nt-success',
    yellow: 'border-l-nt-warning',
    red: 'border-l-nt-error',
  }
  return (
    <div className={`rounded-card bg-white p-5 shadow-sm border-l-4 ${colors[color] ?? colors.blue}`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-800">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function MiniBarChart({ data, formatValue }: {
  data: { label: string; value: number; color: string }[]
  formatValue?: (v: number) => string
}) {
  const max = Math.max(...data.map(d => d.value), 1)
  const fmt = formatValue ?? ((v: number) => String(v))
  return (
    <div className="space-y-2 mt-3">
      {data.map(item => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-24 text-xs text-gray-500 text-right shrink-0">{item.label}</span>
          <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
            <div
              className="h-full rounded transition-all"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }}
            />
          </div>
          <span className="w-20 text-xs font-semibold text-gray-700 shrink-0 text-right">{fmt(item.value)}</span>
        </div>
      ))}
    </div>
  )
}

function RoiSection({ approvedCount, totalMonthlyHours, totalMonthlySavings, totalAnnualSavings, monthlyChart }: {
  approvedCount: number
  totalMonthlyHours: number
  totalMonthlySavings: number
  totalAnnualSavings: number
  monthlyChart: { label: string; value: number; color: string }[]
}) {
  if (approvedCount === 0) return null
  return (
    <div className="rounded-card bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="font-semibold text-gray-700">ROI Consolidado — Automações Aprovadas</h2>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Base: R${DEFAULT_HOURLY_RATE}/hora · {approvedCount} automação{approvedCount !== 1 ? 'ões' : ''} aprovada{approvedCount !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-input border border-nt-accent/30 bg-blue-50 p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Horas/mês economizadas</p>
          <p className="text-2xl font-bold text-nt-primary">{totalMonthlyHours.toFixed(1)}h</p>
        </div>
        <div className="rounded-input border border-green-200 bg-green-50 p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Economia mensal</p>
          <p className="text-2xl font-bold text-nt-success">{fmtBRL(totalMonthlySavings)}</p>
        </div>
        <div className="rounded-input border border-green-200 bg-green-50 p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Economia anual estimada</p>
          <p className="text-2xl font-bold text-nt-success">{fmtBRL(totalAnnualSavings)}</p>
        </div>
      </div>
      {monthlyChart.length > 0 && (
        <>
          <p className="text-sm font-semibold text-gray-600 mb-0">Economia mensal por período</p>
          <MiniBarChart data={monthlyChart} formatValue={fmtBRL} />
        </>
      )}
    </div>
  )
}

export default async function DashboardPage() {
  const profile = await getProfile()
  const supabase = createClient()

  if (profile.role === 'collaborator') {
    const [{ count: openCount }, { count: articleCount }] = await Promise.all([
      supabase.from('automation_requests').select('*', { count: 'exact', head: true })
        .eq('submitter_id', profile.id).in('status', ['new', 'analyzing', 'approved', 'backlog']),
      supabase.from('knowledge_articles').select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    return (
      <div>
        <h1 className="text-2xl font-bold text-nt-primary mb-6">Meu Painel</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          <StatCard label="Meus chamados abertos" value={openCount ?? 0} color="blue" />
          <StatCard label="Artigos publicados esta semana" value={articleCount ?? 0} color="green" />
        </div>
        <div className="flex gap-4 flex-wrap">
          <Link href="/requests/new" className="rounded-card bg-nt-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#142d55] transition-colors">
            Abrir novo chamado
          </Link>
          <Link href="/knowledge" className="rounded-card border border-nt-primary px-5 py-2.5 text-sm font-semibold text-nt-primary hover:bg-blue-50 transition-colors">
            Base de conhecimento
          </Link>
        </div>
      </div>
    )
  }

  if (profile.role === 'director') {
    const company = profile.managed_company ?? profile.company
    const [{ data: requests }, { count: articleCount }] = await Promise.all([
      supabase
        .from('automation_requests')
        .select('status, frequency, time_per_execution, people_count, created_at')
        .eq('company', company),
      supabase
        .from('knowledge_articles')
        .select('*', { count: 'exact', head: true })
        .eq('company', company)
        .eq('status', 'published'),
    ])

    const statusCounts = (requests ?? []).reduce((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)

    const approvedReqs = (requests ?? []).filter(r => r.status === 'approved')
    const roi = computeRoi(approvedReqs)

    const chartData = [
      { label: 'Novo',        value: statusCounts.new ?? 0,       color: '#4A90D9' },
      { label: 'Em Análise',  value: statusCounts.analyzing ?? 0, color: '#D97706' },
      { label: 'Aprovado',    value: statusCounts.approved ?? 0,  color: '#16A34A' },
      { label: 'Backlog',     value: statusCounts.backlog ?? 0,   color: '#9CA3AF' },
      { label: 'Descartado',  value: statusCounts.discarded ?? 0, color: '#DC2626' },
    ]

    return (
      <div>
        <h1 className="text-2xl font-bold text-nt-primary mb-2">Painel — {company}</h1>
        <p className="text-sm text-gray-500 mb-6">Visão geral dos chamados da sua empresa</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <StatCard label="Total de chamados" value={requests?.length ?? 0} color="blue" />
          <StatCard label="Artigos publicados" value={articleCount ?? 0} color="green" />
        </div>
        <div className="rounded-card bg-white p-5 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-700 mb-1">Chamados por status</h2>
          <MiniBarChart data={chartData} />
        </div>
        <RoiSection
          approvedCount={approvedReqs.length}
          totalMonthlyHours={roi.totalMonthlyHours}
          totalMonthlySavings={roi.totalMonthlySavings}
          totalAnnualSavings={roi.totalAnnualSavings}
          monthlyChart={roi.monthlyChart}
        />
      </div>
    )
  }

  // admin / analyst
  const [
    { data: requests },
    { count: articleCount },
    { data: newRequests },
  ] = await Promise.all([
    supabase.from('automation_requests').select('status, complexity, frequency, time_per_execution, people_count, created_at'),
    supabase.from('knowledge_articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('automation_requests').select('id, request_number, title, company, created_at')
      .eq('status', 'new').order('created_at', { ascending: false }).limit(5),
  ])

  const statusCounts = (requests ?? []).reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const complexityCounts = (requests ?? []).reduce((acc, r) => {
    acc[r.complexity] = (acc[r.complexity] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const approvedReqs = (requests ?? []).filter(r => r.status === 'approved')
  const roi = computeRoi(approvedReqs)

  const statusChart = [
    { label: 'Novo',        value: statusCounts.new ?? 0,       color: '#4A90D9' },
    { label: 'Em Análise',  value: statusCounts.analyzing ?? 0, color: '#D97706' },
    { label: 'Aprovado',    value: statusCounts.approved ?? 0,  color: '#16A34A' },
    { label: 'Backlog',     value: statusCounts.backlog ?? 0,   color: '#9CA3AF' },
    { label: 'Descartado',  value: statusCounts.discarded ?? 0, color: '#DC2626' },
  ]

  const complexityChart = [
    { label: 'Simples',  value: complexityCounts.simple ?? 0,  color: '#16A34A' },
    { label: 'Médio',    value: complexityCounts.medium ?? 0,  color: '#D97706' },
    { label: 'Complexo', value: complexityCounts.complex ?? 0, color: '#DC2626' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-nt-primary mb-2">Painel Geral</h1>
      <p className="text-sm text-gray-500 mb-6">Visão consolidada de todos os chamados e artigos</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard label="Total de chamados" value={requests?.length ?? 0} color="blue" />
        <StatCard label="Aguardando análise" value={statusCounts.new ?? 0} color="yellow" sub="status: Novo" />
        <StatCard label="Artigos publicados" value={articleCount ?? 0} color="green" />
        <StatCard label="Aprovados" value={statusCounts.approved ?? 0} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-card bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-1">Chamados por status</h2>
          <MiniBarChart data={statusChart} />
        </div>
        <div className="rounded-card bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-1">Chamados por complexidade</h2>
          <MiniBarChart data={complexityChart} />
        </div>
      </div>

      <div className="mb-6">
        <RoiSection
          approvedCount={approvedReqs.length}
          totalMonthlyHours={roi.totalMonthlyHours}
          totalMonthlySavings={roi.totalMonthlySavings}
          totalAnnualSavings={roi.totalAnnualSavings}
          monthlyChart={roi.monthlyChart}
        />
      </div>

      {(newRequests ?? []).length > 0 && (
        <div className="rounded-card bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">Novos chamados aguardando análise</h2>
            <Link href="/requests?status=new" className="text-sm text-nt-accent hover:underline">Ver todos</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {newRequests?.map(r => (
              <Link
                key={r.id}
                href={`/requests/${r.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <span className="text-xs font-mono text-gray-400 mr-2">{r.request_number}</span>
                  <span className="text-sm font-medium text-gray-800">{r.title}</span>
                  <span className="ml-2 text-xs text-gray-400">{r.company}</span>
                </div>
                <StatusBadge status="new" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
