'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/providers/ToastProvider'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  BOTTLENECK_PRIORITY_LABELS, BOTTLENECK_PRIORITY_COLORS,
  BOTTLENECK_STATUS_LABELS,
} from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Bottleneck } from '@/lib/types'

const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function PriorityBadge({ priority }: { priority: string }) {
  const label = BOTTLENECK_PRIORITY_LABELS[priority] ?? priority
  const color = BOTTLENECK_PRIORITY_COLORS[priority] ?? '#9CA3AF'
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: color + '20', color }}>
      {label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const label = BOTTLENECK_STATUS_LABELS[status] ?? status
  const colors: Record<string, string> = {
    evaluating: 'bg-yellow-50 text-yellow-700',
    approved: 'bg-green-50 text-green-700',
    pipeline: 'bg-blue-50 text-blue-700',
    discarded: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  )
}

const EMPTY_FORM = {
  need: '',
  proposed_tool: '',
  priority: 'medium',
  status: 'evaluating',
  estimated_monthly_cost: '',
  notes: '',
}

export default function BottlenecksPage() {
  const { showToast } = useToast()
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Bottleneck>>({})
  const [filterStatus, setFilterStatus] = useState('')

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from('bottlenecks')
      .select('*')
      .order('priority')
      .order('created_at', { ascending: false })
    setBottlenecks((data ?? []) as Bottleneck[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.need.trim()) { showToast('Descreva a necessidade/gargalo', 'error'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('bottlenecks').insert({
      need: form.need.trim(),
      proposed_tool: form.proposed_tool.trim() || null,
      priority: form.priority,
      status: form.status,
      estimated_monthly_cost: parseFloat(form.estimated_monthly_cost) || 0,
      notes: form.notes.trim() || null,
    })
    if (error) {
      showToast('Erro ao salvar', 'error')
    } else {
      showToast('Gargalo registrado', 'success')
      setForm(EMPTY_FORM)
      setShowForm(false)
      await load()
    }
    setSaving(false)
  }

  async function handleUpdate(id: string) {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('bottlenecks').update({
      need: editForm.need,
      proposed_tool: editForm.proposed_tool || null,
      priority: editForm.priority,
      status: editForm.status,
      estimated_monthly_cost: Number(editForm.estimated_monthly_cost) || 0,
      notes: editForm.notes || null,
    }).eq('id', id)
    if (error) {
      showToast('Erro ao salvar', 'error')
    } else {
      showToast('Gargalo atualizado', 'success')
      setEditingId(null)
      await load()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este gargalo?')) return
    const supabase = createClient()
    const { error } = await supabase.from('bottlenecks').delete().eq('id', id)
    if (error) {
      showToast('Erro ao excluir', 'error')
    } else {
      showToast('Gargalo removido', 'success')
      setBottlenecks(prev => prev.filter(b => b.id !== id))
    }
  }

  const filtered = filterStatus ? bottlenecks.filter(b => b.status === filterStatus) : bottlenecks

  const totalPipelineCost = bottlenecks
    .filter(b => b.status === 'approved' || b.status === 'pipeline')
    .reduce((s, b) => s + b.estimated_monthly_cost, 0)

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" className="text-nt-accent" /></div>

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nt-primary">Gargalos & Pipeline</h1>
          <p className="text-sm text-gray-500">Necessidades não atendidas e ferramentas em avaliação</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null) }}
          className="rounded-card bg-nt-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#142d55] transition-colors shrink-0">
          + Registrar Gargalo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {Object.entries(BOTTLENECK_STATUS_LABELS).map(([k, v]) => (
          <div key={k} className="rounded-card bg-white p-4 shadow-sm border-l-4 border-l-gray-200">
            <p className="text-xs text-gray-500 font-medium">{v}</p>
            <p className="mt-1 text-2xl font-bold text-gray-800">
              {bottlenecks.filter(b => b.status === k).length}
            </p>
          </div>
        ))}
      </div>

      {totalPipelineCost > 0 && (
        <div className="rounded-card bg-yellow-50 border border-yellow-200 p-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-yellow-800 font-medium">Custo estimado dos aprovados/pipeline</p>
          <p className="text-lg font-bold text-yellow-900">{fmtBRL(totalPipelineCost)}/mês</p>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-3 mb-5">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white">
          <option value="">Todos os status</option>
          {Object.entries(BOTTLENECK_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="rounded-card bg-white p-5 shadow-sm border-2 border-nt-accent/30 mb-4 space-y-4">
          <h3 className="font-semibold text-nt-primary">Novo Gargalo</h3>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Necessidade / Gargalo *
            </label>
            <input required value={form.need} onChange={e => setField('need', e.target.value)}
              placeholder="Descreva a necessidade ou limitação..."
              className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ferramenta Proposta</label>
              <input value={form.proposed_tool} onChange={e => setField('proposed_tool', e.target.value)}
                placeholder="Ex: Make, n8n, Power BI..."
                className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Prioridade</label>
              <select value={form.priority} onChange={e => setField('priority', e.target.value)}
                className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white">
                {Object.entries(BOTTLENECK_PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Custo Est. (R$/mês)</label>
              <input type="number" min="0" value={form.estimated_monthly_cost}
                onChange={e => setField('estimated_monthly_cost', e.target.value)} placeholder="0"
                className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Observações</label>
            <textarea value={form.notes} onChange={e => setField('notes', e.target.value)}
              rows={2} placeholder="Contexto adicional, alternativas consideradas..."
              className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-input bg-nt-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#142d55] disabled:opacity-50 transition-colors">
              {saving && <LoadingSpinner size="sm" className="text-white" />}
              Salvar
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
              className="rounded-input border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-card bg-white p-12 text-center text-gray-400 shadow-sm">
          {bottlenecks.length === 0
            ? 'Nenhum gargalo registrado. Clique em "+ Registrar Gargalo" para começar.'
            : 'Nenhum gargalo encontrado com os filtros aplicados.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(b => (
            <div key={b.id} className="rounded-card bg-white p-4 shadow-sm">
              {editingId === b.id ? (
                /* Inline edit */
                <div className="space-y-3">
                  <input value={editForm.need ?? ''} onChange={e => setEditForm(p => ({ ...p, need: e.target.value }))}
                    className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <input value={editForm.proposed_tool ?? ''} placeholder="Ferramenta"
                      onChange={e => setEditForm(p => ({ ...p, proposed_tool: e.target.value }))}
                      className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
                    <select value={editForm.priority ?? 'medium'} onChange={e => setEditForm(p => ({ ...p, priority: e.target.value as Bottleneck['priority'] }))}
                      className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white">
                      {Object.entries(BOTTLENECK_PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select value={editForm.status ?? 'evaluating'} onChange={e => setEditForm(p => ({ ...p, status: e.target.value as Bottleneck['status'] }))}
                      className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white">
                      {Object.entries(BOTTLENECK_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <input type="number" value={editForm.estimated_monthly_cost ?? 0} placeholder="Custo/mês"
                      onChange={e => setEditForm(p => ({ ...p, estimated_monthly_cost: parseFloat(e.target.value) || 0 }))}
                      className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none" />
                  </div>
                  <textarea value={editForm.notes ?? ''} rows={2} placeholder="Observações"
                    onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(b.id)} disabled={saving}
                      className="flex items-center gap-1.5 rounded-input bg-nt-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#142d55] disabled:opacity-50 transition-colors">
                      {saving && <LoadingSpinner size="sm" className="text-white" />}
                      Salvar
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="rounded-input border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* View */
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <PriorityBadge priority={b.priority} />
                      <StatusBadge status={b.status} />
                      {b.estimated_monthly_cost > 0 && (
                        <span className="text-xs text-gray-500">{fmtBRL(b.estimated_monthly_cost)}/mês</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-0.5">{b.need}</p>
                    {b.proposed_tool && (
                      <p className="text-xs text-gray-500">Ferramenta proposta: <span className="font-medium">{b.proposed_tool}</span></p>
                    )}
                    {b.notes && <p className="text-xs text-gray-400 mt-1">{b.notes}</p>}
                    <p className="text-xs text-gray-300 mt-1">{formatDate(b.created_at)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setEditingId(b.id); setEditForm(b); setShowForm(false) }}
                      className="text-xs text-nt-accent hover:underline">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(b.id)}
                      className="text-xs text-red-400 hover:underline">
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
