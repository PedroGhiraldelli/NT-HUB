'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/providers/ToastProvider'
import { ComplexityBadge } from '@/components/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { SearchIcon, EyeIcon } from '@/components/Icons'
import { COMPANIES, STATUS_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { AutomationRequest, RequestStatus } from '@/lib/types'

const COLUMNS: { key: RequestStatus; label: string; color: string; bg: string }[] = [
  { key: 'new',       label: 'Novo',        color: 'bg-blue-500',  bg: 'bg-blue-50' },
  { key: 'analyzing', label: 'Em Análise',  color: 'bg-yellow-500', bg: 'bg-yellow-50' },
  { key: 'approved',  label: 'Aprovado',    color: 'bg-green-500', bg: 'bg-green-50' },
  { key: 'backlog',   label: 'Backlog',     color: 'bg-gray-400',  bg: 'bg-gray-50' },
  { key: 'discarded', label: 'Descartado',  color: 'bg-red-500',   bg: 'bg-red-50' },
]

export default function PipelinePage() {
  const { showToast } = useToast()
  const [requests, setRequests] = useState<AutomationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [complexityFilter, setComplexityFilter] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<RequestStatus | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('automation_requests')
        .select('*')
        .order('created_at', { ascending: false })
      setRequests((data as AutomationRequest[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = requests.filter(r => {
    const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.request_number.includes(search)
    const matchesCompany = !companyFilter || r.company === companyFilter
    const matchesComplexity = !complexityFilter || r.complexity === complexityFilter
    return matchesSearch && matchesCompany && matchesComplexity
  })

  async function moveRequest(id: string, newStatus: RequestStatus) {
    setMovingId(id)
    const supabase = createClient()
    const { error } = await supabase
      .from('automation_requests')
      .update({ status: newStatus })
      .eq('id', id)
    if (error) {
      showToast('Erro ao mover chamado', 'error')
    } else {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
      showToast(`Chamado movido para ${STATUS_LABELS[newStatus]}`, 'success')
    }
    setMovingId(null)
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData('requestId', id)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(id)
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDragOverColumn(null)
  }

  function handleDragOver(e: React.DragEvent, status: RequestStatus) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }

  function handleDragLeave() {
    setDragOverColumn(null)
  }

  async function handleDrop(e: React.DragEvent, newStatus: RequestStatus) {
    e.preventDefault()
    const id = e.dataTransfer.getData('requestId')
    setDraggingId(null)
    setDragOverColumn(null)
    const req = requests.find(r => r.id === id)
    if (!req || req.status === newStatus) return
    await moveRequest(id, newStatus)
  }

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" className="text-nt-accent" /></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-nt-primary">Pipeline de Chamados</h1>
        <p className="text-sm text-gray-500 mt-0.5">Arraste os cards entre colunas para mudar o status</p>
      </div>

      {/* Filtros */}
      <div className="rounded-card bg-white p-4 shadow-sm mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar chamado..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-input border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-nt-accent focus:outline-none"
          />
        </div>
        <select
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
          className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white"
        >
          <option value="">Todas as empresas</option>
          {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
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

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const cards = filtered.filter(r => r.status === col.key)
          const isOver = dragOverColumn === col.key
          return (
            <div
              key={col.key}
              className="flex-shrink-0 w-72"
              onDragOver={e => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, col.key)}
            >
              {/* Coluna header */}
              <div className={`rounded-t-card px-4 py-3 ${col.bg} border border-b-0 ${isOver ? 'border-nt-accent' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                  <span className="font-semibold text-gray-700 text-sm">{col.label}</span>
                  <span className="ml-auto text-xs text-gray-400 font-medium">{cards.length}</span>
                </div>
              </div>

              {/* Drop zone */}
              <div
                className={`min-h-64 rounded-b-card border border-t-0 p-2 space-y-2 transition-colors
                  ${isOver ? 'border-nt-accent bg-blue-50/50' : 'border-gray-200 bg-gray-50'}`}
              >
                {cards.length === 0 && (
                  <div className={`flex items-center justify-center h-16 rounded-lg border-2 border-dashed text-xs text-gray-400
                    ${isOver ? 'border-nt-accent text-nt-accent' : 'border-gray-300'}`}>
                    Solte aqui
                  </div>
                )}

                {cards.map(r => (
                  <div
                    key={r.id}
                    draggable
                    onDragStart={e => handleDragStart(e, r.id)}
                    onDragEnd={handleDragEnd}
                    className={`rounded-card bg-white border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing transition-opacity
                      ${draggingId === r.id ? 'opacity-40' : 'opacity-100'}
                      hover:shadow-md hover:border-nt-accent/50`}
                  >
                    {/* Número + complexidade */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-gray-400">{r.request_number}</span>
                      <ComplexityBadge complexity={r.complexity} />
                    </div>

                    {/* Título */}
                    <p className="text-sm font-semibold text-gray-800 leading-snug mb-1 line-clamp-2">{r.title}</p>
                    <p className="text-xs text-gray-500 mb-2">{r.company}</p>

                    {/* Meta */}
                    <div className="text-xs text-gray-400 space-y-0.5 mb-3">
                      <p>{r.frequency} · {r.time_per_execution}</p>
                      <p>{formatDate(r.created_at)}</p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                      <Link
                        href={`/requests/${r.id}`}
                        className="flex items-center gap-1 text-xs text-nt-accent hover:text-nt-primary font-medium"
                      >
                        <EyeIcon size={12} /> Ver detalhes
                      </Link>
                      <div className="flex items-center gap-1">
                        {movingId === r.id ? (
                          <LoadingSpinner size="sm" className="text-nt-accent" />
                        ) : (
                          <select
                            value={r.status}
                            onChange={e => moveRequest(r.id, e.target.value as RequestStatus)}
                            onClick={e => e.stopPropagation()}
                            className="text-xs rounded border border-gray-200 px-1.5 py-1 bg-white focus:outline-none focus:border-nt-accent"
                          >
                            {COLUMNS.map(c => (
                              <option key={c.key} value={c.key}>{c.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
