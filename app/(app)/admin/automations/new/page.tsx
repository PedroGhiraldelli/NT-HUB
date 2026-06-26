'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/components/providers/UserProvider'
import { useToast } from '@/components/providers/ToastProvider'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  AUTOMATION_STATUS_LABELS, AUTOMATION_CATEGORIES,
  AUTOMATION_TOOLS, COMPANIES,
} from '@/lib/constants'

const EMOJI_OPTIONS = ['🤖', '⚡', '📊', '📧', '📄', '🔄', '🔗', '💡', '🏭', '📈', '🛠️', '🔮', '🧩', '🚀', '📱', '💼']
const COLOR_OPTIONS = ['#4A90D9', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#BE185D', '#1B3A6B']

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-nt-primary text-base mb-4 pb-2 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function NewAutomationPage() {
  const router = useRouter()
  const { profile } = useUser()
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    company: profile.company ?? '',
    status: 'planned',
    tool: '',
    category: '',
    description: '',
    workflow_steps: '',
    icon: '🤖',
    color: '#4A90D9',
    technical_notes: '',
    monthly_hours_saved: '',
    hourly_cost: '25',
    development_hours: '',
    monthly_license_cost: '0',
    go_live_date: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // ROI preview em tempo real
  const monthlyHours = parseFloat(form.monthly_hours_saved) || 0
  const hourCost = parseFloat(form.hourly_cost) || 25
  const licenseCost = parseFloat(form.monthly_license_cost) || 0
  const devHours = parseFloat(form.development_hours) || 0
  const monthlyROI = monthlyHours * hourCost - licenseCost
  const annualROI = monthlyROI * 12
  const paybackMonths = devHours > 0 && monthlyROI > 0 ? (devHours * hourCost) / monthlyROI : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.company) {
      showToast('Preencha nome e empresa', 'error')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('automations').insert({
      name: form.name.trim(),
      company: form.company,
      status: form.status,
      tool: form.tool || null,
      category: form.category || null,
      description: form.description.trim() || null,
      workflow_steps: form.workflow_steps.trim() || null,
      icon: form.icon,
      color: form.color,
      technical_notes: form.technical_notes.trim() || null,
      monthly_hours_saved: parseFloat(form.monthly_hours_saved) || 0,
      hourly_cost: parseFloat(form.hourly_cost) || 25,
      development_hours: parseFloat(form.development_hours) || 0,
      monthly_license_cost: parseFloat(form.monthly_license_cost) || 0,
      go_live_date: form.go_live_date || null,
      created_by: profile.id,
    })
    if (error) {
      showToast('Erro ao salvar automação', 'error')
    } else {
      showToast('Automação criada com sucesso', 'success')
      router.push('/admin/automations')
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-nt-primary">Nova Automação</h1>
          <p className="text-sm text-gray-500">Registre uma automação implementada ou em desenvolvimento</p>
        </div>
        <button type="button" onClick={() => router.back()} className="text-sm text-nt-accent hover:underline">
          ← Voltar
        </button>
      </div>

      {/* Identificação */}
      <Section title="Identificação">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label required>Nome da Automação</Label>
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Ex: Extrato bancário automático"
              className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
          </div>
          <div>
            <Label required>Empresa</Label>
            <select required value={form.company} onChange={e => set('company', e.target.value)}
              className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white">
              <option value="">Selecione...</option>
              {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label>Status</Label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white">
              {Object.entries(AUTOMATION_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Ferramenta Principal</Label>
            <select value={form.tool} onChange={e => set('tool', e.target.value)}
              className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white">
              <option value="">Selecione...</option>
              {AUTOMATION_TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label>Categoria</Label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white">
              <option value="">Selecione...</option>
              {Object.entries(AUTOMATION_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ícone e cor */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {EMOJI_OPTIONS.map(e => (
                <button key={e} type="button" onClick={() => set('icon', e)}
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
                <button key={c} type="button" onClick={() => set('color', c)}
                  className={`w-9 h-9 rounded-lg border-2 transition-all ${form.color === c ? 'border-gray-800 scale-110' : 'border-white shadow'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            {/* Preview */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: form.color + '20' }}>
                {form.icon}
              </div>
              <span className="text-sm font-medium text-gray-700">{form.name || 'Preview'}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Descrição */}
      <Section title="Descrição">
        <div className="space-y-4">
          <div>
            <Label>Descrição</Label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="O que essa automação faz e qual problema resolve..."
              className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none resize-none" />
          </div>
          <div>
            <Label>Passos / Fluxo</Label>
            <textarea value={form.workflow_steps} onChange={e => set('workflow_steps', e.target.value)}
              rows={5} placeholder={"1. Acessa o sistema X\n2. Faz download do relatório Y\n3. Transforma os dados\n4. Envia por e-mail"}
              className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none resize-none" />
          </div>
          <div>
            <Label>Observações Técnicas</Label>
            <textarea value={form.technical_notes} onChange={e => set('technical_notes', e.target.value)}
              rows={3} placeholder="Credenciais, dependências, servidores, limitações, manutenção..."
              className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none resize-none" />
          </div>
        </div>
      </Section>

      {/* ROI */}
      <Section title="ROI e Métricas">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <Label>Horas/mês economizadas</Label>
            <input type="number" min="0" step="0.5" value={form.monthly_hours_saved}
              onChange={e => set('monthly_hours_saved', e.target.value)} placeholder="0"
              className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
          </div>
          <div>
            <Label>Custo/hora (R$)</Label>
            <input type="number" min="0" step="1" value={form.hourly_cost}
              onChange={e => set('hourly_cost', e.target.value)}
              className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
          </div>
          <div>
            <Label>Horas de desenvolvimento</Label>
            <input type="number" min="0" step="1" value={form.development_hours}
              onChange={e => set('development_hours', e.target.value)} placeholder="0"
              className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
          </div>
          <div>
            <Label>Licença/mês (R$)</Label>
            <input type="number" min="0" step="1" value={form.monthly_license_cost}
              onChange={e => set('monthly_license_cost', e.target.value)} placeholder="0"
              className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
          </div>
        </div>

        <div className="mt-4">
          <Label>Data de Entrada em Campo</Label>
          <input type="date" value={form.go_live_date} onChange={e => set('go_live_date', e.target.value)}
            className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
        </div>

        {/* ROI Preview */}
        {monthlyHours > 0 && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-input border border-nt-accent/30 bg-blue-50 p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">ROI mensal</p>
              <p className="text-lg font-bold text-nt-primary">{fmtBRL(monthlyROI)}</p>
            </div>
            <div className="rounded-input border border-green-200 bg-green-50 p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">ROI anual</p>
              <p className="text-lg font-bold text-nt-success">{fmtBRL(annualROI)}</p>
            </div>
            <div className="rounded-input border border-green-200 bg-green-50 p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Payback</p>
              <p className="text-lg font-bold text-nt-success">
                {paybackMonths ? `${paybackMonths.toFixed(1)} meses` : '—'}
              </p>
            </div>
          </div>
        )}
      </Section>

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 rounded-card bg-nt-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#142d55] disabled:opacity-50 transition-colors">
          {saving && <LoadingSpinner size="sm" className="text-white" />}
          Salvar Automação
        </button>
        <button type="button" onClick={() => router.back()}
          className="rounded-card border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
