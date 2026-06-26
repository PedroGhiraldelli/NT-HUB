'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/components/providers/UserProvider'
import { useToast } from '@/components/providers/ToastProvider'
import { CategoryBadge, Badge } from '@/components/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { SearchIcon, ArchiveIcon, PlusIcon } from '@/components/Icons'
import { ARTICLE_CATEGORIES, COMPANIES } from '@/lib/constants'
import { formatDate, truncate } from '@/lib/utils'
import type { KnowledgeArticle } from '@/lib/types'

export default function KnowledgePage() {
  const { profile } = useUser()
  const { showToast } = useToast()
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const isAnalyst = profile.role === 'admin' || profile.role === 'analyst'

  async function loadArticles() {
    const supabase = createClient()
    let query = supabase.from('knowledge_articles').select('*').order('created_at', { ascending: false })

    if (!showArchived) {
      query = query.eq('status', 'published')
    }

    const { data } = await query
    setArticles((data as KnowledgeArticle[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { loadArticles() }, [showArchived])

  async function handleArchive(id: string, title: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('knowledge_articles')
      .update({ status: 'archived' })
      .eq('id', id)
    if (error) {
      showToast('Erro ao arquivar artigo', 'error')
    } else {
      showToast(`"${title}" arquivado`, 'success')
      loadArticles()
    }
  }

  const filtered = articles.filter(a => {
    const searchLower = search.toLowerCase()
    const matchesSearch = !search
      || a.title.toLowerCase().includes(searchLower)
      || a.content.toLowerCase().includes(searchLower)
      || a.tags.some(t => t.toLowerCase().includes(searchLower))
    const matchesCompany = !companyFilter || a.company === companyFilter
    const matchesCategory = !categoryFilter || a.category === categoryFilter
    return matchesSearch && matchesCompany && matchesCategory
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nt-primary">Base de Conhecimento</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} artigo{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          {isAnalyst && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`text-sm px-3 py-2 rounded-input border transition-colors ${showArchived ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              {showArchived ? 'Ocultar arquivados' : 'Ver arquivados'}
            </button>
          )}
          <Link
            href="/knowledge/new"
            className="flex items-center gap-2 rounded-card bg-nt-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#142d55] transition-colors"
          >
            <PlusIcon size={16} /> Novo Artigo
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-card bg-white p-4 shadow-sm mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título, conteúdo ou tag..."
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
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="rounded-input border border-gray-300 px-3 py-2 text-sm focus:border-nt-accent focus:outline-none bg-white"
        >
          <option value="">Todas as categorias</option>
          {Object.entries(ARTICLE_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" className="text-nt-accent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-card bg-white p-12 text-center shadow-sm">
          <p className="text-gray-500 text-sm">Nenhum artigo encontrado.</p>
          <Link href="/knowledge/new" className="mt-4 inline-block text-sm text-nt-accent hover:underline">
            Criar o primeiro artigo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(article => (
            <div
              key={article.id}
              className={`rounded-card bg-white shadow-sm border overflow-hidden flex flex-col transition-shadow hover:shadow-md
                ${article.status === 'archived' ? 'border-gray-200 opacity-75' : 'border-transparent'}`}
            >
              <Link href={`/knowledge/${article.id}`} className="flex-1 p-5 block">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <CategoryBadge category={article.category} />
                  {article.status === 'archived' && (
                    <Badge variant="gray" size="sm">Arquivado</Badge>
                  )}
                </div>
                <h2 className="font-semibold text-gray-800 text-base leading-snug mb-2 line-clamp-2">
                  {article.title}
                </h2>
                <p className="text-xs text-gray-500 mb-3">
                  {article.company} · {article.author_name} · {formatDate(article.created_at)}
                </p>
                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                  {truncate(article.content.replace(/[#*`\-]/g, '').replace(/\n+/g, ' '), 150)}
                </p>
                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {article.tags.map(tag => (
                      <span key={tag} className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>

              {isAnalyst && article.status === 'published' && (
                <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                  <Link
                    href={`/knowledge/${article.id}?edit=1`}
                    className="text-xs text-nt-accent hover:underline"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleArchive(article.id, article.title)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <ArchiveIcon size={12} /> Arquivar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
