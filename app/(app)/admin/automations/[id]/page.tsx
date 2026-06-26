'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/providers/ToastProvider'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  AUTOMATION_STATUS_LABELS, AUTOMATION_STATUS_COLORS,
  AUTOMATION_CATEGORIES, AUTOMATION_TOOLS, COMPANIES,
} from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Automation } from '@/lib/types'

const EMOJI_OPTIONS = ['🤖', '⚡', '📊', '📧', '📄', '🔄', '🔗', '💡', '🏭', '📈', '🛠️', '🔮', '🧩', '🚀', '📱', '💼']
const COLOR_OPTIONS = ['#4A90D9', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#BE185D', '#1B3A6B']

const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{children}</label>
}

function InfoBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value || <span className="italic text-gray-400">Não informado</span>}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-nt-primary text-base mb-4 pb-2 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  )
}

export default function AutomationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { showToast } = useToast()

  const [automation, setAutomation] = useState<Automation | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<Partial<Automation>>({})

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase.from('automations').select('*').eq('id', id).single()
      if (error || !data) { router.push('/admin/automations'); return }
      const a = data as Automation
      setAutomation(a)
      setForm(a)
      setLoading(false)
    }
    load()
  }, [id, router])

  function setField(field: string, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.name?.trim() || !form.company) {
      showToast('Preencha nome e empresa', 'error')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('automations')
      .update({
        name: form.name?.trim(),
        company: form.company,
        status: form.status,
        tool: form.tool || null,
        category: form.category || null,
        description: form.description?.trim() || null,
        workflow_steps: form.workflow_steps?.trim() || null,
        icon: form.icon,
        color: form.color,
        technical_notes: form.technical_notes?.trim() || null,
        monthly_hours_saved: Number(form.monthly_hours_saved) || 0,
        hourly_cost: Number(form.hourly_cost) || 25,
        development_hours: Number(form.development_hours) || 0,
        monthly_license_cost: Number(form.monthly_license_cost) || 0,
        go_live_date: form.go_live_date || null,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      showToast('Erro ao salvar', 'error')
    } else {
      setAutomation(data as Automation)
      setEditing(false)
      showToast('Automação atualizada', 'success')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Excluir esta automação? Esta ação não pode ser desfeita.')) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('automations').delete().eq('id', id)
    if (error) {
      showToast('Erro ao excluir', 'error')
      setDeleting(false)
    } else {
      showToast('Automação excluída', 'success')
      router.push('/admin/automations')
    }
  }

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" className="text-nt-accent" /></div>
  if (!automation) return null

  const a = editing ? form as Automation : automation
  const monthlyROI = a.monthly_hours_saved * a.hourly_cost - a.monthly_license_cost
  const annualROI = monthlyROI * 12
  const paybackMonths = a.development_hours > 0 && monthlyROI > 0
    ? (a.development_hours * a.hourly_cost) / monthlyROI : null
  const statusColor = AUTOMATION_STATUS_COLORS[a.status] ?? '#9CA3AF'

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shrink-0"
            style={{ backgroundColor: a.color + '20' }}>
            {a.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-nt-primary">{a.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ backgroundColor: statusColor + '20', color: statusColor }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                {AUTOMATION_STATUS_LABELS[a.status]}
              </span>
              <span className="text-xs text-gray-400">{a.company}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="text-sm text-nt-accent hover:underline">← Voltar</button>
          {!editing && (
            <>
              <button onClick={() => setEditing(true)}
                className="rounded-input border border-nt-primary px-4 py-2 text-sm font-semibold text-nt-primary hover:bg-blue-50 transition-colors">
                Editar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="rounded-input border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ROI Cards (sempre visível) */}
      {(automation.monthly_hours_saved > 0 || editing) && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-input border border-nt-accent/30 bg-blue-50 p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">ROI mensal</p>
            <p className="text-xl font-bold text-nt-primary">{fmtBRL(monthlyROI)}</p>
          </div>
          <div className="rounded-input border border-green-200 bg-green-50 p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">ROI anual</p>
            <p className="text-xl font-bold text-nt-success">{fmtBRL(annualROI)}</p>
          </div>
          <div className="rounded-input border border-green-200 bg-green-50 p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Payback</p>
            <p className="text-xl font-bold text-nt-success">
              {paybackMonths ? `${paybackMonths.toFixed(1)}m` : '—'}
            </p>
          </div>
        </div>
      )}

      {/* View mode */}
      {!editing && (
        <>
          <Section title="Identificação">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoBlock label="Empresa" value={a.company} />
              <InfoBlock label="Ferramenta" value={a.tool} />
              <InfoBlock label="Categoria" value={a.category ? AUTOMATION_CATEGORIES[a.category] ?? a.category : null} />
              <InfoBlock label="Entrada em campo" value={a.go_live_date ? formatDate(a.go_live_date) : null} />
              <InfoBlock label="Criado em" value={formatDate(a.created_at)} />
            </div>
          </Section>

          {(a.description || a.workflow_steps) && (
            <Section title="Descrição">
              <div className="space-y-4">
                {a.description && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Descrição</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{a.description}</p>
                  </div>
                )}
                {a.workflow_steps && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Passos / Fluxo</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{a.workflow_steps}</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {a.technical_notes && (
            <Section title="Observações Técnicas">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{a.technical_notes}</p>
            </Section>
          )}

          <Section title="Dados de ROI">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <InfoBlock label="Horas/mês economizadas" value={`${a.monthly_hours_saved}h`} />
              <InfoBlock label="Custo/hora" value={fmtBRL(a.hourly_cost)} />
              <InfoBlock label="Horas de desenvolvimento" value={`${a.development_hours}h`} />
              <InfoBlock label="Licença/mês" value={fmtBRL(a.monthly_license_cost)} />
            </div>
          </Section>
        </>
      )}

      {/* Edit mode */}
      {editing && (
        <>
          <Section title="Identificação">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Nome da Automação</Label>
                <input value={form.name ?? ''} onChange={e => setField('name', e.target.value)}
                  className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
              </div>
              <div>
                <Label>Empresa</Label>
                <select value={form.company ?? ''} onChange={e => setField('company', e.target.value)}
                  className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white">
                  {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label>Status</Label>
                <select value={form.status ?? 'planned'} onChange={e => setField('status', e.target.value)}
                  className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white">
                  {Object.entries(AUTOMATION_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <Label>Ferramenta</Label>
                <select value={form.tool ?? ''} onChange={e => setField('tool', e.target.value)}
                  className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white">
                  <option value="">Selecione...</option>
                  {AUTOMATION_TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label>Categoria</Label>
                <select value={form.category ?? ''} onChange={e => setField('category', e.target.value)}
                  className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white">
                  <option value="">Selecione...</option>
                  {Object.entries(AUTOMATION_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label>Ícone</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {EMOJI_OPTIONS.map(e => (
                    <button key={e} type="button" onClick={() => setField('icon', e)}
                      className={`text-xl p-1.5 rounded-lg border-2 transition-colors ${form.icon === e ? 'border-nt-accent bg-blue-50' : 'border-transparent hover:border-gray-200'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Cor de Destaque</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} type="button" onClick={() => setField('color', c)}
                      className={`w-9 h-9 rounded-lg border-2 transition-all ${form.color === c ? 'border-gray-800 scale-110' : 'border-white shadow'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Descrição">
            <div className="space-y-4">
              <div>
                <Label>Descrição</Label>
                <textarea value={form.description ?? ''} onChange={e => setField('description', e.target.value)}
                  rows={3} className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none resize-none" />
              </div>
              <div>
                <Label>Passos / Fluxo</Label>
                <textarea value={form.workflow_steps ?? ''} onChange={e => setField('workflow_steps', e.target.value)}
                  rows={5} className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none resize-none" />
              </div>
              <div>
                <Label>Observações Técnicas</Label>
                <textarea value={form.technical_notes ?? ''} onChange={e => setField('technical_notes', e.target.value)}
                  rows={3} className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none resize-none" />
              </div>
            </div>
          </Section>

          <Section title="ROI e Métricas">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label>Horas/mês economizadas</Label>
                <input type="number" min="0" step="0.5"
                  value={form.monthly_hours_saved ?? 0} onChange={e => setField('monthly_hours_saved', e.target.value)}
                  className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
              </div>
              <div>
                <Label>Custo/hora (R$)</Label>
                <input type="number" min="0" step="1"
                  value={form.hourly_cost ?? 25} onChange={e => setField('hourly_cost', e.target.value)}
                  className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
              </div>
              <div>
                <Label>Horas de desenvolvimento</Label>
                <input type="number" min="0" step="1"
                  value={form.development_hours ?? 0} onChange={e => setField('development_hours', e.target.value)}
                  className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
              </div>
              <div>
                <Label>Licença/mês (R$)</Label>
                <input type="number" min="0" step="1"
                  value={form.monthly_license_cost ?? 0} onChange={e => setField('monthly_license_cost', e.target.value)}
                  className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
              </div>
            </div>
            <div className="mt-4">
              <Label>Data de Entrada em Campo</Label>
              <input type="date" value={form.go_live_date ?? ''}
                onChange={e => setField('go_live_date', e.target.value)}
                className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
            </div>
          </Section>

          <div className="flex gap-3">
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 rounded-card bg-nt-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#142d55] disabled:opacity-50 transition-colors">
              {saving && <LoadingSpinner size="sm" className="text-white" />}
              Salvar Alterações
            </button>
            <button type="button" onClick={() => { setEditing(false); setForm(automation) }}
              className="rounded-card border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
