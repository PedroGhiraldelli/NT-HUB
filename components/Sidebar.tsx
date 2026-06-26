'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Role } from '@/lib/types'
import {
  HomeIcon, PlusIcon, ListIcon, KanbanIcon, BookIcon, EditIcon,
  UsersIcon, LogOutIcon, MenuIcon, XIcon, ZapIcon, AlertTriangleIcon,
} from './Icons'
import { ThemeToggle } from './ThemeToggle'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles: Role[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard',            href: '/dashboard',      icon: <HomeIcon />,   roles: ['admin', 'analyst', 'director', 'collaborator'] },
  { label: 'Novo Chamado',         href: '/requests/new',   icon: <PlusIcon />,   roles: ['collaborator', 'director'] },
  { label: 'Meus Chamados',        href: '/requests',       icon: <ListIcon />,   roles: ['collaborator'] },
  { label: 'Chamados',             href: '/requests',       icon: <ListIcon />,   roles: ['director', 'admin', 'analyst'] },
  { label: 'Pipeline',             href: '/pipeline',       icon: <KanbanIcon />, roles: ['admin', 'analyst'] },
  { label: 'Base de Conhecimento', href: '/knowledge',      icon: <BookIcon />,   roles: ['admin', 'analyst', 'director', 'collaborator'] },
  { label: 'Novo Artigo',          href: '/knowledge/new',  icon: <EditIcon />,   roles: ['admin', 'analyst', 'director', 'collaborator'] },
  { label: 'Usuários',             href: '/admin/users',        icon: <UsersIcon />,          roles: ['admin'] },
  { label: 'Automações',           href: '/admin/automations',  icon: <ZapIcon />,            roles: ['admin'] },
  { label: 'Gargalos',             href: '/admin/bottlenecks',  icon: <AlertTriangleIcon />,  roles: ['admin'] },
]

interface SidebarProps {
  role: Role
  userName: string
  company: string
}

export function Sidebar({ role, userName, company }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const visibleItems = navItems.filter(item => item.roles.includes(role))

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-nt-accent text-white font-bold text-sm shrink-0">
          NT
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">NT Automação Hub</p>
          <p className="text-xs text-blue-300 leading-tight">Nova Trindade SSC</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleItems.map(item => (
          <Link
            key={`${item.label}-${item.href}`}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors
              ${isActive(item.href)
                ? 'bg-white/15 text-white font-medium'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`}
          >
            <span className="shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Usuário + Sair */}
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 px-1">
          <p className="text-sm font-medium text-white truncate">{userName}</p>
          <p className="text-xs text-blue-300 truncate">{company}</p>
        </div>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
        >
          <LogOutIcon size={18} />
          <span>{loggingOut ? 'Saindo...' : 'Sair'}</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-nt-primary h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Botão mobile */}
      <button
        className="fixed top-4 left-4 z-40 lg:hidden rounded-lg bg-nt-primary p-2 text-white shadow-md"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
      >
        <MenuIcon size={20} />
      </button>

      {/* Sidebar mobile (drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-64 bg-nt-primary shadow-xl">
            <button
              className="absolute top-4 right-4 text-white/70 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <XIcon size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
