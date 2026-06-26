'use client'

import { useUser } from './providers/UserProvider'
import { NotificationBell } from './NotificationBell'
import { ROLE_LABELS } from '@/lib/constants'
import { UserIcon } from './Icons'

export function Header() {
  const { profile } = useUser()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm lg:pl-6">
      <div className="flex-1 lg:hidden" />

      <div className="flex-1 lg:flex-none" />

      <div className="flex items-center gap-3">
        <NotificationBell userId={profile.id} />

        <div className="h-5 w-px bg-gray-200" />

        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800 leading-tight">{profile.full_name}</p>
          <p className="text-xs text-gray-500 leading-tight">
            {profile.company} · {ROLE_LABELS[profile.role] ?? profile.role}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-nt-primary text-white">
          <UserIcon size={18} />
        </div>
      </div>
    </header>
  )
}
