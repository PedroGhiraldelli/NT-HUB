'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BellIcon } from './Icons'
import { useToast } from './providers/ToastProvider'
import type { AppNotification } from '@/lib/types'

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  const unread = notifications.filter(n => !n.read).length

  // Carrega notificações iniciais
  useEffect(() => {
    supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25)
      .then(({ data }) => { if (data) setNotifications(data as AppNotification[]) })
  }, [supabase])

  // Realtime: ouve novos INSERTs para este usuário
  useEffect(() => {
    const channel = supabase
      .channel(`notif:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as AppNotification
          setNotifications(prev => [n, ...prev])
          showToast(n.title, 'info')
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase, showToast])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function markAllRead() {
    const ids = notifications.filter(n => !n.read).map(n => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ read: true }).in('id', ids)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Notificações"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <BellIcon size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-card border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-800">
              Notificações
              {unread > 0 && (
                <span className="ml-1.5 text-xs font-normal text-gray-400">({unread} novas)</span>
              )}
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-nt-accent hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">
                Nenhuma notificação
              </p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`border-b border-gray-50 last:border-0 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}
                >
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => { markRead(n.id); setOpen(false) }}
                      className="flex items-start gap-2.5 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <NotifDot unread={!n.read} />
                      <NotifContent n={n} />
                    </Link>
                  ) : (
                    <div className="flex items-start gap-2.5 px-4 py-3">
                      <NotifDot unread={!n.read} />
                      <NotifContent n={n} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotifDot({ unread }: { unread: boolean }) {
  return (
    <span
      className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${unread ? 'bg-nt-accent' : 'bg-transparent'}`}
    />
  )
}

function NotifContent({ n }: { n: AppNotification }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-gray-800 leading-snug">{n.title}</p>
      <p className="mt-0.5 text-xs text-gray-500 leading-snug line-clamp-2">{n.body}</p>
      <p className="mt-1 text-[11px] text-gray-400">{relativeTime(n.created_at)}</p>
    </div>
  )
}

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'Agora mesmo'
  if (mins < 60) return `${mins} min atrás`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}
