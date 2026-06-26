'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/components/providers/UserProvider'
import { useToast } from '@/components/providers/ToastProvider'
import { StatusBadge, ComplexityBadge } from '@/components/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { CommentsSection } from '@/components/CommentsSection'
import { STATUS_LABELS, FREQUENCY_MONTHLY, TIME_MINUTES } from '@/lib/constants'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { AutomationRequest } from '@/lib/types'

function InfoBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value || <span className="italic text-gray-400">Não informado</span>}</p>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-nt-primary text-base mb-4 pb-2 border-b border-gray-100">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

function yesNoLabel(v: string) {
  return { yes: 'Sim', no: 'Não', unknown: 'Não sei' }[v] ?? v
}

function RoiCalculator({ request }: { request: AutomationRequest }) {
  const [hourlyRate, setHourlyRate] = useState(25)

  const monthlyTimes = FREQUENCY_MONTHLY[request.frequency] ?? 0
  const minutes = TIME_MINUTES[request.time_per_execution] ?? 0
  const monthlyHours = (monthlyTimes * minutes * request.people_count) / 60
  const monthlySavings = monthlyHours * hourlyRate
  const annualSavings = monthlySavings * 12

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  if (monthlyTimes === 0) {
    return (
      <div className="rounded-input border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        ROI não calculável para frequência &quot;Sob demanda&quot;.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 shrink-0">Custo/hora (R$):</label>
        <input
          type="number"
          min={0}
          step={5}
          value={hourlyRate}
          onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)}
          className="w-28 rounded-input border border-gray-300 px-3 py-1.5 text-sm focus:border-nt-accent focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-input border border-nt-accent/30 bg-blue-50 p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Horas/mês economizadas</p>
          <p className="text-xl font-bold text-nt-primary">{monthlyHours.toFixed(1)}h</p>
        </div>
        <div className="rounded-input border border-green-200 bg-green-50 p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Economia mensal</p>
          <p className="text-xl font-bold text-nt-success">{fmt(monthlySavings)}</p>
        </div>
        <div className="rounded-input border border-green-200 bg-green-50 p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Economia anual</p>
          <p className="text-xl font-bold text-nt-success">{fmt(annualSavings)}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400">
        Cálculo: {monthlyTimes.toFixed(1)}× /mês × {minutes} min × {request.people_count} pessoa(s) ÷ 60 = {monthlyHours.toFixed(1)} h/mês
      </p>
    </div>
  )
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useUser()
  const { showToast } = useToast()
  const router = useRouter()
  const [request, setRequest] = useState<AutomationRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [analystNotes, setAnalystNotes] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)

  const isAnalyst = profile.role === 'admin' || profile.role === 'analyst'

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('automation_requests')
        .select('*')
        .eq('id', id)
        .single()
      if (error || !data) { router.push('/requests'); return }
      setRequest(data as AutomationRequest)
      setNewStatus(data.status)
      setAnalystNotes(data.analyst_notes ?? '')
      setLoading(false)
    }
    load()
  }, [id, router])

  async function handleStatusChange() {
    if (!request) return
    setSavingStatus(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('automation_requests')
      .update({ status: newStatus })
      .eq('id', request.id)
    if (error) {
      showToast('Erro ao atualizar status', 'error')
    } else {
      setRequest(prev => prev ? { ...prev, status: newStatus as AutomationRequest['status'] } : prev)
      showToast('Status atualizado com sucesso', 'success')
    }
    setSavingStatus(false)
  }

  async function handleSaveNotes() {
    if (!request) return
    setSavingNotes(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('automation_requests')
      .update({ analyst_notes: analystNotes })
      .eq('id', request.id)
    if (error) {
      showToast('Erro ao salvar anotações', 'error')
    } else {
      showToast('Anotações salvas', 'success')
    }
    setSavingNotes(false)
  }

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" className="text-nt-accent" /></div>
  if (!request) return null

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-sm text-gray-400">{request.request_number}</span>
            <StatusBadge status={request.status} />
            <ComplexityBadge complexity={request.complexity} />
          </div>
          <h1 className="text-2xl font-bold text-nt-primary">{request.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{request.company} · {formatDateTime(request.created_at)}</p>
        </div>
        <button onClick={() => router.back()} className="text-sm text-nt-accent hover:underline">← Voltar</button>
      </div>

      <SectionCard title="Identificação">
        <InfoBlock label="Solicitante" value={request.submitter_name} />
        <InfoBlock label="E-mail" value={request.submitter_email} />
        <InfoBlock label="Empresa" value={request.company} />
        <InfoBlock label="Data de abertura" value={formatDate(request.created_at)} />
      </SectionCard>

      <SectionCard title="Descrição da Tarefa">
        <div className="sm:col-span-2">
          <InfoBlock label="Nome da tarefa" value={request.title} />
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Como a tarefa é executada hoje</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{request.task_description}</p>
        </div>
        <InfoBlock label="Frequência" value={request.frequency} />
        <InfoBlock label="Tempo por execução" value={request.time_per_execution} />
        <InfoBlock label="Pessoas envolvidas" value={request.people_count} />
      </SectionCard>

      <SectionCard title="Contexto Técnico">
        <InfoBlock label="Apenas M365" value={yesNoLabel(request.only_m365)} />
        <InfoBlock label="Login externo" value={yesNoLabel(request.requires_external_login)} />
        <InfoBlock label="CAPTCHA" value={yesNoLabel(request.has_captcha)} />
        <div className="sm:col-span-2">
          <InfoBlock label="Sistemas envolvidos" value={request.systems_involved} />
        </div>
        <InfoBlock label="Dados de" value={request.data_sources.join(', ')} />
        <InfoBlock label="Dados para" value={request.data_destinations.join(', ')} />
      </SectionCard>

      {(request.business_justification || request.business_rules) && (
        <SectionCard title="Impacto e Justificativa">
          {request.business_justification && (
            <div className="sm:col-span-2">
              <InfoBlock label="Por que automatizar?" value={request.business_justification} />
            </div>
          )}
          {request.business_rules && (
            <div className="sm:col-span-2">
              <InfoBlock label="Regras de negócio" value={request.business_rules} />
            </div>
          )}
        </SectionCard>
      )}

      {/* Painel do analista */}
      {isAnalyst && (
        <>
          <div className="rounded-card bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-nt-primary text-base mb-4 pb-2 border-b border-gray-100">Gestão do Chamado</h2>
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white"
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <button
                onClick={handleStatusChange}
                disabled={savingStatus || newStatus === request.status}
                className="flex items-center gap-2 rounded-input bg-nt-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#142d55] disabled:opacity-50 transition-colors"
              >
                {savingStatus && <LoadingSpinner size="sm" className="text-white" />}
                Salvar status
              </button>
            </div>
          </div>

          <div className="rounded-card bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-nt-primary text-base mb-4 pb-2 border-b border-gray-100">Anotações do Analista</h2>
            <textarea
              value={analystNotes}
              onChange={e => setAnalystNotes(e.target.value)}
              rows={4}
              placeholder="Adicione notas técnicas, observações, próximos passos..."
              className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm focus:border-nt-accent focus:outline-none resize-none"
            />
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-3 flex items-center gap-2 rounded-input bg-nt-accent px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a7bc8] disabled:opacity-50 transition-colors"
            >
              {savingNotes && <LoadingSpinner size="sm" className="text-white" />}
              Salvar anotações
            </button>
          </div>

          <div className="rounded-card bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-nt-primary text-base mb-4 pb-2 border-b border-gray-100">Calculadora de ROI</h2>
            <RoiCalculator request={request} />
          </div>
        </>
      )}

      {/* Comentários — visível para todos */}
      <CommentsSection requestId={request.id} profile={profile} />
    </div>
  )
}
