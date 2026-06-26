'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LoadingSpinner } from './LoadingSpinner'
import { ROLE_LABELS } from '@/lib/constants'
import type { RequestComment, Profile } from '@/lib/types'

const ROLE_COLORS: Record<string, string> = {
  admin:        'bg-nt-primary',
  analyst:      'bg-nt-accent',
  director:     'bg-purple-600',
  collaborator: 'bg-gray-400',
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'Agora mesmo'
  if (mins < 60) return `${mins} min atrás`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h atrás`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d atrás`
  return new Date(iso).toLocaleDateString('pt-BR')
}

function Avatar({ name, role }: { name: string; role: string }) {
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${ROLE_COLORS[role] ?? 'bg-gray-400'}`}
    >
      {initials(name)}
    </div>
  )
}

export function CommentsSection({ requestId, profile }: { requestId: string; profile: Profile }) {
  const [comments, setComments] = useState<RequestComment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  // Carrega comentários iniciais
  useEffect(() => {
    supabase
      .from('request_comments')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) setComments(data as RequestComment[])
        setLoading(false)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior }), 50)
      })
  }, [supabase, requestId])

  // Realtime: novos comentários aparecem ao vivo
  useEffect(() => {
    const channel = supabase
      .channel(`comments:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'request_comments',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          setComments(prev => {
            // Evita duplicata se for o próprio comentário que acabou de enviar
            if (prev.some(c => c.id === (payload.new as RequestComment).id)) return prev
            return [...prev, payload.new as RequestComment]
          })
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [requestId, supabase])

  async function handleSend() {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)

    const optimistic: RequestComment = {
      id: `tmp-${Date.now()}`,
      request_id: requestId,
      author_id: profile.id,
      author_name: profile.full_name,
      author_role: profile.role,
      content,
      created_at: new Date().toISOString(),
    }
    setComments(prev => [...prev, optimistic])
    setText('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    const { data, error } = await supabase
      .from('request_comments')
      .insert({
        request_id: requestId,
        author_id: profile.id,
        author_name: profile.full_name,
        author_role: profile.role,
        content,
      })
      .select()
      .single()

    if (error) {
      // Reverte o otimista em caso de erro
      setComments(prev => prev.filter(c => c.id !== optimistic.id))
      setText(content)
    } else if (data) {
      // Substitui o otimista pelo real
      setComments(prev => prev.map(c => c.id === optimistic.id ? data as RequestComment : c))
    }

    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="rounded-card bg-white shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-nt-primary text-base">
          Comentários
          {!loading && comments.length > 0 && (
            <span className="ml-1.5 text-sm font-normal text-gray-400">({comments.length})</span>
          )}
        </h2>
      </div>

      {/* Thread de comentários */}
      <div className="max-h-[480px] overflow-y-auto px-5 py-4 space-y-5">
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" className="text-nt-accent" />
          </div>
        ) : comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            Nenhum comentário ainda. Faça uma pergunta ou deixe uma observação.
          </p>
        ) : (
          comments.map(c => (
            <div key={c.id} className={`flex gap-3 ${c.id.startsWith('tmp-') ? 'opacity-60' : ''}`}>
              <Avatar name={c.author_name} role={c.author_role} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-gray-800">{c.author_name}</span>
                  <span className="text-xs text-gray-400">
                    {(ROLE_LABELS as Record<string, string>)[c.author_role] ?? c.author_role}
                  </span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{relativeTime(c.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Caixa de envio */}
      <div className="border-t border-gray-100 px-5 py-4">
        <div className="flex gap-3 items-start">
          <Avatar name={profile.full_name} role={profile.role} />
          <div className="flex-1">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Escreva um comentário… (Ctrl+Enter para enviar)"
              className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-nt-accent focus:outline-none resize-none transition-colors"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">Ctrl+Enter para enviar</span>
              <button
                onClick={handleSend}
                disabled={sending || !text.trim()}
                className="flex items-center gap-2 rounded-input bg-nt-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#142d55] disabled:opacity-50 transition-colors"
              >
                {sending && <LoadingSpinner size="sm" className="text-white" />}
                Comentar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
