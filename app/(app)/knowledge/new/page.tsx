'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/components/providers/UserProvider'
import { useToast } from '@/components/providers/ToastProvider'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { XIcon } from '@/components/Icons'
import { ARTICLE_CATEGORIES, COMPANIES } from '@/lib/constants'

export default function NewArticlePage() {
  const { profile } = useUser()
  const router = useRouter()
  const { showToast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [title, setTitle] = useState('')
  const [company, setCompany] = useState(profile.company)
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [preview, setPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function addTag(value: string) {
    const t = value.trim()
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags(prev => [...prev, t])
    }
    setTagInput('')
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag))
  }

  function insertMarkdown(prefix: string, suffix = '') {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.slice(start, end)
    const replacement = prefix + (selected || 'texto') + suffix
    const newContent = content.slice(0, start) + replacement + content.slice(end)
    setContent(newContent)
    setTimeout(() => {
      textarea.focus()
      const newCursor = start + prefix.length + (selected || 'texto').length + suffix.length
      textarea.setSelectionRange(newCursor, newCursor)
    }, 0)
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Título é obrigatório'
    if (!company) e.company = 'Empresa é obrigatória'
    if (!category) e.category = 'Categoria é obrigatória'
    if (!content.trim()) e.content = 'Conteúdo é obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('knowledge_articles')
      .insert({
        article_number: '',
        title,
        company,
        category,
        tags,
        content,
        author_id: profile.id,
        author_name: profile.full_name,
        status: 'published',
      })
      .select('article_number')
      .single()

    if (error) {
      showToast('Erro ao publicar artigo: ' + error.message, 'error')
      setSubmitting(false)
      return
    }

    showToast(`Artigo ${data.article_number} publicado com sucesso!`, 'success')
    router.push('/knowledge')
  }

  const toolbarButtons = [
    { label: 'N', title: 'Negrito', action: () => insertMarkdown('**', '**') },
    { label: 'I', title: 'Itálico', action: () => insertMarkdown('*', '*'), className: 'italic' },
    { label: 'H', title: 'Título', action: () => insertMarkdown('## ') },
    { label: '—', title: 'Lista', action: () => insertMarkdown('- ') },
    { label: '`', title: 'Código', action: () => insertMarkdown('`', '`') },
  ]

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-nt-primary">Novo Artigo</h1>
        <p className="text-sm text-gray-500 mt-0.5">Publique um procedimento ou processo para a base de conhecimento</p>
      </div>

      <div className="rounded-card bg-white p-6 shadow-sm space-y-5">
        {/* Metadados */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Título *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Como emitir certidão negativa de débitos"
            className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm focus:border-nt-accent focus:outline-none focus:ring-1 focus:ring-nt-accent"
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Empresa *</label>
            <select
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm focus:border-nt-accent focus:outline-none bg-white"
            >
              <option value="">Selecione...</option>
              {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.company && <p className="mt-1 text-xs text-red-500">{errors.company}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm focus:border-nt-accent focus:outline-none bg-white"
            >
              <option value="">Selecione...</option>
              {Object.entries(ARTICLE_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (máx. 5)</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-blue-900">
                  <XIcon size={12} />
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => tagInput.trim() && addTag(tagInput)}
                placeholder="Adicionar tag..."
                className="rounded-full border border-gray-300 px-3 py-1 text-xs focus:border-nt-accent focus:outline-none"
              />
            )}
          </div>
          <p className="text-xs text-gray-400">Pressione Enter para adicionar cada tag</p>
        </div>

        {/* Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">Conteúdo *</label>
            <div className="flex rounded-input border border-gray-200 overflow-hidden text-xs">
              <button
                onClick={() => setPreview(false)}
                className={`px-3 py-1.5 transition-colors ${!preview ? 'bg-nt-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Editar
              </button>
              <button
                onClick={() => setPreview(true)}
                className={`px-3 py-1.5 transition-colors ${preview ? 'bg-nt-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Preview
              </button>
            </div>
          </div>

          {!preview ? (
            <div className="border border-gray-300 rounded-input overflow-hidden focus-within:border-nt-accent focus-within:ring-1 focus-within:ring-nt-accent">
              {/* Toolbar */}
              <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
                {toolbarButtons.map(btn => (
                  <button
                    key={btn.label}
                    onClick={btn.action}
                    title={btn.title}
                    className={`w-7 h-7 flex items-center justify-center rounded text-sm text-gray-600 hover:bg-gray-200 font-mono ${btn.className ?? ''}`}
                  >
                    {btn.label}
                  </button>
                ))}
                <span className="ml-2 text-xs text-gray-400">Suporte a Markdown</span>
              </div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={16}
                placeholder={`## Objetivo\n\nDescreva o propósito deste artigo...\n\n## Passo a passo\n\n- Passo 1\n- Passo 2\n\n## Observações\n\nInformações adicionais...`}
                className="block w-full px-4 py-3 text-sm text-gray-800 font-mono resize-y focus:outline-none bg-white"
              />
            </div>
          ) : (
            <div className="min-h-64 rounded-input border border-gray-200 p-4 bg-white">
              {content ? (
                <MarkdownRenderer content={content} />
              ) : (
                <p className="text-gray-400 text-sm italic">Nenhum conteúdo para visualizar.</p>
              )}
            </div>
          )}
          {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content}</p>}
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            onClick={() => router.back()}
            className="rounded-input border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-input bg-nt-success px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {submitting && <LoadingSpinner size="sm" className="text-white" />}
            {submitting ? 'Publicando...' : 'Publicar Artigo'}
          </button>
        </div>
      </div>
    </div>
  )
}
