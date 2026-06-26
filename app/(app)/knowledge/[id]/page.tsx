'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/components/providers/UserProvider'
import { useToast } from '@/components/providers/ToastProvider'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { CategoryBadge, Badge } from '@/components/Badge'
import { XIcon, ArchiveIcon, EditIcon } from '@/components/Icons'
import { ARTICLE_CATEGORIES, COMPANIES } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'
import type { KnowledgeArticle, ArticleCategory } from '@/lib/types'

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { profile } = useUser()
  const { showToast } = useToast()
  const [article, setArticle] = useState<KnowledgeArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit state
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const isAnalyst = profile.role === 'admin' || profile.role === 'analyst'

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('id', id)
        .single()
      if (error || !data) { router.push('/knowledge'); return }
      const art = data as KnowledgeArticle
      setArticle(art)
      setEditTitle(art.title)
      setEditContent(art.content)
      setEditCategory(art.category)
      setEditCompany(art.company)
      setEditTags(art.tags)
      setLoading(false)
    }
    load()
  }, [id, router])

  async function handleSave() {
    if (!article) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('knowledge_articles')
      .update({
        title: editTitle,
        content: editContent,
        category: editCategory,
        company: editCompany,
        tags: editTags,
      })
      .eq('id', article.id)
    if (error) {
      showToast('Erro ao salvar artigo', 'error')
    } else {
      setArticle(prev => prev ? { ...prev, title: editTitle, content: editContent, category: editCategory as ArticleCategory, company: editCompany, tags: editTags } : prev)
      showToast('Artigo atualizado com sucesso', 'success')
      setEditing(false)
    }
    setSaving(false)
  }

  async function handleArchive() {
    if (!article) return
    const supabase = createClient()
    const { error } = await supabase
      .from('knowledge_articles')
      .update({ status: 'archived' })
      .eq('id', article.id)
    if (error) {
      showToast('Erro ao arquivar artigo', 'error')
    } else {
      showToast('Artigo arquivado', 'success')
      router.push('/knowledge')
    }
  }

  function addTag(value: string) {
    const t = value.trim()
    if (t && !editTags.includes(t) && editTags.length < 5) {
      setEditTags(prev => [...prev, t])
    }
    setTagInput('')
  }

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" className="text-nt-accent" /></div>
  if (!article) return null

  if (editing && isAnalyst) {
    return (
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-nt-primary">Editar Artigo</h1>
          <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancelar edição</button>
        </div>
        <div className="rounded-card bg-white p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título</label>
            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
              className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm focus:border-nt-accent focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Empresa</label>
              <select value={editCompany} onChange={e => setEditCompany(e.target.value)}
                className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm focus:border-nt-accent focus:outline-none bg-white">
                {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
              <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
                className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm focus:border-nt-accent focus:outline-none bg-white">
                {Object.entries(ARTICLE_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {editTags.map(tag => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                  {tag}
                  <button onClick={() => setEditTags(prev => prev.filter(t => t !== tag))}><XIcon size={12} /></button>
                </span>
              ))}
              {editTags.length < 5 && (
                <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) } }}
                  onBlur={() => tagInput.trim() && addTag(tagInput)}
                  placeholder="Nova tag..." className="rounded-full border border-gray-300 px-3 py-1 text-xs focus:border-nt-accent focus:outline-none" />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Conteúdo (Markdown)</label>
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={20}
              className="w-full rounded-input border border-gray-300 px-4 py-3 text-sm font-mono focus:border-nt-accent focus:outline-none resize-y" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => setEditing(false)} className="rounded-input border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 rounded-input bg-nt-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#142d55] disabled:opacity-60">
              {saving && <LoadingSpinner size="sm" className="text-white" />}
              Salvar alterações
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      {/* Ações */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-sm text-nt-accent hover:underline">← Voltar</button>
        {isAnalyst && (
          <div className="flex items-center gap-3">
            {article.status === 'published' && (
              <>
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-sm text-nt-accent hover:text-nt-primary font-medium">
                  <EditIcon size={15} /> Editar
                </button>
                <button onClick={handleArchive}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 font-medium">
                  <ArchiveIcon size={15} /> Arquivar
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <article className="rounded-card bg-white p-6 shadow-sm">
        {/* Metadados */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CategoryBadge category={article.category} />
            {article.status === 'archived' && <Badge variant="gray">Arquivado</Badge>}
            <span className="font-mono text-xs text-gray-400 ml-1">{article.article_number}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{article.title}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
            <span>Empresa: <strong className="text-gray-700">{article.company}</strong></span>
            <span>Autor: <strong className="text-gray-700">{article.author_name}</strong></span>
            <span>Publicado: <strong className="text-gray-700">{formatDateTime(article.created_at)}</strong></span>
            {article.updated_at !== article.created_at && (
              <span>Atualizado: <strong className="text-gray-700">{formatDateTime(article.updated_at)}</strong></span>
            )}
          </div>
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map(tag => (
                <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <hr className="border-gray-100 mb-6" />

        {/* Conteúdo */}
        <MarkdownRenderer content={article.content} />
      </article>
    </div>
  )
}
